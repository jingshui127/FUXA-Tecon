/**
 * FUXA Headless Guardian Entry
 * 
 * 内嵌守护进程的 EXE 入口点
 * 同一个 EXE，双模式运行：
 *   默认模式 (Guardian): 监控 + 崩溃自动重启
 *   FUXA_SERVER=1:       实际运行 FUXA 服务器
 */

const path = require('path');
const fs = require('fs');
const os = require('os');
const { spawn } = require('child_process');

// ============================================================
//  Simple CLI argument parser (supports -p / --port)
// ============================================================
function parseArgs(argv) {
    const args = {};
    for (let i = 2; i < argv.length; i++) {
        if (argv[i] === '-p' || argv[i] === '--port') {
            args.port = argv[i + 1];
            i++;
        }
    }
    return args;
}

// ============================================================
//  SERVER MODE: 实际运行 FUXA 服务器
//  当环境变量 FUXA_SERVER=1 时进入此模式
// ============================================================
if (process.env.FUXA_SERVER === '1') {
    const cliArgs = parseArgs(process.argv);
    
    // 端口（-p 参数或环境变量 PORT）
    if (cliArgs.port) {
        process.env.PORT = cliArgs.port;
        console.log(`[FUXA] Port set to: ${cliArgs.port}`);
    }
    
    // 数据目录：EXE 同目录下的 data 子目录
    const exeDir = path.dirname(process.execPath);
    const fuxaDataDir = path.join(exeDir, 'data');
    
    if (!fs.existsSync(fuxaDataDir)) {
        console.log(`[FUXA] Creating data directory: ${fuxaDataDir}`);
        fs.mkdirSync(fuxaDataDir, { recursive: true });
    }
    console.log(`[FUXA] Data directory: ${fuxaDataDir}`);
    
    process.env.userDir = fuxaDataDir;
    process.env.FUXA_DATA_DIR = fuxaDataDir;
    
    // 使用静态相对路径字面量，确保 pkg 能在构建时把 server/main.js 编译进快照
    // （动态 path.join(__dirname,...) 会阻止 pkg 静态分析，导致 require 读到压缩的 asset 字节而报 "Invalid or unexpected token"）
    try {
        require('./server/main.js');
    } catch (err) {
        console.error(`[FUXA] Failed to start server: ${err.message}`);
        if (err.stack) console.error(err.stack);
        process.exit(1);
    }
    return;
}

// ============================================================
//  GUARDIAN MODE: 守护进程（默认模式）
// ============================================================
console.log('================================================');
console.log('  FUXA Headless Server (Guardian Mode)');
console.log('  科控物联提供技术支持。QQ:2492123056');
console.log('================================================');

const CONFIG = {
    maxRestarts: 1000,
    restartDelay: 2000,
    cooldownWindow: 10000,
    maxRapidRestarts: 5,
};

let restartCount = 0;
let rapidRestarts = 0;
let lastRestartTime = 0;
let childProcess = null;

function log(msg) {
    const ts = new Date().toLocaleString('zh-CN', { hour12: false });
    console.log(`[${ts}] [Guardian] ${msg}`);
}

function startServer() {
    const now = Date.now();
    
    if (now - lastRestartTime < CONFIG.cooldownWindow) {
        rapidRestarts++;
        if (rapidRestarts >= CONFIG.maxRapidRestarts) {
            log(`WARNING: ${CONFIG.maxRapidRestarts} rapid restarts in ${CONFIG.cooldownWindow / 1000}s!`);
            log(`Cooling down for 10 seconds...`);
            return setTimeout(startServer, 10000);
        }
    } else {
        rapidRestarts = 0;
    }
    lastRestartTime = now;
    
    log(`Starting FUXA server (restart #${restartCount + 1})...`);
    
    // 解析命令行参数，通过环境变量传递给子进程
    const cliArgs = parseArgs(process.argv);
    const childEnv = { ...process.env, FUXA_SERVER: '1' };
    if (cliArgs.port) {
        childEnv.PORT = cliArgs.port;
        log(`Port: ${cliArgs.port}`);
    }
    
    // pkg EXE 不接受 CLI 参数（会被当成 JS 文件路径），用环境变量传递
    childProcess = spawn(process.execPath, [], {
        env: childEnv,
        stdio: 'inherit',
        windowsHide: false,
    });
    
    childProcess.on('exit', (code, signal) => {
        if (childProcess) {
            log(`Server exited (code=${code}, signal=${signal || 'none'})`);
            childProcess = null;
        }
        
        if (signal === 'SIGINT' || signal === 'SIGTERM') {
            log('Normal shutdown signal received. Exiting guardian.');
            process.exit(0);
        }
        
        if (restartCount < CONFIG.maxRestarts) {
            restartCount++;
            log(`Restarting in ${CONFIG.restartDelay / 1000}s...`);
            setTimeout(startServer, CONFIG.restartDelay);
        } else {
            log(`ERROR: Max restarts (${CONFIG.maxRestarts}) reached. Exiting.`);
            process.exit(1);
        }
    });
    
    childProcess.on('error', (err) => {
        log(`Failed to start server: ${err.message}`);
        childProcess = null;
        
        if (restartCount < CONFIG.maxRestarts) {
            restartCount++;
            setTimeout(startServer, CONFIG.restartDelay);
        } else {
            process.exit(1);
        }
    });

    // === 保活：pkg 快照下，spawn 的子进程句柄不会保持 guardian 主进程的事件循环，
    //     导致主进程事件循环空闲而自然退出，连带杀掉正在运行的 server 子进程。
    //     用一个不 unref 的 setInterval 强制保持主进程事件循环存活。 ===
    if (!global.__fuxaGuardianKeepAlive) {
        global.__fuxaGuardianKeepAlive = setInterval(() => {
            // 每 15 秒心跳一次，仅用于保持事件循环，不产生日志噪音
        }, 15000);
        if (global.__fuxaGuardianKeepAlive.unref) {
            // 注意：绝不 unref，否则主进程仍会因事件循环空闲而退出
        }
    }
}

log('========================================');
log('  FUXA Headless Server (Guardian Mode)');
log('========================================');
log(`Max restarts: ${CONFIG.maxRestarts}`);
log(`Restart delay: ${CONFIG.restartDelay / 1000}s`);
log(`Rapid restart limit: ${CONFIG.maxRapidRestarts} / ${CONFIG.cooldownWindow / 1000}s`);
log('========================================');

startServer();

process.on('SIGINT', () => {
    log('Received SIGINT. Shutting down...');
    if (childProcess) {
        if (process.platform === 'win32') {
            childProcess.kill('SIGINT');
        } else {
            childProcess.kill('SIGTERM');
        }
        setTimeout(() => process.exit(0), 10000);
    } else {
        process.exit(0);
    }
});

process.on('SIGTERM', () => {
    log('Received SIGTERM. Shutting down...');
    if (childProcess) {
        if (process.platform === 'win32') {
            childProcess.kill('SIGINT');
        } else {
            childProcess.kill('SIGTERM');
        }
        setTimeout(() => process.exit(0), 10000);
    } else {
        process.exit(0);
    }
});

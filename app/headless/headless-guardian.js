/**
 * FUXA Headless Guardian Entry
 * 
 * 内嵌守护进程的 EXE 入口点
 * 同一个 EXE，双模式运行：
 *   默认模式 (Guardian): 监控 + 崩溃自动重启
 *   FUXA_SERVER=1:       实际运行 FUXA 服务器
 * 
 * 解决的问题：
 *   - 无需外部 bat/wrapper.js 守护脚本
 *   - S7 设备保存时崩溃后自动恢复
 *   - EXE 单文件自愈，部署更简单
 */

const path = require('path');
const fs = require('fs');
const os = require('os');
const { spawn } = require('child_process');

// ============================================================
//  SERVER MODE: 实际运行 FUXA 服务器
//  当环境变量 FUXA_SERVER=1 时进入此模式
// ============================================================
if (process.env.FUXA_SERVER === '1') {
    const homeDir = os.homedir();
    const fuxaDataDir = path.join(homeDir, 'fuxa-headless-data');
    
    // 确保数据目录存在
    if (!fs.existsSync(fuxaDataDir)) {
        console.log(`[FUXA] Creating data directory: ${fuxaDataDir}`);
        fs.mkdirSync(fuxaDataDir, { recursive: true });
    }
    console.log(`[FUXA] Data directory: ${fuxaDataDir}`);
    
    // 设置数据目录环境变量
    process.env.userDir = fuxaDataDir;
    
    // 加载并运行 FUXA 服务器
    const serverPath = path.join(__dirname, 'server', 'main.js');
    
    if (!fs.existsSync(serverPath)) {
        console.error(`[FUXA] ERROR: Server not found at ${serverPath}`);
        process.exit(1);
    }
    
    try {
        require(serverPath);
    } catch (err) {
        console.error(`[FUXA] Failed to start server: ${err.message}`);
        if (err.stack) console.error(err.stack);
        process.exit(1);
    }
    return; // 不会到达这里（main.js 会持有进程）
}

// ============================================================
//  GUARDIAN MODE: 守护进程（默认模式）
//  监控子进程，崩溃后自动重启
// ============================================================
console.log('================================================');
console.log('  FUXA Headless Server (Guardian Mode)');
console.log('  科控物联提供技术支持。QQ:2492123056');
console.log('================================================');

const CONFIG = {
    maxRestarts: 1000,
    restartDelay: 2000,       // 崩溃后等待 2 秒再重启
    cooldownWindow: 10000,    // 10 秒内如果频繁崩溃，延长等待
    maxRapidRestarts: 5,      // 冷却窗口内最多快速重启次数
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
    
    // 冷却窗口检查：防止频繁崩溃导致死循环
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
    
    childProcess = spawn(process.execPath, [], {
        env: { ...process.env, FUXA_SERVER: '1' },
        stdio: 'inherit',
        windowsHide: false,
    });
    
    childProcess.on('exit', (code, signal) => {
        if (childProcess) {
            log(`Server exited (code=${code}, signal=${signal || 'none'})`);
            childProcess = null;
        }
        
        // 正常退出（Ctrl+C/关机）不重启
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
}

// ----- 启动守护进程 -----
log('========================================');
log('  FUXA Headless Server (Guardian Mode)');
log('========================================');
log(`Max restarts: ${CONFIG.maxRestarts}`);
log(`Restart delay: ${CONFIG.restartDelay / 1000}s`);
log(`Rapid restart limit: ${CONFIG.maxRapidRestarts} / ${CONFIG.cooldownWindow / 1000}s`);
log('========================================');

startServer();

// 优雅退出处理
process.on('SIGINT', () => {
    log('Received SIGINT. Shutting down...');
    if (childProcess) {
        // 先通知子进程退出
        if (process.platform === 'win32') {
            childProcess.kill('SIGINT');
        } else {
            childProcess.kill('SIGTERM');
        }
        // 等待子进程退出后自身退出
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

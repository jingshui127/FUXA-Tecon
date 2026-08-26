/**
 * FUXA PRO Headless Guardian
 * 双模式入口：Guardian 守护模式 + Server 服务模式
 *
 * 用途：
 * - 作为 pkg 打包的入口点（main.js）
 * - 数据目录改为 EXE 同目录下的 data\ 子目录（便携式部署）
 * - 崩溃自动重启，带冷却窗口防止无限循环
 *
 * 模式一：Server 模式 (FUXA_SERVER=1)
 *   由 Guardian 进程以子进程方式启动
 *   设置数据目录为 EXE 同目录 data\
 *   直接 require FUXA server 主程序
 *
 * 模式二：Guardian 模式（默认）
 *   监控子进程，崩溃后自动重启
 *   10秒窗口内最多5次快速重启（冷却保护）
 *   最大重启次数1000次，间隔2秒
 */

const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

// ==================== 命令行参数解析 ====================
const args = process.argv.slice(2);
const portIdx = args.indexOf('-p');
let serverArgs = [];
if (portIdx !== -1 && args[portIdx + 1]) {
    serverArgs = ['-p', args[portIdx + 1]];
}

// ==================== Server 模式 ====================
if (process.env.FUXA_SERVER === '1') {
    // EXE 所在目录 = 便携数据根目录
    const exeDir = path.dirname(process.execPath);
    const fuxaDataDir = path.join(exeDir, 'data');

    // 确保数据目录存在
    if (!fs.existsSync(fuxaDataDir)) {
        fs.mkdirSync(fuxaDataDir, { recursive: true });
    }

    // 设置环境变量，server/main.js 会读取 userDir
    process.env.userDir = fuxaDataDir;

    // 透传端口参数给 main.js（通过环境变量 PORT，pkg EXE 不支持 CLI args 透传）
    if (serverArgs.length > 0) {
        process.env.PORT = serverArgs[1];
    }

    console.log('[Server] FUXA PRO Headless Server starting...');
    console.log(`[Server] Data directory: ${fuxaDataDir}`);
    console.log(`[Server] Node.js: ${process.version}`);
    if (serverArgs.length > 0) {
        console.log(`[Server] Port override: ${args[portIdx + 1]}`);
    }

    // 启动 FUXA server
    require('./server/main.js');
    return;
}

// ==================== Guardian 模式（默认） ====================
const CONFIG = {
    maxRestarts: 1000,
    restartDelay: 2000,
    cooldownWindow: 10000,
    maxRapidRestarts: 5
};

let restartCount = 0;
let rapidRestarts = [];
let serverProcess = null;

function log(msg) {
    const ts = new Date().toISOString();
    console.log(`[FUXA PRO] ${ts} | ${msg}`);
}

function startServer() {
    log(`Starting FUXA server (restart #${restartCount})...`);

    // 冷却窗口检查：10秒内超过5次快速重启则等待冷却
    const now = Date.now();
    rapidRestarts = rapidRestarts.filter(t => now - t < CONFIG.cooldownWindow);
    if (rapidRestarts.length >= CONFIG.maxRapidRestarts) {
        log(`Rapid restart limit reached (${CONFIG.maxRapidRestarts} in ${CONFIG.cooldownWindow / 1000}s). Cooling down...`);
        setTimeout(startServer, CONFIG.cooldownWindow);
        return;
    }

    const childEnv = { ...process.env, FUXA_SERVER: '1' };
    if (serverArgs.length > 0) {
        childEnv.PORT = serverArgs[1];
    }
    serverProcess = spawn(process.execPath, serverArgs, {
        cwd: path.dirname(process.execPath),
        stdio: 'inherit',
        env: childEnv,
        windowsHide: true
    });

    serverProcess.on('exit', (code, signal) => {
        log(`Server exited (code=${code || 0}, signal=${signal || 'none'})`);

        if (restartCount < CONFIG.maxRestarts) {
            restartCount++;
            rapidRestarts.push(Date.now());
            log(`Restarting in ${CONFIG.restartDelay / 1000}s...`);
            setTimeout(startServer, CONFIG.restartDelay);
        } else {
            log(`Maximum restarts (${CONFIG.maxRestarts}) reached. Stopping.`);
            process.exit(1);
        }
    });

    serverProcess.on('error', (err) => {
        log(`Failed to start process: ${err.message}`);
        if (restartCount < CONFIG.maxRestarts) {
            restartCount++;
            setTimeout(startServer, CONFIG.restartDelay);
        }
    });
}

// 启动
log('=====================================');
log('FUXA PRO Headless Guardian starting...');
log('科控物联提供技术支持 | QQ: 2492123056');
log(`Working directory: ${path.dirname(process.execPath)}`);
log(`Max restarts: ${CONFIG.maxRestarts}`);
log(`Cooldown window: ${CONFIG.cooldownWindow / 1000}s / max ${CONFIG.maxRapidRestarts} rapid`);
if (serverArgs.length > 0) {
    log(`Port override: ${args[portIdx + 1]}`);
}
log('=====================================');

startServer();

// 优雅退出
function shutdown(signal) {
    log(`Received ${signal}, shutting down...`);
    if (serverProcess) {
        serverProcess.kill(signal);
    }
    setTimeout(() => process.exit(0), 5000);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

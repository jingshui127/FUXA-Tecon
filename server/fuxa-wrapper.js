/**
 * FUXA Server Wrapper
 * Auto-restart mechanism: automatically restarts when FUXA process crashes
 * Solves node-snap7 native module crash issues
 *
 * FUXA 服务器包装器
 * 自动重启机制：检测到 FUXA 进程异常退出后自动重新启动
 * 解决 node-snap7 原生模块导致的进程崩溃问题
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Configuration / 配置
const CONFIG = {
    maxRestarts: 1000,           // Maximum restart count (prevent infinite loop) / 最大重启次数
    restartDelay: 2000,          // Restart delay (ms) / 重启延迟（毫秒）
    serverScript: 'main.js',     // FUXA main script / FUXA 主脚本
    workingDir: __dirname        // Working directory / 工作目录
};

let restartCount = 0;
let serverProcess = null;

function log(message) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [FUXA-Wrapper] ${message}`);
}

function startServer() {
    log(`Starting FUXA server (restart #${restartCount})...`);

    serverProcess = spawn('node', [CONFIG.serverScript], {
        cwd: CONFIG.workingDir,
        stdio: 'inherit',         // Inherit stdio to show logs / 继承标准输入输出，显示日志
        detached: false,
        windowsHide: true         // Hide console window on Windows / Windows 下隐藏控制台窗口
    });

    serverProcess.on('exit', (code, signal) => {
        log(`FUXA process exited with code=${code}, signal=${signal}`);

        if (restartCount < CONFIG.maxRestarts) {
            restartCount++;
            log(`Restarting in ${CONFIG.restartDelay}ms...`);
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

// Start server / 启动服务器
log('=====================================');
log('FUXA Server Wrapper starting...');
log(`Working directory: ${CONFIG.workingDir}`);
log(`Max restarts: ${CONFIG.maxRestarts}`);
log('=====================================');

startServer();

// Graceful shutdown / 优雅退出
process.on('SIGINT', () => {
    log('Received SIGINT, shutting down...');
    if (serverProcess) {
        serverProcess.kill('SIGINT');
    }
    setTimeout(() => process.exit(0), 5000);
});

process.on('SIGTERM', () => {
    log('Received SIGTERM, shutting down...');
    if (serverProcess) {
        serverProcess.kill('SIGTERM');
    }
    setTimeout(() => process.exit(0), 5000);
});

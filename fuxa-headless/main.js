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
// pkg 打包后 process.argv 的首个元素可能是入口脚本路径，直接按固定下标取参会错位，
// 这里统一扫描所有参数，兼容 `node guardian.js -p 1882` 与 `fuxa-pro-headless.exe -p 1882`。
const rawArgs = process.argv.slice(1);
let portValue = null;
for (let i = 0; i < rawArgs.length; i++) {
    if ((rawArgs[i] === '-p' || rawArgs[i] === '--port') && rawArgs[i + 1]) {
        portValue = rawArgs[i + 1];
        break;
    }
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

    // 端口通过 PORT 环境变量传递给 server/main.js；
    // 不能把 '-p' 作为 pkg EXE 的首个参数，否则会被 pkg 当成入口脚本。
    if (portValue) {
        process.env.PORT = portValue;
    }

    console.log('[Server] FUXA PRO Headless Server starting...');
    console.log(`[Server] Data directory: ${fuxaDataDir}`);
    console.log(`[Server] Node.js: ${process.version}`);
    if (portValue) {
        console.log(`[Server] Port override: ${portValue}`);
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
    if (portValue) {
        childEnv.PORT = portValue;
    }
    // 子进程不传 CLI 参数，避免 pkg 把 '-p' 误判为入口脚本；端口通过 PORT 环境变量传递
    serverProcess = spawn(process.execPath, [], {
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
if (portValue) {
    log(`Port override: ${portValue}`);
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

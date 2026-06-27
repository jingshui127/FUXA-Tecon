/**
 * FUXA PRO 开发调试用守护脚本
 * 为 node main.js 开发模式提供与 EXE 一致的守护进程保护
 *
 * 用法: cd server && node guard.js -p 1886
 *
 * 特性:
 * - spawn main.js 子进程，崩溃后 2 秒自动重启
 * - 10 秒内快速重启超过 5 次则冷却 10 秒
 * - 最多重启 1000 次
 * - Ctrl+C 优雅退出
 * - 通过环境变量 PORT 传递端口
 */

const { spawn } = require('child_process');
const path = require('path');

// 命令行参数解析
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

const cliArgs = parseArgs(process.argv);

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
    console.log(`[TcScada] ${ts} | ${msg}`);
}

function startServer() {
    log(`Starting FUXA server (restart #${restartCount})...`);

    // 冷却窗口检查
    const now = Date.now();
    rapidRestarts = rapidRestarts.filter(t => now - t < CONFIG.cooldownWindow);
    if (rapidRestarts.length >= CONFIG.maxRapidRestarts) {
        log(`Rapid restart limit reached (${CONFIG.maxRapidRestarts} in ${CONFIG.cooldownWindow / 1000}s). Cooling down...`);
        setTimeout(startServer, CONFIG.cooldownWindow);
        return;
    }

    const childEnv = { ...process.env };
    if (cliArgs.port) {
        childEnv.PORT = cliArgs.port;
    }

    serverProcess = spawn('node', ['main.js'], {
        cwd: __dirname,
        stdio: 'inherit',
        env: childEnv
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
log('FUXA PRO Development Guardian starting...');
log('科控物联提供技术支持 | QQ: 2492123056');
log(`Working directory: ${__dirname}`);
log(`Max restarts: ${CONFIG.maxRestarts}`);
log(`Cooldown window: ${CONFIG.cooldownWindow / 1000}s / max ${CONFIG.maxRapidRestarts} rapid`);
if (cliArgs.port) {
    log(`Port override: ${cliArgs.port}`);
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

/**
 * FUXA Server Guard
 * 从 server/ 目录运行时的守护进程：node guard.js -p 1886
 * 崩溃后自动重启，与 EXE Guardian 模式行为一致
 */
const { spawn } = require('child_process');
const path = require('path');

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

// 解析端口参数
let port = null;
for (let i = 2; i < process.argv.length; i++) {
    if (process.argv[i] === '-p' || process.argv[i] === '--port') {
        port = process.argv[i + 1];
        i++;
    }
}

function log(msg) {
    const ts = new Date().toLocaleString('zh-CN', { hour12: false });
    console.log(`[${ts}] [Guard] ${msg}`);
}

function exitCodeDetail(code) {
    if (code === 0) return '正常退出';
    if (code === 1) return '一般错误';
    if (code === 3221225477) return 'STATUS_ACCESS_VIOLATION (内存访问违规，常见于 native 模块崩溃)';
    if (code === 3221225725) return 'STATUS_DLL_NOT_FOUND (缺少 DLL)';
    if (code === 3221225786) return 'STATUS_ILLEGAL_INSTRUCTION';
    if (code === 3221225617) return 'STATUS_STACK_BUFFER_OVERRUN';
    if (code === null) return '无 exit code';
    return `exit code ${code}`;
}

function startServer() {
    const now = Date.now();

    if (now - lastRestartTime < CONFIG.cooldownWindow) {
        rapidRestarts++;
        if (rapidRestarts >= CONFIG.maxRapidRestarts) {
            log(`WARNING: ${CONFIG.maxRapidRestarts} rapid restarts in ${CONFIG.cooldownWindow / 1000}s!`);
            log('Cooling down for 10s...');
            return setTimeout(startServer, 10000);
        }
    } else {
        rapidRestarts = 0;
    }
    lastRestartTime = now;

    log(`Starting FUXA server (restart #${restartCount + 1})...`);
    if (port) log(`Port: ${port}`);

    const env = { ...process.env };
    if (port) env.PORT = port;

    const serverScript = path.join(__dirname, 'main.js');
    childProcess = spawn('node', [serverScript], {
        env,
        stdio: 'inherit',
        windowsHide: false,
    });

    childProcess.on('exit', (code, signal) => {
        if (childProcess) {
            const detail = exitCodeDetail(code);
            const uptime = Math.floor((Date.now() - lastRestartTime) / 1000);
            log(`Server exited: ${detail} | signal=${signal || 'none'} | 运行时长=${uptime}s`);
            childProcess = null;
            restartCount++;
            if (restartCount < CONFIG.maxRestarts) {
                if (rapidRestarts > 0) {
                    log(`[快速重启计数器: ${rapidRestarts}/${CONFIG.maxRapidRestarts}] 重启倒计时 ${CONFIG.restartDelay / 1000}s...`);
                } else {
                    log(`重启倒计时 ${CONFIG.restartDelay / 1000}s...`);
                }
                setTimeout(startServer, CONFIG.restartDelay);
            } else {
                log(`已达到最大重启次数 (${CONFIG.maxRestarts})，Guard 退出。`);
                process.exit(1);
            }
        }
    });
}

process.on('SIGINT', () => {
    log('Received SIGINT, shutting down...');
    if (childProcess) childProcess.kill('SIGINT');
    process.exit(0);
});

process.on('SIGTERM', () => {
    log('Received SIGTERM, shutting down...');
    if (childProcess) childProcess.kill('SIGTERM');
    process.exit(0);
});

console.log('================================================');
console.log('  FUXA Server Guard');
console.log(`  最大重启: ${CONFIG.maxRestarts} | 重启间隔: ${CONFIG.restartDelay / 1000}s`);
console.log(`  快速重启上限: ${CONFIG.maxRapidRestarts}次/${CONFIG.cooldownWindow / 1000}s`);
console.log('================================================');
startServer();

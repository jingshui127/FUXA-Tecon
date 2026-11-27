/**
 * FUXA PRO Headless 入口（单进程）
 *
 * 只做三件事：
 * 1. 把数据目录设为 <EXE 同级>/data（pkg 下 __dirname 是只读快照，不能写入）
 * 2. 把 -p/--port 转成 PORT 环境变量（pkg 下 '-p' 作为首个参数会被误判为入口脚本）
 * 3. require FUXA server 主程序
 *
 * 崩溃重启由外部守护负责：StarAgent（每 10s 检测 + 3s 延迟，监控 FuxaPro.exe）。
 * 2026-11-27 移除了内置 Guardian 模式（spawn 自身 + 2 秒重启 + 冷却 + 信号转发）：
 * 它与 StarAgent 职责完全重复，且两层守护会让进程树变成双进程。
 */

const path = require('path');
const fs = require('fs');

// 扫描 argv 取端口：pkg 下 process.argv 首元素可能是入口脚本路径，不能按下标硬取
let portValue = null;
const rawArgs = process.argv.slice(1);
for (let i = 0; i < rawArgs.length; i++) {
    if ((rawArgs[i] === '-p' || rawArgs[i] === '--port') && rawArgs[i + 1]) {
        portValue = rawArgs[i + 1];
        break;
    }
}

if (process.pkg) {
    // EXE 所在目录 = 便携数据根目录
    const exeDir = path.dirname(process.execPath);
    const fuxaDataDir = path.join(exeDir, 'data');

    if (!fs.existsSync(fuxaDataDir)) {
        fs.mkdirSync(fuxaDataDir, { recursive: true });
    }

    // server/main.js 读取 userDir 决定 rootDir / workDir
    process.env.userDir = fuxaDataDir;

    console.log('[FUXA] Headless starting...');
    console.log(`[FUXA] Data directory: ${fuxaDataDir}`);
    console.log(`[FUXA] Node.js: ${process.version}`);
} else {
    console.log('[FUXA] Running from source (not packaged), using server/ default directories');
}

if (portValue) {
    process.env.PORT = portValue;
    console.log(`[FUXA] Port override: ${portValue}`);
}

require('./server/main.js');

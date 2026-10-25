const fs = require('fs');
const path = require('path');

// 原生插件验证：针对「已部署 + 已在网页安装插件」的运行目录，
// 而不是构建仓库。CI 里没有这层依赖，因此这项检查必须在部署机上执行。
const root = path.resolve(__dirname, '..');
const runtimeDir = path.join(root, 'artifacts', 'data', '_pkg', 'runtime', 'node_modules');

function fail(message) {
    console.error(`[verify-native] FAIL ${message}`);
    process.exit(1);
}

function load(name) {
    const target = path.join(runtimeDir, name);
    if (!fs.existsSync(target)) {
        fail(`plugin not installed: ${target}. 首次运行 EXE 后，请在网页「设备/插件」中安装该插件再重试。`);
    }
    try {
        return require(target);
    } catch (error) {
        fail(`require(${name}) failed: ${error.message}`);
    }
}

async function main() {
    console.log(`[verify-native] node ${process.version} (native modules must match this ABI)`);

    const odbc = load('odbc');
    if (typeof odbc !== 'object' && typeof odbc !== 'function') {
        fail('odbc loaded but exports nothing usable');
    }
    console.log('[verify-native] PASS odbc loaded');

    load('chart.js');
    const { ChartJSNodeCanvas } = load('chartjs-node-canvas');
    const canvas = new ChartJSNodeCanvas({ width: 400, height: 300 });
    const buffer = await canvas.renderToBuffer({
        type: 'bar',
        data: {
            labels: ['A', 'B', 'C'],
            datasets: [{ label: 'test', data: [3, 1, 2], backgroundColor: '#0f6fbf' }]
        }
    });
    if (!buffer || buffer.length < 1000) {
        fail(`chart render produced ${buffer ? buffer.length : 0} bytes`);
    }
    const isPng = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
    if (!isPng) {
        fail('chart render did not produce a PNG');
    }
    console.log(`[verify-native] PASS chartjs-node-canvas rendered ${buffer.length} bytes PNG`);
    console.log('[verify-native] ALL CHECKS PASSED');
}

main().catch((error) => fail(error.message));

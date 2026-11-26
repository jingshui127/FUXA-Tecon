const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const brandingPath = path.join(__dirname, 'electron-branding.generated.json');
const builderPath = require.resolve('electron-builder/cli.js');
const appName = process.env.FUXA_APP_NAME?.trim() || 'FUXA';

let brandingFileCreated = false;
try {
    const descriptor = fs.openSync(brandingPath, 'wx');
    brandingFileCreated = true;
    fs.writeFileSync(descriptor, JSON.stringify({ appName }, null, 2));
    fs.closeSync(descriptor);

    const result = spawnSync(process.execPath, [
        builderPath,
        '--config', 'electron-builder.config.js',
        ...process.argv.slice(2)
    ], { cwd: __dirname, env: process.env, stdio: 'inherit' });

    if (result.error) throw result.error;
    process.exitCode = result.status ?? 1;
} finally {
    if (brandingFileCreated) fs.unlinkSync(brandingPath);
}

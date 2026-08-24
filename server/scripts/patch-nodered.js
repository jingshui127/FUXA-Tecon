const fs = require('fs');
const path = require('path');

function replaceOnce(target, oldText, newText, message) {
    if (!fs.existsSync(target)) return;
    const source = fs.readFileSync(target, 'utf8');
    if (source.includes(newText) || !source.includes(oldText)) return;
    fs.writeFileSync(target, source.replace(oldText, newText), 'utf8');
    console.log(`[patch-nodered] ${message}`);
}

replaceOnce(
    path.join(__dirname, '..', 'node_modules', '@node-red', 'registry', 'lib', 'localfilesystem.js'),
    '        const pkg = require(packagefile)',
    "        const pkg = JSON.parse(fs.readFileSync(packagefile, 'utf8'))",
    'Patched Node-RED package metadata loading for pkg.'
);

const httpRequest = path.join(__dirname, '..', 'node_modules', '@node-red', 'nodes', 'core', 'network', '21-httprequest.js');
const outerGot = "const got = require(require.resolve('got', { paths: [require('path').resolve(__dirname, '..', '..', '..', '..')] }));  // patched: use outer CommonJS got v11";
replaceOnce(httpRequest, "const { got } = await import('got')", outerGot, 'Patched Node-RED httprequest got loading for pkg.');
replaceOnce(httpRequest, "const got = require('got');  // patched for pkg ESM compatibility", outerGot, 'Updated Node-RED httprequest got resolution.');
/**
 * Patch Node-RED httprequest node for pkg compatibility.
 * 
 * pkg's virtual filesystem cannot resolve ESM dynamic import(),
 * so we replace `await import('got')` with `require('got')`.
 * got v11.x is CommonJS, so require() works fine.
 */
const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '..', 'node_modules', '@node-red', 'nodes', 'core', 'network', '21-httprequest.js');

if (!fs.existsSync(targetFile)) {
    console.log('[patch-nodered] httprequest node not found, skipping.');
    process.exit(0);
}

let content = fs.readFileSync(targetFile, 'utf8');

// Replace: const { got } = await import('got')
// With:    const got = require('got');
const oldImport = "const { got } = await import('got')";
const newImport = "const got = require('got');  // patched for pkg ESM compatibility";

if (content.includes(oldImport)) {
    content = content.replace(oldImport, newImport);
    fs.writeFileSync(targetFile, content, 'utf8');
    console.log('[patch-nodered] Patched httprequest node: import() -> require()');
} else if (content.includes(newImport)) {
    console.log('[patch-noderen] Already patched, skipping.');
} else {
    console.log('[patch-nodered] Pattern not found, may already be patched or version changed.');
}
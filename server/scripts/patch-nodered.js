/**
 * Patch Node-RED httprequest node for pkg & CommonJS compatibility.
 *
 * Two issues in Node-RED 4.x with got v12 (ESM-only) nested inside
 * @node-red/nodes/node_modules:
 *
 * 1) Original code uses ESM dynamic `await import('got')` which fails in
 *    pkg's virtual filesystem → replace with require().
 * 2) Node-RED 4.x ships with got v12 nested in @node-red/nodes/node_modules.
 *    got v12 is ESM-only ("type": "module") so require() throws
 *    `SyntaxError: Cannot use import statement outside a module`.
 *    Fix: use require.resolve(..., { paths: [...]) to force resolution
 *    against the outer server/node_modules which still has got v11
 *    (CommonJS, works fine with require()).
 */
const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '..', 'node_modules', '@node-red', 'nodes', 'core', 'network', '21-httprequest.js');

if (!fs.existsSync(targetFile)) {
    console.log('[patch-nodered] httprequest node not found, skipping.');
    process.exit(0);
}

let content = fs.readFileSync(targetFile, 'utf8');
let modified = false;

// ── Patch 1: ESM dynamic import() → require() (original fix) ──────────
const oldImport = "const { got } = await import('got')";
// Final patched statement (used below, also matches already-patched files)
const finalRequire = "const got = require(require.resolve('got', { paths: [require('path').resolve(__dirname, '..', '..', '..', '..')] }));  // patched: skip nested ESM got v12, use outer CommonJS got v11";

if (content.includes(oldImport)) {
    // Replace import() with the final require-resolve form (skip intermediate)
    content = content.replace(oldImport, finalRequire);
    modified = true;
    console.log('[patch-nodered] Patched: await import(got) -> require.resolve(outer)');
}

// ── Patch 2: upgrade old intermediate require('got') to skip nested ESM got v12 ──
const oldRequire = "const got = require('got');  // patched for pkg ESM compatibility";
if (content.includes(oldRequire)) {
    content = content.replace(oldRequire, finalRequire);
    modified = true;
    console.log('[patch-nodered] Patched: require(got) -> require.resolve(outer) to skip nested ESM got v12');
}

// Already at final form?
if (!modified && content.includes(finalRequire)) {
    console.log('[patch-nodered] Already fully patched, skipping.');
} else if (!modified) {
    console.log('[patch-nodered] No matchable pattern found (version may have changed), inspect manually.');
}

if (modified) {
    fs.writeFileSync(targetFile, content, 'utf8');
}
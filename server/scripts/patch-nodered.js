const fs = require('fs');
const path = require('path');

function patchFile(target, oldText, newText, message) {
    if (!fs.existsSync(target)) {
        throw new Error(`[patch-nodered] target not found: ${target}`);
    }

    const source = fs.readFileSync(target, 'utf8');

    if (source.includes(newText)) {
        console.log(`[patch-nodered] already patched: ${target}`);
        return false;
    }

    if (!source.includes(oldText)) {
        throw new Error(`[patch-nodered] expected source pattern not found: ${target}`);
    }

    fs.writeFileSync(target, source.replace(oldText, newText), 'utf8');
    console.log(`[patch-nodered] ${message}`);
    return true;
}

function patchOptionalFile(target, patterns, replacement, message) {
    if (!fs.existsSync(target)) {
        return false;
    }

    const source = fs.readFileSync(target, 'utf8');
    if (source.includes(replacement)) {
        console.log(`[patch-nodered] already patched: ${target}`);
        return true;
    }

    const pattern = patterns.find((candidate) => source.includes(candidate));
    if (!pattern) {
        throw new Error(`[patch-nodered] expected got import pattern not found: ${target}`);
    }

    fs.writeFileSync(target, source.replace(pattern, replacement), 'utf8');
    console.log(`[patch-nodered] ${message}`);
    return true;
}

const headlessRoot = path.resolve(__dirname, '..', '..');
const nodeModules = path.join(headlessRoot, 'node_modules');
const outerGot = "require(require.resolve('got', { paths: [require('path').resolve(__dirname, '..', '..', '..', '..')] }))";

const registryFile = path.join(
    nodeModules,
    '@node-red',
    'registry',
    'lib',
    'localfilesystem.js'
);

patchFile(
    registryFile,
    '        const pkg = require(packagefile)',
    "        const pkg = JSON.parse(fs.readFileSync(packagefile, 'utf8'))",
    'Patched Node-RED package metadata loading for pkg.'
);

const telemetryFile = path.join(
    nodeModules,
    '@node-red',
    'runtime',
    'lib',
    'telemetry',
    'index.js'
);

patchOptionalFile(
    telemetryFile,
    ["got = (await import('got')).got"],
    `got = ${outerGot}`,
    'Patched Node-RED telemetry got loading for pkg.'
);

const legacyHttpRequest = path.join(
    nodeModules,
    '@node-red',
    'nodes',
    'core',
    'network',
    '21-httprequest.js'
);

patchOptionalFile(
    legacyHttpRequest,
    ["const { got } = await import('got')", "const got = require('got');  // patched for pkg ESM compatibility"],
    `const got = ${outerGot};  // patched: use outer CommonJS got`,
    'Patched legacy Node-RED httprequest got loading for pkg.'
);

if (!fs.existsSync(path.join(nodeModules, 'got', 'package.json'))) {
    throw new Error('[patch-nodered] got package is missing');
}

const registrySource = fs.readFileSync(registryFile, 'utf8');
if (!registrySource.includes("JSON.parse(fs.readFileSync(packagefile, 'utf8'))")) {
    throw new Error('[patch-nodered] registry compatibility patch was not applied');
}

if (fs.existsSync(telemetryFile)) {
    const telemetrySource = fs.readFileSync(telemetryFile, 'utf8');
    if (!telemetrySource.includes(`got = ${outerGot}`)) {
        throw new Error('[patch-nodered] telemetry got compatibility patch was not applied');
    }
}

if (fs.existsSync(legacyHttpRequest)) {
    const legacySource = fs.readFileSync(legacyHttpRequest, 'utf8');
    if (!legacySource.includes('// patched: use outer CommonJS got')) {
        throw new Error('[patch-nodered] legacy httprequest got compatibility patch was not applied');
    }
}

console.log('[patch-nodered] verification passed');

const fs = require('fs');
const path = require('path');

// 官方默认瓦片源 -> OpenStreetMap HOT（人道主义风格，国内可访问性更好）
const TILE_TARGET = 'https://tile-{s}.openstreetmap.fr/hot/{z}/{x}/{y}.png';
const KNOWN_SOURCES = [
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
];

const distDir = path.resolve(__dirname, '..', '..', 'client', 'dist');

function patchBundle(name) {
    const target = path.join(distDir, name);
    const source = fs.readFileSync(target, 'utf8');

    if (source.includes(TILE_TARGET)) {
        console.log(`[patch-map] already patched: ${name}`);
        return;
    }

    const pattern = KNOWN_SOURCES.find((candidate) => source.includes(candidate));
    if (!pattern) {
        throw new Error(`[patch-map] OSM tile source not found in ${name}; 官方可能更换了地图服务商，需人工确认`);
    }

    fs.writeFileSync(target, source.split(pattern).join(TILE_TARGET), 'utf8');
    console.log(`[patch-map] replaced ${pattern} -> ${TILE_TARGET} in ${name}`);
}

function main() {
    if (!fs.existsSync(distDir)) {
        throw new Error(`[patch-map] dist directory not found: ${distDir}`);
    }

    const bundles = fs.readdirSync(distDir).filter((name) => /^main\..*\.js$/.test(name));
    if (bundles.length === 0) {
        throw new Error(`[patch-map] main.*.js not found in ${distDir}`);
    }

    bundles.forEach(patchBundle);

    const failed = bundles.filter((name) => !fs.readFileSync(path.join(distDir, name), 'utf8').includes(TILE_TARGET));
    if (failed.length > 0) {
        throw new Error(`[patch-map] verification failed: ${failed.join(', ')}`);
    }

    console.log('[patch-map] verification passed');
}

try {
    main();
} catch (error) {
    console.error(error.message);
    process.exit(1);
}

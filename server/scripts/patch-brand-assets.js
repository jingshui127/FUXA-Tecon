const fs = require('fs');
const path = require('path');

// 品牌回填：docs/customization 是母本，client/dist/assets/customization 是打包内置资源。
// 官方升级会整体覆盖 client/dist，因此每次打包都执行一次（幂等），避免忘记回填后发出默认样式。
const root = path.resolve(__dirname, '..', '..');
const sourceDir = path.join(root, 'docs', 'customization');
const targetDir = path.join(root, 'client', 'dist', 'assets', 'customization');
const REQUIRED = ['config.json', 'logo.svg', 'favicon.ico'];
const BRAND_TITLE = '科控物联';
// 只复制真正的品牌资源，排除 Windows 目录元数据与隐藏文件
const SKIP = ['desktop.ini', 'thumbs.db'];
const ALLOWED_EXT = ['.json', '.svg', '.ico', '.png', '.jpg', '.jpeg', '.gif', '.webp'];

function fail(message) {
    console.error(`[patch-brand] ${message}`);
    process.exit(1);
}

function main() {
    if (!fs.existsSync(sourceDir)) {
        fail(`source directory not found: ${sourceDir}`);
    }

    const missing = REQUIRED.filter((name) => !fs.existsSync(path.join(sourceDir, name)));
    if (missing.length > 0) {
        fail(`missing required asset in docs/customization: ${missing.join(', ')}`);
    }

    const files = fs.readdirSync(sourceDir, { withFileTypes: true })
        .filter((entry) => entry.isFile())
        .map((entry) => entry.name)
        .filter((name) => {
            if (SKIP.includes(name.toLowerCase())) {
                return false;
            }
            return ALLOWED_EXT.includes(path.extname(name).toLowerCase());
        });

    fs.mkdirSync(targetDir, { recursive: true });
    files.forEach((name) => {
        fs.copyFileSync(path.join(sourceDir, name), path.join(targetDir, name));
    });
    console.log(`[patch-brand] copied ${files.length} file(s) to client/dist/assets/customization: ${files.join(', ')}`);

    let config;
    try {
        config = JSON.parse(fs.readFileSync(path.join(targetDir, 'config.json'), 'utf8'));
    } catch (error) {
        fail(`config.json is not valid JSON: ${error.message}`);
    }

    if (config.appTitle !== BRAND_TITLE) {
        fail(`appTitle is "${config.appTitle}", expected "${BRAND_TITLE}"`);
    }

    const notWritten = REQUIRED.filter((name) => !fs.existsSync(path.join(targetDir, name)));
    if (notWritten.length > 0) {
        fail(`verification failed, missing in target: ${notWritten.join(', ')}`);
    }

    console.log(`[patch-brand] verification passed (appTitle=${config.appTitle})`);
}

try {
    main();
} catch (error) {
    fail(error.message);
}

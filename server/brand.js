/**
 * Brand configuration module.
 *
 * Reads brand.json from the user data directory (process.env.userDir)
 * and exposes it as a public API endpoint for the frontend.
 *
 * brand.json fields:
 *   - name:      Brand name shown in sidenav (replaces "FUXA")
 *   - title:     Browser tab title
 *   - logo:      Logo image path (relative to data/ or absolute URL)
 *   - favicon:   Favicon path
 *   - shortName: Short name for mobile display
 *   - footer:    Footer text
 *
 * All fields are optional. Missing fields fall back to FUXA defaults.
 */

const fs = require('fs');
const path = require('path');

const DEFAULT_BRAND = {
    name: 'FUXA',
    title: 'FUXA',
    logo: null,
    favicon: 'favicon.ico',
    shortName: 'FUXA',
    footer: ''
};

let brandConfig = null;
let brandDataDir = null;

/**
 * 收集可能存放品牌配置的目录。
 * EXE 打包后 __dirname 位于 pkg 虚拟快照（只读），因此必须额外纳入可执行文件所在目录。
 */
function collectDirs(userDir) {
    const dirs = [];
    const push = (dir) => {
        if (dir && dirs.indexOf(dir) < 0) {
            dirs.push(dir);
        }
    };

    if (process.pkg) {
        const exeBase = path.dirname(process.execPath);
        push(path.join(exeBase, 'data'));
        push(exeBase);
    }
    push(userDir);
    push(path.join(userDir, 'data'));
    push(path.join(userDir, '..', 'data'));
    push(path.join(userDir, '..'));

    return dirs;
}

/**
 * 将 PRO 版 customization/config.json 映射为普通版的品牌字段，
 * 让两个版本共用同一份品牌配置。
 */
function mapCustomizationToBrand(cfg) {
    const info = cfg.appInfo || {};
    const splash = cfg.splash || {};
    const fileName = (value) => (typeof value === 'string' && value
        ? path.basename(value.replace(/\\/g, '/'))
        : null);

    return {
        name: cfg.appName || cfg.sideMenuTitle || info.title || DEFAULT_BRAND.name,
        title: cfg.appTitle || info.title || DEFAULT_BRAND.title,
        logo: fileName(splash.image || info.image),
        favicon: fileName(cfg.favicon),
        shortName: cfg.appName || DEFAULT_BRAND.shortName,
        footer: splash.subText || info.subText || ''
    };
}

/**
 * Load brand config from the user directory.
 * 优先普通版原生 brand.json，其次兼容 PRO 版 customization/config.json。
 * 都找不到时回退 FUXA 默认品牌。
 */
function loadBrand(userDir) {
    const dirs = collectDirs(userDir);

    let brandFile = null;
    for (const dir of dirs) {
        const candidate = path.join(dir, 'brand.json');
        if (fs.existsSync(candidate)) {
            brandFile = candidate;
            break;
        }
    }

    if (brandFile) {
        brandDataDir = path.dirname(brandFile);
        try {
            const parsed = JSON.parse(fs.readFileSync(brandFile, 'utf8'));
            brandConfig = { ...DEFAULT_BRAND, ...parsed };
            console.log(`[Brand] Loaded brand config from ${brandFile}: name="${brandConfig.name}"`);
        } catch (err) {
            console.warn(`[Brand] Failed to parse brand.json, using defaults: ${err.message}`);
            brandConfig = { ...DEFAULT_BRAND };
        }
        return brandConfig;
    }

    let customizationFile = null;
    for (const dir of dirs) {
        const candidate = path.join(dir, 'customization', 'config.json');
        if (fs.existsSync(candidate)) {
            customizationFile = candidate;
            break;
        }
    }

    if (customizationFile) {
        // 图片资源既可能在 customization/ 内，也可能与 config.json 的上级目录平级
        brandDataDir = path.dirname(path.dirname(customizationFile));
        try {
            const parsed = JSON.parse(fs.readFileSync(customizationFile, 'utf8'));
            brandConfig = { ...DEFAULT_BRAND, ...mapCustomizationToBrand(parsed) };
            console.log(`[Brand] Loaded customization config from ${customizationFile}: name="${brandConfig.name}"`);
        } catch (err) {
            console.warn(`[Brand] Failed to parse customization config, using defaults: ${err.message}`);
            brandConfig = { ...DEFAULT_BRAND };
        }
        return brandConfig;
    }

    brandConfig = { ...DEFAULT_BRAND };
    brandDataDir = userDir;
    console.log(`[Brand] No brand config found in ${dirs.join(' | ')}, using defaults (FUXA).`);
    return brandConfig;
}

/**
 * 解析品牌图片文件：支持 http(s) URL，否则在品牌目录及其 customization 子目录中查找。
 */
function findAsset(fileName) {
    if (!fileName) {
        return null;
    }
    if (/^https?:\/\//i.test(fileName)) {
        return fileName;
    }
    const rel = fileName.replace(/^\//, '');
    const bases = [brandDataDir, brandDataDir && path.join(brandDataDir, 'customization')];
    for (const base of bases) {
        if (!base) {
            continue;
        }
        const filePath = path.join(base, rel);
        if (fs.existsSync(filePath)) {
            return filePath;
        }
    }
    return null;
}

/**
 * Get current brand config.
 */
function getBrand() {
    return brandConfig || { ...DEFAULT_BRAND };
}

/**
 * Get the brand logo file path for static serving.
 * Returns null if no custom logo is configured.
 */
function getLogoPath() {
    if (!brandConfig) {
        return null;
    }
    return findAsset(brandConfig.logo);
}

/**
 * 获取自定义 favicon 的绝对路径。
 * 未配置时回退默认的 favicon.ico：只要用户目录下存在该文件即视为自定义。
 */
function getFaviconPath() {
    if (!brandConfig) {
        return null;
    }
    return findAsset(brandConfig.favicon || DEFAULT_BRAND.favicon);
}

/**
 * Inject brand config into index.html content.
 * Replaces <title>, favicon references, loading placeholder text, logo, and footer.
 */
function injectBrandToHtml(html) {
    const brand = getBrand();
    let result = html;

    // Replace <title>
    if (brand.title && brand.title !== DEFAULT_BRAND.title) {
        result = result.replace(/<title>[^<]*<\/title>/, `<title>${brand.title}</title>`);
    }

    // Replace favicon link if a custom favicon file actually exists
    if (getFaviconPath()) {
        result = result.replace(
            /<link[^>]*rel="icon"[^>]*>/,
            `<link rel="icon" type="image/x-icon" href="/api/brand/favicon" />`
        );
    }

    // Replace the "FUXA Loading..." placeholder inside <app-root>
    if (brand.name && brand.name !== DEFAULT_BRAND.name) {
        result = result.replace(/FUXA Loading\.\.\./g, `${brand.name} Loading...`);
    }

    // Replace the loading logo (class="logo" div) with custom brand logo or hide it
    const logoPath = getLogoPath();
    if (logoPath) {
        // Replace the logo div with an img tag using the brand logo
        const logoSrc = /^https?:\/\//i.test(logoPath) ? logoPath : '/api/brand/logo';
        const logoHtml = `<img src="${logoSrc}" style="display:block;width:60px;height:60px;object-fit:contain;margin-left:45px;" />`;
        result = result.replace(
            /<div class="logo" style="display:block;width:60px;height:60px;background-size:60px 60px;margin-left: 45px;"><\/div>/,
            logoHtml
        );
    } else if (brand.name && brand.name !== DEFAULT_BRAND.name) {
        // Hide the default FUXA logo when brand name is customized but no logo provided
        result = result.replace(
            /<div class="logo" style="display:block;width:60px;height:60px;background-size:60px 60px;margin-left: 45px;"><\/div>/,
            `<div style="display:block;width:60px;height:60px;margin-left:45px;display:flex;align-items:center;justify-content:center;font-size:36px;font-weight:bold;color:#1976d2;">${brand.name.charAt(0)}</div>`
        );
    }

    // Replace "powered by frangoteam" footer text
    if (brand.footer) {
        result = result.replace(
            /powered by <span><b>frango<\/b>team<\/span>/g,
            brand.footer
        );
    } else if (brand.name && brand.name !== DEFAULT_BRAND.name) {
        // Replace with generic brand footer
        result = result.replace(
            /powered by <span><b>frango<\/b>team<\/span>/g,
            `© ${brand.name}`
        );
    }

    // Inject brand data as window.__BRAND__ for Angular frontend
    const brandLogoUrl = logoPath
        ? (/^https?:\/\//i.test(logoPath) ? logoPath : '/api/brand/logo')
        : null;
    const brandScript = `<script>window.__BRAND__=${JSON.stringify({
        name: brand.name,
        title: brand.title,
        logo: brandLogoUrl,
        shortName: brand.shortName,
        footer: brand.footer
    })}</script>`;
    result = result.replace('</head>', `${brandScript}</head>`);

    return result;
}

module.exports = {
    loadBrand,
    getBrand,
    getLogoPath,
    getFaviconPath,
    injectBrandToHtml,
    DEFAULT_BRAND
};
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
 * Load brand.json from the user directory.
 * Falls back to defaults if file doesn't exist or is invalid.
 * 
 * Search order for brand.json:
 *   1. <userDir>/brand.json
 *   2. <userDir>/data/brand.json
 *   3. <userDir>/../data/brand.json (when userDir is server/, look for project root data/)
 */
function loadBrand(userDir) {
    // Candidate directories where brand.json might be located
    const candidates = [
        path.join(userDir, 'brand.json'),
        path.join(userDir, 'data', 'brand.json'),
        path.join(userDir, '..', 'data', 'brand.json'),
        path.join(userDir, '..', 'brand.json')
    ];

    let brandFile = null;
    for (const candidate of candidates) {
        if (fs.existsSync(candidate)) {
            brandFile = candidate;
            brandDataDir = path.dirname(candidate);
            break;
        }
    }

    if (brandFile) {
        try {
            const raw = fs.readFileSync(brandFile, 'utf8');
            const parsed = JSON.parse(raw);
            brandConfig = { ...DEFAULT_BRAND, ...parsed };
            console.log(`[Brand] Loaded brand config from ${brandFile}: name="${brandConfig.name}"`);
        } catch (err) {
            console.warn(`[Brand] Failed to parse brand.json, using defaults: ${err.message}`);
            brandConfig = { ...DEFAULT_BRAND };
        }
    } else {
        brandConfig = { ...DEFAULT_BRAND };
        brandDataDir = userDir;
        console.log('[Brand] brand.json not found in any candidate location, using defaults (FUXA).');
    }

    return brandConfig;
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
    if (!brandConfig || !brandConfig.logo) {
        return null;
    }
    // logo can be: "/logo.png" (relative to data dir), absolute path, or URL
    if (brandConfig.logo.startsWith('http')) {
        return brandConfig.logo;
    }
    const logoFile = path.join(brandDataDir || '.', brandConfig.logo.replace(/^\//, ''));
    return fs.existsSync(logoFile) ? logoFile : null;
}

/**
 * Get the brand favicon file path for static serving.
 * Returns null if no custom favicon is configured.
 */
function getFaviconPath() {
    if (!brandConfig || !brandConfig.favicon || brandConfig.favicon === 'favicon.ico') {
        return null;
    }
    const faviconFile = path.join(brandDataDir || '.', brandConfig.favicon.replace(/^\//, ''));
    return fs.existsSync(faviconFile) ? faviconFile : null;
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

    // Replace favicon link if custom favicon
    if (brand.favicon && brand.favicon !== DEFAULT_BRAND.favicon) {
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
    if (brand.logo) {
        // Replace the logo div with an img tag using the brand logo
        const logoHtml = brand.logo.startsWith('http') 
            ? `<img src="${brand.logo}" style="display:block;width:60px;height:60px;object-fit:contain;margin-left:45px;" />`
            : `<img src="/api/brand/logo" style="display:block;width:60px;height:60px;object-fit:contain;margin-left:45px;" />`;
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
    const brandScript = `<script>window.__BRAND__=${JSON.stringify({
        name: brand.name,
        title: brand.title,
        logo: brand.logo,
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
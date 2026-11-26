const packageConfig = require('./package.json');

const appName = process.env.FUXA_APP_NAME?.trim() || 'FUXA';

module.exports = {
    ...packageConfig.build,
    productName: appName,
    extraMetadata: {
        ...packageConfig.build.extraMetadata,
        productName: appName
    },
    nsis: {
        ...packageConfig.build.nsis,
        shortcutName: appName,
        uninstallDisplayName: appName
    }
};

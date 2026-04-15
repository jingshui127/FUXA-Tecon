const path = require('path');
const fs = require('fs');
const os = require('os');
const { fork } = require('child_process');

async function bootstrap() {
    console.log('FUXA Headless starting...');

    const homeDir = os.homedir();
    const fuxaDataDir = path.join(homeDir, 'fuxa-headless-data');
    
    if (!fs.existsSync(fuxaDataDir)) {
        console.log(`Creating initial data directory: ${fuxaDataDir}`);
        try {
            fs.mkdirSync(fuxaDataDir, { recursive: true });
        } catch (err) {
            console.error(`Failed to create data directory: ${err.message}`);
            process.exit(1);
        }
    } else {
        console.log(`Using existing data directory: ${fuxaDataDir}`);
    }

    const nativeCachePath = path.join(fuxaDataDir, 'pkg-native-cache');
    if (!fs.existsSync(nativeCachePath)) {
        fs.mkdirSync(nativeCachePath, { recursive: true });
    }
    process.env.PKG_NATIVE_CACHE_PATH = nativeCachePath;

    const serverPath = path.join(__dirname, 'server', 'main.js');

    if (!fs.existsSync(serverPath)) {
        console.error(`Could not find FUXA server at: ${serverPath}`);
        process.exit(1);
    }

    console.log(`Launching FUXA server with userDir: ${fuxaDataDir}`);
    
    const serverProcess = fork(serverPath, [], {
        env: { 
            ...process.env, 
            userDir: fuxaDataDir,
            PKG_NATIVE_CACHE_PATH: nativeCachePath
        },
        stdio: 'inherit'
    });

    serverProcess.on('error', (err) => {
        console.error(`Failed to start FUXA server: ${err.message}`);
        process.exit(1);
    });

    process.on('SIGINT', () => {
        console.log('Shutting down FUXA server...');
        serverProcess.kill('SIGTERM');
        process.exit(0);
    });

    process.on('SIGTERM', () => {
        console.log('Shutting down FUXA server...');
        serverProcess.kill('SIGTERM');
        process.exit(0);
    });
}

bootstrap();

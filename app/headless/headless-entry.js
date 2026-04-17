const path = require('path');
const fs = require('fs');
const os = require('os');
const { fork } = require('child_process');

/**
 * FUXA Headless Entry Point
 * 
 * This script is the entry point for standalone binaries.
 * It ensures the project data directory exists in the user's home folder
 * and then launches the FUXA server.
 */

async function bootstrap() {
    console.log('FUXA PRO starting...');
    console.log('技术支持QQ：2492123056');
    console.log('FUXA PRO 科控物联定制版');
    console.log('版本：1.3.1-PRO');
    console.log('');
    
    // 解析命令行参数
    let port = null;
    const args = process.argv.slice(2);
    for (let i = 0; i < args.length; i++) {
        if (args[i] === '-P' && args[i + 1]) {
            port = args[i + 1];
            break;
        }
    }

    // 1. Determine the user data directory (similar to Electron app)
    const homeDir = os.homedir();
    const fuxaDataDir = path.join(homeDir, 'fuxa-headless-data');
    
    // 2. Ensure the directory exists (Electron-style)
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

    // 3. Resolve the server path
    const serverPath = path.join(__dirname, 'server', 'main.js');

    if (!fs.existsSync(serverPath)) {
        console.error(`Could not find FUXA server at: ${serverPath}`);
        process.exit(1);
    }

    // 4. Launch the server (fork like Electron does)
    console.log(`Launching FUXA server with userDir: ${fuxaDataDir}`);
    if (port) {
        console.log(`Using custom port: ${port}`);
    }
    
    // 构建服务器参数
    const serverArgs = [];
    if (port) {
        serverArgs.push('-P', port);
    }
    
    const serverProcess = fork(serverPath, serverArgs, {
        env: { ...process.env, userDir: fuxaDataDir },
        stdio: 'inherit'
    });

    serverProcess.on('error', (err) => {
        console.error(`Failed to start FUXA server: ${err.message}`);
        process.exit(1);
    });

    // Keep the process running
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
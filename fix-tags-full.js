const http = require('http');
const fs = require('fs');

const FUXA_URL = 'http://127.0.0.1:1881';
const DEVICE_ID = 'd_f9faa9df-f80c40de';

function apiGet(path) {
    return new Promise((resolve, reject) => {
        http.get(FUXA_URL + path, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try { resolve(JSON.parse(data)); }
                catch (e) { resolve(data); }
            });
        }).on('error', reject);
    });
}

function apiPost(path, payload) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify(payload);
        const url = new URL(FUXA_URL + path);
        const options = {
            hostname: url.hostname, port: url.port, path: url.pathname,
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData) }
        };
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try { resolve(JSON.parse(data)); }
                catch (e) { resolve(data); }
            });
        });
        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

// 从CSV文件读取正确的标签配置
function loadTagConfig() {
    const config = {};
    const csvFiles = ['plc-tags-D0.csv', 'plc-tags-D1.csv', 'plc-tags-D2.csv',
                      'plc-tags-D3.csv', 'plc-tags-D4.csv', 'plc-tags-D5.csv',
                      'plc-tags-D6.csv', 'plc-tags-D7.csv'];
    
    csvFiles.forEach(file => {
        if (fs.existsSync(file)) {
            const content = fs.readFileSync(file, 'utf8');
            const lines = content.split('\n');
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;
                const parts = line.split(',');
                if (parts.length >= 8) {
                    const tagName = parts[6].trim();
                    const fuxaAddr = parts[5].trim();  // FUXA地址(1-based)
                    config[tagName] = fuxaAddr;
                }
            }
        }
    });
    return config;
}

// 从memaddress获取寄存器类型数字值
function getRegisterTypeNumber(memaddress) {
    if (memaddress.startsWith('4X')) return 400000;
    if (memaddress.startsWith('3X')) return 300000;
    if (memaddress.startsWith('1X')) return 0;
    if (memaddress.startsWith('0X')) return 100000;
    return 400000;
}

// 根据标签名确定divisor
function getDivisor(tagName) {
    if (tagName.includes('流量')) return 100;
    if (tagName.includes('压力') || tagName.includes('时间')) return 10;
    return null;
}

async function main() {
    console.log('=== 修复标签配置 ===');
    
    // 加载CSV配置
    const tagConfig = loadTagConfig();
    console.log('已加载 ' + Object.keys(tagConfig).length + ' 个标签配置');
    
    const project = await apiGet('/api/project');
    const device = project.devices[DEVICE_ID];
    const tags = device.tags;
    
    let updated = 0;
    
    for (const tagId of Object.keys(tags)) {
        const tag = tags[tagId];
        const tagName = tag.name;
        
        if (tagConfig[tagName]) {
            const correctAddress = tagConfig[tagName];
            const expectedRegister = getRegisterTypeNumber(correctAddress);
            const divisor = getDivisor(tagName);
            
            // 检查是否需要更新
            const needsUpdate = tag.memaddress !== correctAddress ||
                              typeof tag.register !== 'number' || 
                              tag.register !== expectedRegister ||
                              (divisor !== null && tag.divisor !== divisor);
            
            if (needsUpdate) {
                tag.memaddress = correctAddress;
                tag.register = expectedRegister;
                if (divisor !== null) {
                    tag.divisor = divisor;
                }
                updated++;
            }
        }
    }
    
    console.log(`更新 ${updated} 个标签`);
    await apiPost('/api/project', project);
    
    // 验证
    const project2 = await apiGet('/api/project');
    const device2 = project2.devices[DEVICE_ID];
    
    console.log('\n=== 验证结果 ===');
    const checkTags = ['合模1压力1', '合模1流量1', '合模1时间1', '合模1位置1'];
    checkTags.forEach(name => {
        const ids = Object.keys(device2.tags).filter(id => device2.tags[id].name === name);
        if (ids.length > 0) {
            const tag = device2.tags[ids[0]];
            console.log(`${name}:`);
            console.log(`  memaddress: ${tag.memaddress}`);
            console.log(`  register: ${tag.register} (数字类型: ${typeof tag.register})`);
            console.log(`  divisor: ${tag.divisor}`);
        }
    });
    
    console.log('\n=== 完成 ===');
}

main().catch(e => { console.error(e); process.exit(1); });
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
                    const fuxaAddr = parts[5].trim();
                    const type = parts[7].trim();
                    config[tagName] = {
                        fuxaAddr: fuxaAddr,
                        type: type === 'Int32' ? 'Int32MLE' : (type === 'UInt' ? 'UInt16' : type)
                    };
                }
            }
        }
    });
    return config;
}

// 从FUXA地址格式获取寄存器信息
function parseAddress(fuxaAddr) {
    const match = fuxaAddr.match(/^([0-9]X)(\d+)$/);
    if (match) {
        const typeCode = match[1];
        const addrNum = parseInt(match[2]);
        let memaddrStr;
        switch (typeCode) {
            case '4X': memaddrStr = '400000'; break;
            case '3X': memaddrStr = '300000'; break;
            case '1X': memaddrStr = '000000'; break;
            case '0X': memaddrStr = '100000'; break;
            default: memaddrStr = '400000';
        }
        return {
            memaddress: memaddrStr,
            address: addrNum
        };
    }
    return { memaddress: '400000', address: 1 };
}

function getDivisor(tagName) {
    if (tagName.includes('流量')) return 100;
    if (tagName.includes('压力') || tagName.includes('时间')) return 10;
    return null;
}

async function main() {
    console.log('=== 修复memaddress为字符串格式 ===\n');
    
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
            const config = tagConfig[tagName];
            const addrInfo = parseAddress(config.fuxaAddr);
            const divisor = getDivisor(tagName);
            
            // 检查是否需要更新 - memaddress必须是字符串
            const needsUpdate = typeof tag.memaddress !== 'string' ||
                              tag.memaddress !== addrInfo.memaddress ||
                              tag.address !== addrInfo.address ||
                              (divisor !== null && tag.divisor !== divisor) ||
                              tag.type !== config.type;
            
            if (needsUpdate) {
                tag.memaddress = addrInfo.memaddress;  // 字符串如 '400000'
                tag.address = addrInfo.address;         // 数字如 101
                tag.type = config.type;
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
            console.log(`  id: ${tag.id}`);
            console.log(`  name: ${tag.name}`);
            console.log(`  type: ${tag.type}`);
            console.log(`  memaddress: "${tag.memaddress}" (type: ${typeof tag.memaddress})`);
            console.log(`  address: ${tag.address} (type: ${typeof tag.address})`);
            console.log(`  divisor: ${tag.divisor}`);
            console.log('---');
        }
    });
    
    console.log('\n=== 完成！请刷新FUXA页面查看 ===');
}

main().catch(e => { console.error(e); process.exit(1); });
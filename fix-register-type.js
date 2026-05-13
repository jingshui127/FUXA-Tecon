const http = require('http');
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

// 从memaddress获取寄存器类型数字值
function getRegisterTypeNumber(memaddress) {
    if (memaddress.startsWith('4X')) return 400000; // HoldingRegisters
    if (memaddress.startsWith('3X')) return 300000; // InputRegisters
    if (memaddress.startsWith('1X')) return 0;      // CoilStatus
    if (memaddress.startsWith('0X')) return 100000; // DigitalInputs
    return 400000; // 默认HoldingRegisters
}

async function main() {
    console.log('=== 修复寄存器类型为数字值 ===');
    
    const project = await apiGet('/api/project');
    const device = project.devices[DEVICE_ID];
    const tags = device.tags;
    
    let updated = 0;
    
    for (const tagId of Object.keys(tags)) {
        const tag = tags[tagId];
        const expectedRegister = getRegisterTypeNumber(tag.memaddress);
        
        // 如果register不是数字或者值不对，需要更新
        if (typeof tag.register !== 'number' || tag.register !== expectedRegister) {
            tag.register = expectedRegister;
            updated++;
        }
    }
    
    console.log(`更新 ${updated} 个标签的寄存器类型`);
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
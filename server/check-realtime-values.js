/**
 * check-realtime-values.js - 检查实时变量值
 */

const http = require('http');

async function fetchTags() {
    return new Promise((resolve, reject) => {
        const tags = ['t_d0_0100', 't_d0_0101', 't_d0_0201', 't_d0_0301', 't_d0_0401'];
        const url = `http://127.0.0.1:1881/api/getTagValue?${tags.join('&')}`;
        
        http.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try { resolve(JSON.parse(data)); }
                catch (e) { reject(e); }
            });
        }).on('error', reject);
    });
}

async function main() {
    console.log('检查实时变量值...\n');
    
    try {
        const values = await fetchTags();
        console.log('========== 实时变量值 ==========\n');
        
        Object.entries(values).forEach(([key, val]) => {
            console.log(`${key}: ${val ?? 'null'}`);
        });
        
        // 检查API返回结构
        console.log('\n返回的keys:', Object.keys(values));
        
    } catch (e) {
        console.error('错误:', e.message);
    }
}

main();

/**
 * verify-navigation.js - 验证navigation配置
 */

const http = require('http');

function fetchProject() {
    return new Promise((resolve, reject) => {
        http.get('http://127.0.0.1:1881/api/project', (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(JSON.parse(data)));
        }).on('error', reject);
    });
}

async function main() {
    const project = await fetchProject();
    const nav = project.hmi?.layout?.navigation;
    
    console.log('========== Navigation配置 ==========\n');
    console.log(`存在: ${nav ? '是' : '否'}`);
    
    if (nav) {
        console.log(`mode: ${nav.mode}`);
        console.log(`type: ${nav.type}`);
        console.log(`bkcolor: ${nav.bkcolor}`);
        console.log(`fgcolor: ${nav.fgcolor}`);
        console.log(`items: ${nav.items?.length || 0}个`);
        
        if (nav.items) {
            nav.items.forEach((item, i) => {
                console.log(`  ${i+1}. [${item.icon}] ${item.text} → ${item.view}`);
            });
        }
    }
}

main();

/**
 * check-footer-api.js - 通过API检查Footer配置
 */

const http = require('http');

function fetchProject() {
    return new Promise((resolve, reject) => {
        http.get('http://127.0.0.1:1881/api/project', (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
}

async function main() {
    try {
        console.log('正在获取项目配置...\n');
        const project = await fetchProject();
        const layout = project.layout || {};
        const footer = layout.footer;

        console.log('========== API返回的Footer配置 ==========\n');
        console.log(`footer存在: ${footer ? '是' : '否'}`);

        if (footer) {
            console.log(`mode: ${footer.mode}`);
            console.log(`type: ${footer.type}`);
            console.log(`bkcolor: ${footer.bkcolor}`);
            console.log(`fgcolor: ${footer.fgcolor}`);
            console.log(`items数量: ${footer.items?.length || 0}`);

            if (footer.items) {
                footer.items.forEach((item, index) => {
                    console.log(`  ${index + 1}. ${item.id}: ${item.text} -> ${item.view}`);
                });
            }
        } else {
            console.log('⚠️ footer配置为空，请检查数据库');
        }

        console.log('\n========================================');

    } catch (error) {
        console.error('获取失败:', error.message);
    }
}

main();

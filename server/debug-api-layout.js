/**
 * debug-api-layout.js - 检查API返回的layout结构
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

        console.log('========== API返回的完整结构 ==========\n');
        console.log('顶层keys:', Object.keys(project));
        console.log('');

        if (project.layout) {
            console.log('layout keys:', Object.keys(project.layout));
            console.log('');

            // 检查是否有footer
            const hasFooter = 'footer' in project.layout;
            console.log(`layout中有footer属性: ${hasFooter}`);
            console.log(`footer值: ${JSON.stringify(project.layout.footer, null, 2)}`);
        } else {
            console.log('project中没有layout属性!');
        }

    } catch (error) {
        console.error('获取失败:', error.message);
    }
}

main();

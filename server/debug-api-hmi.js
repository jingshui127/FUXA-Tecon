/**
 * debug-api-hmi.js - 检查API返回的hmi结构
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

        if (project.hmi) {
            console.log('hmi keys:', Object.keys(project.hmi));
            const hmi = project.hmi;

            if (hmi.layout) {
                console.log('\nhmi.layout keys:', Object.keys(hmi.layout));

                const footer = hmi.layout.footer;
                console.log('\n========== Footer配置 ==========\n');
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
                }
            } else {
                console.log('\nhmi中没有layout属性!');
            }
        } else {
            console.log('project中没有hmi属性!');
        }

    } catch (error) {
        console.error('获取失败:', error.message);
    }
}

main();

/**
 * full-verification.js - 完整验证脚本
 * 验证: Header配置、CSS样式、Navigation、变量值
 */

const http = require('http');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, '_appdata', 'project.fuxap.db');

async function fetchAPI(url) {
    return new Promise((resolve, reject) => {
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

async function verifyTagValues() {
    try {
        const result = await fetchAPI('http://127.0.0.1:1881/api/getTagValue?t_d0_0100&t_d0_0101&t_d0_0201&t_d0_0301&t_d0_0401');
        return result;
    } catch (e) {
        return { error: e.message };
    }
}

async function main() {
    console.log('\n========================================');
    console.log('  FUXA 配置完整验证报告');
    console.log('========================================\n');

    // 1. API项目配置
    console.log('【1/4】检查API返回的项目配置...');
    try {
        const project = await fetchAPI('http://127.0.0.1:1881/api/project');
        const hmi = project.hmi?.layout;
        
        if (hmi) {
            console.log('  ✅ HMI Layout存在');
            console.log(`  - Header items: ${hmi.header?.items?.length || 0}个`);
            console.log(`  - Navigation items: ${hmi.navigation?.items?.length || 0}个`);
            console.log(`  - CSS长度: ${hmi.header?.customStyles?.length || 0}字符`);
            
            // 检查底部导航CSS
            const hasFooterCss = hmi.header?.customStyles?.includes('fuxa-footer-nav');
            console.log(`  - 底部导航CSS: ${hasFooterCss ? '✅ 已添加' : '❌ 缺失'}`);
        } else {
            console.log('  ❌ HMI Layout不存在');
        }
    } catch (e) {
        console.log(`  ❌ API请求失败: ${e.message}`);
    }

    // 2. 变量值
    console.log('\n【2/4】检查Header所需变量值...');
    const tags = ['t_d0_0100', 't_d0_0101', 't_d0_0201', 't_d0_0301', 't_d0_0401'];
    const names = ['合模位置', '开模位置', '合模压力', '射胶速度', '循环周期'];
    
    for (let i = 0; i < tags.length; i++) {
        try {
            const res = await fetchAPI(`http://127.0.0.1:1881/api/getTagValue?${tags[i]}`);
            const value = res[tags[i]];
            if (value !== undefined && value !== null) {
                console.log(`  ✅ ${tags[i]} (${names[i]}): ${value}`);
            } else {
                console.log(`  ⚠️ ${tags[i]} (${names[i]}): 无数据`);
            }
        } catch (e) {
            console.log(`  ❌ ${tags[i]}: 获取失败`);
        }
    }

    // 3. 数据库直接验证
    console.log('\n【3/4】数据库直接验证...');
    const db = new sqlite3.Database(DB_PATH, (err) => {
        if (err) {
            console.log(`  ❌ 数据库连接失败: ${err.message}`);
            return;
        }

        db.get("SELECT value FROM general WHERE name = 'layout'", (err, row) => {
            if (err || !row) {
                console.log('  ❌ 无法读取layout');
                db.close();
                return;
            }

            const layout = JSON.parse(row.value);
            console.log(`  ✅ 数据库layout存在`);
            console.log(`  - CSS包含fuxa-footer-nav: ${layout.header?.customStyles?.includes('fuxa-footer-nav') ? '是' : '否'}`);
            console.log(`  - Navigation模式: ${layout.navigation?.mode || '未设置'}`);
            
            db.close();
        });
    });

    // 4. 视图中的按钮
    console.log('\n【4/4】检查视图中的导航按钮...');
    const db2 = new sqlite3.Database(DB_PATH, (err) => {
        if (err) return;

        db2.all("SELECT * FROM views", (err, rows) => {
            if (err || !rows) {
                console.log('  ❌ 无法读取视图');
                db2.close();
                return;
            }

            rows.forEach(row => {
                try {
                    const view = JSON.parse(row.value);
                    const items = view.items || {};
                    const navButtons = Object.keys(items).filter(k => 
                        k.includes('nav_btn') || items[k].name?.includes('主页') || items[k].name?.includes('开合模')
                    );
                    
                    if (navButtons.length > 0) {
                        console.log(`  ✅ 视图 "${view.name}": ${navButtons.length}个导航按钮`);
                    } else {
                        console.log(`  ⚠️ 视图 "${view.name}": 无导航按钮`);
                    }
                } catch (e) {}
            });

            db2.close();

            console.log('\n========================================');
            console.log('  验证完成');
            console.log('========================================\n');
        });
    });
}

main();

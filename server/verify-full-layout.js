/**
 * verify-full-layout.js - 验证完整布局配置
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, '_appdata', 'project.fuxap.db');

const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('连接失败:', err.message);
        process.exit(1);
    }

    console.log('✅ 数据库连接成功');
    console.log('');

    db.get("SELECT value FROM general WHERE name = 'layout'", (err, row) => {
        if (err) {
            console.error('查询失败:', err.message);
            db.close();
            return;
        }

        if (!row) {
            console.log('❌ 未找到布局配置');
            db.close();
            return;
        }

        try {
            const layout = JSON.parse(row.value);
            const header = layout.header || {};
            const footer = layout.footer || {};

            console.log('========== 完整布局配置验证 ==========\n');

            console.log('📌 Header 页眉配置:');
            console.log(`  标题: ${header.title || '未设置'}`);
            console.log(`  背景色: ${header.bkcolor || '未设置'}`);
            console.log(`  文字色: ${header.fgcolor || '未设置'}`);
            console.log(`  字体: ${header.fontFamily || '未设置'}`);
            console.log(`  字号: ${header.fontSize || '未设置'}`);
            console.log(`  菜单项数量: ${header.items?.length || 0}`);

            console.log('\n📌 Footer 底部导航配置:');
            console.log(`  模式: ${footer.mode || '未设置'}`);
            console.log(`  类型: ${footer.type || '未设置'}`);
            console.log(`  背景色: ${footer.bkcolor || '未设置'}`);
            console.log(`  文字色: ${footer.fgcolor || '未设置'}`);
            console.log(`  菜单项数量: ${footer.items?.length || 0}`);

            if (footer.items && footer.items.length > 0) {
                console.log('\n  菜单项:');
                footer.items.forEach((item, index) => {
                    console.log(`    ${index + 1}. [${item.icon}] ${item.text} -> ${item.view}`);
                });
            }

            console.log('\n✅ 布局配置验证完成');
            console.log('========================================');

        } catch (e) {
            console.error('解析失败:', e.message);
        }

        db.close();
    });
});

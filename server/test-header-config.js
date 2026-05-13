/**
 * test-header-config.js - 测试Header配置是否正确应用
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

    // 查询general表获取项目配置
    db.get("SELECT value FROM general WHERE name = 'project'", (err, row) => {
        if (err) {
            console.error('查询失败:', err.message);
            db.close();
            return;
        }

        if (!row) {
            console.log('❌ 未找到项目配置');
            db.close();
            return;
        }

        try {
            const project = JSON.parse(row.value);
            const header = project.layout?.header;

            console.log('========== Header配置验证 ==========\n');
            console.log(`标题: ${header?.title || '未设置'}`);
            console.log(`背景色: ${header?.bkcolor || '未设置'}`);
            console.log(`文字色: ${header?.fgcolor || '未设置'}`);
            console.log(`字体: ${header?.fontFamily || '未设置'}`);
            console.log(`字号: ${header?.fontSize || '未设置'}`);
            console.log(`Items数量: ${header?.items?.length || 0}`);

            if (header?.items && header.items.length > 0) {
                console.log('\nHeader Items:');
                header.items.forEach((item, index) => {
                    const varId = item.property?.variableId || '(无绑定)';
                    console.log(`  ${index + 1}. ${item.id}: ${item.text || '(无文本)'} [${varId}]`);
                });
            }

            console.log('\n✅ Header配置验证完成');

        } catch (e) {
            console.error('解析失败:', e.message);
        }

        db.close();
    });
});

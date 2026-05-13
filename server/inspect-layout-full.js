/**
 * inspect-layout-full.js - 检查layout字段完整内容
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, '_appdata', 'project.fuxap.db');

const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('连接失败:', err.message);
        process.exit(1);
    }

    db.get("SELECT value FROM general WHERE name = 'layout'", (err, row) => {
        if (err) {
            console.error('查询失败:', err.message);
            db.close();
            return;
        }

        if (!row) {
            console.log('❌ 未找到layout配置');
            db.close();
            return;
        }

        try {
            const layout = JSON.parse(row.value);
            console.log('========== layout字段完整内容 ==========\n');
            console.log(JSON.stringify(layout, null, 2));
        } catch (e) {
            console.error('解析失败:', e.message);
            console.log('原始值:', row.value?.substring(0, 500));
        }

        db.close();
    });
});

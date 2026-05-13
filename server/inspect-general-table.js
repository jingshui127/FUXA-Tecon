/**
 * inspect-general-table.js - 查看general表内容
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

    db.all("SELECT * FROM general", (err, rows) => {
        if (err) {
            console.error('查询失败:', err.message);
            db.close();
            return;
        }

        console.log('========== general表内容 ==========\n');
        console.log(`共 ${rows.length} 条记录`);
        console.log('');

        rows.forEach((row, index) => {
            console.log(`--- 记录 ${index + 1} ---`);
            console.log(`name: ${row.name}`);
            console.log(`value: ${row.value?.substring(0, 500)}${row.value?.length > 500 ? '...' : ''}`);
            console.log('');
        });

        db.close();
    });
});

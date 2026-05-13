/**
 * inspect-view-structure.js - 查看视图详细结构
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, '_appdata', 'project.fuxap.db');

const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('连接失败:', err.message);
        process.exit(1);
    }

    db.all("SELECT * FROM views", (err, rows) => {
        if (err) {
            console.error('查询失败:', err.message);
            db.close();
            return;
        }

        console.log(`共 ${rows.length} 个视图\n`);

        rows.forEach((row, index) => {
            try {
                const viewData = JSON.parse(row.value);
                console.log(`========== 视图 ${index + 1}: ${viewData.name || '未命名'} ==========\n`);
                console.log(JSON.stringify(viewData, null, 2).substring(0, 2000));
                console.log('\n');
            } catch (e) {
                console.error(`解析失败:`, e.message);
            }
        });

        db.close();
    });
});

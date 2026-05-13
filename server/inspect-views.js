/**
 * inspect-views.js - 查看当前视图结构
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

    db.all("SELECT * FROM views", (err, rows) => {
        if (err) {
            console.error('查询失败:', err.message);
            db.close();
            return;
        }

        console.log('========== views表内容 ==========\n');
        console.log(`共 ${rows.length} 个视图`);
        console.log('');

        rows.forEach((row, index) => {
            try {
                const viewData = JSON.parse(row.value);
                console.log(`--- 视图 ${index + 1} ---`);
                console.log(`id: ${row.id}`);
                console.log(`name: ${viewData.name || '未设置'}`);
                console.log(`type: ${viewData.type || '未设置'}`);
                console.log(`viewId: ${viewData.viewId || '未设置'}`);
                console.log('');
            } catch (e) {
                console.log(`--- 视图 ${index + 1} ---`);
                console.log(`id: ${row.id}`);
                console.log(`value: ${row.value?.substring(0, 100)}...`);
                console.log('');
            }
        });

        db.close();
    });
});

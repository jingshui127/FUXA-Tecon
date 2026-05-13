/**
 * check-db-structure.js - 检查数据库结构
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

    // 获取所有表
    db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, rows) => {
        if (err) {
            console.error('查询失败:', err.message);
            db.close();
            return;
        }

        console.log('数据库表列表:');
        rows.forEach(row => {
            console.log(`  - ${row.name}`);
        });

        // 查询devices表结构
        console.log('\n--- devices表结构 ---');
        db.all("PRAGMA table_info(devices)", (err, cols) => {
            if (err) {
                console.error('查询失败:', err.message);
            } else {
                cols.forEach(col => {
                    console.log(`  ${col.name} (${col.type})`);
                });
            }
            db.close();
        });
    });
});

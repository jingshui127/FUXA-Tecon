/**
 * inspect-header-full.js - 检查Header完整配置
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
        if (err || !row) {
            console.error('查询失败');
            db.close();
            return;
        }

        const layout = JSON.parse(row.value);
        const header = layout.header;

        console.log('========== Header完整配置 ==========\n');

        if (header.items) {
            header.items.forEach((item, i) => {
                console.log(`--- Item ${i + 1}: ${item.id} ---`);
                console.log(`  type: ${item.type}`);
                console.log(`  text: "${item.text}"`);
                console.log(`  fgcolor: ${item.fgcolor}`);

                if (item.property) {
                    console.log(`  variableId: ${item.property.variableId || '(无)'}`);
                    console.log(`  format: ${item.property.format || '(无)'}`);
                }
                console.log('');
            });
        }

        db.close();
    });
});

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('_appdata/project.fuxap.db');

db.get("SELECT value FROM views WHERE rowid = 16", (err, row) => {
    if (!row || err) {
        console.log('Error:', err?.message);
        db.close();
        return;
    }
    
    const v = JSON.parse(row.value);
    const items = v.items || {};
    
    // 找出用户添加的按钮（非B-HXB开头的）
    Object.keys(items).forEach(k => {
        const item = items[k];
        if (item.type && item.type.includes('button')) {
            console.log(`\n========== 按钮: ${k} ==========`);
            console.log(JSON.stringify(item, null, 2));
        }
    });
    
    db.close();
});

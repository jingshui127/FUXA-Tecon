const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('_appdata/project.fuxap.db');

// 获取rowid=2的最新数据，更新到rowid=7
db.get("SELECT value FROM views WHERE rowid = 2", (err, row) => {
    if (!row || err) {
        console.log('Error:', err?.message);
        db.close();
        return;
    }
    
    const v = JSON.parse(row.value);
    const btnCount = Object.keys(v.items || {}).filter(k => 
        v.items[k].type && v.items[k].type.includes('button')
    ).length;
    
    console.log(`源数据(rowid=2): ${v.name}, ${Object.keys(v.items||{}).length} items, ${btnCount} buttons`);
    
    // 更新到rowid=7
    db.run("UPDATE views SET value = ? WHERE rowid = 7", [row.value], function(err) {
        if (err) {
            console.log('❌ 更新失败:', err.message);
        } else {
            console.log(`✅ 已同步到 rowid=7 (${this.changes} 行受影响)`);
            
            // 验证
            db.get("SELECT value FROM views WHERE rowid = 7", (err2, row2) => {
                if (row2) {
                    const v2 = JSON.parse(row2.value);
                    const btns2 = Object.keys(v2.items || {}).filter(k => 
                        v2.items[k].type && v2.items[k].type.includes('button')
                    ).length;
                    console.log(`\n验证结果:`);
                    console.log(`- rowid=7: ${v2.name}, ${Object.keys(v2.items||{}).length} items, ${btns2} buttons`);
                }
                db.close();
            });
        }
    });
});

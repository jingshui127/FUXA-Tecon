const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, '_appdata', 'project.fuxap.db');
const BAK_PATH = path.join(__dirname, '_appdata', 'project.fuxap.db.bak_20260512_175525');

console.log('=== 从备份恢复视图 ===\n');

// 1. 获取备份数据
const bakDb = new sqlite3.Database(BAK_PATH);
bakDb.all("SELECT name, value FROM views", (err, bakRows) => {
    if (!bakRows) { console.log('读取备份失败'); return; }
    
    const db = new sqlite3.Database(DB_PATH);
    
    // 获取当前数据库的rowid映射
    db.all("SELECT rowid, name FROM views", (err2, curRows) => {
        if (!curRows) { console.log('读取当前失败'); return; }
        
        let restored = 0;
        
        bakRows.forEach(bak => {
            const v = JSON.parse(bak.value);
            console.log(`处理: ${v.name} (${Object.keys(v.items||{}).length} items)`);
            
            // 找到对应的当前记录（按name匹配）
            const cur = curRows.find(r => r.name === bak.name);
            if (cur) {
                db.run("UPDATE views SET value = ? WHERE rowid = ?", 
                    [bak.value, cur.rowid],
                    function(err) {
                        if (err) console.log(`❌ ${v.name}: ${err.message}`);
                        else {
                            console.log(`✅ 已恢复 ${v.name} -> rowid=${cur.rowid}`);
                            restored++;
                            if (restored === bakRows.length) {
                                console.log('\n=== 恢复完成 ===');
                                // 最终验证
                                db.all("SELECT rowid, value FROM views", (e3, final) => {
                                    final.forEach(r => {
                                        try {
                                            const vv = JSON.parse(r.value);
                                            console.log(`rowid ${r.rowid}: ${vv.name} (${Object.keys(vv.items||{}).length} items)`);
                                        } catch(ex) {}
                                    });
                                    db.close();
                                });
                            }
                        }
                    }
                );
            } else {
                console.log(`⚠️ 未找到: ${bak.name}`);
            }
        });
    });
    bakDb.close();
});

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, '_appdata', 'project.fuxap.db');
const BAK_PATH = path.join(__dirname, '_appdata', 'project.fuxap.db.bak_20260512_175525');

// 从备份获取斜率/PID视图数据
const bakDb = new sqlite3.Database(BAK_PATH);
bakDb.get("SELECT name, value FROM views WHERE name LIKE '%斜率%' OR name LIKE '%PID%'", (err, row) => {
    if (err || !row) {
        console.log('备份中未找到斜率视图');
        // 列出备份中的所有视图
        bakDb.all("SELECT name FROM views", (e2, rows) => {
            if (rows) {
                console.log('备份中的视图:');
                rows.forEach(r => console.log(' -', r.name));
            }
            bakDb.close();
        });
        return;
    }
    
    const v = JSON.parse(row.value);
    console.log(`找到备份: ${v.name} (${Object.keys(v.items||{}).length} items)`);
    
    // 更新到当前数据库的rowid=2
    const db = new sqlite3.Database(DB_PATH);
    db.run("UPDATE views SET value = ?, name = ? WHERE rowid = 2", 
        [row.value, row.name], 
        function(err) {
            if (err) {
                console.log('❌ 恢复失败:', err.message);
            } else {
                console.log(`✅ 已恢复 rowid=2 为 ${v.name}`);
                
                // 验证
                db.all("SELECT rowid, substr(value, 1, 100) as p FROM views", (e2, rows2) => {
                    console.log('\n当前状态:');
                    rows2.forEach(r => {
                        try {
                            const vv = JSON.parse(r.p + '}');
                            console.log(`  rowid=${r.rowid}: ${vv.name || '解析中...'}`);
                        } catch(e) {
                            console.log(`  rowid=${r.rowid}: ${r.p.substring(0,50)}...`);
                        }
                    });
                });
            }
            db.close();
        }
    );
    bakDb.close();
});

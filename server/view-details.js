const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('_appdata/project.fuxap.db');
db.all("SELECT value FROM views", (err, rows) => {
    if (rows) {
        rows.forEach(row => {
            const v = JSON.parse(row.value);
            console.log(`视图: ${v.name} (ID: ${v.id})`);
            console.log(`  items数: ${Object.keys(v.items || {}).length}`);
            
            // 查找按钮
            const btns = Object.keys(v.items || {}).filter(k => 
                v.items[k].type && v.items[k].type.includes('button')
            );
            console.log(`  按钮数: ${btns.length}`);
            
            if (btns.length > 0) {
                console.log('  按钮详情:');
                btns.slice(0,3).forEach(k => {
                    const item = v.items[k];
                    console.log(`    - ${item.name} (${item.type})`);
                });
            }
            console.log('');
        });
    }
    db.close();
});

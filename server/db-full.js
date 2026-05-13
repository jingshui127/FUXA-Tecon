const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('_appdata/project.fuxap.db');

db.all("SELECT rowid, name, value FROM views", (err, rows) => {
    rows.forEach(r => {
        try {
            const v = JSON.parse(r.value);
            const btnCount = Object.keys(v.items || {}).filter(k => 
                v.items[k].type && v.items[k].type.includes('button')
            ).length;
            
            console.log(`\n===== rowid: ${r.rowid} =====`);
            console.log(`DB name: ${r.name}`);
            console.log(`JSON id: ${v.id}`);
            console.log(`JSON name: ${v.name}`);
            console.log(`items数: ${Object.keys(v.items || {}).length}`);
            console.log(`按钮数: ${btnCount}`);
        } catch(e) {
            console.log(`\nrowid: ${r.rowid}, 解析错误`);
        }
    });
    db.close();
});

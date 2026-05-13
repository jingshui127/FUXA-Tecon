const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('_appdata/project.fuxap.db');

db.all("SELECT rowid, name, length(value) as len FROM views", (err, rows) => {
    console.log('视图列表:');
    rows.forEach(r => {
        try {
            const v = JSON.parse(r.value);
            console.log(`\nrowid: ${r.rowid}`);
            console.log(`name(DB): ${r.name}`);
            console.log(`name(JSON): ${v.name}`);
            console.log(`value长度: ${r.len}`);
            console.log(`items数: ${Object.keys(v.items || {}).length}`);
        } catch (e) {
            console.log(`rowid: ${r.rowid}, name: ${r.name}, JSON解析失败`);
        }
    });
    db.close();
});

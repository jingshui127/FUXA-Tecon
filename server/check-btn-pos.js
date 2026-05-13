const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('_appdata/project.fuxap.db');

db.all("SELECT rowid, value FROM views", (err, rows) => {
    rows.forEach(row => {
        const v = JSON.parse(row.value);
        console.log(`\n========== ${v.name} (rowid=${row.rowid}) ==========`);
        
        // 找出所有按钮
        Object.keys(v.items || {}).forEach(k => {
            const item = v.items[k];
            if (item.type === 'svg-ext-html_button') {
                console.log(`\n--- ${item.name} (${k.substring(0,20)}...) ---`);
                console.log(`  x: ${item.x ?? 'MISSING!'}`);
                console.log(`  y: ${item.y ?? 'MISSING!'}`);
                console.log(`  width: ${item.width ?? 'MISSING!'}`);
                console.log(`  height: ${item.height ?? 'MISSING!'}`);
                console.log(`  svg存在: ${!!item.svg}`);
            }
        });
    });
    db.close();
});

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('_appdata/project.fuxap.db');

db.all("SELECT rowid, value FROM views", (err, rows) => {
    rows.forEach(row => {
        const v = JSON.parse(row.value);
        console.log(`\n${v.name} (rowid=${row.rowid}):`);
        console.log(`  总items: ${Object.keys(v.items || {}).length}`);
        
        // 列出所有item类型统计
        const types = {};
        Object.values(v.items || {}).forEach(item => {
            if (item.type) {
                types[item.type] = (types[item.type] || 0) + 1;
            }
        });
        
        console.log('  类型分布:');
        Object.entries(types).forEach(([t, c]) => console.log(`    ${t}: ${c}`));
    });
    db.close();
});

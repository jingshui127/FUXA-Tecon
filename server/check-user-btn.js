const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('_appdata/project.fuxap.db');

db.all("SELECT rowid, value FROM views", (err, rows) => {
    rows.forEach(row => {
        const v = JSON.parse(row.value);
        console.log(`\n========== 视图: ${v.name} (rowid=${row.rowid}) ==========`);
        
        const items = v.items || {};
        
        // 找出所有按钮
        Object.keys(items).forEach(k => {
            const item = items[k];
            if (item.type && item.type.includes('button')) {
                console.log(`\n--- 按钮: ${item.name || k.substring(0,15)} ---`);
                console.log(`  id: ${k}`);
                console.log(`  type: ${item.type}`);
                console.log(`  x: ${item.x}, y: ${item.y}, w: ${item.width}, h: ${item.height}`);
                
                if (item.property) {
                    console.log(`  text: "${item.property.text}"`);
                    
                    if (item.property.events && item.property.events.length > 0) {
                        item.property.events.forEach((e, ei) => {
                            console.log(`  events[${ei}]:`);
                            console.log(`    event: ${e.event}`);
                            if (e.actions) {
                                e.actions.forEach((a, ai) => {
                                    console.log(`    actions[${ai}]: type=${a.type}, param=${a.actparam || a.viewId || '-'}`);
                                });
                            }
                        });
                    }
                }
            }
        });
    });
    db.close();
});

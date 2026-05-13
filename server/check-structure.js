const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('_appdata/project.fuxap.db');

db.all("SELECT rowid, name FROM views", (err, rows) => {
    console.log('当前视图:');
    rows.forEach(r => console.log(`  rowid=${r.rowid}: ${r.name}`));
    
    if (rows.length > 0) {
        db.get(`SELECT value FROM views WHERE rowid = ${rows[0].rowid}`, (err2, row) => {
            const v = JSON.parse(row.value);
            
            console.log('\n视图顶层属性:');
            Object.keys(v).forEach(k => {
                if (k !== 'items') {
                    const val = v[k];
                    if (typeof val === 'object' && val !== null) {
                        console.log(`  ${k}: [object] keys=${Object.keys(val).slice(0,5).join(',')}`);
                    } else {
                        console.log(`  ${k}: ${val}`);
                    }
                }
            });
            
            // 检查svg
            console.log('\nsvg字段:', v.svg ? '存在' : '不存在');
            
            // 对比组件
            const items = v.items || {};
            let inputKey = null, btnKey = null;
            Object.keys(items).forEach(k => {
                if (!inputKey && items[k].type?.includes('input')) inputKey = k;
                if (!btnKey && items[k].type?.includes('button')) btnKey = k;
            });
            
            if (inputKey) {
                console.log('\n=== Input组件 (能显示) ===');
                console.log(JSON.stringify(items[inputKey], null, 2).substring(0, 1200));
            }
            
            if (btnKey) {
                console.log('\n=== Button组件 ===');
                console.log(JSON.stringify(items[btnKey], null, 2));
            }
            
            db.close();
        });
    } else {
        db.close();
    }
});

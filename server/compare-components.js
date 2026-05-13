const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('_appdata/project.fuxap.db');

db.get("SELECT value FROM views WHERE rowid = 19", (err, row) => {
    const v = JSON.parse(row.value);
    const items = v.items || {};
    
    // 找第一个input和一个button对比
    let inputSample = null;
    let btnSample = null;
    
    Object.entries(items).forEach(([k, item]) => {
        if (!inputSample && item.type === 'svg-ext-html_input') {
            inputSample = { key: k, ...item };
        }
        if (!btnSample && item.type === 'svg-ext-html_button') {
            btnSample = { key: k, ...item };
        }
    });
    
    console.log('=== Input组件示例 ===');
    console.log(JSON.stringify(inputSample, null, 2).substring(0, 1500));
    
    console.log('\n=== Button组件示例 ===');
    console.log(JSON.stringify(btnSample, null, 2));
    
    db.close();
});

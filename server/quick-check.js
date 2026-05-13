const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('_appdata/project.fuxap.db');
db.get("SELECT value FROM views WHERE name='开合模参数'", (err, row) => {
    if (row) {
        const v = JSON.parse(row.value);
        const items = v.items || {};
        const btns = Object.keys(items).filter(k => items[k].type && items[k].type.includes('button'));
        console.log('开合模参数视图:');
        console.log('- 总items:', Object.keys(items).length);
        console.log('- 按钮数:', btns.length);
    }
    db.close();
});

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('_appdata/project.fuxap.db');
db.get("SELECT value FROM views WHERE name='开合模参数'", (err, row) => {
    if (!row || err) {
        console.log('Error:', err?.message);
        db.close();
        return;
    }
    const v = JSON.parse(row.value);
    const items = v.items || {};
    const keys = Object.keys(items);
    
    // 查找所有包含button或B-HXB的key
    const btnKeys = keys.filter(k => 
        items[k].type && items[k].type.includes('button') ||
        k.startsWith('B-HXB')
    );
    
    console.log('开合模参数视图详情:');
    console.log('- 总items数:', keys.length);
    console.log('- 按钮类型keys:', btnKeys.length);
    
    // 列出最后5个items
    console.log('\n最后5个items:');
    const last5 = keys.slice(-5);
    last5.forEach(k => {
        const item = items[k];
        console.log(`  ${k.substring(0,20)}... type=${item.type} name=${item.name}`);
    });
    
    db.close();
});

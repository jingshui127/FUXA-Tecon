const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('_appdata/project.fuxap.db');

console.log('=== 查看完整General配置 ===\n');

db.get("SELECT value FROM general", (err, row) => {
    if (!row) {
        console.log('❌ 未找到general表');
        db.close();
        return;
    }
    
    const general = JSON.parse(row.value);
    
    console.log('General表所有字段:');
    Object.keys(general).forEach(key => {
        console.log(`  ${key}`);
    });
    
    // 直接查找包含header的任何位置
    const jsonStr = JSON.stringify(general);
    
    if (jsonStr.includes('"header"')) {
        console.log('\n✅ 发现header字段!');
        
        // 找到header的位置
        const headerIdx = jsonStr.indexOf('"header"');
        console.log('\nHeader附近内容:');
        console.log(jsonStr.substring(Math.max(0, headerIdx - 50), headerIdx + 500));
    }
    
    // 输出前2000字符看看整体结构
    console.log('\n\n=== General完整内容(前3000字符) ===');
    console.log(jsonStr.substring(0, 3000));
    
    db.close();
});

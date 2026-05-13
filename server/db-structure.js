const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('_appdata/project.fuxap.db');

console.log('=== 数据库表结构 ===\n');

db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
    console.log('所有表:', tables.map(t => t.name).join(', '));
    
    // 尝试查找项目配置
    console.log('\n=== 查找layout配置 ===');
    
    // 检查views表的完整结构
    db.get("SELECT value FROM views WHERE rowid = 1", (err, row) => {
        if (row) {
            const v = JSON.parse(row.value);
            console.log('\n视图字段:', Object.keys(v).join(', '));
            
            // 检查是否有layout相关配置
            if (v.layout) {
                console.log('\n✅ 找到layout配置:');
                console.log(JSON.stringify(v.layout, null, 2));
            } else {
                console.log('\n❌ 视图中无layout字段');
            }
        }
        
        // 直接搜索包含layout的记录
        console.log('\n=== 全局搜索layout ===');
        db.all("SELECT value FROM views", (err2, rows) => {
            let foundLayout = false;
            rows.forEach(r => {
                const content = r.value;
                if (content.includes('"layout"')) {
                    foundLayout = true;
                    console.log(`✅ 发现layout在 rowid=${r.rowid}`);
                }
            });
            
            if (!foundLayout) {
                console.log('❌ 未找到任何layout配置');
                
                // 显示一个视图的完整结构
                console.log('\n=== 视图完整结构示例 ===');
                const sampleView = JSON.parse(rows[0].value);
                Object.keys(sampleView).forEach(key => {
                    const val = sampleView[key];
                    if (typeof val === 'object' && val !== null) {
                        console.log(`${key}: [object] (${Array.isArray(val) ? 'array' : 'object'})`);
                    } else {
                        console.log(`${key}: ${val}`);
                    }
                });
            }
            
            // 统计按钮
            console.log('\n\n=== 导航按钮统计 ===');
            rows.forEach(row => {
                const v = JSON.parse(row.value);
                const btns = Object.values(v.items || {}).filter(
                    i => i.type === 'svg-ext-html_button'
                );
                if (btns.length > 0) {
                    console.log(`\n${v.name}:`);
                    btns.forEach(b => {
                        console.log(`  ✅ ${b.name} -> ${b.property.events?.[0]?.actparam?.substring(0, 8)}...`);
                    });
                }
            });
            
            db.close();
        });
    });
});

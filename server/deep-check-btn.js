const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('_appdata/project.fuxap.db');

db.all("SELECT value FROM views", (err, rows) => {
    rows.forEach(row => {
        const v = JSON.parse(row.value);
        console.log(`\n========== ${v.name} ==========`);
        
        const items = v.items || {};
        
        // 找出所有button类型
        const buttons = Object.entries(items).filter(([k, item]) => 
            item.type === 'svg-ext-html_button'
        );
        
        console.log(`\n按钮数量: ${buttons.length}`);
        
        buttons.forEach(([key, btn]) => {
            console.log(`\n--- ${btn.name} (${key}) ---`);
            
            // 完整输出这个对象的所有键
            console.log('所有属性:', Object.keys(btn).join(', '));
            
            // 特别检查svg字段
            if (btn.svg) {
                console.log('svg字段存在: YES');
                console.log('svg内容:', JSON.stringify(btn.svg));
            } else {
                console.log('svg字段存在: NO');
            }
            
            // 检查是否有任何位置相关字段
            const posFields = ['x', 'y', 'width', 'height', 'left', 'top', 'position'];
            posFields.forEach(f => {
                if (btn[f] !== undefined) {
                    console.log(`${f}: ${btn[f]}`);
                }
            });
        });
    });
    db.close();
});

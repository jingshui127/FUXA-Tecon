const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('_appdata/project.fuxap.db');

db.all("SELECT rowid, name, value FROM views", (err, rows) => {
    rows.forEach(row => {
        const v = JSON.parse(row.value);
        
        // 查找svg字段
        let svgContent = null;
        if (v.svg && typeof v.svg === 'string') {
            svgContent = v.svg;
        } else if (typeof v.value === 'string' && v.value.includes('<svg')) {
            svgContent = v.value;
        }
        
        console.log(`\n${v.name} (rowid=${row.rowid}):`);
        console.log(`  有独立svg字段: ${!!v.svg}`);
        console.log(`  value类型: ${typeof v.value}`);
        
        // 检查value是否包含SVG
        if (typeof v.value === 'string' && v.value.includes('<svg')) {
            console.log(`  value是SVG字符串! 长度: ${v.value.length}`);
            console.log(`  包含button: ${v.value.includes('svg-ext-html_button')}`);
            
            // 统计SVG中的button数量
            const btnMatches = v.value.match(/type="svg-ext-html_button"/g);
            console.log(`  SVG中button数: ${btnMatches ? btnMatches.length : 0}`);
        }
        
        // 检查所有顶层字段
        console.log(`\n  所有字段: ${Object.keys(v).join(', ')}`);
    });
    
    db.close();
});

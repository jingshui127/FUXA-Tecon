const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('_appdata/project.fuxap.db');

db.get("SELECT value FROM views WHERE rowid = 1", (err, row) => {
    const v = JSON.parse(row.value);
    
    console.log('svgcontent字段:');
    console.log(`  类型: ${typeof v.svgcontent}`);
    console.log(`  长度: ${v.svgcontent?.length || 0}`);
    
    // 显示svgcontent的最后500字符（应该包含按钮）
    if (v.svgcontent) {
        const content = v.svgcontent;
        console.log('\n=== SVG最后部分（包含按钮）===');
        console.log(content.substring(content.length - 800));
        
        // 找到按钮的SVG元素
        const btnStart = content.indexOf('type="svg-ext-html_button"');
        if (btnStart > -1) {
            console.log('\n=== 按钮完整SVG元素 ===');
            console.log(content.substring(btnStart - 20, btnStart + 400));
        }
    }
    
    db.close();
});

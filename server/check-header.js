const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('_appdata/project.fuxap.db');

console.log('=== 查看完整Header配置 ===\n');

db.get("SELECT value FROM general", (err, row) => {
    if (!row) {
        console.log('❌ 未找到general表');
        db.close();
        return;
    }
    
    const general = JSON.parse(row.value);
    
    console.log('=== 当前layout.header配置 ===');
    if (general.layout && general.layout.header) {
        const hdr = general.layout.header;
        
        console.log('\n基础设置:');
        console.log(`  标题: ${hdr.title}`);
        console.log(`  背景: ${hdr.bkcolor}`);
        console.log(`  前景: ${hdr.fgcolor}`);
        console.log(`  字体: ${hdr.fontFamily}`);
        console.log(`  字号: ${hdr.fontSize}px`);
        console.log(`  对齐: ${hdr.itemsAnchor}`);
        
        console.log('\n功能开关:');
        console.log(`  报警显示: ${hdr.alarms}`);
        console.log(`  信息显示: ${hdr.infos}`);
        console.log(`  日期时间: ${hdr.dateTimeDisplay}`);
        console.log(`  语言切换: ${hdr.language}`);
        console.log(`  用户信息: ${hdr.loginInfo}`);
        
        console.log(`\n=== Header Items (${hdr.items?.length || 0}个) ===`);
        
        if (hdr.items && hdr.items.length > 0) {
            hdr.items.forEach((item, i) => {
                console.log(`\n${i+1}. [${item.type}] ${item.id || '未命名'}`);
                console.log(`   文本: "${item.text}"`);
                
                if (item.property) {
                    if (item.property.variableId) {
                        console.log(`   绑定变量: ${item.property.variableId}`);
                    }
                    if (item.property.format) {
                        console.log(`   格式: ${item.property.format}`);
                    }
                    if (item.property.ranges && item.property.ranges.length > 0) {
                        console.log(`   范围配置: ${JSON.stringify(item.property.ranges)}`);
                    }
                }
            });
        } else {
            console.log('  ⚠️ 无items配置');
        }
    } else {
        console.log('❌ 无layout.header配置');
    }
    
    // 输出完整JSON供参考
    console.log('\n\n=== 完整layout配置(JSON) ===');
    console.log(JSON.stringify(general.layout, null, 2).substring(0, 2000));
    
    db.close();
});

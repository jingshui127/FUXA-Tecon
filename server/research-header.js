const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('_appdata/project.fuxap.db');

console.log('=== 研究FUXA Header实现机制 ===\n');

// 1. 查找所有表
db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
    console.log('所有表:', tables.map(t => t.name));
    
    // 2. 查找可能包含layout配置的表
    const searchTables = ['general', 'settings', 'project', 'config'];
    
    let checkedCount = 0;
    searchTables.forEach(tableName => {
        db.all(`SELECT * FROM ${tableName} LIMIT 1`, (err, rows) => {
            if (!err && rows && rows.length > 0) {
                const row = rows[0];
                const value = row.value || JSON.stringify(row);
                
                if (value.includes('"header"') || value.includes('"layout"')) {
                    console.log(`\n✅ 在 ${tableName} 表中发现 layout/header 配置!`);
                    console.log(`内容预览:`, value.substring(0, 500));
                }
            }
            
            checkedCount++;
            if (checkedCount === searchTables.length) {
                // 3. 检查views表中的profile字段
                checkViewsProfile();
            }
        });
    });
});

function checkViewsProfile() {
    console.log('\n\n=== 检查视图结构 ===');
    
    db.get("SELECT value FROM views WHERE rowid = 1", (err, row) => {
        if (row) {
            const v = JSON.parse(row.value);
            
            console.log('\n视图字段:');
            Object.keys(v).forEach(key => {
                const val = v[key];
                if (key !== 'items' && key !== 'svgcontent' && typeof val !== 'object') {
                    console.log(`  ${key}: ${val}`);
                } else if (typeof val === 'object' && key !== 'items' && key !== 'svgcontent') {
                    console.log(`  ${key}: [object] keys=${Object.keys(val).join(',')}`);
                }
            });
            
            // 检查profile
            if (v.profile) {
                console.log('\n=== profile 配置 ===');
                console.log(JSON.stringify(v.profile, null, 2));
            }
        }
        
        // 4. 搜索源码中的Header相关代码
        searchHeaderInSource();
    });
}

function searchHeaderInSource() {
    console.log('\n\n=== 搜索FUXA源码中的Header实现 ===');
    
    const fs = require('fs');
    const path = require('path');
    
    // 搜索home.component.ts
    const homePath = path.join(__dirname, '..', 'client', 'src', 'app', 'home', 'home.component.ts');
    
    if (fs.existsSync(homePath)) {
        const content = fs.readFileSync(homePath, 'utf8');
        
        // 查找header相关代码
        const headerMatches = content.match(/header[^;]{0,200}/gi);
        
        if (headerMatches) {
            console.log(`\n✅ 在 home.component.ts 中找到 ${headerMatches.length} 处header引用`);
            headerMatches.slice(0, 5).forEach((m, i) => {
                console.log(`${i+1}. ${m.trim()}`);
            });
        }
        
        // 查找layout相关
        const layoutMatches = content.match(/layout[^;]{0,100}/gi);
        if (layoutMatches) {
            console.log(`\n找到 ${layoutMatches.length} 处layout引用`);
            layoutMatches.slice(0, 3).forEach(m => console.log(`  - ${m.trim()}`));
        }
        
        // 查找HeaderItem
        const headerItemMatches = content.match(/HeaderItem[^;]{0,150}/g);
        if (headerItemMatches) {
            console.log(`\n✅ 找到HeaderItem定义: ${headerItemMatches.length} 处`);
            headerItemMatches.slice(0, 2).forEach(m => console.log(`${m}\n`));
        }
    } else {
        console.log('⚠️ 未找到 home.component.ts');
    }
    
    db.close();
}

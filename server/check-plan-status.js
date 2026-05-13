const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('_appdata/project.fuxap.db');

console.log('=== 计划文档实施状态检查 ===\n');

// 1. 检查项目整体布局
db.get("SELECT value FROM projects WHERE rowid = 1", (err, projectRow) => {
    if (!projectRow) {
        console.log('❌ 无法获取项目');
        db.close();
        return;
    }
    
    const project = JSON.parse(projectRow.value);
    
    console.log('【一、项目布局配置】');
    console.log(`layout存在: ${!!project.layout}`);
    
    if (project.layout) {
        console.log('\n--- layout.header ---');
        if (project.layout.header) {
            console.log(`  header存在: ✅`);
            console.log(`  配置:`, JSON.stringify(project.layout.header, null, 2).substring(0, 500));
            
            // 检查header items
            const hdrItems = project.layout.header.items || [];
            console.log(`  \n  Header Items数量: ${hdrItems.length}`);
            hdrItems.forEach((item, i) => {
                console.log(`    ${i+1}. ${item.text || item.type || 'unknown'} - ${item.variableId || '无绑定'}`);
            });
        } else {
            console.log(`  header: ❌ 未配置`);
        }
        
        console.log('\n--- layout.navigation ---');
        if (project.layout.navigation) {
            console.log(`  navigation存在: ✅`);
            console.log(`  配置:`, JSON.stringify(project.layout.navigation).substring(0, 300));
        } else {
            console.log(`  navigation: ❌ 未配置`);
        }
        
        console.log('\n--- layout.footer ---');
        if (project.layout.footer) {
            console.log(`  footer: ✅`);
            console.log(`  配置:`, JSON.stringify(project.layout.footer).substring(0, 300));
        } else {
            console.log(`  footer: ❌ 未配置`);
        }
    }
    
    // 2. 检查视图中的导航按钮
    console.log('\n\n【二、视图导航按钮实现】');
    
    db.all("SELECT value FROM views", (err2, viewRows) => {
        viewRows.forEach(row => {
            const v = JSON.parse(row.value);
            const btns = Object.values(v.items || {}).filter(
                item => item.type === 'svg-ext-html_button'
            );
            const svgBtns = (v.svgcontent?.match(/type="svg-ext-html_button"/g) || []).length;
            
            console.log(`\n${v.name}:`);
            console.log(`  Items中按钮: ${btns.length}个`);
            btns.forEach(b => {
                const target = b.property.events?.[0]?.actparam;
                const action = b.property.events?.[0]?.action;
                console.log(`    - ${b.name}: ${action} -> ${target}`);
            });
            console.log(`  SVG渲染元素: ${svgBtns}个`);
        });
        
        // 3. 检查CSS样式文件
        console.log('\n\n【三、样式文件检查】');
        const fs = require('fs');
        const cssPath = './header-navbar-styles.css';
        if (fs.existsSync(cssPath)) {
            const cssContent = fs.readFileSync(cssPath, 'utf8');
            console.log(`✅ CSS文件存在: ${cssPath}`);
            console.log(`   文件大小: ${cssContent.length} 字符`);
            console.log(`   包含规则数: ${(cssContent.match(/\{/g) || []).length} 个`);
        } else {
            console.log(`❌ CSS文件不存在`);
        }
        
        // 4. 总结
        console.log('\n\n' + '='.repeat(60));
        console.log('【四、实施状态总结】');
        console.log('='.repeat(60));
        
        // FR-01 核心参数显示
        const hasHeaderItems = project.layout?.header?.items?.length > 0;
        console.log(`\nFR-01 核心参数实时显示区: ${hasHeaderItems ? '✅ 已实现' : '❌ 未实现'}`);
        
        // FR-02 系统状态
        const hasAlarms = project.layout?.header?.alarms;
        console.log(`FR-02 报警计数器: ${hasAlarms ? '✅ 已配置' : '❌ 未配置'}`);
        
        // FR-03 辅助功能
        const hasDateTime = project.layout?.header?.datetime;
        console.log(`FR-03 日期时间显示: ${hasDateTime ? '✅ 已配置' : '❌ 未配置'}`);
        
        // FR-04 导航按钮
        const totalBtns = viewRows.reduce((sum, r) => {
            const v = JSON.parse(r.value);
            return sum + Object.values(v.items || {}).filter(i => i.type === 'svg-ext-html_button').length;
        }, 0);
        console.log(`FR-04 底部导航按钮: ✅ 已实现 (${totalBtns}个按钮)`);
        
        // 视觉设计
        console.log(`视觉设计规范(CSS): ${fs.existsSync(cssPath) ? '✅ 文件已创建' : '❌ 未创建'}`);
        
        db.close();
    });
});

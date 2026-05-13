const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const crypto = require('crypto');

const DB_PATH = path.join(__dirname, '_appdata', 'project.fuxap.db');

console.log('=== 添加导航按钮到数据库 ===\n');

const db = new sqlite3.Database(DB_PATH);

db.all("SELECT rowid, value FROM views", async (err, rows) => {
    if (!rows || err) {
        console.log('Error:', err?.message);
        db.close();
        return;
    }
    
    // 构建视图映射
    const viewMap = {};
    rows.forEach(row => {
        try {
            const v = JSON.parse(row.value);
            viewMap[v.name] = { id: v.id, rowid: row.rowid };
        } catch (e) {}
    });
    
    console.log('可用视图:');
    Object.entries(viewMap).forEach(([name, info]) => {
        console.log(`  ${name} (${info.id})`);
    });
    
    const NAV_ITEMS = [
        { text: '开合模', targetName: '开合模参数' },
        { text: '斜率/PID', targetName: '斜率/PID' }
    ];
    
    for (const row of rows) {
        let view;
        try { view = JSON.parse(row.value); } catch (e) { continue; }
        
        if (!view.items) view.items = {};
        console.log(`\n处理: ${view.name}`);
        
        for (const nav of NAV_ITEMS) {
            const target = viewMap[nav.targetName];
            if (!target || target.id === view.id) continue;
            
            const exists = Object.values(view.items).some(
                item => item.name === nav.text && item.type === 'svg-ext-html_button'
            );
            if (exists) {
                console.log(`  ⏭️ "${nav.text}" 已存在`);
                continue;
            }
            
            const btnId = 'HXB_' + crypto.randomUUID();
            view.items[btnId] = {
                id: btnId,
                type: 'svg-ext-html_button',
                name: nav.text,
                property: {
                    ranges: [{ min: 20, max: 80, color: '', type: 2, stroke: '' }],
                    events: [{
                        type: 'click',
                        action: 'onpage',
                        actparam: target.id,
                        actoptions: {}
                    }],
                    actions: []
                },
                label: 'HtmlButton',
                hide: false,
                lock: false
            };
            
            console.log(`  ✅ "${nav.text}" -> ${target.id}`);
        }
        
        // 同步更新
        await new Promise((resolve) => {
            db.run("UPDATE views SET value = ? WHERE rowid = ?",
                [JSON.stringify(view), row.rowid],
                () => resolve()
            );
        });
    }
    
    // 验证
    console.log('\n=== 验证 ===\n');
    
    db.all("SELECT value FROM views", (err2, finalRows) => {
        finalRows.forEach(row => {
            const v = JSON.parse(row.value);
            const btns = Object.values(v.items || {}).filter(
                i => i.type === 'svg-ext-html_button'
            );
            console.log(`${v.name}: ${btns.length} 个按钮`);
            btns.forEach(b => 
                console.log(`  - ${b.name}: ${b.property.events?.[0]?.actparam}`)
            );
        });
        
        console.log('\n✅ 数据库已更新！');
        console.log('⚠️  请重启FUXA服务使更改生效');
        console.log('   命令: 先关闭浏览器标签，然后 npm start');
        
        db.close();
    });
});

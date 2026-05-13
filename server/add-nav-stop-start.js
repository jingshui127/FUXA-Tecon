const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

const DB_PATH = path.join(__dirname, '_appdata', 'project.fuxap.db');

async function main() {
    console.log('=== 步骤1: 停止FUXA服务 ===\n');
    
    try {
        execSync('taskkill /F /IM node.exe', { stdio: 'pipe' });
        console.log('✅ FUXA已停止');
    } catch (e) {
        console.log('⚠️ FUXA未运行或已停止');
    }
    
    await new Promise(r => setTimeout(r, 1500));
    
    console.log('\n=== 步骤2: 读取并修改数据库 ===\n');
    
    const db = new sqlite3.Database(DB_PATH);
    
    // 获取所有视图
    const rows = await new Promise((resolve, reject) => {
        db.all("SELECT rowid, name, value FROM views", (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
    
    // 构建视图映射
    const viewMap = {};
    rows.forEach(row => {
        try {
            const v = JSON.parse(row.value);
            viewMap[v.name] = { id: v.id, rowid: row.rowid };
        } catch (e) {}
    });
    
    console.log('视图列表:');
    Object.entries(viewMap).forEach(([name, info]) => {
        console.log(`  ${name} -> ${info.id}`);
    });
    
    // 导航配置
    const NAV_ITEMS = [
        { text: '开合模', targetName: '开合模参数' },
        { text: '斜率/PID', targetName: '斜率/PID' }
    ];
    
    let updatedCount = 0;
    
    for (const row of rows) {
        let view;
        try { view = JSON.parse(row.value); } catch (e) { continue; }
        
        if (!view.items) view.items = {};
        
        console.log(`\n处理: ${view.name}`);
        
        for (const nav of NAV_ITEMS) {
            const target = viewMap[nav.targetName];
            if (!target || target.id === view.id) continue;
            
            // 检查是否已存在
            const exists = Object.values(view.items).some(
                item => item.name === nav.text && item.type === 'svg-ext-html_button'
            );
            if (exists) {
                console.log(`  ⏭️ "${nav.text}" 已存在`);
                continue;
            }
            
            // 创建按钮（完全复制用户的格式）
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
            
            console.log(`  ✅ 添加 "${nav.text}" -> ${nav.targetName}`);
        }
        
        // 更新数据库
        await new Promise((resolve, reject) => {
            db.run(
                "UPDATE views SET value = ? WHERE rowid = ?",
                [JSON.stringify(view), row.rowid],
                function(err) {
                    if (err) {
                        console.log(`  ❌ 保存失败: ${err.message}`);
                        reject(err);
                    } else {
                        updatedCount++;
                        resolve();
                    }
                }
            );
        });
    }
    
    db.close();
    
    console.log('\n=== 步骤3: 验证保存结果 ===\n');
    
    // 验证
    const verifyDb = new sqlite3.Database(DB_PATH);
    const verifyRows = await new Promise((resolve, reject) => {
        verifyDb.all("SELECT value FROM views", (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
    
    verifyRows.forEach(row => {
        const v = JSON.parse(row.value);
        const btns = Object.values(v.items || {}).filter(
            item => item.type === 'svg-ext-html_button'
        );
        console.log(`${v.name}: ${btns.length} 个按钮`);
        btns.forEach(b => console.log(`  - ${b.name}: ${b.property.events?.[0]?.actparam || '?'}`));
    });
    
    verifyDb.close();
    
    console.log('\n✅ 完成！请手动启动FUXA: npm start');
}

main().catch(console.error);

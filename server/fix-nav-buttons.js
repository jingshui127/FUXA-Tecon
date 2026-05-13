const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const crypto = require('crypto');

const DB_PATH = path.join(__dirname, '_appdata', 'project.fuxap.db');
const db = new sqlite3.Database(DB_PATH);

const NAV_ITEMS = [
    { text: '🏠 主页', viewId: 'v_home_main' },
    { text: '⬜ 开合模', viewId: 'v_mold_param' },
    { text: '📈 斜率/PID', viewId: 'v_pid_param' },
    { text: '⚠️ 报警', viewId: 'v_alarm_main' },
    { text: '🕐 趋势', viewId: 'v_history_main' }
];

function genId() {
    return 'B-HXB_' + crypto.randomUUID().substring(0, 8);
}

db.all("SELECT value FROM views", (err, rows) => {
    if (!rows || err) {
        console.log('Error:', err?.message);
        db.close();
        return;
    }

    let updatedCount = 0;
    
    rows.forEach((row, idx) => {
        const view = JSON.parse(row.value);
        
        // 检查是否已有导航按钮
        const hasNav = Object.keys(view.items || {}).some(k => 
            view.items[k].name === '🏠 主页'
        );
        
        if (hasNav) {
            console.log(`${view.name}: 已有按钮`);
            return;
        }

        // 添加按钮
        const viewH = view.docProfile?.height || 768;
        const viewW = view.docProfile?.width || 1024;
        const btnW = Math.floor((viewW - 40) / NAV_ITEMS.length);
        const btnH = 46;
        const startY = viewH - btnH - 10;

        if (!view.items) view.items = {};

        NAV_ITEMS.forEach((nav, i) => {
            const id = genId();
            const x = 4 + i * (btnW + 4);
            
            view.items[id] = {
                id,
                type: 'svg-ext-html_button',
                name: nav.text,
                label: 'HtmlButton',
                hide: false,
                lock: false,
                x, y: startY,
                width: btnW, height: btnH,
                rotation: 0,
                property: {
                    variableId: null,
                    text: nav.text,
                    ranges: [],
                    events: [{
                        event: 'click',
                        actions: [{ type: 'viewChange', viewId: nav.viewId, params: {} }]
                    }],
                    actions: [],
                    options: { updated: true }
                },
                style: { bkcolor: '#f8f9fa', fgcolor: '#495057', fontSize: 13, borderRadius: '6px' },
                svg: { id: `svg_${crypto.randomUUID().substring(0,8)}`, type: 'g', children: [] }
            };
        });

        // 更新数据库 - 使用正确的WHERE条件
        db.run("UPDATE views SET value = ? WHERE rowid = ?", 
            [JSON.stringify(view), idx + 1],
            function(err) {
                if (err) {
                    console.log(`❌ ${view.name} 更新失败: ${err.message}`);
                } else {
                    console.log(`✅ ${view.name} 已添加 ${NAV_ITEMS.length} 个按钮`);
                    updatedCount++;
                    if (updatedCount === rows.filter(r => {
                        const v = JSON.parse(r.value);
                        return !Object.keys(v.items || {}).some(k => v.items[k].name === '🏠 主页');
                    }).length) {
                        console.log('\n完成！');
                        db.close();
                    }
                }
            }
        );
    });
});

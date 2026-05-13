const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const crypto = require('crypto');

const DB_PATH = path.join(__dirname, '_appdata', 'project.fuxap.db');

// 导航配置
const NAV_ITEMS = [
    { text: '主页', viewId: 'v_home_main' },
    { text: '开合模', viewId: 'v_mold_param' },
    { text: '斜率/PID', viewId: 'v_pid_param' },
    { text: '报警', viewId: 'v_alarm_main' },
    { text: '趋势', viewId: 'v_history_main' }
];

function genId() {
    return 'B-HXB_' + crypto.randomUUID().substring(0, 8);
}

console.log('=== 添加导航按钮（使用FUXA原生事件）===\n');

const db = new sqlite3.Database(DB_PATH);

db.all("SELECT rowid, name, value FROM views", (err, rows) => {
    if (!rows || err) {
        console.log('Error:', err?.message);
        db.close();
        return;
    }

    let updatedCount = 0;

    rows.forEach((row) => {
        let view;
        try {
            view = JSON.parse(row.value);
        } catch (e) {
            console.log(`rowid ${row.rowid}: JSON解析失败`);
            return;
        }

        console.log(`\n处理视图: ${view.name}`);

        // 获取视图尺寸
        const viewH = view.docProfile?.height || 960;
        const viewW = view.docProfile?.width || 1280;
        
        // 按钮参数
        const btnH = 40;
        const btnGap = 8;
        const totalWidth = viewW - 40; // 左右各留20px边距
        const btnW = Math.floor((totalWidth - (NAV_ITEMS.length - 1) * btnGap) / NAV_ITEMS.length);
        const startY = viewH - btnH - 10; // 底部留10px

        if (!view.items) view.items = {};

        // 为每个导航项创建按钮
        NAV_ITEMS.forEach((nav, i) => {
            const id = genId();
            const x = 20 + i * (btnW + btnGap);

            // 创建按钮 - 使用FUXA原生格式
            view.items[id] = {
                id,
                type: 'svg-ext-html_button',
                name: nav.text,
                label: 'HtmlButton',
                hide: false,
                lock: false,
                x,
                y: startY,
                width: btnW,
                height: btnH,
                rotation: 0,
                property: {
                    variableId: null,
                    text: nav.text,
                    ranges: [],
                    // FUXA原生的"打开页面"事件格式
                    events: [{
                        event: 'click',
                        actions: [{
                            type: 'onpage',
                            actparam: nav.viewId
                        }]
                    }],
                    actions: [],
                    options: { updated: true }
                },
                style: {
                    bkcolor: '#2c3e50',
                    fgcolor: '#ffffff',
                    fontSize: 14,
                    borderRadius: '4px'
                },
                svg: {
                    id: `svg_${crypto.randomUUID().substring(0, 8)}`,
                    type: 'g',
                    children: []
                }
            };
        });

        // 更新数据库
        db.run("UPDATE views SET value = ? WHERE rowid = ?", 
            [JSON.stringify(view), row.rowid],
            function(err) {
                if (err) {
                    console.log(`❌ ${view.name} 更新失败: ${err.message}`);
                } else {
                    console.log(`✅ ${view.name}: 已添加 ${NAV_ITEMS.length} 个导航按钮`);
                    updatedCount++;
                    
                    if (updatedCount === rows.length) {
                        console.log('\n=== 完成！请重启FUXA服务 ===');
                        
                        // 验证
                        setTimeout(() => {
                            db.all("SELECT rowid, value FROM views ORDER BY rowid", (e2, finalRows) => {
                                console.log('\n验证结果:');
                                finalRows.forEach(r => {
                                    try {
                                        const v = JSON.parse(r.value);
                                        const btns = Object.keys(v.items || {}).filter(k =>
                                            v.items[k].type && v.items[k].type.includes('button')
                                        );
                                        console.log(`  rowid ${r.rowid}: ${v.name} - ${btns.length} 个按钮`);
                                    } catch (ex) {}
                                });
                                db.close();
                            });
                        }, 500);
                    }
                }
            }
        );
    });
});

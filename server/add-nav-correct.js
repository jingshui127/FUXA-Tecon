const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const crypto = require('crypto');

const DB_PATH = path.join(__dirname, '_appdata', 'project.fuxap.db');

console.log('=== 按照FUXA原生格式添加导航按钮 ===\n');

const db = new sqlite3.Database(DB_PATH);

// 先获取所有视图的实际ID
db.all("SELECT rowid, value FROM views", (err, rows) => {
    if (!rows || err) {
        console.log('Error:', err?.message);
        db.close();
        return;
    }

    // 构建视图ID映射
    const viewMap = {};
    rows.forEach(row => {
        const v = JSON.parse(row.value);
        viewMap[v.name] = {
            id: v.id,
            dbId: v.id,
            rowid: row.rowid
        };
        viewMap[row.rowid] = {
            name: v.name,
            id: v.id,
            rowid: row.rowid
        };
    });

    console.log('视图列表:');
    Object.entries(viewMap).forEach(([k, v]) => {
        if (typeof v === 'object' && v.name) {
            console.log(`  ${v.name} -> ID: ${v.id}`);
        }
    });

    // 导航配置 - 使用实际视图ID
    const NAV_CONFIG = [
        { text: '主页', name: '主页' },
        { text: '开合模', name: '开合模参数' },
        { text: '斜率/PID', name: '斜率/PID' }
    ];

    let updatedCount = 0;

    rows.forEach((row) => {
        const view = JSON.parse(row.value);
        const viewName = view.name;
        
        console.log(`\n处理: ${viewName}`);

        if (!view.items) view.items = {};

        // 获取视图尺寸
        const viewH = view.docProfile?.height || 960;
        const viewW = view.docProfile?.width || 1280;

        // 删除旧的B-HXB按钮
        const keysToDelete = Object.keys(view.items).filter(k => 
            k.startsWith('B-HXB_') && 
            view.items[k].type && 
            view.items[k].type.includes('button')
        );
        keysToDelete.forEach(k => delete view.items[k]);
        if (keysToDelete.length > 0) {
            console.log(`  删除旧按钮: ${keysToDelete.length}个`);
        }

        // 创建新按钮 - 使用正确的FUXA格式
        const btnH = 40;
        const btnW = 200;
        const startX = 20;
        const startY = viewH - btnH - 10;
        const gap = 10;

        NAV_CONFIG.forEach((nav, i) => {
            // 找到目标视图的实际ID
            const targetView = Object.values(viewMap).find(v => v.name === nav.name);
            if (!targetView) {
                console.log(`  ⚠️ 未找到视图: ${nav.name}`);
                return;
            }

            const id = 'HXB_' + crypto.randomUUID();
            const x = startX + i * (btnW + gap);

            // 使用用户验证过的格式
            view.items[id] = {
                id,
                type: 'svg-ext-html_button',
                name: nav.text,
                property: {
                    ranges: [
                        { min: 20, max: 80, color: '', type: 2, stroke: '' }
                    ],
                    events: [
                        {
                            type: 'click',
                            action: 'onpage',
                            actparam: targetView.id,
                            actoptions: {}
                        }
                    ],
                    actions: []
                },
                label: 'HtmlButton',
                hide: false,
                lock: false
            };

            console.log(`  ✅ ${nav.text} -> ${targetView.id} (${nav.name})`);
        });

        // 更新数据库
        db.run("UPDATE views SET value = ? WHERE rowid = ?", 
            [JSON.stringify(view), row.rowid],
            function(err) {
                if (err) {
                    console.log(`❌ ${viewName}: ${err.message}`);
                } else {
                    updatedCount++;
                    
                    if (updatedCount === rows.length) {
                        console.log('\n=== 完成！请重启FUXA服务 ===');
                        
                        setTimeout(() => {
                            db.all("SELECT value FROM views", (e2, finalRows) => {
                                console.log('\n最终验证:');
                                finalRows.forEach(r => {
                                    try {
                                        const v = JSON.parse(r.value);
                                        const btns = Object.keys(v.items || {}).filter(k =>
                                            !k.startsWith('B-HXB_') && 
                                            v.items[k].type === 'svg-ext-html_button'
                                        );
                                        console.log(`  ${v.name}: ${btns.length} 个导航按钮`);
                                        
                                        btns.slice(0, 3).forEach(k => {
                                            const b = v.items[k];
                                            console.log(`    - ${b.name}: ${b.property.events[0].actparam}`);
                                        });
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

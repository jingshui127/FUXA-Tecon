/**
 * add-nav-to-all-views.js - 为所有视图添加导航按钮
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const crypto = require('crypto');

const DB_PATH = path.join(__dirname, '_appdata', 'project.fuxap.db');

// 导航按钮配置
const NAV_ITEMS = [
    { text: '🏠 主页', viewId: 'v_home_main' },
    { text: '⬜ 开合模', viewId: 'v_mold_param' },
    { text: '📈 斜率/PID', viewId: 'v_pid_param' },
    { text: '⚠️ 报警', viewId: 'v_alarm_main' },
    { text: '🕐 趋势', viewId: 'v_history_main' }
];

function generateId() {
    return 'B-HXB_' + crypto.randomUUID().substring(0, 8);
}

async function main() {
    console.log('\n========================================');
    console.log('  为所有视图添加导航按钮');
    console.log('========================================\n');

    const db = new sqlite3.Database(DB_PATH, async (err) => {
        if (err) {
            console.error('DB错误:', err.message);
            return;
        }

        db.all("SELECT * FROM views", async (err, rows) => {
            if (err || !rows?.length) {
                console.log('无视图');
                db.close();
                return;
            }

            for (const row of rows) {
                let view;
                try {
                    view = JSON.parse(row.value);
                } catch (e) {
                    continue;
                }

                console.log(`\n处理视图: ${view.name}`);

                // 获取或创建items
                if (!view.items) view.items = {};

                // 检查是否已有nav按钮
                const hasNavBtns = Object.keys(view.items).some(k => 
                    view.items[k].name === '🏠 主页'
                );

                if (hasNavBtns) {
                    console.log(`  ⚠️ 已有导航按钮，跳过`);
                    continue;
                }

                // 获取视图尺寸
                const viewH = view.docProfile?.height || 768;
                const viewW = view.docProfile?.width || 1024;
                const btnWidth = Math.floor((viewW - 40) / NAV_ITEMS.length);
                const btnHeight = 46;
                const startY = viewH - btnHeight - 10;

                // 创建按钮
                let addedCount = 0;
                NAV_ITEMS.forEach((nav, i) => {
                    const id = generateId();
                    const x = 4 + i * (btnWidth + 4);
                    
                    view.items[id] = {
                        id,
                        type: 'svg-ext-html_button',
                        name: nav.text,
                        label: 'HtmlButton',
                        hide: false,
                        lock: false,
                        x,
                        y: startY,
                        width: btnWidth,
                        height: btnHeight,
                        rotation: 0,
                        property: {
                            variableId: null,
                            text: nav.text,
                            ranges: [],
                            events: [{
                                event: 'click',
                                actions: [{
                                    type: 'viewChange',
                                    viewId: nav.viewId,
                                    params: {}
                                }]
                            }],
                            actions: [],
                            options: { updated: true }
                        },
                        style: {
                            bkcolor: '#f8f9fa',
                            fgcolor: '#495057',
                            fontSize: 13,
                            borderRadius: '6px'
                        },
                        svg: { id: `svg_${crypto.randomUUID().substring(0,8)}`, type: 'g', children: [] }
                    };
                    addedCount++;
                });

                // 保存
                db.run(
                    "UPDATE views SET value = ? WHERE name = ?",
                    [JSON.stringify(view), view.name],
                    (err) => {
                        if (err) {
                            console.log(`  ❌ 保存失败: ${err.message}`);
                        } else {
                            console.log(`  ✅ 已添加 ${addedCount} 个导航按钮`);
                        }
                    }
                );
            }

            setTimeout(() => {
                console.log('\n========================================');
                console.log('  ✅ 完成！请重启FUXA服务');
                console.log('========================================\n');
                db.close();
            }, 500);
        });
    });
}

main();

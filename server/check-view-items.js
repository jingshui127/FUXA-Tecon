/**
 * check-view-items.js - 详细检查视图items
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, '_appdata', 'project.fuxap.db');

const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('连接失败:', err.message);
        process.exit(1);
    }

    db.all("SELECT * FROM views", (err, rows) => {
        if (err || !rows) {
            console.log('无视图');
            db.close();
            return;
        }

        rows.forEach((row, idx) => {
            try {
                const view = JSON.parse(row.value);
                console.log(`\n========== 视图: ${view.name} ==========`);
                
                const items = view.items || {};
                const allKeys = Object.keys(items);
                
                console.log(`总Items数: ${allKeys.length}`);
                
                // 找出所有button类型
                const buttons = allKeys.filter(k => items[k].type?.includes('button'));
                console.log(`Button数量: ${buttons.length}`);
                
                buttons.forEach(key => {
                    const item = items[key];
                    console.log(`\n  [${key.substring(0,20)}...]`);
                    console.log(`    type: ${item.type}`);
                    console.log(`    name: ${item.name}`);
                    console.log(`    x: ${item.x}, y: ${item.y}`);
                    console.log(`    w: ${item.width}, h: ${item.height}`);
                    
                    // 检查property
                    if (item.property) {
                        console.log(`    text: "${item.property.text}"`);
                        console.log(`    events: ${item.property.events?.length || 0}个`);
                        
                        // 检查是否有viewChange动作
                        if (item.property.events) {
                            item.property.events.forEach(e => {
                                console.log(`    event: ${e.event}`);
                                if (e.actions) {
                                    e.actions.forEach(a => {
                                        console.log(`      action: ${a.type} -> ${a.viewId || a.link || '?'}`);
                                    });
                                }
                            });
                        }
                    }
                });
                
            } catch (e) {
                console.error('解析错误:', e.message);
            }
        });

        db.close();
    });
});

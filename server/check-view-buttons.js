/**
 * check-view-buttons.js - 检查视图中的按钮位置
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
                console.log(`\n========== 视图 ${idx + 1}: ${view.name} ==========`);
                console.log(`尺寸: ${view.docProfile?.width || '?'}x${view.docProfile?.height || '?'}`);

                const items = view.items || {};
                Object.keys(items).forEach(key => {
                    const item = items[key];
                    if (item.type === 'svg-ext-html_button' || item.name?.includes('nav')) {
                        console.log(`\n按钮: ${item.name || item.id}`);
                        console.log(`  位置: x=${item.x}, y=${item.y}`);
                        console.log(`  尺寸: ${item.width}x${item.height}`);
                        console.log(`  文本: "${item.property?.text}"`);
                        
                        // 检查是否在底部
                        const viewH = view.docProfile?.height || 768;
                        if (item.y > viewH - 80) {
                            console.log(`  ✅ 在底部区域`);
                        } else {
                            console.log(`  ⚠️ 不在底部 (距底: ${viewH - (item.y + (item.height||0))}px)`);
                        }
                    }
                });
            } catch (e) {}
        });

        db.close();
    });
});

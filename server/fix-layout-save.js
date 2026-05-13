/**
 * fix-layout-save.js - 修复布局保存
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, '_appdata', 'project.fuxap.db');

// 底部导航CSS
const FOOTER_NAV_CSS = `

/* ===== 固定底部导航栏 ===== */
.fuxa-footer-nav {
    position: fixed !important;
    bottom: 0 !important;
    left: 0 !important;
    right: 0 !important;
    height: 56px !important;
    background: linear-gradient(180deg, #f8f9fa 0%, #e9ecef 100%) !important;
    border-top: 1px solid #dee2e6 !important;
    display: flex !important;
    justify-content: space-around !important;
    align-items: center !important;
    z-index: 9999 !important;
    box-shadow: 0 -2px 10px rgba(0,0,0,0.1) !important;
}

/* 内容区域padding */
.view-container {
    padding-bottom: 66px !important;
}
`;

async function main() {
    const db = new sqlite3.Database(DB_PATH, async (err) => {
        if (err) {
            console.error('连接失败:', err.message);
            process.exit(1);
        }

        console.log('✅ 数据库连接成功\n');

        // 获取当前layout
        db.get("SELECT value FROM general WHERE name = 'layout'", async (err, row) => {
            if (err || !row) {
                console.error('获取layout失败:', err?.message);
                db.close();
                return;
            }

            let layout = JSON.parse(row.value);
            
            // 添加底部导航CSS
            if (!layout.header.customStyles.includes('fuxa-footer-nav')) {
                layout.header.customStyles += FOOTER_NAV_CSS;
                console.log('✅ 已添加底部导航CSS');
            }

            const newJson = JSON.stringify(layout);
            
            // 使用正确的更新语句
            db.run(
                "UPDATE general SET value = ? WHERE name = 'layout'",
                [newJson],
                function(err) {
                    if (err) {
                        console.error('❌ 更新失败:', err.message);
                    } else {
                        console.log(`✅ 配置已保存 (影响 ${this.changes} 行)`);
                        console.log(`\nCSS总长度: ${layout.header.customStyles.length} 字符`);
                    }
                    db.close();
                }
            );
        });
    });
}

main();

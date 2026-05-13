/**
 * enhance-nav-buttons.js - 增强导航按钮样式
 * 确保按钮可见且有正确的视觉效果
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, '_appdata', 'project.fuxap.db');

// 增强版底部导航CSS - 更明显的样式
const ENHANCED_FOOTER_CSS = `

/* ===== 底部导航栏容器 ===== */
.fuxa-bottom-nav-container {
    position: fixed !important;
    bottom: 0 !important;
    left: 0 !important;
    right: 0 !important;
    height: 60px !important;
    background-color: #ffffff !important;
    border-top: 2px solid #e0e0e0 !important;
    display: flex !important;
    justify-content: space-around !important;
    align-items: center !important;
    z-index: 10000 !important;
    box-shadow: 0 -4px 12px rgba(0,0,0,0.15) !important;
}

/* 所有html-button样式 */
.html-button,
[class*="B-HXB_"] button,
button[style*="background"] {
    border-radius: 8px !important;
    font-weight: 600 !important;
    transition: all 0.2s ease !important;
    text-shadow: none !important;
}

/* 导航按钮悬停效果 */
.html-button:hover,
[class*="B-HXB_"]:hover {
    transform: translateY(-2px) !important;
    box-shadow: 0 4px 8px rgba(0,123,255,0.3) !important;
}

/* 内容区域留出底部空间 */
svg {
    padding-bottom: 70px !important;
}

.view-content,
.main-view,
[id*="view"] {
    margin-bottom: 60px !important;
}
`;

async function main() {
    console.log('\n========================================');
    console.log('  增强导航按钮样式');
    console.log('========================================\n');

    const db = new sqlite3.Database(DB_PATH, async (err) => {
        if (err) {
            console.error('连接失败:', err.message);
            process.exit(1);
        }

        db.get("SELECT value FROM general WHERE name = 'layout'", async (err, row) => {
            if (err || !row) {
                console.error('获取layout失败');
                db.close();
                return;
            }

            let layout = JSON.parse(row.value);
            
            // 检查是否已有增强CSS
            if (!layout.header.customStyles.includes('fuxa-bottom-nav-container')) {
                layout.header.customStyles += ENHANCED_FOOTER_CSS;
                console.log('✅ 已添加增强CSS');
            } else {
                console.log('⚠️ 增强CSS已存在');
            }

            // 同时确保navigation配置正确
            if (!layout.navigation) {
                layout.navigation = {
                    mode: 'item.navsmode-fix',
                    type: 'item.navtype-icons-text-block',
                    bkcolor: '#f0f0f0',
                    fgcolor: '#1d1d1d',
                    items: [
                        { id: 'nav_home', text: '主页', link: '', view: 'v_home_main', icon: 'home', image: '' },
                        { id: 'nav_mold', text: '开合模', link: '', view: 'v_mold_param', icon: 'maximize', image: '' },
                        { id: 'nav_pid', text: '斜率/PID', link: '', view: 'v_pid_param', icon: 'trending-up', image: '' },
                        { id: 'nav_alarm', text: '报警', link: '', view: 'v_alarm_main', icon: 'alert-circle', image: '' },
                        { id: 'nav_history', text: '趋势', link: '', view: 'v_history_main', icon: 'clock', image: '' }
                    ]
                };
                console.log('✅ 已添加Navigation配置');
            }

            db.run(
                "UPDATE general SET value = ? WHERE name = 'layout'",
                [JSON.stringify(layout)],
                function(err) {
                    if (err) {
                        console.error('❌ 保存失败:', err.message);
                    } else {
                        console.log(`✅ 配置已保存`);
                        console.log(`\nCSS总长度: ${layout.header.customStyles.length} 字符`);
                        console.log(`Navigation items: ${layout.navigation.items?.length || 0}个`);
                    }
                    db.close();
                }
            );
        });
    });
}

main();

/**
 * create-footer-nav-buttons.js - 创建底部导航按钮组
 *
 * 在主视图中添加固定在底部的导航按钮
 * 模拟移动端底部导航栏效果
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const crypto = require('crypto');

const DB_PATH = path.join(__dirname, '_appdata', 'project.fuxap.db');

// 底部导航配置
const NAV_ITEMS = [
    { id: 'nav_btn_home', text: '🏠 主页', viewId: 'v_home_main', icon: 'home' },
    { id: 'nav_btn_mold', text: '⬜ 开合模', viewId: 'v_mold_param', icon: 'maximize' },
    { id: 'nav_btn_pid', text: '📈 斜率/PID', viewId: 'v_pid_param', icon: 'trending-up' },
    { id: 'nav_btn_alarm', text: '⚠️ 报警', viewId: 'v_alarm_main', icon: 'alert-circle' },
    { id: 'nav_btn_history', text: '🕐 趋势', viewId: 'v_history_main', icon: 'clock' }
];

// 视图尺寸（假设1024x768）
const VIEW_WIDTH = 1024;
const VIEW_HEIGHT = 768;
const NAV_HEIGHT = 56; // 导航栏高度
const BUTTON_WIDTH = Math.floor((VIEW_WIDTH - 40) / NAV_ITEMS.length); // 每个按钮宽度
const BUTTON_MARGIN = 4;

class FooterNavButtonCreator {
    constructor(dryRun = true) {
        this.dryRun = dryRun;
        this.db = null;
    }

    generateUUID() {
        return crypto.randomUUID();
    }

    async openDatabase() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(DB_PATH, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    async closeDatabase() {
        return new Promise((resolve) => {
            if (this.db) this.db.close(() => resolve());
            else resolve();
        });
    }

    createNavButton(item, index) {
        const x = BUTTON_MARGIN + index * (BUTTON_WIDTH + BUTTON_MARGIN);
        const y = VIEW_HEIGHT - NAV_HEIGHT - 10;

        const buttonId = `B-HXB_${this.generateUUID().substring(0, 8)}`;
        const svgId = `svg_${this.generateUUID().substring(0, 8)}`;

        return {
            [buttonId]: {
                id: buttonId,
                type: 'svg-ext-html_button',
                name: item.text,
                label: 'HtmlButton',
                hide: false,
                lock: false,
                x: x,
                y: y,
                width: BUTTON_WIDTH,
                height: NAV_HEIGHT - 10,
                rotation: 0,
                property: {
                    variableId: null,
                    text: item.text,
                    ranges: [],
                    events: [
                        {
                            event: 'click',
                            actions: [{
                                type: 'viewChange',
                                viewId: item.viewId,
                                params: {}
                            }]
                        }
                    ],
                    actions: [],
                    options: {
                        updated: true
                    }
                },
                style: {
                    bkcolor: '#f8f9fa',
                    fgcolor: '#495057',
                    fontSize: 14,
                    fontWeight: '500',
                    borderRadius: '8px',
                    border: 'none',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                },
                svg: {
                    id: svgId,
                    type: 'g',
                    children: []
                }
            }
        };
    }

    async getViews() {
        return new Promise((resolve, reject) => {
            this.db.all("SELECT * FROM views", (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        });
    }

    async updateView(viewName, viewData) {
        return new Promise((resolve, reject) => {
            const value = JSON.stringify(viewData);
            this.db.run(
                "UPDATE views SET value = ? WHERE name = ?",
                [value, viewName],
                (err) => err ? reject(err) : resolve()
            );
        });
    }

    async run() {
        console.log('\n========================================');
        console.log('  创建底部导航按钮组');
        console.log('========================================\n');
        console.log(`模式: ${this.dryRun ? 'DRY-RUN' : 'APPLY'}`);
        console.log(`视图尺寸: ${VIEW_WIDTH}x${VIEW_HEIGHT}`);
        console.log(`导航栏高度: ${NAV_HEIGHT}px`);
        console.log(`按钮数量: ${NAV_ITEMS.length}`);
        console.log(`每个按钮宽度: ${BUTTON_WIDTH}px\n`);

        try {
            await this.openDatabase();

            // 获取所有视图
            const views = await this.getViews();
            console.log(`发现 ${views.length} 个视图`);

            if (views.length === 0) {
                console.log('❌ 未找到任何视图，需要先创建主页视图');
                return;
            }

            // 为每个视图添加底部导航按钮
            for (const viewRow of views) {
                let viewData;
                try {
                    viewData = JSON.parse(viewRow.value);
                } catch (e) {
                    console.log(`跳过视图 ${viewRow.name}: 解析失败`);
                    continue;
                }

                console.log(`\n处理视图: ${viewData.name || '未命名'}`);

                // 获取现有items或创建新的
                if (!viewData.items) {
                    viewData.items = {};
                }

                // 检查是否已有导航按钮
                let hasNavButtons = Object.keys(viewData.items).some(key =>
                    key.startsWith('B-HXB_') && viewData.items[key].name?.includes('nav_btn')
                );

                if (hasNavButtons) {
                    console.log(`  ⚠️ 已有导航按钮，跳过`);
                    continue;
                }

                // 创建导航按钮
                const navButtons = {};
                for (let i = 0; i < NAV_ITEMS.length; i++) {
                    const button = this.createNavButton(NAV_ITEMS[i], i);
                    Object.assign(navButtons, button);
                    console.log(`  ✅ 添加按钮: ${NAV_ITEMS[i].text}`);
                }

                // 合并到items中
                Object.assign(viewData.items, navButtons);

                if (!this.dryRun) {
                    await this.updateView(viewRow.name, viewData);
                    console.log(`  ✅ 视图已更新`);
                } else {
                    console.log(`  [DRY-RUN] 视图将被更新`);
                }
            }

            // 同时更新CSS样式以支持底部导航
            console.log('\n----------------------------------------');
            console.log('更新自定义样式...');
            console.log('----------------------------------------');

            const layout = await this.getLayout();
            if (layout && layout.header) {
                const footerStyles = `

/* ===== 底部导航按钮样式 ===== */
[B-HXB_*] .html-button,
[class*="B-HXB_"] {
    position: fixed !important;
    bottom: 0 !important;
    left: 0 !important;
    right: 0 !important;
    z-index: 1000 !important;
}

/* 确保内容不被遮挡 */
.view-content {
    padding-bottom: 70px !important;
}`;

                if (!layout.header.customStyles) {
                    layout.header.customStyles = '';
                }
                layout.header.customStyles += footerStyles;

                if (!this.dryRun) {
                    await this.saveLayout(layout);
                    console.log('✅ CSS样式已更新');
                }
            }

            console.log('\n========================================');
            console.log('  ✅ 底部导航按钮创建完成');
            console.log('========================================\n');

        } catch (error) {
            console.error('❌ 错误:', error.message);
        } finally {
            await this.closeDatabase();
        }
    }

    async getLayout() {
        return new Promise((resolve, reject) => {
            this.db.get(
                "SELECT value FROM general WHERE name = 'layout'",
                (err, row) => {
                    if (err) reject(err);
                    else if (!row) resolve(null);
                    else resolve(JSON.parse(row.value));
                }
            );
        });
    }

    async saveLayout(layout) {
        return new Promise((resolve, reject) => {
            this.db.run(
                "UPDATE general SET value = ? WHERE name = 'layout'",
                [JSON.stringify(layout), 'layout'],
                (err) => err ? reject(err) : resolve()
            );
        });
    }
}

async function main() {
    const args = process.argv.slice(2);
    const dryRun = !args.includes('--apply');

    const creator = new FooterNavButtonCreator(dryRun);
    await creator.run();
}

main();

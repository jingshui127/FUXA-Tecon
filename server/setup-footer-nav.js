/**
 * setup-footer-nav.js - 配置底部导航栏
 *
 * 根据plan-a-header-implementation.md配置底部导航栏
 * 关联现有视图和新增功能模块
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, '_appdata', 'project.fuxap.db');

// 底部导航栏配置
const FOOTER_CONFIG = {
    mode: 'item.navsmode-fix',                    // 固定底部模式
    type: 'item.navtype-icons-text-block',        // 图标+文字横向排列
    bkcolor: '#f0f0f0',                           // 浅灰背景
    fgcolor: '#1d1d1d',                           // 深色文字
    logo: false,
    items: [
        // 主功能组
        { id: 'nav_home', text: '主页', link: '', view: 'v_home_main', icon: 'home', image: '' },
        { id: 'nav_mold', text: '开合模', link: '', view: 'v_mold_param', icon: 'maximize', image: '' },
        { id: 'nav_pid', text: '斜率/PID', link: '', view: 'v_pid_param', icon: 'trending-up', image: '' },
        { id: 'nav_alarm', text: '报警', link: '', view: 'v_alarm_main', icon: 'alert-circle', image: '' },
        { id: 'nav_history', text: '趋势', link: '', view: 'v_history_main', icon: 'clock', image: '' }
    ]
};

class FooterNavConfigurator {
    constructor(dryRun = true) {
        this.dryRun = dryRun;
        this.db = null;
    }

    async openDatabase() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(DB_PATH, (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    async closeDatabase() {
        return new Promise((resolve) => {
            if (this.db) {
                this.db.close((err) => {
                    if (err) {
                        console.error('关闭数据库失败:', err.message);
                    }
                    resolve();
                });
            } else {
                resolve();
            }
        });
    }

    async getCurrentLayout() {
        return new Promise((resolve, reject) => {
            this.db.get(
                'SELECT value FROM general WHERE name = ?',
                ['layout'],
                (err, row) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    if (!row) {
                        resolve({});
                        return;
                    }
                    try {
                        resolve(JSON.parse(row.value));
                    } catch (e) {
                        reject(e);
                    }
                }
            );
        });
    }

    async saveLayout(layout) {
        return new Promise((resolve, reject) => {
            const layoutJson = JSON.stringify(layout);
            this.db.run(
                'UPDATE general SET value = ? WHERE name = ?',
                [layoutJson, 'layout'],
                (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                }
            );
        });
    }

    async run() {
        console.log('\n========================================');
        console.log('  底部导航栏配置脚本 (Phase 2)');
        console.log('========================================\n');
        console.log(`模式: ${this.dryRun ? 'DRY-RUN (仅预览)' : 'APPLY (实际修改)'}`);
        console.log(`数据库: ${DB_PATH}`);
        console.log('');

        try {
            await this.openDatabase();
            console.log('✅ 数据库连接成功');

            console.log('\n----------------------------------------');
            console.log('Step 1: 获取当前布局配置...');
            console.log('----------------------------------------');

            const layout = await this.getCurrentLayout();
            console.log('✅ 布局配置加载成功');

            console.log('\n----------------------------------------');
            console.log('Step 2: 当前底部导航配置:');
            console.log('----------------------------------------');

            const currentFooter = layout.footer || {};
            console.log(`模式: ${currentFooter.mode || '未设置'}`);
            console.log(`类型: ${currentFooter.type || '未设置'}`);
            console.log(`背景色: ${currentFooter.bkcolor || '未设置'}`);
            console.log(`文字色: ${currentFooter.fgcolor || '未设置'}`);
            console.log(`菜单项数量: ${currentFooter.items?.length || 0}`);

            if (currentFooter.items && currentFooter.items.length > 0) {
                console.log('\n当前菜单项:');
                currentFooter.items.forEach((item, index) => {
                    console.log(`  ${index + 1}. ${item.id}: ${item.text} (${item.view || '无视图'})`);
                });
            }

            console.log('\n----------------------------------------');
            console.log('Step 3: 新底部导航配置:');
            console.log('----------------------------------------');

            console.log(`模式: ${FOOTER_CONFIG.mode}`);
            console.log(`类型: ${FOOTER_CONFIG.type}`);
            console.log(`背景色: ${FOOTER_CONFIG.bkcolor}`);
            console.log(`文字色: ${FOOTER_CONFIG.fgcolor}`);
            console.log(`菜单项数量: ${FOOTER_CONFIG.items.length}`);

            console.log('\n新菜单项:');
            FOOTER_CONFIG.items.forEach((item, index) => {
                console.log(`  ${index + 1}. ${item.id}: ${item.text} -> ${item.view}`);
            });

            console.log('\n----------------------------------------');
            console.log('Step 4: 应用新配置...');
            console.log('----------------------------------------');

            if (!this.dryRun) {
                layout.footer = FOOTER_CONFIG;
                await this.saveLayout(layout);
                console.log('✅ 布局配置保存成功');
            } else {
                console.log('[DRY-RUN] 布局配置将被更新');
            }

            console.log('\n========================================');
            console.log('  ✅ 底部导航栏配置完成');
            console.log('========================================\n');

        } catch (error) {
            console.error('\n❌ 执行失败:', error.message);
            throw error;
        } finally {
            await this.closeDatabase();
        }
    }
}

async function main() {
    const args = process.argv.slice(2);
    const dryRun = !args.includes('--apply');

    const configurator = new FooterNavConfigurator(dryRun);
    await configurator.run();

    process.exit(0);
}

main();

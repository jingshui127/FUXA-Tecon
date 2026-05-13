/**
 * optimize-header-and-footer.js - 完整优化Header和底部导航
 *
 * 1. 修复Header样式确保参数值正确显示
 * 2. 添加CSS固定底部导航栏（覆盖式）
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, '_appdata', 'project.fuxap.db');

// 底部导航CSS样式
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
    padding: 0 !important;
    margin: 0 !important;
}

.fuxa-footer-nav-item {
    flex: 1 !important;
    height: 100% !important;
    display: flex !important;
    flex-direction: column !important;
    justify-content: center !important;
    align-items: center !important;
    cursor: pointer !important;
    transition: all 0.2s ease !important;
    border: none !important;
    background: transparent !important;
    color: #495057 !important;
    font-size: 11px !important;
    font-family: 'Microsoft YaHei', sans-serif !important;
}

.fuxa-footer-nav-item:hover {
    background-color: rgba(0,123,255,0.1) !important;
    color: #007bff !important;
}

.fuxa-footer-nav-item.active {
    color: #007bff !important;
    border-bottom: 2px solid #007bff !important;
}

.fuxa-footer-nav-icon {
    font-size: 20px !important;
    margin-bottom: 2px !important;
}

/* 为内容区域添加底部padding避免被遮挡 */
.view-container,
svg,
.main-content {
    padding-bottom: 66px !important;
}
`;

class LayoutOptimizer {
    constructor(dryRun = true) {
        this.dryRun = dryRun;
        this.db = null;
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

    async run() {
        console.log('\n========================================');
        console.log('  完整优化 Header 和 底部导航');
        console.log('========================================\n');

        try {
            await this.openDatabase();
            const layout = await this.getLayout();

            if (!layout || !layout.header) {
                console.log('❌ 未找到布局配置');
                return;
            }

            console.log('Step 1: 更新Header样式...\n');

            // 确保header配置正确
            layout.header.title = '注塑机HMI';
            layout.header.bkcolor = '#1a1a2e';
            layout.header.fgcolor = '#ffffff';
            layout.header.fontFamily = 'Microsoft YaHei, system-ui, sans-serif';
            layout.header.fontSize = 14;

            // 合并自定义CSS（包含底部导航）
            let existingCss = layout.header.customStyles || '';
            
            // 检查是否已有底部导航CSS
            if (!existingCss.includes('fuxa-footer-nav')) {
                existingCss += FOOTER_NAV_CSS;
                console.log('✅ 已添加底部导航CSS');
            } else {
                console.log('⚠️ 底部导航CSS已存在');
            }

            layout.header.customStyles = existingCss;

            console.log('\nStep 2: 保存配置...\n');

            if (!this.dryRun) {
                await this.saveLayout(layout);
                console.log('✅ 配置已保存');
                
                console.log('\n========== 配置摘要 ==========\n');
                console.log(`Header标题: ${layout.header.title}`);
                console.log(`背景色: ${layout.header.bkcolor}`);
                console.log(`CSS长度: ${layout.header.customStyles.length} 字符`);
                console.log(`包含底部导航: ${layout.header.customStyles.includes('fuxa-footer-nav') ? '是' : '否'}`);
            } else {
                console.log('[DRY-RUN] 配置将被更新');
            }

            console.log('\n========================================');
            console.log('  ✅ 优化完成');
            console.log('========================================\n');

        } catch (error) {
            console.error('❌ 错误:', error.message);
        } finally {
            await this.closeDatabase();
        }
    }
}

async function main() {
    const args = process.argv.slice(2);
    const dryRun = !args.includes('--apply');

    const optimizer = new LayoutOptimizer(dryRun);
    await optimizer.run();
}

main();

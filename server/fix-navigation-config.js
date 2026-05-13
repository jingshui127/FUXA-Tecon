/**
 * fix-navigation-config.js - 修复导航栏配置
 *
 * 问题：FUXA使用navigation字段而不是footer字段
 * 修复：将footer配置迁移到navigation字段
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, '_appdata', 'project.fuxap.db');

class NavigationFixer {
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
                'SELECT value FROM general WHERE name = ?',
                ['layout'],
                (err, row) => {
                    if (err) reject(err);
                    else if (!row) resolve({});
                    else resolve(JSON.parse(row.value));
                }
            );
        });
    }

    async saveLayout(layout) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'UPDATE general SET value = ? WHERE name = ?',
                [JSON.stringify(layout), 'layout'],
                (err) => err ? reject(err) : resolve()
            );
        });
    }

    async run() {
        console.log('\n========================================');
        console.log('  修复导航栏配置 - 使用navigation字段');
        console.log('========================================\n');
        console.log(`模式: ${this.dryRun ? 'DRY-RUN' : 'APPLY'}`);

        try {
            await this.openDatabase();
            const layout = await this.getLayout();

            // 检查是否有错误的footer配置
            if (layout.footer) {
                console.log('\n发现footer配置，需要迁移到navigation字段\n');

                // 将footer内容复制到navigation
                layout.navigation = {
                    mode: layout.footer.mode || 'item.navsmode-fix',
                    type: layout.footer.type || 'item.navtype-icons-text-block',
                    bkcolor: layout.footer.bkcolor || '#f0f0f0',
                    fgcolor: layout.footer.fgcolor || '#1d1d1d',
                    logo: layout.footer.logo || false,
                    items: layout.footer.items || []
                };

                // 删除footer字段
                delete layout.footer;

                console.log('新navigation配置:');
                console.log(`  mode: ${layout.navigation.mode}`);
                console.log(`  type: ${layout.navigation.type}`);
                console.log(`  items数量: ${layout.navigation.items.length}`);

                if (!this.dryRun) {
                    await this.saveLayout(layout);
                    console.log('\n✅ 配置已保存（已删除footer，使用navigation）');
                } else {
                    console.log('\n[DRY-RUN] 配置将被更新');
                }
            } else {
                console.log('\n没有找到footer配置');
                
                // 检查navigation是否存在
                if (layout.navigation) {
                    console.log('navigation已存在:');
                    console.log(`  mode: ${layout.navigation.mode}`);
                    console.log(`  type: ${layout.navigation.type}`);
                    console.log(`  items数量: ${layout.navigation.items?.length || 0}`);
                }
            }

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
    
    const fixer = new NavigationFixer(dryRun);
    await fixer.run();
}

main();

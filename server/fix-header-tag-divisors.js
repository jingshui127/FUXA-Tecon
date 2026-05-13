/**
 * fix-header-tag-divisors.js - 修复页眉标签除数配置
 *
 * 根据预检结果修复以下标签的divisor字段:
 * - t_d0_0100: 合模位置 - 除数从10改为1
 * - t_d0_0101: 开模位置 - 除数从100改为1
 * - t_d0_0201: 合模压力 - 除数从100改为10
 * - t_d0_0301: 射胶速度 - 除数从100改为1
 * - t_d0_0401: 循环周期 - 除数从100改为10
 *
 * 用法: node fix-header-tag-divisors.js [--apply]
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, '_appdata', 'project.fuxap.db');

// 需要修复的标签配置
const TAG_FIXES = [
    { id: 't_d0_0100', name: '合模位置', expectedDivisor: 1 },
    { id: 't_d0_0101', name: '开模位置', expectedDivisor: 1 },
    { id: 't_d0_0201', name: '合模压力', expectedDivisor: 10 },
    { id: 't_d0_0301', name: '射胶速度', expectedDivisor: 1 },
    { id: 't_d0_0401', name: '循环周期', expectedDivisor: 10 },
];

class TagDivisorFixer {
    constructor(dryRun = true) {
        this.dryRun = dryRun;
        this.db = null;
        this.results = {
            fixed: [],
            skipped: [],
            errors: []
        };
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

    closeDatabase() {
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

    async getAllDevices() {
        return new Promise((resolve, reject) => {
            this.db.all(
                'SELECT name, value FROM devices',
                (err, rows) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    const devices = [];
                    rows.forEach(row => {
                        try {
                            const deviceData = JSON.parse(row.value);
                            devices.push({
                                name: row.name,
                                type: deviceData.type || 'Unknown',
                                tags: deviceData.tags || {}
                            });
                        } catch (e) {
                            console.warn(`解析设备 ${row.name} 失败: ${e.message}`);
                        }
                    });
                    resolve(devices);
                }
            );
        });
    }

    async updateTagDivisor(deviceName, tagId, newDivisor) {
        return new Promise((resolve, reject) => {
            this.db.get(
                'SELECT value FROM devices WHERE name = ?',
                [deviceName],
                (err, row) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    if (!row) {
                        reject(new Error(`设备 ${deviceName} 不存在`));
                        return;
                    }

                    try {
                        const deviceData = JSON.parse(row.value);
                        if (!deviceData.tags || !deviceData.tags[tagId]) {
                            reject(new Error(`标签 ${tagId} 不存在于设备 ${deviceName}`));
                            return;
                        }

                        const oldDivisor = deviceData.tags[tagId].divisor;
                        deviceData.tags[tagId].divisor = newDivisor;

                        if (this.dryRun) {
                            console.log(`[DRY-RUN] 将更新设备 ${deviceName} 的标签 ${tagId}: divisor ${oldDivisor} → ${newDivisor}`);
                            resolve({ updated: true, oldValue: oldDivisor, newValue: newDivisor });
                            return;
                        }

                        const updatedValue = JSON.stringify(deviceData);
                        this.db.run(
                            'UPDATE devices SET value = ? WHERE name = ?',
                            [updatedValue, deviceName],
                            (updateErr) => {
                                if (updateErr) {
                                    reject(updateErr);
                                } else {
                                    resolve({ updated: true, oldValue: oldDivisor, newValue: newDivisor });
                                }
                            }
                        );
                    } catch (e) {
                        reject(e);
                    }
                }
            );
        });
    }

    async run() {
        console.log('\n========================================');
        console.log('  修复页眉标签除数配置');
        console.log('========================================\n');
        console.log(`模式: ${this.dryRun ? 'DRY-RUN (仅预览)' : 'APPLY (实际修改)'}`);
        console.log(`数据库: ${DB_PATH}`);
        console.log('');

        try {
            await this.openDatabase();
            console.log('✅ 数据库连接成功');

            console.log('\n----------------------------------------');
            console.log('Step 1: 查找包含目标标签的设备...');
            console.log('----------------------------------------');

            const devices = await this.getAllDevices();
            console.log(`发现 ${devices.length} 个设备`);

            let targetDevice = null;
            for (const device of devices) {
                const hasAllTags = TAG_FIXES.every(fix => device.tags[fix.id]);
                if (hasAllTags) {
                    targetDevice = device;
                    break;
                }
            }

            if (!targetDevice) {
                console.log('\n❌ 未找到包含所有目标标签的设备');
                console.log('正在搜索包含部分标签的设备...');

                for (const device of devices) {
                    const foundTags = TAG_FIXES.filter(fix => device.tags[fix.id]);
                    if (foundTags.length > 0) {
                        console.log(`\n设备 ${device.name} 包含 ${foundTags.length} 个目标标签:`);
                        foundTags.forEach(fix => {
                            const tag = device.tags[fix.id];
                            console.log(`  - ${fix.id} (${fix.name}): divisor=${tag.divisor}`);
                        });
                        targetDevice = device;
                    }
                }
            }

            if (!targetDevice) {
                console.log('\n❌ 未找到任何包含目标标签的设备');
                return this.results;
            }

            console.log(`\n✅ 找到目标设备: ${targetDevice.name}`);

            console.log('\n----------------------------------------');
            console.log('Step 2: 检查当前除数配置...');
            console.log('----------------------------------------');

            for (const fix of TAG_FIXES) {
                const tag = targetDevice.tags[fix.id];
                if (tag) {
                    const currentDivisor = tag.divisor;
                    const status = currentDivisor === fix.expectedDivisor ? '✅' : '❌';
                    console.log(`${status} ${fix.id} (${fix.name}): 当前divisor=${currentDivisor}, 期望=${fix.expectedDivisor}`);
                } else {
                    console.log(`⚠️ ${fix.id} (${fix.name}): 标签不存在`);
                }
            }

            console.log('\n----------------------------------------');
            console.log('Step 3: 应用修复...');
            console.log('----------------------------------------');

            for (const fix of TAG_FIXES) {
                const tag = targetDevice.tags[fix.id];
                if (!tag) {
                    this.results.skipped.push({ id: fix.id, reason: '标签不存在' });
                    console.log(`⚠️ 跳过 ${fix.id}: 标签不存在`);
                    continue;
                }

                if (tag.divisor === fix.expectedDivisor) {
                    this.results.skipped.push({ id: fix.id, reason: '已正确配置' });
                    console.log(`⚠️ 跳过 ${fix.id}: 除数已正确 (${tag.divisor})`);
                    continue;
                }

                try {
                    const result = await this.updateTagDivisor(targetDevice.name, fix.id, fix.expectedDivisor);
                    this.results.fixed.push({
                        id: fix.id,
                        name: fix.name,
                        oldValue: result.oldValue,
                        newValue: result.newValue
                    });
                    console.log(`✅ 修复 ${fix.id}: divisor ${result.oldValue} → ${result.newValue}`);
                } catch (error) {
                    this.results.errors.push({ id: fix.id, error: error.message });
                    console.log(`❌ 修复 ${fix.id} 失败: ${error.message}`);
                }
            }

            console.log('\n----------------------------------------');
            console.log('Step 4: 结果汇总...');
            console.log('----------------------------------------');

            console.log('\n========== 修复结果 ==========\n');
            console.log(`✅ 已修复: ${this.results.fixed.length}`);
            this.results.fixed.forEach(item => {
                console.log(`   - ${item.id} (${item.name}): ${item.oldValue} → ${item.newValue}`);
            });

            console.log(`\n⚠️ 已跳过: ${this.results.skipped.length}`);
            this.results.skipped.forEach(item => {
                console.log(`   - ${item.id}: ${item.reason}`);
            });

            console.log(`\n❌ 错误: ${this.results.errors.length}`);
            this.results.errors.forEach(item => {
                console.log(`   - ${item.id}: ${item.error}`);
            });

            console.log('\n========================================');
            if (this.results.errors.length === 0) {
                console.log('  ✅ 修复完成');
            } else {
                console.log('  ⚠️ 修复完成，但有错误');
            }
            console.log('========================================\n');

        } catch (error) {
            console.error('\n❌ 执行失败:', error.message);
            this.results.errors.push({ error: error.message });
        } finally {
            await this.closeDatabase();
        }

        return this.results;
    }
}

async function main() {
    const args = process.argv.slice(2);
    const dryRun = !args.includes('--apply');

    const fixer = new TagDivisorFixer(dryRun);
    await fixer.run();

    process.exit(fixer.results.errors.length > 0 ? 1 : 0);
}

main();

const utils = require('../.trae/skills/fuxa-automation/references/modbus-tag-utils.js');
const fs = require('fs');

const args = process.argv.slice(2);
const deviceId = args[0] || null;
const autoFix = args.includes('--fix');
const verbose = args.includes('--verbose');
const quiet = args.includes('--quiet');

function log(msg) {
    if (!quiet) console.log(msg);
}

console.log('╔════════════════════════════════════════════════════╗');
console.log('║     FUXA 项目完整性检查工具 v1.1                  ║');
console.log('║     Usage: node validate-project.js [deviceId]      ║');
console.log('║            [--fix] [--verbose] [--quiet]           ║');
console.log('╚════════════════════════════════════════════════════╝\n');

async function runDiagnosis(deviceId) {
    const device = await utils.getDeviceFromDb(deviceId);
    if (!device) return { exists: false };
    
    const isSystemDevice = ['FuxaServer', 'System'].includes(device.type);
    
    const result = {
        exists: true,
        id: deviceId,
        name: device.name || deviceId,
        type: device.type,
        driver: device.driver || null,
        settings: device.settings ? Object.keys(device.settings) : [],
        tags: {},
        tagCount: 0,
        issues: { errors: [], warnings: [] },
        status: 'ok'
    };
    
    const tags = device.tags || {};
    result.tagCount = Object.keys(tags).length;
    result.tags = tags;
    
    if (!isSystemDevice) {
        if (!device.driver) {
            result.issues.errors.push({ field: 'driver', msg: '缺失 driver 字段' });
            result.status = 'error';
        }
        
        if (!device.settings) {
            result.issues.errors.push({ field: 'settings', msg: '缺失 settings 字段' });
            result.status = 'error';
        } else {
            const required = ['ipaddress', 'port', 'slaveid'];
            const missing = required.filter(k => !device.settings[k]);
            if (missing.length > 0) {
                result.issues.warnings.push({ field: 'settings', msg: `缺少: ${missing.join(', ')}` });
                if (result.status === 'ok') result.status = 'warning';
            }
        }
        
        if (result.tagCount === 0) {
            result.issues.warnings.push({ field: 'tags', msg: '没有配置标签' });
            if (result.status === 'ok') result.status = 'warning';
        }
    }
    
    for (const [tagId, tag] of Object.entries(tags)) {
        const v = utils.validateTag(tag);
        if (!v.valid) {
            result.issues.errors.push({
                field: `tag:${tag.name || tagId}`,
                msg: v.errors.join('; ')
            });
            result.status = 'error';
        } else if (v.warnings.length > 0) {
            result.issues.warnings.push({
                field: `tag:${tag.name || tagId}`,
                msg: v.warnings.join('; ')
            });
        }
        
        if (result.issues.errors.length > 50) break;
    }
    
    return result;
}

async function main() {
    try {
        log(`📁 数据库: ${utils.PROJECT_DB}`);
        if (!fs.existsSync(utils.PROJECT_DB)) {
            console.error(`❌ 数据库不存在: ${utils.PROJECT_DB}`);
            process.exit(1);
        }
        log(`✅ 数据库已找到\n`);
        
        const devices = await utils.listAllDevices();
        log(`📋 发现 ${devices.length} 个设备\n`);
        
        let globalErrors = 0;
        let globalWarnings = 0;
        let totalTags = 0;
        const results = [];
        
        for (const device of devices) {
            if (deviceId && device.id !== deviceId) continue;
            
            const diag = await runDiagnosis(device.id);
            results.push(diag);
            totalTags += diag.tagCount;
            
            if (diag.status === 'error') globalErrors++;
            else if (diag.status === 'warning') globalWarnings++;
            
            if (!diag.exists) {
                log(`   ❌ 设备 ${device.id} 不存在于数据库`);
                continue;
            }
            
            const statusIcon = { ok: '✅', warning: '⚠️', error: '❌', critical: '🚨' };
            log(`${'─'.repeat(60)}`);
            log(`  ${statusIcon[diag.status]} ${diag.name} (${diag.type})`);
            log(`     ID: ${diag.id}`);
            log(`     标签: ${diag.tagCount} 个`);
            log(`     驱动: ${diag.driver || '(未设置)'}`);
            
            if (diag.issues.errors.length > 0) {
                log(`     ❌ 错误 (${diag.issues.errors.length}):`);
                diag.issues.errors.slice(0, 5).forEach(e => {
            log(`        - [${e.field}] ${e.msg}`);
                });
                if (diag.issues.errors.length > 5) {
                    log(`        ... 还有 ${diag.issues.errors.length - 5} 个`);
                }
            }
            
            if (diag.issues.warnings.length > 0) {
                log(`     ⚠️  警告 (${diag.issues.warnings.length}):`);
                diag.issues.warnings.slice(0, 3).forEach(w => {
                    log(`        - [${w.field}] ${w.msg}`);
                });
                if (diag.issues.warnings.length > 3) {
                    log(`        ... 还有 ${diag.issues.warnings.length - 3} 个`);
                }
            }
            
            if (verbose && diag.tagCount > 0) {
                log(`\n     📊 标签字段类型抽样:`);
                const checkResult = utils.preFlightCheck(diag.tags);
                
                const typeStats = {};
                for (const [key, stat] of Object.entries(checkResult.summary || {})) {
                    if (stat.fail + stat.fixed > 0) {
                        typeStats[key] = stat;
                    }
                }
                
                const statKeys = Object.keys(typeStats);
                if (statKeys.length === 0) {
                    log(`        ✅ 全部通过 (${diag.tagCount} 个标签)`);
                } else {
                    statKeys.forEach(key => {
                        const s = typeStats[key];
                        log(`        ${s.fail > 0 ? '❌' : '⚠️'} ${key}: 通过=${s.pass}, 失败=${s.fail}, 已修复=${s.fixed}`);
                    });
                    
                    if (checkResult.errors.length > 0) {
                        log(`\n        错误示例 (前5个):`);
                        checkResult.errors.slice(0, 5).forEach(e => {
                            log(`          [${e.tagName}] ${e.issue} = ${e.currentValue}`);
                        });
                    }
                }
            }
            
            log('');
        }
        
        console.log('╔════════════════════════════════════════════════════╗');
        console.log('║                   检查汇总                       ║');
        console.log('╠════════════════════════════════════════════════════╣');
        console.log(`║  数据库:  ${utils.PROJECT_DB.split('\\').pop().padEnd(38)} ║`);
        console.log(`║  设备总数: ${devices.length.toString().padEnd(37)} ║`);
        console.log(`║  标签总数: ${totalTags.toString().padEnd(37)} ║`);
        console.log(`║  ✅ 正常:   ${(devices.length - globalErrors - globalWarnings).toString().padEnd(37)} ║`);
        console.log(`║  ⚠️ 警告:   ${globalWarnings.toString().padEnd(37)} ║`);
        console.log(`║  ❌ 错误:   ${globalErrors.toString().padEnd(37)} ║`);
        console.log('╚════════════════════════════════════════════════════╝');
        
        if (autoFix && (globalErrors > 0 || globalWarnings > 0)) {
            log('\n🔧 自动修复模式已启用...\n');
            
            for (const r of results) {
                if (!r.exists) continue;
                
                try {
                    const fixResult = await utils.fixAllTagFieldTypes(r.id);
                    if (fixResult.fixed > 0) {
                        log(`  ✅ ${r.name}: 已修复 ${fixResult.fixed} 个字段`);
                    } else {
                        log(`  ℹ️  ${r.name}: 无需修复`);
                    }
                } catch (e) {
                    log(`  ❌ ${r.name}: 修复失败 - ${e.message}`);
                }
            }
            
            log('\n✅ 自动修复完成！请重新运行此脚本验证。\n');
        }
        
        if (globalErrors > 0) {
            console.log('\n❌ 发现错误！请查看上方详细报告。\n');
            process.exit(1);
        } else if (globalWarnings > 0) {
            console.log('\n⚠️  有警告，建议修复。\n');
            process.exit(0);
        } else {
            console.log('\n✅ 所有检查通过！\n');
            process.exit(0);
        }
        
    } catch (e) {
        console.error('\n❌ 检查出错:', e.message);
        if (verbose) console.error(e.stack);
        process.exit(2);
    }
}

main();
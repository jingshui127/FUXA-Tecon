const fs = require('fs');
const http = require('http');
const path = require('path');

let sqlite3;
try {
    sqlite3 = require('sqlite3').verbose();
} catch (e) {
    try {
        const serverPath = path.resolve(path.join(__dirname, '..', '..', '..', '..'));
        sqlite3 = require(path.join(serverPath, 'server', 'node_modules', 'sqlite3')).verbose();
    } catch (e2) {
        console.error('无法加载 sqlite3 模块，请在 server 目录下运行或安装: npm install sqlite3');
        throw e2;
    }
}

const FUXA_URL = 'http://127.0.0.1:1881';
const DB_DIR = path.resolve(path.join(__dirname, '..', '..', '..', '..', 'server', '_appdata'));
const PROJECT_DB = path.join(DB_DIR, 'project.fuxap.db');

// 寄存器类型映射表
const REGISTER_TYPE_MAP = {
    '4X': { memaddress: '400000', name: 'Holding Registers (Read/Write 400001-465535)' },
    '3X': { memaddress: '300000', name: 'Input Registers (Read 300001-365536)' },
    '1X': { memaddress: '000000', name: 'Coil Status (Read/Write 000001-065536)' },
    '0X': { memaddress: '100000', name: 'Digital Inputs (Read 100001-165536)' }
};

// 数据类型映射（CSV文档 → FUXA）
const DATA_TYPE_MAP = {
    'Int32': 'Int32MLE',
    'UInt': 'UInt16',
    'Int': 'Int16',
    'Float': 'Float32',
    'Bool': 'Bool'
};

// 除数映射（根据标签名关键词）
function getDivisorByTagName(tagName) {
    if (!tagName) return null;
    if (tagName.includes('流量')) return 100;
    if (tagName.includes('压力') || tagName.includes('时间')) return 10;
    return null;
}

// 从FUXA地址格式(如"4X101")解析为标签配置
function parseFuxaAddress(fuxaAddr) {
    const match = fuxaAddr.match(/^([0-9]X)(\d+)$/);
    if (!match) return null;
    
    const typeCode = match[1];
    const addrNum = parseInt(match[2]);
    
    return REGISTER_TYPE_MAP[typeCode] ? {
        memaddress: REGISTER_TYPE_MAP[typeCode].memaddress,
        address: addrNum,
        registerType: typeCode
    } : null;
}

// 创建符合规范的Modbus标签
function createModbusTag(options) {
    const { id, name, fuxaAddress, type, divisor } = options;
    
    const addrInfo = parseFuxaAddress(fuxaAddress);
    if (!addrInfo) {
        throw new Error(`Invalid FUXA address format: ${fuxaAddress}. Expected format: "4X101"`);
    }
    
    return {
        id: id,
        name: name,
        type: type || 'UInt16',
        memaddress: addrInfo.memaddress,
        address: addrInfo.address,
        divisor: divisor !== undefined ? divisor : getDivisorByTagName(name),
        daq: {
            enabled: false,
            interval: 60,
            changed: false,
            restored: false
        }
    };
}

// 从CSV文件批量加载标签配置
function loadTagsFromCsv(csvFiles) {
    const tags = {};
    
    csvFiles.forEach(file => {
        if (!fs.existsSync(file)) return;
        
        const content = fs.readFileSync(file, 'utf8');
        const lines = content.split('\n');
        
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            const parts = line.split(',');
            if (parts.length >= 8) {
                const tagId = parts[0].trim();
                const tagName = parts[6].trim();
                const fuxaAddr = parts[5].trim();
                const rawType = parts[7].trim();
                
                tags[tagId] = createModbusTag({
                    id: tagId,
                    name: tagName,
                    fuxaAddress: fuxaAddr,
                    type: DATA_TYPE_MAP[rawType] || rawType
                });
            }
        }
    });
    
    return tags;
}

// API工具函数
function apiGet(path) {
    return new Promise((resolve, reject) => {
        http.get(FUXA_URL + path, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try { resolve(JSON.parse(data)); }
                catch (e) { resolve(data); }
            });
        }).on('error', reject);
    });
}

function apiPost(path, payload) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify(payload);
        const url = new URL(FUXA_URL + path);
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };
        
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try { resolve(JSON.parse(data)); }
                catch (e) { resolve(data); }
            });
        });
        
        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

// 批量更新设备标签
async function updateDeviceTags(deviceId, newTags) {
    console.log(`正在更新设备 ${deviceId} 的标签...`);
    
    const project = await apiGet('/api/project');
    const device = project.devices[deviceId];
    
    if (!device) {
        throw new Error(`Device not found: ${deviceId}`);
    }
    
    let updatedCount = 0;
    let skippedCount = 0;
    
    for (const [tagId, tagConfig] of Object.entries(newTags)) {
        if (device.tags[tagId]) {
            Object.assign(device.tags[tagId], tagConfig);
            updatedCount++;
        } else {
            device.tags[tagId] = tagConfig;
            updatedCount++;
        }
    }
    
    await apiPost('/api/project', project);
    
    console.log(`完成！更新 ${updatedCount} 个标签，跳过 ${skippedCount} 个`);
    return { updated: updatedCount, skipped: skippedCount };
}

// 验证标签配置是否符合规范
function validateTag(tag) {
    const errors = [];
    const warnings = [];
    
    // 必填字段检查
    if (!tag.id) errors.push('缺少 id 字段');
    if (!tag.name) errors.push('缺少 name 字段');
    if (!tag.type) errors.push('缺少 type 字段');
    
    // memaddress 类型检查
    if (typeof tag.memaddress !== 'string') {
        errors.push(`memaddress 必须是字符串，当前为 ${typeof tag.memaddress}`);
    } else if (!['000000', '100000', '300000', '400000'].includes(tag.memaddress)) {
        warnings.push(`memaddress 值 "${tag.memaddress}" 可能无效，有效值: 000000, 100000, 300000, 400000`);
    }
    
    // address 类型检查
    if (typeof tag.address !== 'number') {
        errors.push(`address 必须是数字，当前为 ${typeof tag.address}`);
    } else if (tag.address < 1 || tag.address > 65536) {
        warnings.push(`address 值 ${tag.address} 超出范围 (1-65536)`);
    }
    
    // divisor 检查
    if (tag.divisor !== undefined && tag.divisor !== null && typeof tag.divisor !== 'number') {
        warnings.push(`divisor 应该是数字或null，当前为 ${typeof tag.divisor}`);
    }
    
    return { valid: errors.length === 0, errors, warnings };
}

// ==================== SQLite 数据库操作工具 ====================

// 获取数据库连接
function getDbConnection() {
    if (!fs.existsSync(PROJECT_DB)) {
        throw new Error(`数据库文件不存在: ${PROJECT_DB}`);
    }
    return new sqlite3.Database(PROJECT_DB);
}

// 从数据库读取设备配置（异步Promise封装）
function getDeviceFromDb(deviceId) {
    return new Promise((resolve, reject) => {
        const db = getDbConnection();
        db.get("SELECT value FROM devices WHERE name = ?", [deviceId], (err, row) => {
            db.close();
            if (err) reject(err);
            else if (!row) resolve(null);
            else resolve(JSON.parse(row.value));
        });
    });
}

// 更新设备到数据库（异步）
function updateDeviceInDb(deviceId, deviceConfig) {
    return new Promise((resolve, reject) => {
        const db = getDbConnection();
        const valueJson = JSON.stringify(deviceConfig);
        db.run("UPDATE devices SET value = ? WHERE name = ?", [valueJson, deviceId], (err) => {
            db.close();
            if (err) reject(err);
            else resolve({ success: true, deviceId });
        });
    });
}

// 列出所有设备ID和名称
function listAllDevices() {
    return new Promise((resolve, reject) => {
        const db = getDbConnection();
        db.all("SELECT name, value FROM devices", [], (err, rows) => {
            db.close();
            if (err) reject(err);
            else {
                const devices = rows.map(row => {
                    const config = JSON.parse(row.value);
                    return { id: row.name, name: config.name || row.name, type: config.type };
                });
                resolve(devices);
            }
        });
    });
}

// 批量修复所有标签的字段类型（确保memaddress是字符串，address是数字）
async function fixAllTagFieldTypes(deviceId) {
    console.log(`正在修复设备 ${deviceId} 的标签字段类型...`);
    
    const device = await getDeviceFromDb(deviceId);
    if (!device) throw new Error(`设备不存在: ${deviceId}`);
    
    let fixedCount = 0;
    
    for (const [tagId, tag] of Object.entries(device.tags || {})) {
        let needsFix = false;
        
        // 修复 memaddress 类型（必须是字符串）
        if (typeof tag.memaddress !== 'string') {
            const addrInfo = parseFuxaAddress(tag.memaddress + '');
            if (addrInfo) {
                tag.memaddress = addrInfo.memaddress;
                needsFix = true;
            }
        }
        
        // 修复 address 类型（必须是数字）
        if (typeof tag.address !== 'number') {
            tag.address = parseInt(tag.address) || 1;
            needsFix = true;
        }
        
        // 验证并记录
        const validation = validateTag(tag);
        if (!validation.valid && validation.errors.length > 0) {
            console.log(`  ⚠️ ${tag.name}: ${validation.errors.join(', ')}`);
        }
        
        if (needsFix) fixedCount++;
    }
    
    if (fixedCount > 0) {
        await updateDeviceInDb(deviceId, device);
        console.log(`已修复 ${fixedCount} 个标签`);
    } else {
        console.log('无需修复，所有标签字段类型正确');
    }
    
    return { fixed: fixedCount, totalTags: Object.keys(device.tags || {}).length };
}

// 从CSV导入标签到数据库（直接操作）
async function importTagsToDatabaseFromCsv(deviceId, csvFiles) {
    console.log(`正在从CSV导入标签到设备 ${deviceId}...`);
    
    const tags = loadTagsFromCsv(csvFiles);
    const device = await getDeviceFromDb(deviceId);
    
    if (!device) {
        throw new Error(`设备不存在: ${deviceId}，请先创建设备`);
    }
    
    if (!device.tags) device.tags = {};
    
    let imported = 0;
    let updated = 0;
    
    for (const [tagId, tagConfig] of Object.entries(tags)) {
        if (device.tags[tagId]) {
            Object.assign(device.tags[tagId], tagConfig);
            updated++;
        } else {
            device.tags[tagId] = tagConfig;
            imported++;
        }
    }
    
    await updateDeviceInDb(deviceId, device);
    
    console.log(`完成！新增 ${imported} 个，更新 ${updated} 个，共 ${Object.keys(tags).length} 个标签`);
    return { imported, updated, total: Object.keys(tags).length };
}

// 备份数据库
function backupDatabase(backupDir) {
    const backupPath = backupDir || path.join(DB_DIR, 'backup');
    if (!fs.existsSync(backupPath)) fs.mkdirSync(backupPath, { recursive: true });
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(backupPath, `project_${timestamp}.db.fuxap`);
    
    fs.copyFileSync(PROJECT_DB, backupFile);
    console.log(`数据库已备份到: ${backupFile}`);
    return backupFile;
}

// ==================== 安全操作工具 ====================

// 安全修改设备配置（自动备份+验证+回滚）
async function safeModify(deviceId, modifyFn, options = {}) {
    const { autoBackup = true, autoValidate = true, autoFix = true } = options;
    
    console.log(`\n${'='.repeat(50)}`);
    console.log(`🔧 开始安全修改: ${deviceId}`);
    console.log(`${'='.repeat(50)}`);
    
    // 1. 备份
    let backupFile = null;
    if (autoBackup) {
        try {
            backupFile = backupDatabase();
            console.log(`✅ 已创建备份: ${backupFile}`);
        } catch (e) {
            console.warn(`⚠️ 备份失败，继续操作: ${e.message}`);
        }
    }
    
    // 2. 读取当前状态
    let snapshot = null;
    try {
        snapshot = await getDeviceFromDb(deviceId);
        if (!snapshot) throw new Error(`设备不存在: ${deviceId}`);
        console.log(`✅ 已读取设备: ${snapshot.name} (${Object.keys(snapshot.tags || {}).length} 个标签)`);
    } catch (e) {
        throw new Error(`无法读取设备: ${e.message}`);
    }
    
    try {
        // 3. 执行修改
        console.log('⏳ 正在执行修改...');
        const modified = await modifyFn({ ...snapshot });
        
        // 4. 验证（如果启用）
        if (autoValidate) {
            console.log('🔍 验证配置...');
            const current = await getDeviceFromDb(deviceId);
            
            let errorCount = 0;
            let warningCount = 0;
            
            for (const [tagId, tag] of Object.entries(current.tags || {})) {
                const result = validateTag(tag);
                if (!result.valid) {
                    errorCount += result.errors.length;
                    warningCount += result.warnings.length;
                    
                    if (result.errors.length > 0) {
                        console.log(`  ❌ ${tag.name}: ${result.errors.join(', ')}`);
                    }
                    if (result.warnings.length > 0) {
                        console.log(`  ⚠️  ${tag.name}: ${result.warnings.join(', ')}`);
                    }
                }
            }
            
            // 5. 自动修复（如果启用且有问题）
            if ((errorCount > 0 || warningCount > 0) && autoFix) {
                console.log('\n🔧 发现问题，正在自动修复...');
                const fixResult = await fixAllTagFieldTypes(deviceId);
                console.log(`✅ 修复完成: ${fixResult.fixed} 个字段已修正`);
            }
            
            console.log(`\n✅ 验证结果: ${errorCount} 个错误, ${warningCount} 个警告`);
        }
        
        console.log(`${'='.repeat(50)}`);
        console.log('✅ 安全修改完成！');
        if (backupFile) console.log(`💾 备份位置: ${backupFile}`);
        console.log(`${'='.repeat(50)}\n`);
        
        return { success: true, backupFile };
        
    } catch (e) {
        // 6. 回滚
        console.error(`\n❌ 修改失败: ${e.message}`);
        
        if (snapshot && backupFile) {
            console.log('🔄 正在回滚到备份状态...');
            try {
                await updateDeviceInDb(deviceId, snapshot);
                console.log('✅ 回滚成功');
            } catch (rollbackErr) {
                console.error(`❌ 回滚失败！请手动恢复备份: ${backupFile}`);
                console.error(`   错误: ${rollbackErr.message}`);
            }
        }
        
        throw e;
    }
}

// 标签配置检查清单（部署前使用）
function preFlightCheck(deviceTags) {
    const checks = [
        { 
            name: 'memaddress类型', 
            test: (t) => typeof t.memaddress === 'string',
            fix: (t) => { t.memaddress = String(t.memaddress || '400000'); },
            level: 'error'
        },
        { 
            name: 'memaddress值有效性', 
            test: (t) => ['000000','100000','300000','400000'].includes(t.memaddress),
            fix: null,
            level: 'warning'
        },
        { 
            name: 'address类型', 
            test: (t) => typeof t.address === 'number',
            fix: (t) => { t.address = parseInt(t.address) || 1; },
            level: 'error'
        },
        { 
            name: 'address范围(1-65536)', 
            test: (t) => t.address >= 1 && t.address <= 65536,
            fix: (t) => { t.address = Math.max(1, Math.min(65536, t.address)); },
            level: 'error'
        },
        { 
            name: 'type字段存在', 
            test: (t) => !!t.type,
            fix: (t) => { t.type = 'UInt16'; },
            level: 'error'
        },
        { 
            name: 'name字段存在', 
            test: (t) => !!t.name,
            fix: (t) => { t.name = t.id || 'unnamed'; },
            level: 'error'
        },
        { 
            name: 'id字段存在', 
            test: (t) => !!t.id,
            fix: (t) => { t.id = 't_auto_' + Date.now(); },
            level: 'error'
        },
        { 
            name: 'divisor合理性', 
            test: (t) => t.divisor === undefined || t.divisor === null || 
                          typeof t.divisor === 'number',
            fix: (t) => { if (typeof t.divisor !== 'number') t.divisor = null; },
            level: 'warning'
        }
    ];
    
    const results = {
        total: Object.keys(deviceTags || {}).length,
        errors: [],
        warnings: [],
        fixed: [],
        passed: true,
        summary: {}
    };
    
    checks.forEach(check => {
        results.summary[check.name] = { pass: 0, fail: 0, fixed: 0 };
    });
    
    for (const [tagId, tag] of Object.entries(deviceTags || {})) {
        checks.forEach(check => {
            const passed = check.test(tag);
            
            if (passed) {
                results.summary[check.name].pass++;
            } else {
                results.passed = false;
                
                if (check.level === 'error') {
                    results.errors.push({
                        tagId,
                        tagName: tag.name || tagId,
                        issue: check.name,
                        currentValue: tag[check.name.split('类型')[0].split('值')[0]] || 'undefined'
                    });
                    results.summary[check.name].fail++;
                } else {
                    results.warnings.push({
                        tagId,
                        tagName: tag.name || tagId,
                        issue: check.name,
                        currentValue: tag[check.name.split('类型')[0].split('值')[0]] || 'undefined'
                    });
                    results.summary[check.name].fail++;
                }
                
                // 尝试自动修复
                if (check.fix) {
                    check.fix(tag);
                    results.fixed.push({
                        tagId,
                        tagName: tag.name || tagId,
                        issue: check.name
                    });
                    results.summary[check.name].fixed++;
                }
            }
        });
    }
    
    return results;
}

// Modbus 设备连接诊断工具
async function diagnoseModbusConnection(deviceId) {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`🔍 诊断设备: ${deviceId}`);
    console.log(`${'='.repeat(50)}`);
    
    const diagnosis = {
        deviceId,
        timestamp: new Date().toISOString(),
        checks: [],
        status: 'unknown',
        suggestions: []
    };
    
    try {
        // 检查1: 设备是否存在
        const device = await getDeviceFromDb(deviceId);
        if (!device) {
            diagnosis.checks.push({ name: '设备存在性', status: '❌ 失败', detail: '设备不存在' });
            diagnosis.status = 'critical';
            diagnosis.suggestions.push('请先创建设备');
            return diagnosis;
        }
        diagnosis.checks.push({ name: '设备存在性', status: '✅ 通过', detail: `名称: ${device.name}, 类型: ${device.type}` });
        
        // 检查2: driver 字段
        if (!device.driver) {
            diagnosis.checks.push({ name: 'driver字段', status: '❌ 缺失', detail: '需要 "modbus"' });
            diagnosis.status = 'error';
            diagnosis.suggestions.push('运行 fix-device.js 或 safeModify() 修复');
        } else {
            diagnosis.checks.push({ name: 'driver字段', status: '✅ 通过', detail: device.driver });
        }
        
        // 检查3: settings 字段
        if (!device.settings) {
            diagnosis.checks.push({ name: 'settings字段', status: '❌ 缺失', detail: '缺少连接配置' });
            diagnosis.status = 'error';
            diagnosis.suggestions.push('补全 settings 对象（ipaddress, port, slaveid等）');
        } else {
            const requiredSettings = ['ipaddress', 'port', 'slaveid'];
            const missing = requiredSettings.filter(s => !device.settings[s]);
            if (missing.length > 0) {
                diagnosis.checks.push({ name: 'settings完整性', status: '⚠️ 不完整', detail: `缺失: ${missing.join(', ')}` });
                if (diagnosis.status !== 'error') diagnosis.status = 'warning';
            } else {
                diagnosis.checks.push({ 
                    name: 'settings字段', 
                    status: '✅ 通过', 
                    detail: `${device.settings.ipaddress}:${device.settings.port} (slave=${device.settings.slaveid})` 
                });
            }
        }
        
        // 检查4: 标签数量
        const tagCount = Object.keys(device.tags || {}).length;
        if (tagCount === 0) {
            diagnosis.checks.push({ name: '标签配置', status: '⚠️ 空', detail: '没有配置任何标签' });
            diagnosis.suggestions.push('导入CSV或手动添加标签');
            if (diagnosis.status !== 'error') diagnosis.status = 'warning';
        } else {
            diagnosis.checks.push({ name: '标签配置', status: '✅ 通过', detail: `${tagCount} 个标签` });
        }
        
        // 检查5: 标签字段类型验证
        if (tagCount > 0) {
            let invalidCount = 0;
            let checkedCount = 0;
            
            for (const tag of Object.values(device.tags)) {
                checkedCount++;
                const v = validateTag(tag);
                if (!v.valid) {
                    invalidCount++;
                    if (invalidCount <= 3) {  // 只显示前3个错误
                        diagnosis.checks.push({ 
                            name: `标签 "${tag.name}"`, 
                            status: '❌ 无效', 
                            detail: v.errors.join('; ') 
                        });
                    }
                }
            }
            
            if (invalidCount > 0) {
                diagnosis.checks.push({ 
                    name: '标签验证汇总', 
                    status: '❌ 有错误', 
                    detail: `${invalidCount}/${checkedCount} 个标签无效` 
                });
                diagnosis.status = 'error';
                diagnosis.suggestions.push(`运行 fixAllTagFieldTypes("${deviceId}") 修复`);
            } else {
                diagnosis.checks.push({ name: '标签验证汇总', status: '✅ 通过', detail: `${checkedCount} 个标签全部有效` });
            }
        }
        
        // 最终状态判定
        if (diagnosis.status === 'unknown') diagnosis.status = 'ok';
        
    } catch (e) {
        diagnosis.checks.push({ name: '诊断过程', status: '❌ 异常', detail: e.message });
        diagnosis.status = 'error';
        diagnosis.suggestions.push('检查数据库文件是否被锁定');
    }
    
    // 输出诊断报告
    console.log('\n📋 诊断报告:');
    diagnosis.checks.forEach(c => {
        console.log(`  ${c.status} ${c.name}: ${c.detail || ''}`);
    });
    
    if (diagnosis.suggestions.length > 0) {
        console.log('\n💡 建议:');
        diagnosis.suggestions.forEach((s, i) => console.log(`  ${i + 1}. ${s}`));
    }
    
    const statusEmoji = { ok: '✅', warning: '⚠️', error: '❌', critical: '🚨' };
    console.log(`\n${'='.repeat(50)}`);
    console.log(`总体状态: ${statusEmoji[diagnosis.status] || diagnosis.status.toUpperCase()}`);
    console.log(`${'='.repeat(50)}\n`);
    
    return diagnosis;
}

module.exports = {
    REGISTER_TYPE_MAP,
    DATA_TYPE_MAP,
    getDivisorByTagName,
    parseFuxaAddress,
    createModbusTag,
    loadTagsFromCsv,
    apiGet,
    apiPost,
    updateDeviceTags,
    validateTag,
    FUXA_URL,
    DB_DIR,
    PROJECT_DB,
    getDeviceFromDb,
    updateDeviceInDb,
    listAllDevices,
    fixAllTagFieldTypes,
    importTagsToDatabaseFromCsv,
    backupDatabase,
    safeModify,
    preFlightCheck,
    diagnoseModbusConnection
};
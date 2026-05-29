const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('_appdata/project.fuxap.db');

// 查询并修复ModbusTCP设备
db.get("SELECT name, value FROM devices WHERE name = 'd_f9faa9df-f80c40de'", (err, row) => {
    if (err) {
        console.error('查询失败:', err);
        db.close();
        return;
    }
    
    const device = JSON.parse(row.value);
    console.log('修复前:');
    console.log('type:', device.type);
    console.log('driver:', device.driver);
    console.log('hasCustomTags:', device.hasCustomTags);
    console.log('settings:', device.settings);
    
    // 添加缺失的字段
    if (!device.driver) device.driver = 'modbus';
    if (device.hasCustomTags === undefined) device.hasCustomTags = true;
    if (!device.settings) {
        device.settings = {
            ipaddress: '127.0.0.1',
            port: 502,
            slaveid: 1,
            timeout: 5000,
            interval: 1000,
            reconnect: 5000,
            debug: false,
            usertag: false
        };
    }
    
    // 更新数据库
    db.run("UPDATE devices SET value = ? WHERE name = ?", 
           [JSON.stringify(device), row.name], (err) => {
        if (err) {
            console.error('更新失败:', err);
        } else {
            console.log('\n修复完成:');
            console.log('driver:', device.driver);
            console.log('hasCustomTags:', device.hasCustomTags);
            console.log('settings:', JSON.stringify(device.settings));
        }
        db.close();
    });
});
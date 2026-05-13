const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('_appdata/project.fuxap.db');

console.log('=== 检查系统状态指示区配置 (FR-02) ===\n');

db.get("SELECT value FROM general", (err, row) => {
    if (!row) {
        console.log('❌ 未找到general表');
        db.close();
        return;
    }
    
    const general = JSON.parse(row.value);
    
    if (!general.header) {
        console.log('❌ 无header配置');
        db.close();
        return;
    }
    
    const hdr = general.header;
    
    console.log('=== 当前系统状态指示区配置 ===\n');
    
    // 1. 检查报警显示设置
    console.log('1️⃣ 报警计数器 (FR-02.1):');
    console.log(`   alarms配置: ${hdr.alarms}`);
    console.log(`   状态: ${hdr.alarms ? '✅ 已启用' : '❌ 未启用'}`);
    
    // 2. 检查信息显示设置
    console.log('\n2️⃣ 信息计数器 (FR-02.2):');
    console.log(`   infos配置: ${hdr.infos}`);
    console.log(`   状态: ${hdr.infos ? '✅ 已启用' : '❌ 未启用'}`);
    
    // 3. 检查是否有运行状态指示灯
    console.log('\n3️⃣ 运行状态指示灯 (FR-02.3):');
    const statusItem = hdr.items?.find(item => 
        item.id?.includes('status') || 
        item.id?.includes('running') ||
        item.text?.includes('运行')
    );
    
    if (statusItem) {
        console.log(`   ✅ 找到状态项: ${statusItem.id}`);
        console.log(`      文本: "${statusItem.text}"`);
        if (statusItem.property?.variableId) {
            console.log(`      绑定变量: ${statusItem.property.variableId}`);
        }
    } else {
        console.log('   ❌ 未找到运行状态指示灯');
    }
    
    // 4. 显示当前所有items，便于分析布局
    console.log('\n4️⃣ 当前Header Items列表:');
    console.log('   ┌─────────────────────────────────────────────────────────────┐');
    hdr.items?.forEach((item, i) => {
        const type = item.type.padEnd(8);
        const id = (item.id || '').padEnd(18);
        const text = (item.text || '').padEnd(12);
        const varId = item.property?.variableId || '-';
        
        console.log(`   │ ${i+1}. [${type}] ${id} "${text}" → ${varId}`);
    });
    console.log('   └─────────────────────────────────────────────────────────────┘');
    
    // 5. 分析建议
    console.log('\n5️⃣ 配置建议:');
    
    const suggestions = [];
    
    if (!hdr.alarms) {
        suggestions.push('• 启用 alarms 配置以显示报警计数器');
    }
    
    if (!hdr.infos) {
        suggestions.push('• 启用 infos 配置以显示信息计数器');
    }
    
    if (!statusItem) {
        suggestions.push('• 添加运行状态指示灯（建议绑定系统标签或根据报警推断）');
    }
    
    if (suggestions.length === 0) {
        console.log('   ✅ 所有系统状态指示功能均已配置完成！');
    } else {
        suggestions.forEach(s => console.log(`   ⚠️  ${s}`));
    }
    
    db.close();
});

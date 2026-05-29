const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('_appdata/project.fuxap.db');

console.log('=== 配置系统状态指示区 (FR-02) ===\n');

db.get("SELECT value FROM general", async (err, row) => {
    const general = JSON.parse(row.value);
    const hdr = general.header;
    
    console.log('【步骤1】修改信息计数器显示模式');
    console.log(`  当前: ${hdr.infos}`);
    hdr.infos = 'item.notifymode-fix';  // 改为固定显示
    console.log(`  修改后: ${hdr.infos} ✅`);
    
    console.log('\n【步骤2】添加设备运行状态指示灯');
    
    // 创建运行状态指示灯（使用圆形色块表示）
    const statusIndicator = {
        id: 'hdr_status_light',
        type: 'label',
        text: '●',                    // Unicode实心圆
        bkcolor: 'transparent',
        fgcolor: '#22c55e',           // 默认绿色（运行）
        marginLeft: 16,
        marginRight: 8,
        fontSize: 20,
        property: {
            variableId: null,         // 暂不绑定变量，后续可根据需要绑定
            format: '',
            ranges: [
                { min: 0, max: 0, color: '#64748b', type: 6 },     // 0=停止/离线: 灰色
                { min: 1, max: 1, color: '#eab308', type: 6 },    // 1=待机: 黄色
                { min: 2, max: 2, color: '#22c55e', type: 6 }     // 2=运行: 绿色
            ],
            events: [],
            actions: [],
            options: {}
        }
    };
    
    // 在items数组末尾添加状态指示灯
    if (!hdr.items) {
        hdr.items = [];
    }
    hdr.items.push(statusIndicator);
    
    console.log(`  ✅ 已添加运行状态指示灯`);
    console.log(`     ID: ${statusIndicator.id}`);
    console.log(`     默认颜色: ${statusIndicator.fgcolor} (绿色-运行)`);
    console.log(`     支持状态: 灰(停止) / 黄(待机) / 绿(运行)`);
    
    // 更新数据库
    general.header = hdr;
    
    db.run("UPDATE general SET value = ?", [JSON.stringify(general)], (updateErr) => {
        if (updateErr) {
            console.error('\n❌ 更新失败:', updateErr.message);
            db.close();
            return;
        }
        
        console.log('\n=== ✅ FR-02 配置完成 ===');
        console.log('\n【最终配置摘要】');
        console.log(`  • 报警计数器: ${hdr.alarms} (显示)`);
        console.log(`  • 信息计数器: ${hdr.infos} (显示)`);
        console.log(`  • 运行状态灯: 已添加 (${hdr.items.length}个items)`);
        
        console.log('\n【Header Items布局预览】');
        console.log('┌───────────────────────────────────────────────────────────────────────┐');
        console.log('│ [合模] [开模] [压力] [射速] [周期] | 🔔alarms 📋infos ●status | 📅时间 👤用户 │');
        console.log('└───────────────────────────────────────────────────────────────────────┘');
        
        console.log('\n【下一步建议】');
        console.log('  1. 如需绑定真实运行状态变量，请修改 hdr_status_light 的 variableId');
        console.log('  2. 重启FUXA服务以查看效果');
        console.log('  3. 验证报警和信息按钮是否正常显示和交互');
        
        db.close();
    });
});

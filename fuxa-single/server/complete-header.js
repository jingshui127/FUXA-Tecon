const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('_appdata/project.fuxap.db');

console.log('=== 分析并完善Header配置 ===\n');

db.get("SELECT value FROM general", async (err, row) => {
    const general = JSON.parse(row.value);
    const hdr = general.header;
    
    console.log('【当前Header Items统计】');
    console.log(`总数: ${hdr.items?.length || 0}个`);
    
    // 分类统计
    let valueItems = 0;
    let labelItems = 0;
    let unitItems = 0;
    
    hdr.items?.forEach((item, i) => {
        const hasVar = item.property?.variableId;
        
        if (hasVar) {
            valueItems++;
            console.log(`\n${i+1}. 📊 [数值] ${item.id}`);
            console.log(`   变量: ${item.property.variableId}`);
            console.log(`   格式: ${item.property.format || '无'}`);
        } else if (item.text && item.text.match(/^[a-zA-Z\u4e00-\u9fa5]+$/)) {
            labelItems++;
            console.log(`${i+1}. 🏷️  [标签] ${item.id} = "${item.text}"`);
        } else {
            unitItems++;
            console.log(`${i+1}. 📏 [单位] ${item.id} = "${item.text}"`);
        }
    });
    
    console.log(`\n分类:`);
    console.log(`  数值项: ${valueItems}个`);
    console.log(`  标签项: ${labelItems}个`);
    console.log(`  单位项: ${unitItems}个`);
    
    // 检查是否缺少循环周期参数
    const hasCycleTime = hdr.items?.some(item => 
        item.property?.variableId === 't_d0_0401'
    );
    
    console.log('\n\n【缺失检查】');
    
    if (!hasCycleTime) {
        console.log('❌ 缺少: 循环周期 (t_d0_0401)');
        
        console.log('\n=== 添加循环周期参数 ===');
        
        // 找到最后一个单位项的位置（在其后插入）
        const lastUnitIdx = hdr.items.findLastIndex(item => 
            !item.property?.variableId && 
            item.text && 
            item.text.match(/^(mm|bar|rpm|s|%|°C)$/)
        );
        
        const insertIdx = lastUnitIdx + 1;
        
        // 创建新的参数组（值 + 标签 + 单位）
        const newItems = [
            {
                id: 'hdr_cycle_val',
                type: 'label',
                text: '--',
                bkcolor: 'transparent',
                fgcolor: '#ffffff',
                marginLeft: 8,
                marginRight: 0,
                property: {
                    variableId: 't_d0_0401',      // 循环时间标签
                    format: '#.00',                 // 显示2位小数
                    ranges: [],
                    events: [],
                    actions: [],
                    options: {}
                }
            },
            {
                id: 'hdr_cycle_lbl',
                type: 'label',
                text: '周期',
                bkcolor: 'transparent',
                fgcolor: '#94a3b8',
                marginLeft: 0,
                marginRight: 0,
                property: {
                    variableId: null,
                    format: '',
                    ranges: [],
                    events: [],
                    actions: [],
                    options: {}
                }
            },
            {
                id: 'hdr_cycle_unit',
                type: 'label',
                text: 's',
                bkcolor: 'transparent',
                fgcolor: '#94a3b8',
                marginLeft: 0,
                marginRight: 24,
                property: {
                    variableId: null,
                    format: '',
                    ranges: [],
                    events: [],
                    actions: [],
                    options: {}
                }
            }
        ];
        
        // 插入到数组中
        hdr.items.splice(insertIdx, 0, ...newItems);
        
        console.log(`✅ 已在第${insertIdx + 1}位置插入循环周期参数`);
        console.log(`   新的items总数: ${hdr.items.length}个`);
        
        // 更新ranges配置以支持超阈值变色
        console.log('\n=== 配置超阈值变色 ===');
        
        hdr.items.forEach(item => {
            if (item.property?.variableId) {
                // 为每个数值项添加范围颜色配置
                item.property.ranges = [
                    { min: 0, max: 80, color: '#ffffff', type: 6 },     // 正常: 白色
                    { min: 80, max: 95, color: '#fbbf24', type: 6 },    // 警告: 黄色
                    { min: 95, max: 99999, color: '#ef4444', type: 6 }  // 危险: 红色
                ];
                
                console.log(`  ✓ ${item.id}: 已配置超阈值变色`);
            }
        });
        
        // 保存更新后的配置
        await new Promise((resolve) => {
            db.run("UPDATE general SET value = ?", [JSON.stringify(general)], () => resolve());
        });
        
        console.log('\n✅ 配置已保存到数据库！');
        console.log('⚠️  请重启FUXA服务使更改生效');
        
    } else {
        console.log('✅ 循环周期参数已存在');
    }
    
    // 输出最终统计
    console.log('\n\n' + '='.repeat(60));
    console.log('【最终Header配置】');
    console.log('='.repeat(60));
    
    console.log(`\n标题: ${hdr.title}`);
    console.log(`背景: ${hdr.bkcolor}`);
    console.log(`参数数量: ${hdr.items?.filter(i => i.property?.variableId).length || 0}个`);
    console.log(`报警: ${hdr.alarms}`);
    console.log(`日期时间: ${hdr.dateTimeDisplay}`);
    console.log(`用户信息: ${hdr.loginInfo}`);
    
    db.close();
});

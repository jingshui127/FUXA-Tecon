const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('_appdata/project.fuxap.db');

db.get("SELECT value FROM views WHERE rowid = 19", (err, row) => {
    const v = JSON.parse(row.value);
    
    // 检查视图的所有顶层属性
    console.log('视图顶层属性:');
    Object.keys(v).forEach(k => {
        if (k !== 'items') {
            const val = v[k];
            if (typeof val === 'object') {
                console.log(`  ${k}: [${typeof val}] keys=${Object.keys(val).slice(0,5).join(',')}`);
            } else {
                console.log(`  ${k}: ${val}`);
            }
        }
    });
    
    // 检查是否有svg字段
    if (v.svg) {
        console.log('\n=== SVG字段存在 ===');
        console.log('svg类型:', typeof v.svg);
        if (typeof v.svg === 'object') {
            console.log('svg keys:', Object.keys(v.svg));
        }
    }
    
    // 检查docProfile
    if (v.docProfile) {
        console.log('\n=== docProfile ===');
        console.log(JSON.stringify(v.docProfile, null, 2));
    }
    
    // 对比一个正常显示的input组件和一个不显示的button
    console.log('\n=== 组件对比 ===');
    const items = v.items || {};
    
    let inputSample = null;
    let btnSample = null;
    
    Object.entries(items).forEach(([key, item]) => {
        if (!inputSample && item.type?.includes('input')) inputSample = { key, ...item };
        if (!btnSample && item.type?.includes('button')) btnSample = { key, ...item };
    });
    
    if (inputSample) {
        console.log('\nInput组件完整结构:');
        console.log(JSON.stringify(inputSample, null, 2));
    }
    
    db.close();
});

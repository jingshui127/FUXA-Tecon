const XLSX = require('xlsx');

const workbook = XLSX.readFile('new260429(1).xls');
const sheetName = 'D0';
const sheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

// 显示前20行的原始数据结构
console.log('=== D0 工作表原始数据（前20行）===');
for (let i = 0; i < Math.min(20, data.length); i++) {
    const row = data[i];
    console.log(`行${i+1}:`);
    for (let j = 0; j < row.length; j++) {
        if (row[j] !== undefined && row[j] !== null && row[j] !== '') {
            console.log(`  列${j+1}: "${row[j]}"`);
        }
    }
    console.log('---');
}

// 显示第7行附近（中子A退区域）
console.log('\n=== 中子A退区域（第60-70行）===');
for (let i = 59; i < Math.min(70, data.length); i++) {
    const row = data[i];
    console.log(`行${i+1}:`);
    for (let j = 0; j < row.length; j++) {
        if (row[j] !== undefined && row[j] !== null && row[j] !== '') {
            console.log(`  列${j+1}: "${row[j]}"`);
        }
    }
    console.log('---');
}

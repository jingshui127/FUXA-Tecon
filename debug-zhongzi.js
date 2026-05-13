const XLSX = require('xlsx');

const workbook = XLSX.readFile('new260429(1).xls');
const sheet = workbook.Sheets['D0'];
const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

// 显示前2行的详细数据（可能包含跨行合并的标签名）
for (let i = 0; i < Math.min(2, data.length); i++) {
    const row = data[i];
    console.log(`=== 第 ${i + 1} 行 ===`);
    if (!row) {
        console.log('(空行)');
        continue;
    }
    
    for (let j = 0; j < row.length; j++) {
        const cell = row[j];
        if (cell !== undefined && cell !== null && cell !== '') {
            const str = cell.toString().trim();
            console.log(`  列${j + 1}: "${str}"`);
        }
    }
    console.log('');
}

// 搜索包含"中子"的所有行
console.log('\n=== 包含"中子"的行 ===');
data.forEach((row, i) => {
    if (row && row.some(cell => cell && cell.toString().includes('中子'))) {
        console.log(`第 ${i + 1} 行:`);
        for (let j = 0; j < row.length; j++) {
            const cell = row[j];
            if (cell !== undefined && cell !== null && cell !== '') {
                const str = cell.toString().trim();
                console.log(`  列${j + 1}: "${str}"`);
            }
        }
        console.log('');
    }
});

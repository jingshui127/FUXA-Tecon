const XLSX = require('xlsx');

const workbook = XLSX.readFile('new260429(1).xls');
const sheet = workbook.Sheets['D0'];
const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

// 查找包含D0654的行
let targetRowIndex = -1;
data.forEach((row, index) => {
    if (row && row.some(cell => cell && cell.toString().trim() === 'D0654')) {
        targetRowIndex = index;
    }
});

console.log(`找到D0654在第 ${targetRowIndex + 1} 行`);
console.log('');

// 显示目标行及其前后各3行的详细数据
for (let i = Math.max(0, targetRowIndex - 3); i <= Math.min(data.length - 1, targetRowIndex + 3); i++) {
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

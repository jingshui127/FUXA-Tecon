const XLSX = require('xlsx');
const path = require('path');

const workbook = XLSX.readFile(path.join(__dirname, '点表', 'new260520.xlsx'));

console.log('=== 检查所有D系列工作表 ===');
['D0', 'D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7'].forEach(name => {
    const sheet = workbook.Sheets[name];
    if (sheet) {
        const range = sheet['!ref'];
        const merges = sheet['!merges'] ? sheet['!merges'].length : 0;
        
        // 统计地址数量
        let addrCount = 0;
        const addrRange = XLSX.utils.decode_range(range);
        for (let r = addrRange.s.r; r <= addrRange.e.r; r++) {
            for (let c = addrRange.s.c; c <= addrRange.e.c; c++) {
                const cell = sheet[XLSX.utils.encode_cell({ r, c })];
                if (cell && cell.v && /^D7\d{3}$/.test(cell.v.toString())) {
                    addrCount++;
                }
            }
        }
        
        console.log(`${name}: 范围=${range}, 合并单元格=${merges}, D7地址数=${addrCount}`);
    } else {
        console.log(`${name}: 不存在`);
    }
});

// 检查D7工作表前几行
console.log('\n=== D7工作表内容 ===');
const sheet = workbook.Sheets['D7'];
if (sheet) {
    const range = sheet['!ref'];
    console.log(`工作表范围: ${range}`);
    
    for (let rowIdx = 0; rowIdx < 15; rowIdx++) {
        const cols = [];
        for (let colIdx = 0; colIdx < 15; colIdx++) {
            const cell = sheet[XLSX.utils.encode_cell({ r: rowIdx, c: colIdx })];
            cols.push(cell ? (cell.v !== undefined ? cell.v : '空') : '空');
        }
        console.log(`行${rowIdx + 1}: ${cols.join(' | ')}`);
    }
}
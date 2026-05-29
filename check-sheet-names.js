const XLSX = require('xlsx');
const path = require('path');

const workbook = XLSX.readFile(path.join(__dirname, '点表', 'new260520.xlsx'));

console.log('=== Excel所有工作表 ===');
console.log(workbook.SheetNames.join('\n'));

console.log('\n=== 检查各D系列工作表的实际地址范围 ===');
workbook.SheetNames.forEach(name => {
    const sheet = workbook.Sheets[name];
    if (!sheet) return;
    
    let dAddrs = [];
    const range = XLSX.utils.decode_range(sheet['!ref']);
    for (let r = range.s.r; r <= range.e.r; r++) {
        for (let c = range.s.c; c <= range.e.c; c++) {
            const cell = sheet[XLSX.utils.encode_cell({ r, c })];
            if (cell && cell.v && /^D\d{4}$/.test(cell.v.toString())) {
                dAddrs.push(cell.v.toString());
            }
        }
    }
    
    if (dAddrs.length > 0) {
        dAddrs.sort();
        const uniqueAddrs = [...new Set(dAddrs)];
        console.log(`${name}: ${uniqueAddrs.length}个不同地址, 范围: ${uniqueAddrs[0]} - ${uniqueAddrs[uniqueAddrs.length-1]}`);
    }
});
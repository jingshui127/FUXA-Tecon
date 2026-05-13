const XLSX = require('xlsx');

const workbook = XLSX.readFile('new260429(1).xls');
const sheet = workbook.Sheets['D0'];
const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

function isValidCell(cell) {
    return cell !== undefined && cell !== null && cell !== '';
}

function isAddress(t) { return /^D\d{4}$/.test(t?.toString().trim()); }
function isType(t) {
    const s = t?.toString().trim();
    return ['压力1','流量1','位置1','时间1','计数1','开始行程1','开始位置1',
            '开始方式1','终止方式1','功能使用1'].includes(s);
}

// === 区域1: D0100-D0120（合模区域）===
console.log('=== 合模区域 D0100-D0120 完整结构 ===\n');
for (let r = 1; r < Math.min(25, data.length); r++) {
    const row = data[r];
    if (!row) continue;
    
    for (let c = 0; c < row.length; c++) {
        const cell = row[c];
        if (isValidCell(cell)) {
            const str = cell.toString().trim();
            if (isAddress(str)) {
                const num = parseInt(str.replace('D',''));
                if (num >= 100 && num <= 120) {
                    // 显示地址及其右边4列的所有内容
                    let detail = `[${str}]`;
                    for (let dc = c + 1; dc < Math.min(c + 5, row.length); dc++) {
                        const dv = row[dc];
                        const ds = isValidCell(dv) ? dv.toString().trim() : '(空)';
                        const tag = isType(ds) ? '<T>' : (isAddress(ds) ? '<A>' : '');
                        detail += ` → [${ds}]${tag}`;
                    }
                    console.log(`  第${r+1}行 列${c+1}: ${detail}`);
                }
            }
        }
    }
}

// === 区域2: D0600-D0640（中子进区域）===
console.log('\n=== 中子进区域 D0600-D0640 完整结构 ===\n');
for (let r = 1; r < Math.min(25, data.length); r++) {
    const row = data[r];
    if (!row) continue;
    
    for (let c = 0; c < row.length; c++) {
        const cell = row[c];
        if (isValidCell(cell)) {
            const str = cell.toString().trim();
            if (isAddress(str)) {
                const num = parseInt(str.replace('D',''));
                if (num >= 600 && num <= 640) {
                    // 显示地址及其左边2列和右边2列
                    let left = '', right = '';
                    if (c >= 2 && isValidCell(row[c-2])) left += `[${row[c-2].toString().trim()}] `;
                    if (c >= 1 && isValidCell(row[c-1])) left += `[${row[c-1].toString().trim()}]`;
                    
                    for (let dc = c + 1; dc < Math.min(c + 3, row.length); dc++) {
                        const dv = row[dc];
                        const ds = isValidCell(dv) ? dv.toString().trim() : '(空)';
                        right += ` → [${ds}]`;
                    }
                    console.log(`  第${r+1}行 列${c+1}: 左={${left}} ${str} 右=${right}`);
                }
            }
        }
    }
}

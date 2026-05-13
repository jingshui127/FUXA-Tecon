const XLSX = require('xlsx');

const workbook = XLSX.readFile('new260429(1).xls');
const sheet = workbook.Sheets['D0'];
const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

function isValidCell(cell) {
    return cell !== undefined && cell !== null && cell !== '';
}

// 类型关键词列表
const TYPE_KEYWORDS = ['压力', '流量', '位置', '时间', '计数', '开始行程', '开始位置', 
                        '开始方式', '终止方式', '功能使用', '设定'];

function isTypeOnly(text) {
    if (!text) return false;
    const str = text.toString().trim();
    return TYPE_KEYWORDS.some(kw => str === kw || str.startsWith(kw));
}

function isAddress(text) {
    return /^D\d{4}$/.test(text?.toString().trim());
}

console.log('=== 图1验证 (D0000-D0009) ===\n');
for (let rowIdx = 0; rowIdx < Math.min(15, data.length); rowIdx++) {
    const row = data[rowIdx];
    if (!row) continue;
    
    for (let colIdx = 0; colIdx < Math.min(10, row.length); colIdx++) {
        const cell = row[colIdx];
        if (isValidCell(cell)) {
            const str = cell.toString().trim();
            if (isAddress(str) && parseInt(str.replace('D','')) <= 9) {
                // 查找右边的值
                let val = '';
                for (let c = colIdx + 1; c < row.length && c < colIdx + 3; c++) {
                    if (isValidCell(row[c])) {
                        val = row[c].toString().trim();
                        break;
                    }
                }
                console.log(`${str} -> ${val}`);
            }
        }
    }
}

console.log('\n=== 图2验证 (D0050-D0070) ===\n');
// 找到包含D0050的行
for (let rowIdx = 0; rowIdx < data.length; rowIdx++) {
    const row = data[rowIdx];
    if (!row) continue;
    
    for (let colIdx = 0; colIdx < row.length; colIdx++) {
        const cell = row[colIdx];
        if (isValidCell(cell) && cell.toString().trim() === 'D0050') {
            // 从这里开始显示
            console.log(`--- 第${rowIdx + 1}行, 列${colIdx + 1}开始 ---`);
            
            // 显示当前行及后续行的D0050-D0070区域
            for (let r = rowIdx; r < Math.min(rowIdx + 15, data.length); r++) {
                const rrow = data[r];
                if (!rrow) continue;
                
                for (let c = 0; c < rrow.length; c++) {
                    const ccell = rrow[c];
                    if (isValidCell(ccell)) {
                        const cstr = ccell.toString().trim();
                        if (isAddress(cstr)) {
                            const addrNum = parseInt(cstr.replace('D',''));
                            if (addrNum >= 50 && addrNum <= 70) {
                                // 查找值
                                let val = '';
                                for (let vc = c + 1; vc < rrow.length && vc < c + 3; vc++) {
                                    if (isValidCell(rrow[vc])) {
                                        val = rrow[vc].toString().trim();
                                        break;
                                    }
                                }
                                console.log(`  ${cstr} [第${r+1}行列${c+1}] -> "${val}"`);
                            }
                        }
                    }
                }
            }
            break;
        }
    }
}

console.log('\n=== 图3验证 (D0100-D0130) ===\n');
// 找到包含D0100的行
for (let rowIdx = 0; rowIdx < data.length; rowIdx++) {
    const row = data[rowIdx];
    if (!row) continue;
    
    for (let colIdx = 0; colIdx < row.length; colIdx++) {
        const cell = row[colIdx];
        if (isValidCell(cell) && cell.toString().trim() === 'D0100') {
            console.log(`--- 第${rowIdx + 1}行, 列${colIdx + 1}开始 ---`);
            
            // 显示D0100-D0130区域的完整结构
            for (let r = rowIdx; r < Math.min(rowIdx + 20, data.length); r++) {
                const rrow = data[r];
                if (!rrow) continue;
                
                for (let c = 0; c < rrow.length; c++) {
                    const ccell = rrow[c];
                    if (isValidCell(ccell)) {
                        const cstr = ccell.toString().trim();
                        if (isAddress(cstr)) {
                            const addrNum = parseInt(cstr.replace('D',''));
                            if (addrNum >= 100 && addrNum <= 130) {
                                let val = '';
                                for (let vc = c + 1; vc < rrow.length && vc < c + 3; vc++) {
                                    if (isValidCell(rrow[vc])) {
                                        val = rrow[vc].toString().trim();
                                        break;
                                    }
                                }
                                const typeTag = isTypeOnly(val) ? ' [类型]' : ' [主标签]';
                                console.log(`  ${cstr} [第${r+1}行列${c+1}] -> "${val}"${typeTag}`);
                            }
                        }
                    }
                }
            }
            break;
        }
    }
}

console.log('\n=== D0650-D0700区域（中子相关）===\n');
for (let rowIdx = 0; rowIdx < data.length; rowIdx++) {
    const row = data[rowIdx];
    if (!row) continue;
    
    let found = false;
    for (let colIdx = 0; colIdx < row.length; colIdx++) {
        const cell = row[colIdx];
        if (isValidCell(cell)) {
            const str = cell.toString().trim();
            if (isAddress(str)) {
                const addrNum = parseInt(str.replace('D',''));
                if (addrNum >= 650 && addrNum <= 700) {
                    if (!found) {
                        console.log(`--- 第${rowIdx + 1}行 ---`);
                        found = true;
                    }
                    let val = '';
                    for (let vc = colIdx + 1; vc < row.length && vc < colIdx + 3; vc++) {
                        if (isValidCell(row[vc])) {
                            val = row[vc].toString().trim();
                            break;
                        }
                    }
                    const typeTag = isTypeOnly(val) ? ' [类型]' : ' [主标签]';
                    console.log(`  ${str} [列${colIdx + 1}] -> "${val}"${typeTag}`);
                }
            }
        }
    }
}

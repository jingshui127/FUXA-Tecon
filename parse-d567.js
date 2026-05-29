const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const WORKSHEET_CONFIG = {
    'D5': { minAddr: 5000, maxAddr: 5999, name: 'D5' },
    'D6': { minAddr: 6000, maxAddr: 6999, name: 'D6' },
    'D7': { minAddr: 7000, maxAddr: 7999, name: 'D7' }
};

function isValidCell(cell) {
    return cell !== undefined && cell !== null && cell !== '';
}

function isAddress(text) {
    if (!text) return false;
    return /^D\d{4}$/.test(text.toString().trim());
}

function validateAddress(addr, worksheetName) {
    if (!isAddress(addr)) return false;
    const config = WORKSHEET_CONFIG[worksheetName];
    if (!config) return false;
    
    const addrNum = parseInt(addr.replace('D', ''));
    return addrNum >= config.minAddr && addrNum <= config.maxAddr;
}

function parseWorksheet(workbook, sheetName) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) return null;
    
    const merges = sheet['!merges'] || [];
    const config = WORKSHEET_CONFIG[sheetName];
    
    function isVerticalMerge2(rowIdx, colIdx) {
        for (const m of merges) {
            if (rowIdx >= m.s.r && rowIdx <= m.e.r &&
                colIdx >= m.s.c && colIdx <= m.e.c &&
                m.e.r - m.s.r === 1) {
                return true;
            }
        }
        return false;
    }
    
    function getCategoryForRow(rowIdx, colIdx) {
        for (const m of merges) {
            if (m.s.c === colIdx && m.e.c === colIdx && m.s.r !== m.e.r) {
                if (rowIdx >= m.s.r && rowIdx <= m.e.r) {
                    const topLeftCell = sheet[XLSX.utils.encode_cell({ r: m.s.r, c: m.s.c })];
                    if (topLeftCell && isValidCell(topLeftCell.v)) {
                        return topLeftCell.v.toString().trim();
                    }
                }
            }
        }
        return '';
    }
    
    function getCellValue(rowIdx, colIdx) {
        const cell = sheet[XLSX.utils.encode_cell({ r: rowIdx, c: colIdx })];
        if (cell && isValidCell(cell.v)) {
            return cell.v.toString().trim();
        }
        
        for (const m of merges) {
            if (rowIdx >= m.s.r && rowIdx <= m.e.r &&
                colIdx >= m.s.c && colIdx <= m.e.c) {
                const topLeftCell = sheet[XLSX.utils.encode_cell({ r: m.s.r, c: m.s.c })];
                if (topLeftCell && isValidCell(topLeftCell.v)) {
                    return topLeftCell.v.toString().trim();
                }
            }
        }
        
        return '';
    }
    
    const allEntries = [];
    const tagNames = new Set();
    const processedAddrNums = new Set();
    const range = XLSX.utils.decode_range(sheet['!ref']);
    
    for (let rowIdx = range.s.r; rowIdx <= range.e.r; rowIdx++) {
        for (let colIdx = range.s.c; colIdx <= range.e.c; colIdx++) {
            const addr = getCellValue(rowIdx, colIdx);
            
            if (!validateAddress(addr, sheetName)) continue;
            
            const addrNum = parseInt(addr.replace('D', ''));
            if (processedAddrNums.has(addrNum)) continue;
    
            const right1 = getCellValue(rowIdx, colIdx + 1);
            const right2 = getCellValue(rowIdx, colIdx + 2);
            const right3 = getCellValue(rowIdx, colIdx + 3);
            
            let category = '';
            let paramValue = '';
            let paramColIdx = -1;
            
            if (right1 && !isAddress(right1) && right2 && !isAddress(right2) && right3 && isAddress(right3)) {
                category = right1;
                paramValue = right2;
                paramColIdx = colIdx + 2;
            }
            else if (right1 && !isAddress(right1)) {
                paramValue = right1;
                paramColIdx = colIdx + 1;
                category = getCategoryForRow(rowIdx, colIdx - 1);
            }
            else if (!right1 && right2 && !isAddress(right2) && right3 && isAddress(right3)) {
                paramValue = right2;
                paramColIdx = colIdx + 2;
                category = getCategoryForRow(rowIdx, colIdx - 1);
            }
            
            if (!paramValue) continue;
    
            let varName = paramValue;
            if (category && category !== paramValue) {
                varName = category + paramValue;
            }
    
            let type = 'ushort';
            let wordCount = 1;
            
            if (isVerticalMerge2(rowIdx, paramColIdx)) {
                type = 'int';
                wordCount = 2;
                processedAddrNums.add(addrNum + 1);
            }
    
            let uniqueName = varName;
            let counter = 1;
            while (tagNames.has(uniqueName)) {
                uniqueName = varName + '_' + counter;
                counter++;
            }
            tagNames.add(uniqueName);
    
            allEntries.push({
                originalAddr: addr,
                addrNum: addrNum,
                row: rowIdx + 1,
                col: colIdx + 1,
                name: uniqueName,
                type: type,
                wordCount: wordCount
            });
        }
    }
    
    allEntries.sort((a, b) => a.addrNum - b.addrNum);
    
    return allEntries;
}

const workbook = XLSX.readFile(path.join(__dirname, '点表', 'new260520.xlsx'));

// 处理D5
console.log('=== 处理D5 ===');
const d5Entries = parseWorksheet(workbook, 'D5');
if (d5Entries) {
    const csvHeader = '工作表,行,列,原始地址(HMI),Modbus地址(0-based),FUXA地址(1-based),标签名,类型,字数';
    const csvRows = d5Entries.map(tag => {
        const modbusAddr0 = tag.originalAddr.replace(/[A-Za-z]/g, '');
        const fuxaAddr = '4X' + (tag.addrNum + 1);
        return `D5,${tag.row},${tag.col},${tag.originalAddr},4x${modbusAddr0},${fuxaAddr},"${tag.name}",${tag.type},${tag.wordCount}字`;
    });
    const csvContent = [csvHeader, ...csvRows].join('\n');
    fs.writeFileSync(path.join(__dirname, '点表', 'plc-tags-D5.csv'), csvContent, 'utf8');
    console.log(`D5解析完成: ${d5Entries.length}条, ushort:${d5Entries.filter(t=>t.type==='ushort').length}条, int:${d5Entries.filter(t=>t.type==='int').length}条`);
}

// 处理D6
console.log('=== 处理D6 ===');
const d6Entries = parseWorksheet(workbook, 'D6');
if (d6Entries) {
    const csvHeader = '工作表,行,列,原始地址(HMI),Modbus地址(0-based),FUXA地址(1-based),标签名,类型,字数';
    const csvRows = d6Entries.map(tag => {
        const modbusAddr0 = tag.originalAddr.replace(/[A-Za-z]/g, '');
        const fuxaAddr = '4X' + (tag.addrNum + 1);
        return `D6,${tag.row},${tag.col},${tag.originalAddr},4x${modbusAddr0},${fuxaAddr},"${tag.name}",${tag.type},${tag.wordCount}字`;
    });
    const csvContent = [csvHeader, ...csvRows].join('\n');
    fs.writeFileSync(path.join(__dirname, '点表', 'plc-tags-D6.csv'), csvContent, 'utf8');
    console.log(`D6解析完成: ${d6Entries.length}条, ushort:${d6Entries.filter(t=>t.type==='ushort').length}条, int:${d6Entries.filter(t=>t.type==='int').length}条`);
}

// 处理D7
console.log('=== 处理D7 ===');
const d7Entries = parseWorksheet(workbook, 'D7');
if (d7Entries) {
    const csvHeader = '工作表,行,列,原始地址(HMI),Modbus地址(0-based),FUXA地址(1-based),标签名,类型,字数';
    const csvRows = d7Entries.map(tag => {
        const modbusAddr0 = tag.originalAddr.replace(/[A-Za-z]/g, '');
        const fuxaAddr = '4X' + (tag.addrNum + 1);
        return `D7,${tag.row},${tag.col},${tag.originalAddr},4x${modbusAddr0},${fuxaAddr},"${tag.name}",${tag.type},${tag.wordCount}字`;
    });
    const csvContent = [csvHeader, ...csvRows].join('\n');
    fs.writeFileSync(path.join(__dirname, '点表', 'plc-tags-D7.csv'), csvContent, 'utf8');
    console.log(`D7解析完成: ${d7Entries.length}条, ushort:${d7Entries.filter(t=>t.type==='ushort').length}条, int:${d7Entries.filter(t=>t.type==='int').length}条`);
}

console.log('\n=== 全部完成 ===');
console.log('输出文件: 点表/plc-tags-D5.csv, plc-tags-D6.csv, plc-tags-D7.csv');
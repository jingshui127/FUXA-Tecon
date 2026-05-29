const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

// 通用解析器配置
const WORKSHEET_CONFIG = {
    'D0': { minAddr: 0, maxAddr: 999, name: 'D0' },
    'D1': { minAddr: 1000, maxAddr: 1999, name: 'D1' },
    'D2': { minAddr: 2000, maxAddr: 2999, name: 'D2' },
    'D3': { minAddr: 3000, maxAddr: 3999, name: 'D3' },
    'D4': { minAddr: 4000, maxAddr: 4999, name: 'D4' },
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

function parseWorksheet(workbook, worksheetName) {
    const sheet = workbook.Sheets[worksheetName];
    if (!sheet) {
        console.error(`工作表 ${worksheetName} 不存在`);
        return null;
    }
    
    const merges = sheet['!merges'] || [];
    
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
    const processedAddrs = new Set();
    const range = XLSX.utils.decode_range(sheet['!ref']);
    const categoryByColGroup = {};
    
    for (let rowIdx = range.s.r; rowIdx <= range.e.r; rowIdx++) {
        for (let colIdx = range.s.c; colIdx <= range.e.c; colIdx++) {
            const addr = getCellValue(rowIdx, colIdx);
            
            if (!validateAddress(addr, worksheetName)) continue;
            if (processedAddrs.has(addr)) continue;
    
            const addrNum = parseInt(addr.replace('D', ''));
    
            const right1 = getCellValue(rowIdx, colIdx + 1);
            const right2 = getCellValue(rowIdx, colIdx + 2);
            const right3 = getCellValue(rowIdx, colIdx + 3);
            
            let category = '';
            let paramValue = '';
            let paramColIdx = -1;
            
            if (isAddress(right2) && isAddress(right3)) {
                continue;
            } else if (isAddress(right2)) {
                paramValue = right1;
                paramColIdx = colIdx + 1;
            } else if (right2) {
                category = right1;
                paramValue = right2;
                paramColIdx = colIdx + 2;
            } else {
                if (isAddress(right3)) {
                    category = right1;
                    paramValue = '';
                } else {
                    paramValue = right1;
                    paramColIdx = colIdx + 1;
                }
            }
    
            const colGroupKey = Math.floor(colIdx / 3);
            if (!category && categoryByColGroup[colGroupKey]) {
                category = categoryByColGroup[colGroupKey];
            }
            
            if (category) {
                categoryByColGroup[colGroupKey] = category;
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
                processedAddrs.add('D' + (addrNum + 1));
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

// 解析D0工作表
const workbook = XLSX.readFile(path.join(__dirname, '点表', 'new260520.xlsx'));
const entries = parseWorksheet(workbook, 'D0');

if (entries) {
    const csvHeader = '工作表,行,列,原始地址(HMI),Modbus地址(0-based),FUXA地址(1-based),标签名,类型,字数';
    const csvRows = entries.map(tag => {
        const modbusAddr0 = tag.originalAddr.replace(/[A-Za-z]/g, '');
        const fuxaAddr = '4X' + (tag.addrNum + 1);
        return `D0,${tag.row},${tag.col},${tag.originalAddr},4x${modbusAddr0},${fuxaAddr},"${tag.name}",${tag.type},${tag.wordCount}字`;
    });
    
    const csvContent = [csvHeader, ...csvRows].join('\n');
    fs.writeFileSync(path.join(__dirname, '点表', 'plc-tags-D0.csv'), csvContent, 'utf8');
    
    console.log(`D0工作表解析完成，共生成 ${entries.length} 条标签`);
    console.log('输出文件: 点表/plc-tags-D0.csv');
    
    // 显示部分解析结果
    console.log('\n=== 前30条解析结果 ===');
    entries.slice(0, 30).forEach((tag, idx) => {
        console.log(`${idx + 1}. ${tag.originalAddr} - ${tag.name} (${tag.type}, ${tag.wordCount}字)`);
    });
    
    // 统计
    console.log('\n=== 数据类型统计 ===');
    const typeCount = {};
    entries.forEach(tag => {
        typeCount[tag.type] = (typeCount[tag.type] || 0) + 1;
    });
    Object.keys(typeCount).forEach(type => {
        console.log(`${type}: ${typeCount[type]}条`);
    });
    
    // 地址范围统计
    console.log('\n=== 地址范围统计 ===');
    const addrRanges = {};
    entries.forEach(tag => {
        const range = Math.floor(tag.addrNum / 50) * 50;
        const rangeKey = `D${range.toString().padStart(4, '0')}-D${(range + 49).toString().padStart(4, '0')}`;
        addrRanges[rangeKey] = (addrRanges[rangeKey] || 0) + 1;
    });
    Object.keys(addrRanges).forEach(range => {
        console.log(`${range}: ${addrRanges[range]}条`);
    });
}
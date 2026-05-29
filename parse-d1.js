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

// D1工作表专用解析器
function parseD1Worksheet(workbook) {
    const sheet = workbook.Sheets['D1'];
    if (!sheet) return null;
    
    const merges = sheet['!merges'] || [];
    
    // 检查单元格是否是垂直合并单元格（跨2行）
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
    
    // 检查单元格是否在指定列的合并范围内
    function getCategoryForRow(rowIdx, colIdx) {
        for (const m of merges) {
            // 检查是否是垂直合并的分类单元格
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
            
            if (!validateAddress(addr, 'D1')) continue;
            
            const addrNum = parseInt(addr.replace('D', ''));
            if (processedAddrNums.has(addrNum)) continue;
    
            const right1 = getCellValue(rowIdx, colIdx + 1);
            const right2 = getCellValue(rowIdx, colIdx + 2);
            const right3 = getCellValue(rowIdx, colIdx + 3);
            
            let category = '';
            let paramValue = '';
            let paramColIdx = -1;
            
            // D1工作表的特殊情况：
            
            // 情况1: 3列结构（地址 + 分类 + 参数）
            if (right1 && !isAddress(right1) && right2 && !isAddress(right2) && right3 && isAddress(right3)) {
                category = right1;
                paramValue = right2;
                paramColIdx = colIdx + 2;
            }
            // 情况2: 2列结构（地址 + 参数）
            else if (right1 && !isAddress(right1)) {
                paramValue = right1;
                paramColIdx = colIdx + 1;
                // 尝试从左边的列获取分类（检查是否在合并范围内）
                category = getCategoryForRow(rowIdx, colIdx - 1);
            }
            // 情况3: 地址 + 空 + 参数结构
            else if (!right1 && right2 && !isAddress(right2) && right3 && isAddress(right3)) {
                paramValue = right2;
                paramColIdx = colIdx + 2;
                // 尝试从左边的列获取分类（检查是否在合并范围内）
                category = getCategoryForRow(rowIdx, colIdx - 1);
            }
            
            // 如果参数值为空，跳过
            if (!paramValue) continue;
    
            // 组合变量名
            let varName = paramValue;
            if (category && category !== paramValue) {
                varName = category + paramValue;
            }
    
            // 判断类型
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

// 解析D1工作表
const workbook = XLSX.readFile(path.join(__dirname, '点表', 'new260520.xlsx'));
const entries = parseD1Worksheet(workbook);

if (entries) {
    const csvHeader = '工作表,行,列,原始地址(HMI),Modbus地址(0-based),FUXA地址(1-based),标签名,类型,字数';
    const csvRows = entries.map(tag => {
        const modbusAddr0 = tag.originalAddr.replace(/[A-Za-z]/g, '');
        const fuxaAddr = '4X' + (tag.addrNum + 1);
        return `D1,${tag.row},${tag.col},${tag.originalAddr},4x${modbusAddr0},${fuxaAddr},"${tag.name}",${tag.type},${tag.wordCount}字`;
    });
    
    const csvContent = [csvHeader, ...csvRows].join('\n');
    fs.writeFileSync(path.join(__dirname, '点表', 'plc-tags-D1.csv'), csvContent, 'utf8');
    
    console.log(`D1工作表解析完成，共生成 ${entries.length} 条标签`);
    console.log('输出文件: 点表/plc-tags-D1.csv');
    
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
}
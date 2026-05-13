const XLSX = require('xlsx');

function getSheetData(workbook, sheetName) {
    const sheet = workbook.Sheets[sheetName];
    return XLSX.utils.sheet_to_json(sheet, { header: 1 });
}

function isValidCell(cell) {
    return cell !== undefined && cell !== null && cell !== '';
}

const TYPE_WORDS = new Set([
    '压力','流量','位置','时间','计数',
    '开始行程','开始位置','开始方式','终止方式','功能使用',
    '设定','上限','下限'
]);

function isTypeIndicator(text) {
    if (!text) return false;
    const s = text.toString().trim();
    return TYPE_WORDS.has(s);
}

function isFullType(text) {
    if (!text) return false;
    const s = text.toString().trim();
    return /^(压力|流量|位置|时间|计数|开始行程|开始位置|开始方式|终止方式|功能使用|设定)\d+$/.test(s)
        || /^(上限|下限)\d+$/.test(s);
}

function isAddress(text) {
    if (!text) return false;
    return /^D\d{4}$/.test(text.toString().trim());
}

function collectRightCells(row, startCol) {
    const cells = [];
    for (let rc = startCol; rc < Math.min(startCol + 5, row.length); rc++) {
        const rCell = row[rc];
        if (!isValidCell(rCell)) continue;
        const rStr = rCell.toString().trim();
        if (isAddress(rStr)) break;
        cells.push(rStr);
    }
    return cells;
}

function parseDSheet(sheetName, jsonData) {
    const allEntries = [];
    const colMainLabel = {};

    for (let rowIndex = 0; rowIndex < jsonData.length; rowIndex++) {
        const row = jsonData[rowIndex];
        if (!row || rowIndex === 0) continue;

        for (let colIdx = 0; colIdx < row.length; colIdx++) {
            const cell = row[colIdx];
            if (!isValidCell(cell)) continue;
            const str = cell.toString().trim();
            if (!isAddress(str)) continue;

            const addrNum = parseInt(str.replace('D', ''));

            const rightCells = collectRightCells(row, colIdx + 1);

            if (rightCells.length === 0) {
                continue;
            }

            let mainLabel = '';
            let typeName = '';
            for (const rc of rightCells) {
                if (isFullType(rc)) {
                    typeName = rc;
                } else if (rc.length >= 2) {
                    mainLabel = rc;
                }
            }

            if (mainLabel) {
                colMainLabel[colIdx] = mainLabel;
            }

            if (!mainLabel && !typeName) {
                continue;
            }

            if (!mainLabel) {
                mainLabel = colMainLabel[colIdx] || '';
            }

            let varName = '';
            if (mainLabel && typeName) {
                varName = mainLabel + typeName;
            } else if (mainLabel && !typeName) {
                varName = mainLabel;
            } else if (!mainLabel && typeName) {
                varName = typeName;
            } else {
                continue;
            }

            allEntries.push({
                originalAddr: str,
                addrNum: addrNum,
                row: rowIndex + 1,
                col: colIdx + 1,
                varName: varName,
                typeName: typeName
            });
        }
    }

    allEntries.sort((a, b) => a.addrNum - b.addrNum);

    const tags = [];
    const tagNames = new Set();

    for (const entry of allEntries) {
        const isPosition = entry.typeName && entry.typeName.includes('位置');
        const wordCount = isPosition ? 2 : 1;
        const dataType = wordCount === 2 ? 'Int32' : 'UInt';

        const modbusAddr = entry.addrNum + 1;

        let uniqueName = entry.varName;
        let counter = 1;
        while (tagNames.has(uniqueName)) {
            uniqueName = entry.varName + '_' + counter;
            counter++;
        }
        tagNames.add(uniqueName);

        tags.push({
            row: entry.row,
            col: entry.col,
            originalAddr: entry.originalAddr,
            fuxaAddr: '4X' + modbusAddr,
            name: uniqueName,
            type: dataType,
            sheet: sheetName,
            wordCount: wordCount
        });
    }

    return tags;
}

// === 执行：处理所有工作表 ===
const workbook = XLSX.readFile('new260429(1).xls');
const fs = require('fs');

const SHEET_NAMES = ['D0', 'D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'MD'];
const csvHeader = '工作表,行,列,原始地址(HMI),Modbus地址(0-based),FUXA地址(1-based),标签名,类型,字数';

let totalTags = 0;
let totalMultiWord = 0;

SHEET_NAMES.forEach(sheetName => {
    if (!workbook.Sheets[sheetName]) {
        console.log(sheetName + ': 工作表不存在，跳过');
        return;
    }

    const data = getSheetData(workbook, sheetName);
    const tags = parseDSheet(sheetName, data);

    const csvRows = tags.map(tag => {
        const modbusAddr0 = tag.originalAddr.replace(/[A-Za-z]/g, '');
        return tag.sheet + ',' + tag.row + ',' + tag.col + ',' + tag.originalAddr + ',4x' + modbusAddr0 + ',' + tag.fuxaAddr + ',"' + tag.name + '",' + tag.type + ',' + tag.wordCount + '字';
    });

    const filename = 'plc-tags-' + sheetName + '.csv';
    fs.writeFileSync(filename, [csvHeader, ...csvRows].join('\n'));

    const multiWord = tags.filter(t => t.wordCount > 1);
    totalTags += tags.length;
    totalMultiWord += multiWord.length;

    console.log(sheetName + ': ' + tags.length + ' 条标签 (' + multiWord.length + ' 个Int32) → ' + filename);
});

console.log('\n总计: ' + totalTags + ' 条标签 (' + totalMultiWord + ' 个Int32)');

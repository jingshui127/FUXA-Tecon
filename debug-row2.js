const XLSX = require('xlsx');

const workbook = XLSX.readFile('new260429(1).xls');
const sheet = workbook.Sheets['D0'];
const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

console.log('=== 第2行完整数据（标签-类型-地址列组分析）===\n');
const row = data[1];
for (let j = 0; j < row.length; j++) {
    const cell = row[j];
    if (cell !== undefined && cell !== null && cell !== '') {
        const str = cell.toString().trim();
        const isAddr = /^D\d{4}$/.test(str);
        const isType = ['压力1','压力2','流量1','流量2','位置1','位置2','时间1','时间2','计数1','计数2',
            '开始行程1','开始位置1','开始方式1','终止方式1','功能使用1',
            '设定1','设定2','设定3','设定4','设定5','设定6','设定7','设定8','设定9','设定10','设定11',
            '上限9','下限7'].includes(str);
        const tag = isAddr ? ' [地址]' : isType ? ' [类型]' : ' [标签]';
        console.log(`  列${j + 1}: "${str}"${tag}`);
    }
}

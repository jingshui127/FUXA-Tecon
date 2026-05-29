const fs = require('fs');
const path = require('path');

const csvFiles = [
    'plc-tags-D0.csv',
    'plc-tags-D1.csv',
    'plc-tags-D2.csv',
    'plc-tags-D3.csv',
    'plc-tags-D4.csv',
    'plc-tags-D5.csv',
    'plc-tags-D6.csv',
    'plc-tags-D7.csv'
];

csvFiles.forEach(fileName => {
    const filePath = path.join('C:\\Users\\13971\\Downloads\\FUXA-master\\点表', fileName);
    if (!fs.existsSync(filePath)) {
        console.log(`跳过(不存在): ${fileName}`);
        return;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    // 替换类型列中的int为int32（类型在第7列，格式为,int,）
    content = content.replace(/,int,/g, ',int32,');
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`已修改: ${fileName}`);
});

console.log('\n完成！');
const { FUXAClient } = require('./.trae/skills/fuxa-automation/references/fuxa-cli');

async function main() {
  const client = new FUXAClient({
    url: 'http://127.0.0.1:50000'
  });

  console.log('正在连接 FUXA 服务器...');

  try {
    const devices = await client.getDevices();
    console.log('✓ 连接成功！当前设备列表：', Object.keys(devices));
    console.log('');

    console.log('正在读取 Modbus 标签数据...');
    console.log('');

    const tagIds = ['t_temp', 't_humi'];
    const values = await client.getTagValue(tagIds);
    
    console.log('===== 标签数据 =====');
    console.log(JSON.stringify(values, null, 2));

  } catch (error) {
    console.error('✗ 错误：', error.message);
  }
}

main();

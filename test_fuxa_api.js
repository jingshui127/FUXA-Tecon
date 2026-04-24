const { FUXAClient } = require('./.trae/skills/fuxa-automation/references/fuxa-cli');

async function main() {
  const client = new FUXAClient({
    url: 'http://127.0.0.1:50000'
  });

  console.log('正在连接 FUXA 服务器...');

  try {
    const devices = await client.getDevices();
    console.log('✓ 连接成功！当前设备列表：', Object.keys(devices));

    console.log('正在创建 Modbus TCP 设备...');

    await client.setDevice({
      id: 'd_modbus_01',
      name: 'Modbus PLC',
      type: 'ModbusTCP',
      enabled: true,
      polling: 1000,
      property: {
        address: '192.168.1.100',
        port: '502',
        slaveid: '1'
      },
      tags: {
        't_temp': {
          id: 't_temp',
          name: '温度',
          type: 'UInt16',
          memaddress: '400001',
          address: '1'
        },
        't_humi': {
          id: 't_humi',
          name: '湿度',
          type: 'Int16',
          memaddress: '400002',
          address: '1'
        }
      }
    });

    console.log('✓ 设备创建成功！');
    console.log('');
    console.log('设备配置：');
    console.log('  - 设备名称：Modbus PLC');
    console.log('  - 设备类型：ModbusTCP');
    console.log('  - IP 地址：192.168.1.100');
    console.log('  - 端口：502');
    console.log('  - 从站 ID：1');
    console.log('  - 轮询间隔：1000ms');
    console.log('');
    console.log('标签列表：');
    console.log('  - t_temp (温度): UInt16, 寄存器 400001');
    console.log('  - t_humi (湿度): Int16, 寄存器 400002');

  } catch (error) {
    console.error('✗ 错误：', error.message);
  }
}

main();

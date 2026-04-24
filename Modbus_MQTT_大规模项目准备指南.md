# Modbus TCP + MQTT 大规模项目准备指南

## 项目规模：上千个数据点

## 1. 架构设计

### 1.1 设备分层

**建议设备数量分配**：
- **Modbus TCP 设备**：每台设备控制 50-100 个点
- **MQTT 设备**：按功能或区域分组，每组 20-50 个设备

**设备命名规范**：
```
d_[协议]_[区域]_[编号]
例如：d_modbus_production_01, d_mqtt_warehouse_02
```

### 1.2 标签分层

**标签命名规范**：
```
t_[设备ID]_[功能]_[编号]
例如：t_d_modbus_production_01_temp_01
```

**标签分组**：
- 按设备功能分组
- 按数据类型分组（温度、压力、流量等）
- 按重要性分组（关键参数、一般参数）

## 2. 性能优化

### 2.1 Modbus TCP 优化

**轮询间隔**：
- 关键参数：200-500ms
- 一般参数：1000-3000ms
- 次要参数：5000-10000ms

**连接设置**：
- 启用连接池
- 设置合理的超时时间（3-5秒）
- 批量读写（每次最多 125 个寄存器）

### 2.2 MQTT 优化

**消息策略**：
- 使用 QoS 1 确保消息送达
- 合理设置消息保留策略
- 避免重复主题

**订阅管理**：
- 按层级订阅（如 `factory/floor1/#`）
- 使用通配符减少订阅数量
- 定期清理无效订阅

### 2.3 系统资源

**FUXA 服务器配置**：
- CPU：至少 4 核
- 内存：至少 8GB
- 存储：SSD 硬盘
- 网络：千兆网卡

**数据存储**：
- 启用数据压缩
- 设置合理的历史数据保留期
- 考虑使用外部数据库（如 InfluxDB）

## 3. 批量操作工具

### 3.1 批量创建设备

```javascript
const { FUXAClient } = require('./.trae/skills/fuxa-automation/references/fuxa-cli');

async function createModbusDevices() {
  const client = new FUXAClient({ url: 'http://localhost:1881' });
  await client.login('admin', 'password');

  // 批量创建 20 台 Modbus 设备，每台 50 个点
  const devices = [];
  for (let i = 1; i <= 20; i++) {
    const deviceId = `d_modbus_production_${i.toString().padStart(2, '0')}`;
    const tags = {};
    
    // 为每台设备创建 50 个标签
    for (let j = 1; j <= 50; j++) {
      tags[`t_${deviceId}_temp_${j.toString().padStart(2, '0')}`] = 
        FUXAClient.createModbusTag({
          id: `t_${deviceId}_temp_${j.toString().padStart(2, '0')}`,
          name: `温度 ${j}`,
          type: 'Float32',
          memaddress: `400${j.toString().padStart(3, '0')}`,
          address: j.toString()
        });
    }

    devices.push(FUXAClient.createModbusTCP({
      id: deviceId,
      name: `生产设备 ${i}`,
      address: `192.168.1.${100 + i}`,
      port: 502,
      slaveId: 1,
      polling: 1000,
      tags: tags
    }));
  }

  const results = await client.setDevices(devices);
  console.log('批量创建设备结果:', results);
}

createModbusDevices();
```

### 3.2 批量创建 MQTT 设备

```javascript
async function createMQTTDevices() {
  const client = new FUXAClient({ url: 'http://localhost:1881' });
  await client.login('admin', 'password');

  // 批量创建 10 组 MQTT 设备，每组 30 个设备
  const devices = [];
  for (let i = 1; i <= 10; i++) {
    const deviceId = `d_mqtt_group_${i.toString().padStart(2, '0')}`;
    
    devices.push(FUXAClient.createMQTT({
      id: deviceId,
      name: `MQTT 组 ${i}`,
      broker: 'mqtt://localhost:1883',
      clientId: `fuxa_group_${i}`,
      topics: [
        `factory/group${i}/#`,
        `sensors/group${i}/#`
      ],
      polling: 500
    }));
  }

  const results = await client.setDevices(devices);
  console.log('批量创建 MQTT 设备结果:', results);
}

createMQTTDevices();
```

## 4. 监控与报警

### 4.1 批量配置报警

```javascript
async function createAlarms() {
  const client = new FUXAClient({ url: 'http://localhost:1881' });
  await client.login('admin', 'password');

  const alarms = [];
  // 为每个温度标签创建高低限报警
  for (let i = 1; i <= 20; i++) {
    const deviceId = `d_modbus_production_${i.toString().padStart(2, '0')}`;
    for (let j = 1; j <= 50; j++) {
      const tagId = `t_${deviceId}_temp_${j.toString().padStart(2, '0')}`;
      
      // 高温报警
      alarms.push({
        id: `alarm_${tagId}_high`,
        name: `温度 ${j} 高报警`,
        device: deviceId,
        tag: tagId,
        type: 'high',
        limit: 80,
        deadband: 1,
        text: `温度超过 80°C`,
        ackMode: 'alarm.ack-float'
      });
      
      // 低温报警
      alarms.push({
        id: `alarm_${tagId}_low`,
        name: `温度 ${j} 低报警`,
        device: deviceId,
        tag: tagId,
        type: 'low',
        limit: 0,
        deadband: 1,
        text: `温度低于 0°C`,
        ackMode: 'alarm.ack-float'
      });
    }
  }

  const results = await client.setAlarmDefinitions(alarms);
  console.log('批量创建报警结果:', results);
}

createAlarms();
```

### 4.2 设备状态监控

```javascript
async function monitorDeviceStatus() {
  const client = new FUXAClient({ url: 'http://localhost:1881' });
  await client.login('admin', 'password');

  setInterval(async () => {
    const statusList = await client.getAllDeviceConnectionStatus();
    const offlineDevices = statusList.filter(device => device.statusText === '离线');
    
    if (offlineDevices.length > 0) {
      console.log('离线设备:', offlineDevices.map(d => d.deviceName));
      // 这里可以添加通知逻辑
    }
  }, 60000); // 每分钟检查一次
}

monitorDeviceStatus();
```

## 5. 数据管理

### 5.1 历史数据配置

**DAQ 配置建议**：
- 关键参数：1-5 秒采集一次
- 一般参数：10-30 秒采集一次
- 次要参数：1-5 分钟采集一次

**数据压缩**：
- 启用死区压缩（deadband）
- 设置合理的压缩阈值（如 0.5%）

### 5.2 数据查询优化

```javascript
async function queryHistoryData() {
  const client = new FUXAClient({ url: 'http://localhost:1881' });
  await client.login('admin', 'password');

  const from = new Date(Date.now() - 24*60*60*1000).toISOString(); // 24小时
  const to = new Date().toISOString();
  
  // 批量查询标签数据
  const tagIds = [];
  for (let i = 1; i <= 5; i++) { // 一次查询 5 台设备的关键标签
    const deviceId = `d_modbus_production_${i.toString().padStart(2, '0')}`;
    tagIds.push(`t_${deviceId}_temp_01`); // 每台设备的第一个温度标签
  }

  const data = await client.getDaqData(from, to, tagIds);
  console.log('历史数据查询结果:', data);
}

queryHistoryData();
```

## 6. 故障排查

### 6.1 常见问题及解决方案

| 问题 | 可能原因 | 解决方案 |
|------|---------|----------|
| Modbus 连接超时 | 网络问题、设备离线 | 检查网络连接、增加超时时间 |
| MQTT 消息丢失 | 网络不稳定、QoS 级别低 | 使用 QoS 1 或 2、检查网络 |
| 系统响应缓慢 | 轮询间隔过短、标签数量过多 | 调整轮询间隔、优化标签分组 |
| 历史数据存储不足 | 存储容量不足、采集频率过高 | 增加存储、调整采集频率 |
| 报警风暴 | 报警阈值设置不合理 | 调整报警阈值和死区 |

### 6.2 性能监控

```javascript
async function monitorSystemPerformance() {
  const client = new FUXAClient({ url: 'http://localhost:1881' });
  await client.login('admin', 'password');

  setInterval(async () => {
    try {
      // 获取系统日志，检查错误
      const logFiles = await client.getLogFiles();
      if (logFiles && logFiles.length > 0) {
        const logContent = await client.getLogContent('fuxa.log');
        // 分析日志中的错误信息
        const errors = logContent.match(/\[ERR\].*/g);
        if (errors && errors.length > 0) {
          console.log('系统错误:', errors.slice(-5)); // 显示最近 5 个错误
        }
      }
    } catch (error) {
      console.error('监控错误:', error.message);
    }
  }, 300000); // 每 5 分钟检查一次
}

monitorSystemPerformance();
```

## 7. 部署策略

### 7.1 分阶段部署

1. **测试阶段**：配置 1-2 台设备，验证连接和数据采集
2. **小规模部署**：配置 10-20 台设备，测试系统性能
3. **大规模部署**：分批部署剩余设备，每批 20-50 台

### 7.2 备份策略

- 定期备份 FUXA 配置（每日）
- 定期备份历史数据（每周）
- 启用自动备份功能

## 8. 工具脚本

### 8.1 设备配置生成器

```javascript
// device-generator.js
const { FUXAClient } = require('./.trae/skills/fuxa-automation/references/fuxa-cli');

function generateModbusDevices(count, pointsPerDevice) {
  const devices = [];
  for (let i = 1; i <= count; i++) {
    const deviceId = `d_modbus_${i.toString().padStart(3, '0')}`;
    const tags = {};
    
    for (let j = 1; j <= pointsPerDevice; j++) {
      tags[`t_${deviceId}_point_${j.toString().padStart(3, '0')}`] = 
        FUXAClient.createModbusTag({
          id: `t_${deviceId}_point_${j.toString().padStart(3, '0')}`,
          name: `Point ${j}`,
          type: 'Float32',
          memaddress: `400${j.toString().padStart(3, '0')}`,
          address: j.toString()
        });
    }

    devices.push(FUXAClient.createModbusTCP({
      id: deviceId,
      name: `Modbus Device ${i}`,
      address: `192.168.1.${100 + i}`,
      port: 502,
      slaveId: 1,
      polling: 1000,
      tags: tags
    }));
  }
  return devices;
}

// 生成配置文件
const devices = generateModbusDevices(20, 50); // 20 台设备，每台 50 个点
require('fs').writeFileSync('modbus-devices.json', JSON.stringify(devices, null, 2));
console.log('设备配置文件生成完成: modbus-devices.json');
```

### 8.2 标签导入工具

```javascript
// tag-importer.js
const { FUXAClient } = require('./.trae/skills/fuxa-automation/references/fuxa-cli');
const devices = require('./modbus-devices.json');

async function importDevices() {
  const client = new FUXAClient({ url: 'http://localhost:1881' });
  await client.login('admin', 'password');

  // 分批导入，每批 5 台设备
  for (let i = 0; i < devices.length; i += 5) {
    const batch = devices.slice(i, i + 5);
    const results = await client.setDevices(batch);
    console.log(`导入批次 ${Math.floor(i/5) + 1}:`, results);
    await new Promise(resolve => setTimeout(resolve, 2000)); // 间隔 2 秒
  }

  console.log('所有设备导入完成！');
}

importDevices();
```

## 9. 最佳实践

1. **分层设计**：按功能和区域分层设备和标签
2. **标准化命名**：使用统一的命名规范
3. **批量操作**：使用批量API减少网络请求
4. **性能优化**：合理设置轮询间隔和采集频率
5. **监控预警**：设置设备状态监控和报警
6. **定期维护**：定期备份和清理数据
7. **分阶段部署**：避免一次性部署过多设备
8. **测试验证**：在小规模测试后再大规模部署

## 10. 技术支持

- **技术支持 QQ**：2492123056
- **FUXA 官方文档**：https://frangoteam.github.io/fuxa/
- **Modbus 协议文档**：https://modbus.org/
- **MQTT 协议文档**：https://mqtt.org/

---

**准备就绪**：按照以上指南，您的上千个点的 Modbus TCP + MQTT 项目应该能够平稳运行。如果遇到任何问题，请随时联系技术支持。
---
name: "fuxa-automation"
description: "FUXA SCADA/HMI 自动化配置技能。通过 REST API 远程管理 FUXA 服务器，支持设备驱动配置、报警配置、标签读写、组态配置等。Invoke when user wants to deploy, configure, or manage FUXA SCADA system."
---

# FUXA 自动化配置技能

## 概述

本技能通过 **FUXA REST API** 远程管理 FUXA SCADA/HMI 服务器。所有操作都通过 HTTP 请求完成，不需要在本机安装 FUXA。

## 红线规则

> **禁止直接修改 FUXA 配置文件。** 所有配置变更必须通过 REST API 完成。

## 中文命令支持

当用户使用以下中文命令时，触发此技能：

| 中文命令 | 英文等价 | 说明 |
|---------|---------|------|
| 连接 Modbus 设备 | connect Modbus | 添加 Modbus TCP/RTU 设备 |
| 连接 S7 设备 | connect S7 | 添加西门子 S7 设备 |
| 连接 OPC UA | connect OPC UA | 添加 OPC UA 设备 |
| 添加设备 | add device | 创建设备 |
| 删除设备 | delete device | 删除设备 |
| 读取标签 | read tag | 读取标签值 |
| 写入标签 | write tag | 写入标签值 |
| 配置报警 | config alarm | 配置报警规则 |
| 查看报警 | view alarm | 查看当前报警 |
| 创建视图 | create view | 创建组态视图 |
| 查询历史 | query history | 查询历史数据 |
| 部署 FUXA | deploy FUXA | 部署 FUXA 服务 |

## 使用方法

### 触发条件

当用户请求以下操作时，必须调用此技能：
- FUXA 部署/安装
- 设备驱动配置（Modbus、S7、OPC UA 等）
- 标签读写
- 报警配置
- 组态配置
- 工业自动化配置

### 认证方式

| 方式 | 请求头 | 适用场景 |
|------|--------|----------|
| JWT Token | `x-access-token: <token>` | 用户名密码登录后获取 |
| API Key | `x-api-key: <key>` | 预先创建的 API Key |

### 连接配置

执行操作前需要获取：
- FUXA 服务器地址（默认 http://localhost:1881）
- 用户名和密码（如果启用了认证）
- 或 API Key

## 快速使用

### 1. 基础连接

```javascript
const { FUXAClient } = require('./references/fuxa-cli');

// 创建客户端
const client = new FUXAClient({
  url: 'http://192.168.1.100:1881',
  username: 'admin',
  password: 'password'
});

// 登录
await client.login();
```

### 2. 批量添加设备

```javascript
// 批量创建设备
const devices = [
  {
    id: 'd_modbus_01',
    name: 'Modbus PLC 1',
    type: 'ModbusTCP',
    property: { address: '192.168.1.100', port: '502', slaveid: '1' },
    tags: { 't_temp': { id: 't_temp', name: '温度', type: 'Float32', memaddress: '400001' } }
  },
  {
    id: 'd_modbus_02',
    name: 'Modbus PLC 2',
    type: 'ModbusTCP',
    property: { address: '192.168.1.101', port: '502', slaveid: '1' },
    tags: { 't_humi': { id: 't_humi', name: '湿度', type: 'Float32', memaddress: '400001' } }
  }
];

// 批量创建
for (const device of devices) {
  await client.setDevice(device);
}
```

### 3. 批量读写标签

```javascript
// 批量读取标签
const values = await client.getTagValue(['t_temp', 't_humi', 't_pressure']);

// 批量写入标签
await client.setTagValue([
  { id: 't_temp', value: 25.5 },
  { id: 't_humi', value: 60 },
  { id: 't_pressure', value: 1.2 }
]);
```

## 设备模板

### Modbus TCP 模板

```javascript
const modbusTemplate = {
  id: 'd_modbus_xxx',
  name: 'Modbus 设备名称',
  type: 'ModbusTCP',
  enabled: true,
  polling: 1000,
  property: {
    address: '192.168.1.100',  // IP 地址
    port: '502',               // 端口
    slaveid: '1'              // 从站 ID
  },
  tags: {}
};
```

### 西门子 S7 模板

```javascript
const s7Template = {
  id: 'd_s7_xxx',
  name: 'S7 设备名称',
  type: 'SiemensS7',
  enabled: true,
  polling: 1000,
  property: {
    address: '192.168.1.100',  // IP 地址
    rack: 0,                    // 机架号
    slot: 1                     // 槽号
  },
  tags: {}
};
```

### OPC UA 模板

```javascript
const opcuaTemplate = {
  id: 'd_opcua_xxx',
  name: 'OPC UA 设备名称',
  type: 'OPCUA',
  enabled: true,
  polling: 1000,
  property: {
    endpoint: 'opc.tcp://192.168.1.100:4840',
    username: 'admin',
    password: 'password',
    securityPolicy: 'None',
    securityMode: 'None'
  },
  tags: {}
};
```

## 支持的设备驱动

| 驱动类型 | 标识 | 典型用途 |
|----------|------|----------|
| Modbus TCP | `ModbusTCP` | PLC、传感器 |
| Modbus RTU | `ModbusRTU` | 串口设备 |
| OPC UA | `OPCUA` | 标准化工业互联 |
| Siemens S7 | `SiemensS7` | 西门子 PLC |
| BACnet | `BACnet` | 楼宇自动化 |
| MQTT Client | `MQTTclient` | IoT 消息 |
| Web API | `WebAPI` | HTTP REST 接口 |
| EtherNet/IP | `EthernetIP` | AB/罗克韦尔 PLC |
| MELSEC | `MELSEC` | 三菱 PLC |
| Redis | `REDIS` | 缓存/消息 |

## 常见 API 端点

| 方法 | 端点 | 说明 |
|------|------|------|
| POST | `/api/signin` | 登录 |
| GET | `/api/project` | 获取项目配置 |
| POST | `/api/projectData` | 更新项目数据 |
| GET | `/api/getTagValue` | 读取标签值 |
| POST | `/api/setTagValue` | 写入标签值 |
| GET | `/api/alarms` | 获取报警 |
| GET | `/api/settings` | 获取系统设置 |

## 关键提醒

- Modbus 从站 ID 字段名是 `property.slaveid`（全小写字符串）
- 设备地址字段名是 `property.address`
- 语言代码是 `zh-cn`（不是 `zh`）
- projectData cmd 值是 `'set-device'`、`'set-alarm'`
- 端口号必须是字符串类型，如 `'502'` 不是 `502`

## 常见问题

### Q: 如何查看设备连接状态？

```javascript
const status = await client.getDeviceConnectionStatus('d_modbus_01');
console.log(status.status, status.statusText);
```

### Q: 如何批量添加标签？

```javascript
// 先获取设备
const devices = await client.getDevices();
const device = devices['d_modbus_01'];

// 添加新标签
device.tags['t_new'] = {
  id: 't_new',
  name: '新标签',
  type: 'Float32',
  memaddress: '400010'
};

// 更新设备
await client.setDevice(device);
```

### Q: 如何配置报警？

```javascript
await client.setAlarmDefinition({
  id: 'alarm_temp_high',
  name: '温度高报警',
  device: 'd_modbus_01',
  tag: 't_temp',
  type: 'high',
  limit: 80,
  deadband: 1,
  text: '温度超过 80°C',
  ackMode: 'alarm.ack-float'
});
```

### Q: 如何查询历史数据？

```javascript
const from = new Date(Date.now() - 24*60*60*1000).toISOString();
const to = new Date().toISOString();
const data = await client.getDaqData(from, to, ['t_temp', 't_humi']);
```

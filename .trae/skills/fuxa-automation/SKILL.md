---
name: "fuxa-automation"
description: "FUXA SCADA/HMI 自动化配置技能。通过 REST API 远程管理 FUXA 服务器，支持设备驱动配置、报警配置、标签读写、组态配置等。Invoke when user wants to deploy, configure, or manage FUXA SCADA system."
---

# FUXA 自动化配置技能

## 概述

本技能通过 **FUXA REST API** 远程管理 FUXA SCADA/HMI 服务器。所有操作都通过 HTTP 请求完成，不需要在本机安装 FUXA。

## 红线规则

> **禁止直接修改 FUXA 配置文件。** 所有配置变更必须通过 REST API 完成。

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

// 获取所有设备
const devices = await client.getDevices();

// 创建设备
await client.setDevice({
  id: 'd_xxx',
  name: 'Modbus PLC',
  type: 'ModbusTCP',
  enabled: true,
  polling: 1000,
  property: {
    address: '192.168.0.119',
    port: '502',
    slaveid: '1'
  },
  tags: {
    't_temp': {
      id: 't_temp',
      name: '温度',
      type: 'Float32',
      memaddress: '400001',
      address: '1'
    }
  }
});

// 读取标签值
const values = await client.getTagValue(['t_temp']);

// 写入标签值
await client.setTagValue([{ id: 't_temp', value: 25.5 }]);
```

## 支持的设备驱动

| 驱动类型 | 标识 |
|----------|------|
| Modbus TCP | `ModbusTCP` |
| Modbus RTU | `ModbusRTU` |
| OPC UA | `OPCUA` |
| Siemens S7 | `SiemensS7` |
| BACnet | `BACnet` |
| MQTT Client | `MQTTclient` |
| Web API | `WebAPI` |
| EtherNet/IP | `EthernetIP` |

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

---
name: fuxa-automation
description: FUXA SCADA/HMI 自动化配置技能。通过 REST API 远程管理 FUXA 服务器，支持设备驱动配置、报警配置、标签读写、组态配置等。Invoke when user wants to deploy, configure, or manage FUXA SCADA system.
---

# FUXA 自动化配置技能

## 概述

本技能通过 **FUXA REST API** 远程管理 FUXA SCADA/HMI 服务器。所有操作都通过 HTTP 请求完成，不需要在本机安装 FUXA。

## 配置方式选择

> **优先使用 REST API**，但在以下场景可考虑直接操作：

| 方式 | 适用场景 | 示例 |
|------|---------|------|
| **REST API（首选）** | 日常配置、标签增删改查、设备管理 | `POST /api/project` 更新标签 |
| **直接修改数据库/文件** | 批量修复、紧急恢复、API 无法覆盖的操作 | SQLite 修复设备配置、JSON 直接编辑 |

### 直接操作的注意事项

1. **备份优先**：修改前备份 `server/_appdata/project.fuxap.db`
2. **停止服务**：建议先停止 FUXA 服务再修改
3. **数据格式**：确保 JSON 格式正确，字段类型匹配
4. **重启生效**：修改后需重启 FUXA 服务

### 常用直接操作路径

| 操作对象 | 路径 | 说明 |
|---------|------|------|
| 项目数据库 | `server/_appdata/project.fuxap.db` | SQLite，包含所有项目配置 |
| DAQ 数据 | `server/_db/daq-data_*.db` | 历史数据存储 |
| 配置文件 | `server/settings.json` | 系统设置 |

## FUXA 数据库架构（重要！）

> **理解数据库结构是高效操作 FUXA 的基础。** 变量/标签存储在 SQLite 的 `devices` 表中。

### 核心数据库：`project.fuxap.db`

**路径**: `server/_db/project.fuxap.db`  
**类型**: SQLite3

#### 表结构总览

| 表名 | 存储内容 | value 字段格式 |
|------|---------|---------------|
| **`devices`** ⭐ | 设备 + 所有**变量/标签** | JSON（包含 tags 对象） |
| `general` | 项目名称、语言等通用设置 | JSON |
| `views` | 视图/组态画面 | JSON |
| `alarms` | 报警配置 | JSON |
| `scripts` | 脚本 | JSON |
| `texts` | 文本资源 | JSON |
| `notifications` | 通知配置 | JSON |
| `reports` | 报表配置 | JSON |

#### devices 表详解（变量存储位置）

```sql
CREATE TABLE devices (
    name TEXT PRIMARY KEY,     -- 设备ID，如 "d_f9faa9df-f80c40de"
    value TEXT,                -- ⭐ 设备配置JSON（包含所有标签）
    connection TEXT,           -- 连接状态
    cntid TEXT,                -- 连接ID
    cntpwd TEXT                -- 连接密码
);
```

**value 字段内容示例**：
```json
{
    "id": "d_f9faa9df-f80c40de",
    "name": "modbus",
    "type": "ModbusTCP",
    "enabled": true,
    "driver": "modbus",
    "hasCustomTags": true,
    "settings": {
        "ipaddress": "127.0.0.1",
        "port": 502,
        "slaveid": 1
    },
    "tags": {                              // ← 所有变量在这里！
        "t_d0_0100": {
            "id": "t_d0_0100",
            "name": "合模1压力1",
            "type": "UInt16",
            "memaddress": "400000",         // 字符串类型
            "address": 101,                 // 数字类型 (1-based)
            "divisor": 10
        },
        "t_d0_0101": { ... }
    }
}
```

### 辅助数据库文件

| 数据库文件 | 用途 | 说明 |
|-----------|------|------|
| `currentTagReadings.db` | 当前标签实时值缓存 | 运行时生成 |
| `daq-data_*.db` | DAQ 历史数据记录 | 按日期/设备轮转 |
| `daq-map_*.db` | DAQ 映射索引 | 标签→数据映射 |
| `users.fuxap.db` | 用户账户 | 认证系统 |
| `apikeys.fuxap.db` | API 密钥 | REST API 认证 |
| `alarms.fuxap.db` | 报警历史记录 | 已触发的报警 |

### 快速查询命令

```bash
# 列出所有设备
sqlite3 server/_appdata/project.fuxap.db "SELECT name FROM devices;"

# 查看设备完整配置（JSON格式）
sqlite3 server/_appdata/project.fuxap.db "SELECT value FROM devices WHERE name='d_xxx';"

# 查看某设备的标签数量
sqlite3 server/_appdata/project.fuxap.db "SELECT length(value) FROM devices WHERE name='d_xxx';"
```

### 直接修改数据库的工具函数

使用 `modbus-tag-utils.js` 中的数据库操作函数：

```javascript
const dbUtils = require('./references/modbus-tag-utils.js');

// 从数据库读取设备配置
const device = await dbUtils.getDeviceFromDb('d_xxx');

// 更新设备到数据库
await dbUtils.updateDeviceInDb('d_xxx', device);

// 批量修复所有标签的字段类型
await dbUtils.fixAllTagFieldTypes('d_xxx');
```

---

## 中文命令支持

当用户使用以下中文命令时，触发此技能：

| 中文命令 | 英文等价 | 说明 |
|---------|---------|------|
| 连接 Modbus 设备 | connect Modbus | 添加 Modbus TCP/RTU 设备 |
| 连接 S7 设备 | connect S7 | 添加西门子 S7 设备 |
| 连接 OPC UA | connect OPC UA | 添加 OPC UA 设备 |
| 连接 BACnet | connect BACnet | 添加 BACnet 楼宇设备 |
| 连接三菱 PLC | connect MELSEC | 添加三菱 MELSEC 设备 |
| 连接 AB PLC | connect EthernetIP | 添加罗克韦尔 PLC |
| 连接倍福 | connect ADS | 添加倍福 TwinCAT |
| 添加设备 | add device | 创建设备 |
| 删除设备 | delete device | 删除设备 |
| 读取标签 | read tag | 读取标签值 |
| 写入标签 | write tag | 写入标签值 |
| 配置报警 | config alarm | 配置报警规则 |
| 查看报警 | view alarm | 查看当前报警 |
| 创建视图 | create view | 创建组态视图 |
| 查询历史 | query history | 查询历史数据 |
| 部署 FUXA | deploy FUXA | 部署 FUXA 服务 |
| 查看日志 | view logs | 查看系统日志 |
| 查看设备状态 | device status | 查看设备连接状态 |
| 配置调度 | config scheduler | 配置定时调度 |
| 管理用户 | manage users | 用户/角色管理 |

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

## 完整 API 端点列表

### 认证

| 方法 | 端点 | 说明 |
|------|------|------|
| POST | `/api/signin` | 登录 |
| POST | `/api/signout` | 登出 |
| POST | `/api/refresh` | 刷新 Token |
| POST | `/api/heartbeat` | 心跳检测 |

### 项目数据

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/api/project` | 获取项目配置 |
| POST | `/api/project` | 更新项目 |
| POST | `/api/projectData` | 更新项目部分数据 |
| GET | `/api/projectdemo` | 获取演示项目 |

### 设备与标签

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/api/device` | 获取设备属性 |
| POST | `/api/device` | 设置设备属性 |
| GET | `/api/getTagValue` | 读取标签值 |
| POST | `/api/setTagValue` | 写入标签值 |

### 报警与事件

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/api/alarms` | 获取当前报警 |
| GET | `/api/alarmsHistory` | 获取报警历史 |
| POST | `/api/alarmack` | 确认报警 |
| POST | `/api/alarmsClear` | 清除报警 |
| GET | `/api/events` | 获取事件历史 |
| POST | `/api/eventsClear` | 清除事件历史 |

### DAQ 历史数据

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/api/daq` | 查询历史数据 |

### 脚本

| 方法 | 端点 | 说明 |
|------|------|------|
| POST | `/api/runscript` | 执行脚本 |
| POST | `/api/runSysFunction` | 执行系统函数 |

### 调度器

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/api/scheduler` | 获取调度器 |
| POST | `/api/scheduler` | 设置调度器 |
| DELETE | `/api/scheduler` | 删除调度器 |

### 用户与权限

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/api/users` | 获取用户列表 |
| POST | `/api/users` | 创建/更新用户 |
| DELETE | `/api/users` | 删除用户 |
| GET | `/api/roles` | 获取角色列表 |
| POST | `/api/roles` | 创建/更新角色 |
| DELETE | `/api/roles` | 删除角色 |
| GET | `/api/apikeys` | 获取 API Key 列表 |
| POST | `/api/apikeys` | 创建/更新 API Key |
| DELETE | `/api/apikeys` | 删除 API Key |

### 诊断

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/api/settings` | 获取系统设置 |
| POST | `/api/settings` | 更新系统设置 |
| GET | `/api/version` | 获取版本号 |
| GET | `/api/logsdir` | 获取日志文件列表 |
| GET | `/api/logs` | 获取日志内容 |
| POST | `/api/sendmail` | 发送测试邮件 |
| GET | `/api/reportsdir` | 获取报表文件列表 |

### 资源

| 方法 | 端点 | 说明 |
|------|------|------|
| POST | `/api/upload` | 上传文件 |
| GET | `/api/resources/images` | 获取图片列表 |
| GET | `/api/resources/resources` | 获取资源列表 |
| GET | `/api/resources/templates` | 获取模板列表 |
| GET | `/api/resources/widgets` | 获取 Widget 列表 |

### 插件

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/api/plugins` | 获取插件列表 |
| POST | `/api/plugins` | 安装插件 |
| DELETE | `/api/plugins` | 卸载插件 |

## 支持的设备驱动（16 种）

| 驱动类型 | 标识 | 典型用途 | 模板方法 |
|----------|------|----------|----------|
| Modbus TCP | `ModbusTCP` | PLC、传感器 | `createModbusTCP()` |
| Modbus RTU | `ModbusRTU` | 串口设备 | `createModbusRTU()` |
| Siemens S7 | `SiemensS7` | 西门子 PLC | `createS7Device()` |
| OPC UA | `OPCUA` | 标准化工业互联 | `createOPCUA()` |
| BACnet | `BACnet` | 楼宇自动化 | `createBACnet()` |
| MQTT Client | `MQTTclient` | IoT 消息 | `createMQTT()` |
| Web API | `WebAPI` | HTTP REST 接口 | `createWebAPI()` |
| Ethernet/IP | `EthernetIP` | AB/罗克韦尔 PLC | `createEthernetIP()` |
| MELSEC | `MELSEC` | 三菱 PLC (MC 协议) | `createMELSEC()` |
| ADS | `ADSclient` | 倍福 TwinCAT | `createADS()` |
| FUXA Server | `FuxaServer` | FUXA 内部通信 | `createFuxaServer()` |
| ODBC | `ODBC` | 数据库连接 | `createODBC()` |
| Redis | `REDIS` | 缓存/消息 | `createRedis()` |
| GPIO | `GPIO` | 树莓派 GPIO | - |
| WebCam | `WebCam` | 网络摄像头 | - |

## 数据类型参考

### Modbus 数据类型

| 类型 | 字节数 | 说明 |
|------|--------|------|
| Bool | 1 | 布尔值 |
| Int16 | 2 | 有符号 16 位整数 |
| UInt16 | 2 | 无符号 16 位整数 |
| Int32 | 4 | 有符号 32 位整数 |
| UInt32 | 4 | 无符号 32 位整数 |
| Float32 | 4 | 32 位浮点数 |
| Float64 | 8 | 64 位双精度浮点 |
| String | 1 | ASCII 字符串 |

### Modbus 寄存器地址映射

| 功能码 | 地址范围 | 说明 |
|--------|----------|------|
| 01 | 000001-099999 | 线圈 (Coil) |
| 02 | 100001-199999 | 离散输入 (DI) |
| 03 | 300001-399999 | 输入寄存器 (IR) |
| 04 | 400001-499999 | 保持寄存器 (HR) |

### S7 数据类型

| 类型 | 字节数 | 说明 |
|------|--------|------|
| BOOL | 1 | 布尔值 |
| BYTE | 1 | 无符号 8 位 |
| WORD | 2 | 无符号 16 位 |
| DWORD | 4 | 无符号 32 位 |
| INT | 2 | 有符号 16 位整数 |
| DINT | 4 | 有符号 32 位整数 |
| REAL | 4 | 32 位浮点数 |
| CHAR | 1 | ASCII 字符 |

### S7 地址格式

| 地址 | 说明 |
|------|------|
| DB1.DBD0 | DB1 的 DBD0 (DINT/REAL) |
| DB1.DBW0 | DB1 的 DBW0 (INT/WORD) |
| DB1.DBX0.0 | DB1 的 DBX0.0 (BOOL) |
| I0.0 | 输入位 |
| Q0.0 | 输出位 |
| M0.0 | 标志位 |

## ProjectData 命令类型

| 命令 | 说明 |
|------|------|
| set-device | 创建/更新设备 |
| del-device | 删除设备 |
| set-view | 创建/更新视图 |
| del-view | 删除视图 |
| layout | 设置布局 |
| viewtree | 设置视图树 |
| charts | 设置图表 |
| graphs | 设置图形 |
| languages | 设置语言 |
| client-access | 设置客户端访问 |
| set-text / del-text | 添加/删除文本 |
| set-alarm / del-alarm | 添加/删除报警 |
| set-notification / del-notification | 添加/删除通知 |
| set-script / del-script | 添加/删除脚本 |
| set-report / del-report | 添加/删除报表 |
| set-maps-location / del-maps-location | 添加/删除地图位置 |

## 快速使用

### 1. 基础连接

```javascript
const { FUXAClient } = require('./references/fuxa-cli');

const client = new FUXAClient({
  url: 'http://192.168.1.100:1881',
  username: 'admin',
  password: 'password'
});

await client.login();
```

### 2. 使用模板快速创建设备

```javascript
// Modbus TCP
const device = FUXAClient.createModbusTCP({
  id: 'd_modbus_01',
  name: '温湿度传感器',
  address: '192.168.1.100',
  port: 502,
  slaveId: 1,
  tags: {
    't_temp': FUXAClient.createModbusTag({ id: 't_temp', name: '温度', type: 'Float32', memaddress: '400001' }),
    't_humi': FUXAClient.createModbusTag({ id: 't_humi', name: '湿度', type: 'Float32', memaddress: '400003' })
  }
});
await client.setDevice(device);

// S7
const s7 = FUXAClient.createS7Device({
  id: 'd_s7_01', name: 'S7-1500', address: '192.168.1.200', rack: 0, slot: 1,
  tags: {
    't_speed': FUXAClient.createS7Tag({ id: 't_speed', name: '速度', type: 'REAL', memaddress: 'DB1.DBD0' })
  }
});
await client.setDevice(s7);

// OPC UA
const opcua = FUXAClient.createOPCUA({
  id: 'd_opcua_01', name: 'OPC UA Server', endpoint: 'opc.tcp://192.168.1.100:4840'
});
await client.setDevice(opcua);
```

### 3. 批量操作

```javascript
// 批量创建设备
const results = await client.setDevices([
  FUXAClient.createModbusTCP({ name: '设备1', address: '192.168.1.100' }),
  FUXAClient.createModbusTCP({ name: '设备2', address: '192.168.1.101' })
]);

// 批量读取标签
const values = await client.getTagValue(['t_temp', 't_humi', 't_pressure']);

// 批量写入标签
await client.setTagValue([
  { id: 't_temp', value: 25.5 },
  { id: 't_humi', value: 60 }
]);
```

### 4. 设备状态监控

```javascript
// 单个设备状态
const status = await client.getDeviceConnectionStatus('d_modbus_01');
// { deviceId, deviceName, status, statusText: '在线'|'离线'|'警告' }

// 所有设备状态
const allStatus = await client.getAllDeviceConnectionStatus();
```

### 5. 报警配置

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

### 6. 历史数据查询

```javascript
const from = new Date(Date.now() - 24*60*60*1000).toISOString();
const to = new Date().toISOString();
const data = await client.getDaqData(from, to, ['t_temp', 't_humi']);
```

## 关键提醒

> ⚠️ **Modbus 标签配置红线规则** - 违反会导致界面显示异常或数据读取错误！

### Modbus 标签必须遵守的数据结构

```javascript
{
    "id": "t_d0_0100",           // 必须，标签ID
    "name": "合模1压力1",        // 必须，标签名称
    "type": "UInt16",            // 必须，数据类型
    "memaddress": "400000",      // ⚠️ 必须是字符串！寄存器类型基址
    "address": 101,              // ⚠️ 必须是数字！1-based偏移量
    "divisor": 10,               // 可选，除数（压力/时间=10, 流量=100）
    "daq": {                     // 可选，DAQ设置
        "enabled": false,
        "interval": 60,
        "changed": false,
        "restored": false
    }
}
```

### memaddress 字段详解（⚠️ 最容易出错！）

**类型**: 必须是 **字符串 (string)**，不是数字！

| 下拉框显示文本 | memaddress 值 | 类型 |
|---------------|--------------|------|
| Coil Status (Read/Write 000001-065536) | `"000000"` | string ✅ |
| Digital Inputs (Read 100001-165536) | `"100000"` | string ✅ |
| Input Registers (Read 300001-365536) | `"300000"` | string ✅ |
| Holding Registers (Read/Write 400001-465535) | `"400000"` | string ✅ |

**❌ 错误示例**:
```javascript
{ "memaddress": 400000 }     // 数字类型 → 界面显示为空
{ "memaddress": "4X101" }   // 格式错误 → 无法匹配下拉框
```

**✅ 正确示例**:
```javascript
{ "memaddress": "400000" }   // 字符串类型 → 正确显示 Holding Registers
```

### address 字段详解

**类型**: 必须是 **数字 (number)**，**1-based 偏移**

| PLC地址 | address 值 | 说明 |
|---------|-----------|------|
| D100 | `101` | D100 对应 address=101（+1） |
| D200 | `201` | D200 对应 address=201 |
| D0 | `1` | D0 对应 address=1 |

**❌ 错误示例**:
```javascript
{ "address": "101" }       // 字符串类型 → 可能导致解析错误
{ "address": 100 }         // 0-based偏移 → 地址偏移错误
```

### divisor 字段详解（除数）

用于将原始整数值转换为实际工程值：

| 参数类型 | divisor 值 | 示例：原始值100 | 实际值 |
|---------|-----------|----------------|-------|
| 压力参数 | `10` | 100 | 10.0 bar |
| 时间参数 | `10` | 500 | 50.0 ms |
| 流量参数 | `100` | 2500 | 25.0 L/min |
| 其他参数 | `null` 或不设置 | 100 | 100 |

### 完整的地址转换函数

```javascript
// 从PLC地址格式(如"4X101")转换为FUXA标签配置
function parseFuxaAddress(fuxaAddr) {
    const match = fuxaAddr.match(/^([0-9]X)(\d+)$/);
    if (!match) return null;
    
    const typeCode = match[1];
    const addrNum = parseInt(match[2]);
    
    let memaddrStr;
    switch (typeCode) {
        case '4X': memaddrStr = '400000'; break;  // Holding Registers
        case '3X': memaddrStr = '300000'; break;  // Input Registers
        case '1X': memaddrStr = '000000'; break;  // Coil Status
        case '0X': memaddrStr = '100000'; break;  // Digital Inputs
        default: memaddrStr = '400000';
    }
    
    return {
        memaddress: memaddrStr,  // ⚠️ 字符串
        address: addrNum          // ⚠️ 数字 (1-based)
    };
}

// 使用示例
const config = parseFuxaAddress("4X101");
// 结果: { memaddress: "400000", address: 101 }
```

---

## 其他关键提醒

- Modbus 从站 ID 字段名是 `property.slaveid`（全小写字符串）
- 设备地址字段名是 `property.address`
- 语言代码是 `zh-cn`（不是 `zh`）
- projectData cmd 值是 `'set-device'`、`'set-alarm'` 等
- 端口号必须是字符串类型，如 `'502'` 不是 `502`
- 设备连接状态：0=离线，3=警告，5=在线
- FUXA Server（id='0'）是内置设备，包含系统标签
- 标签支持 scale（缩放）、deadband（死区）、format（格式化）属性
- 标签支持 scaleReadFunction/scaleWriteFunction（脚本缩放）

## 常见问题

### Q: 如何查看设备连接状态？

```javascript
const status = await client.getDeviceConnectionStatus('d_modbus_01');
console.log(status.statusText); // '在线' | '离线' | '警告'
```

### Q: 如何批量添加标签？

```javascript
const devices = await client.getDevices();
const device = devices['d_modbus_01'];
device.tags['t_new'] = { id: 't_new', name: '新标签', type: 'Float32', memaddress: '400010' };
await client.setDevice(device);
```

### Q: 如何查看系统日志？

```javascript
const logFiles = await client.getLogFiles();
const logContent = await client.getLogContent('fuxa.log');
```

### Q: 如何管理调度器？

```javascript
// 获取调度器
const scheduler = await client.getScheduler('scheduler_01');

// 设置调度器
await client.setScheduler('scheduler_01', {
  schedules: {},
  settings: {
    devices: [{ name: '设备1', variableId: 't_temp' }]
  }
});
```

### Q: 如何查询事件历史？

```javascript
const events = await client.getEventsHistory({ start: '2026-01-01', end: '2026-04-23' });
```

---

## 打包与部署注意事项

### 原生模块打包

FUXA 使用 `pkg` 工具打包为独立 EXE，但原生模块（如 `node-snap7`）需要特殊处理：

```bash
# 正确的打包命令（包含原生模块参数）
pkg fuxa-single/package.json \
  --targets node18-win-x64 \
  --out-path artifacts \
  --public-packages "node-snap7,bindings,nan"
```

### Node.js 版本要求

| 目标平台 | 推荐 Node.js 版本 | 说明 |
|----------|------------------|------|
| node18-win-x64 | 18.x | S7 插件已预编译支持 |
| node20-win-x64 | 20.x | 需要重新编译 node-snap7 |

**警告**：打包时 Node.js 版本必须与目标平台版本一致，否则会出现 `"try to create S7-1500 but plugin is missing!"` 错误。

### fontkit 编码问题

`fontkit` 模块在 pkg 打包环境下使用 `windows-1252` 编码，会导致 Node.js 18 启动失败。解决方案：

1. 从 `server/package.json` 中移除 `fontkit` 依赖
2. 从 `server/api/resources/index.js` 中移除 fontkit 引用

### 常见打包错误

| 错误信息 | 原因 | 解决方案 |
|----------|------|----------|
| `try to create S7-1500 but plugin is missing!` | Node.js 版本不匹配或原生模块未打包 | 检查 Node.js 版本，添加 `--public-packages` 参数 |
| `ERR_ENCODING_NOT_SUPPORTED: The "windows-1252" encoding is not supported` | fontkit 编码问题 | 移除 fontkit 依赖 |
| `Cannot find module 'node-snap7'` | 原生模块未被打包 | 添加 `--public-packages "node-snap7,bindings,nan"` |

---

## 视图组态开发

### 视图创建 API

| 命令 | 说明 |
|------|------|
| set-view | 创建/更新视图 (含 SVG 内容、items、variables) |
| del-view | 删除视图 |
| layout | 设置全局布局 (导航栏、起始页、头部) |

### 视图数据结构

```javascript
{
  id: 'v_xxx',           // UUID 格式
  name: '视图名称',
  profile: {
    width: 1280,         // 页面宽度
    height: 960,         // 页面高度
    bkcolor: '#ffffffff', // 背景色
    margin: 10,
    align: 'topCenter',
    gridType: 'fixed'
  },
  items: {},             // 组件对象 { itemId: itemData }
  variables: {},
  svgcontent: '<svg>...</svg>',  // SVG 画布内容
  type: 'svg'
}
```

### 表格式布局模式 (推荐)

对于参数密集型监控画面，推荐使用**表格布局**替代分组列表布局：

**优势**:
- 空间利用率提升 60%+ (112 参数 → 95 参数, 高度减少 50%)
- 同类型参数同行显示，便于对比和设定
- 符合工业 HMI 操作习惯

**核心函数**: `buildTable(x, y, colHeaders, rows, items, cellW, cellH)`

```javascript
// 示例: 合模参数表格
const table = buildTable(
    x, y,                    // 起始坐标
    ['一段', '二段', '三段', '低压', '高压'],  // 列标题
    [
        { label: '压力 [bar]', cells: [tag1, tag2, tag3, tag4, tag5] },
        { label: '速度 [%]',   cells: [tag6, tag7, tag8, tag9, tag10] },
        { label: '位置 [mm]',  cells: [null, tag11, tag12, null, tag13] },  // null=禁用格
    ],
    items,   // items 对象引用
    80,      // 单元格宽度
    26       // 单元格高度
);
```

**输入组件类型**: `svg-ext-html_input`

```javascript
function makeInputItem(variableId, name) {
    return {
        id: 'HXI_' + uuid(),
        type: 'svg-ext-html_input',
        name: name,
        property: {
            variableId: variableId,
            ranges: [{ min: 0, max: 99999 }],
            options: { numeric: true, type: 'number' }
        }
    };
}
```

### 开合模监控画面示例

参考 `create-kaihemo-views.js`，包含两个页面:

| 页面 | 尺寸 | 内容 | 参数数 |
|------|------|------|--------|
| 开合模参数 | 1280×960 | 合模/开模表格 + 调模 + 功能 + 状态栏 | ~48 |
| 斜率/PID | 1280×960 | 合模/开模斜率表 + PID参数 + 状态信号 | ~47 |

**运行命令**: `node create-kaihemo-views.js`

### SVG 样式规范

```css
/* 推荐使用的 CSS 类 */
.page-bg{fill:#f5f7f9}              /* 页面背景 */
.section-header{fill:#2a6b9e;rx:3}   /* 分区标题栏 */
.section-title{font-size:13px;fill:#ffffff}  /* 分区标题文字 */
.input-bg{fill:#ffffff;stroke:#cccccc} /* 输入框背景 */
.disabled-bg{fill:#e8e8e8;stroke:#d0d0d0} /* 禁用单元格 */
.table-border{fill:none;stroke:#c0c8d0}     /* 表格边框 */
.row-label{font-size:11px;fill:#333333}     /* 行标签 */
.col-header{font-size:11px;text-anchor:center} /* 列标题 */
```

---

## ⚠️ FUXA组件核心机制：双字段渲染（重要！）

> **这是FUXA组态开发中最关键的知识点！** 违反此规则会导致组件不显示！

### 核心原理

```
FUXA组件 = items（配置数据） + svgcontent（SVG渲染元素）
           ↓                        ↓
        属性、事件、绑定          实际显示的DOM结构
```

**必须同时更新两个字段，组件才能正常显示！**

### 视图数据结构详解

```javascript
{
  id: 'v_xxx',
  name: '视图名称',
  type: 'svg',                    // 视图类型
  profile: { width: 1280, height: 800 },
  
  // ⭐ 字段1：组件配置数据（属性、事件、变量绑定）
  items: {
    'HXI_xxx': {
      id: 'HXI_xxx',
      type: 'svg-ext-html_input',    // 组件类型
      name: '合模压力',               // 组件名称
      property: {                     // ⭐ 属性配置
        variableId: 't_d0_0100',     // 变量绑定
        events: [                    // 事件列表
          { type: 'click', action: 'onpage', actparam: 'v_target' }
        ],
        ranges: [...],               // 范围/颜色映射
        actions: [...]               // 动作配置
      },
      label: 'HtmlInput',            // 组件标签
      hide: false,
      lock: false
    }
  },
  
  // ⭐ 字段2：SVG渲染内容（实际DOM元素）
  svgcontent: `<svg ...>
    <g data-name="合模压力" id="HXI_xxx" type="svg-ext-html_input">
      <rect class="inp-bg" height="24" width="80" y="454" x="492"/>
      <foreignObject id="H-HXI_xxx" width="80" height="24" y="454" x="492">
        <INPUT id="I-HXI_xxx" style="..." value="#.##" type="text"/>
      </foreignObject>
    </g>
  </svg>`
}
```

### 按钮组件完整示例（导航按钮）

```javascript
// items中的配置
{
  id: 'HXB_f2e5030a-33d646e3',
  type: 'svg-ext-html_button',
  name: '斜率',
  property: {
    ranges: [{ min: 20, max: 80, color: '', type: 2, stroke: '' }],
    events: [{
      type: 'click',
      action: 'onpage',              // 页面跳转动作
      actparam: 'v_ccebcd69-...',   // 目标视图ID
      actoptions: {}
    }],
    actions: []
  },
  label: 'HtmlButton',
  hide: false,
  lock: false
}

// svgcontent中对应的SVG元素
`<g stroke="rgba(0,0,0,0)" fill="rgba(0,0,0,0)" 
      type="svg-ext-html_button" 
      id="HXB_f2e5030a-33d646e3">
   <rect id="svg_2de20d99-d1b84235" 
         height="32" width="80" y="592" x="100" stroke-width="0"/>
   <foreignObject id="H-HXB_49aacfc7-0dfe4d88" 
                  width="80" height="32" y="592" x="100">     
    <BUTTON style="width:calc(100% - 6px);height:calc(100% - 6px);
               text-align:center;background-color:#FFFFFF;color:#000000;
               font-size:14px;font-family:sans-serif;" 
            class="md-btn md-btn-raised" 
            id="B-HXB_49aacfc7-0dfe4d88">斜率</BUTTON>
   </foreignObject>
</g>`
```

### 常见组件类型ID前缀

| 组件类型 | ID前缀 | SVG元素前缀 | 说明 |
|---------|--------|------------|------|
| 输入框 | `HXI_` | `I-HXI_` | html_input |
| 按钮 | `HXB_` | `B-HXB_` | **注意：B-前缀！** |
| 文本标签 | `svg_` | - | 静态文本 |
| 图表 | `chart_` | - | 数据图表 |

### ⚠️ 常见错误及解决方案

#### 错误1：只更新items，未更新svgcontent

**现象**：组件在编辑器中可见，但运行时不显示或无响应

**原因**：
```javascript
// ❌ 错误做法：只改items
view.items['HXB_new'] = { /* 配置 */ };
// svgcontent中没有对应的<g>元素 → 组件不显示！
```

**正确做法**：
```javascript
// ✅ 正确做法：同时更新两个字段
view.items['HXB_new'] = { /* 配置 */ };

// 在svgcontent的</g></svg>之前插入SVG元素
const svgEnd = view.svgcontent.lastIndexOf('</g>\n</svg>');
const btnSVG = `<g type="svg-ext-html_button" id="HXB_new">...</g>`;
view.svgcontent = view.svgcontent.substring(0, svgEnd) + btnSVG + '\n' + view.svgcontent.substring(svgEnd);
```

#### 错误2：ID不匹配

**现象**：组件显示但无法交互（点击无效）

**原因**：items中的id与svgcontent中的id不一致

```javascript
// ❌ 错误：ID不匹配
view.items['HXB_abc'].id = 'HXB_abc';        // items中是 HXB_abc
// svgcontent中却是 <g id="HXB_xyz">...       // SVG中是 HXB_xyz

// ✅ 正确：保持一致
view.items['HXB_abc'].id = 'HXB_abc';
// <g id="HXB_abc">...                         // 必须相同
```

#### 错误3：按钮缺少B-前缀

**现象**：按钮显示但点击事件不触发

**原因**：FUXA用 `B-HXB_` 前缀识别按钮内部元素

```html
<!-- ✅ 正确的按钮结构 -->
<BUTTON id="B-HXB_xxx">按钮文字</BUTTON>  <!-- 必须有B-前缀 -->

<!-- ❌ 错误 -->
<BUTTON id="HXB_xxx">按钮文字</BUTTON>    <!-- 缺少B-前缀 -->
```

### 操作工具函数

```javascript
/**
 * 安全地添加组件到视图（同时更新items和svgcontent）
 * @param {Object} view - 视图对象
 * @param {string} itemId - 组件ID (如 'HXB_xxx')
 * @param {Object} itemConfig - 组件配置
 * @param {string} svgElement - 组件的SVG字符串
 * @returns {boolean} 是否成功添加
 */
function addComponentToView(view, itemId, itemConfig, svgElement) {
    if (!view.items) view.items = {};
    
    // 1. 添加到items
    view.items[itemId] = itemConfig;
    
    // 2. 添加到svgcontent
    if (!view.svgcontent) {
        console.warn('警告: 视图没有svgcontent字段');
        return false;
    }
    
    const svgEnd = view.svgcontent.lastIndexOf('</g>\n</svg>');
    if (svgEnd === -1) {
        console.error('错误: 无法找到SVG结尾');
        return false;
    }
    
    view.svgcontent = 
        view.svgcontent.substring(0, svgEnd) + 
        '\n' + svgElement + '\n' + 
        view.svgcontent.substring(svgEnd);
    
    return true;
}

// 使用示例
addComponentToView(
    view,
    'HXB_nav_btn',
    {
        id: 'HXB_nav_btn',
        type: 'svg-ext-html_button',
        name: '导航',
        property: {
            events: [{ type: 'click', action: 'onpage', actparam: 'v_target' }],
            ranges: [],
            actions: []
        },
        label: 'HtmlButton',
        hide: false,
        lock: false
    },
    `<g stroke="rgba(0,0,0,0)" fill="rgba(0,0,0,0)" type="svg-ext-html_button" id="HXB_nav_btn">
       <rect height="32" width="100" y="592" x="100" stroke-width="0"/>
       <foreignObject width="100" height="32" y="592" x="100">
         <BUTTON class="md-btn md-btn-raised" id="B-HXB_nav_btn">导航</BUTTON>
       </foreignObject>
     </g>`
);
```

### 验证清单

添加组件后，使用以下检查确保正确：

```bash
# 1. 检查items中是否有该组件
sqlite3 project.fuxap.db "SELECT value FROM views WHERE rowid=1" | grep "HXB_new"

# 2. 检查svgcontent中是否有对应元素
sqlite3 project.fuxap.db "SELECT value FROM views WHERE rowid=1" | grep 'id="HXB_new"'

# 3. 确保两个ID一致
# items中: "id": "HXB_new"
# svgcontent中: <g id="HXB_new">

# 4. 对于按钮，检查B-前缀
# svgcontent中: <BUTTON id="B-HXB_new">
```

---

## 最佳实践总结

### ✅ 推荐做法

1. **始终同时更新items和svgcontent**
2. **保持ID一致性**（items.id === svgcontent.g@id）
3. **按钮使用正确的ID前缀格式**（`B-HXB_`）
4. **修改前备份数据库**
5. **修改后重启FUXA服务**
6. **使用工具函数封装操作**，避免遗漏字段

### ❌ 禁止做法

1. **只更新一个字段**（最常见错误）
2. **硬编码ID而不验证一致性**
3. **在生产环境直接修改**（先测试环境验证）
4. **忽略SVG命名空间要求**

---
---
name: fuxa-automation
description: FUXA SCADA/HMI 自动化配置技能。通过 REST API 远程管理 FUXA 服务器。Invoke when user wants to deploy, configure, or manage FUXA SCADA system, import CSV point tables, filter placeholder tags, or batch manage device tags.
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
| 导入点表 | import point table | 从 CSV/Excel 批量导入变量 |
| 清理变量 | clean tags | 过滤占位/模板变量 |
| 替换变量 | replace tags | 以新点表替换旧设备标签 |

## 使用方法

### 触发条件

当用户请求以下操作时，必须调用此技能：
- FUXA 部署/安装
- 设备驱动配置（Modbus、S7、OPC UA 等）
- 标签读写
- 报警配置
- 组态配置
- 工业自动化配置
- **从 CSV/Excel 点表批量导入标签**
- **清理/过滤 HMI 模板占位变量**
- **替换设备全部标签**

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

- **ProjectData API 有效负载格式**: `{ cmd: 'set-device', data: device }` — 键名是 **`data`**，不是 `device`、`devices` 或其他。**这是最容易犯的错误！**
- Modbus 从站 ID 字段名是 `property.slaveid`（全小写字符串）
- 设备地址字段名是 `property.address`
- 语言代码是 `zh-cn`（不是 `zh`）
- projectData cmd 值是 `'set-device'`、`'set-alarm'` 等
- 端口号必须是字符串类型，如 `'502'` 不是 `502`
- 设备连接状态：0=离线，3=警告，5=在线
- FUXA Server（id='0'）是内置设备，包含系统标签
- 标签支持 scale（缩放）、deadband（死区）、format（格式化）属性
- 标签支持 scaleReadFunction/scaleWriteFunction（脚本缩放）
- **批量替换标签时**：直接修改 `device.tags`，然后通过 `/api/projectData` 的 `set-device` 命令提交整个设备对象即可完全替换标签

## CSV/Excel 点表批量导入

这是 SCADA 工程中最常见的需求：从 HMI 组态软件导出的点表 CSV 文件，批量导入到 FUXA。

### 完整工作流（两阶段）

**阶段一：清理 CSV 点表**
- 读取 CSV，识别并删除 HMI 模板预留的"占位变量"（见下方占位变量过滤规则）
- 将清理后的 CSV 写回文件

**阶段二：通过 REST API 导入 FUXA**
- 从 FUXA 获取现有项目: `GET /api/project`
- 取到目标设备对象，替换其 `tags` 字段
- 通过 `POST /api/projectData` 提交: `{ cmd: 'set-device', data: device }`

### CSV 格式规范

典型的 HMI 点表 CSV 格式（由注塑机/PLC 组态软件导出）：

```csv
工作表,行,列,原始地址(HMI),Modbus地址(0-based),FUXA地址(1-based),标签名,类型,字数
D0,3,1,D0001,4x0001,4X2,"按键1",UInt,1字
D0,4,1,D0002,4x0002,4X3,"按键2",UInt,1字
```

关键列：第5列 **Modbus地址(0-based)** → 解析得到整数偏移，第7列标签名，第8列类型。

### HMI 地址 → FUXA Modbus 标签映射

```
CSV 中的 Modbus地址: "4x0001" (0-based holding register)
                     ↓ 去掉"4x"前缀，parseInt
                     得到 address=1
FUXA 标签: { memaddress: "400000", address: 1, type: "UInt16" }
```

### 类型映射表

| CSV 类型 | FUXA Modbus 类型 |
|----------|-----------------|
| UInt | UInt16 |
| Int32 | Int32MLE |
| Float32 | Float32MLE |
| 其他 | UInt16（默认） |

### 使用 Node.js 实现的核心代码

```javascript
const http = require('http');

function parseModbusAddress(addr) {
    const m = addr.match(/^4x(\d+)$/i);
    return m ? parseInt(m[1], 10) : null;
}

function typeMap(csvType) {
    switch (csvType) {
        case 'UInt': return 'UInt16';
        case 'Int32': return 'Int32MLE';
        case 'Float32': return 'Float32MLE';
        default: return 'UInt16';
    }
}

// FUXA 标签对象模板
const tag = {
    id: 't_d0_0001',
    name: '按键1',
    type: 'UInt16',
    memaddress: '400000',  // Modbus 保持寄存器基址
    address: 1,             // 0-based offset
    divisor: null,
    daq: { enabled: false, interval: 60, changed: false, restored: false },
    description: 'UInt, 1字'
};

// POST 到 FUXA
async function importToFuxa(device) {
    const payload = { cmd: 'set-device', data: device };
    // HTTP POST to http://host:port/api/projectData
    // Content-Type: application/json
}
```

## 占位变量过滤规则

HMI 组态软件为每个画面预留了大量固定数量的变量槽位，导出时会生成大量
无意义的编号占位变量（如"验证程序_1" ~ "验证程序_40"）。**必须过滤掉这些变量**，
否则会污染变量列表。

### 识别策略

1. 对每张工作表（`D0`, `D1`...）的标签名按"基底名"（去掉 `_N` 后缀）分组
2. 如果一个基底名有 >= 3 个编号项，且基底名是通用描述词 → 很可能是占位变量
3. 用正则表达式精确匹配

### 常见的占位变量模式

| 工作表 | 占位模式 | 示例 | 原因 |
|--------|---------|------|------|
| D0（参数设定） | `验证程序(_N)?` | 验证程序_1~_40 | 预留的验证程序编号槽位 |
| D0（参数设定） | `取样间隔(_N)?` | 取样间隔_1~_29 | 预留的采样间隔编号槽位 |
| D0（参数设定） | `功能(_N)?` | 功能, 功能_1~_14 | 预留的功能编号槽位 |
| D2（监控画面） | `报警提示(_N)?` | 报警提示_1~_19 | 预留的报警文本槽位 |
| D2（监控画面） | `开模位置(_N)?` | 开模位置_1~_8 | 预留的位置显示槽位 |
| D2（监控画面） | `包箱模数(_N)?` | 包箱模数_1~_7 | 预留的计数槽位 |
| D3（IO诊断） | `功能选择(_N)?` | 功能选择_1~_51 | 预留的功能选择槽位 |
| D3（IO诊断） | `托模退结束(_N)?` | 托模退结束_1~_30 | 预留的状态槽位 |
| D3（IO诊断） | `机械行程(_N)?` | 机械行程_1~_15 | 预留的行程槽位 |
| D3（IO诊断） | `现在位置(_N)?` | 现在位置_1~_15 | 预留的位置槽位 |
| D3（IO诊断） | `绝对位置(_N)?` | 绝对位置_1~_15 | 预留的位置槽位 |
| D3（IO诊断） | `限长(_N)?` | 限长_1~_15 | 预留的限长槽位 |
| D3（IO诊断） | `最小校正保存值(_N)?` | 最小校正保存值_1~_15 | 预留的校正槽位 |
| D3（IO诊断） | `最大校正保存值(_N)?` | 最大校正保存值_1~_15 | 预留的校正槽位 |
| D3（IO诊断） | `最小校正(_N)?` | 最小校正_1~_7 | 预留的校正槽位 |
| D3（IO诊断） | `最大校正(_N)?` | 最大校正_1~_7 | 预留的校正槽位 |
| D3（IO诊断） | `最大压力(_N)?` | 最大压力_1~_14 | 预留的压力槽位 |
| D3（IO诊断） | `合模终止(_N)?` | 合模终止_1~_15 | 预留的终止状态槽位 |
| D3（IO诊断） | `备用(_N)?` | 备用, 备用_1~_4 | 预留的备用槽位 |
| D7（参考值） | `设置值参考值N` | 全部 | 纯HMI模板 |
| D7（参考值） | `数据值参考值N` | 全部 | 纯HMI模板 |

### 正则表达式技巧

注意要同时匹配基底名（不带 `_N`）和编号版本（带 `_N`）：

```javascript
// ✅ 正确：同时匹配"托模退结束" 和 "托模退结束_1" ~ "托模退结束_30"
pattern: /^托模退结束(_\d+)?$/

// ❌ 错误：只匹配了带编号的，漏掉了基底名
pattern: /^托模退结束_\d+$/
```

### 占位变量过滤实现

```javascript
const PLACEHOLDER_RULES = [
    { sheet: 'D0', pattern: /^验证程序(_\d+)?$/ },
    { sheet: 'D0', pattern: /^取样间隔(_\d+)?$/ },
    { sheet: 'D0', pattern: /^功能(_\d+)?$/ },
    { sheet: 'D3', pattern: /^功能选择(_\d+)?$/ },
    { sheet: 'D3', pattern: /^托模退结束(_\d+)?$/ },
    // ... 更多规则
];

function isPlaceholder(sheet, tagName) {
    return PLACEHOLDER_RULES.some(r => r.sheet === sheet && r.pattern.test(tagName));
}
```

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

### Q: 如何从 HMI 点表 CSV 批量导入标签到现有设备？

```javascript
// 1. 先获取当前项目
const project = await client.getProject();
const device = project.devices['d_modbus_01'];

// 2. 解析 CSV，构建新 tags 对象
const newTags = {};
csvRows.forEach(row => {
    const addr = parseInt(row.modbusAddr.replace('4x', ''), 10);
    newTags['t_' + addr] = {
        id: 't_' + addr,
        name: row.name,
        type: typeMap(row.type),
        memaddress: '400000',
        address: addr,
        divisor: null,
        daq: { enabled: false, interval: 60, changed: false, restored: false }
    };
});

// 3. 替换并提交（会完全替换旧标签！）
device.tags = newTags;
await client.setDevice(device);
```

### Q: 如何识别和过滤 HMI 模板占位变量？

```javascript
// 策略：按基底名分组，>=3个带编号的同类名即视为占位变量
function getBaseName(name) {
    return name.replace(/_\d+$/, '');
}

// 分组统计
const groups = {};
rows.forEach(r => {
    const base = getBaseName(r.name);
    if (!groups[base]) groups[base] = [];
    groups[base].push(r);
});

// 过滤 >=3 个的占位组
const placeholderBases = Object.entries(groups)
    .filter(([_, arr]) => arr.length >= 3)
    .map(([base]) => base);

// 或直接用预定义的正则规则表匹配（更精确）
const PLACEHOLDER_RULES = [
    /^验证程序(_\d+)?$/, /^取样间隔(_\d+)?$/,
    /^功能(_\d+)?$/,     /^功能选择(_\d+)?$/,
    // ... 根据实际 HMI 模板扩展
];
```

### Q: 导入标签后如何验证？

```javascript
// 获取项目，检查标签数
const project = await client.getProject();
const device = project.devices['d_modbus_01'];
const tagCount = Object.keys(device.tags).length;
console.log(`Total tags: ${tagCount}`);

// 抽查边界地址（占位变量不应存在，真实变量应存在）
['t_d0_0009', 't_d0_0050'].forEach(id => {
    console.log(`${id}:`, device.tags[id] ? 'PRESENT' : 'FILTERED');
});
```

### Q: ProjectData API 报 "unexpected_error" 怎么办？

**99% 的情况是 payload 格式错误。** 检查：

1. 键名必须是 `data`，不是 `device`、`devices` 或其他
   ```javascript
   // ✅ 正确
   { cmd: 'set-device', data: device }
   
   // ❌ 错误！
   { cmd: 'set-device', device: device }
   { cmd: 'set-device', devices: [device] }
   ```
2. device 对象必须包含完整的标签结构（`tags` 是一个对象，key 是 tagId）
3. Content-Type 必须为 `application/json`
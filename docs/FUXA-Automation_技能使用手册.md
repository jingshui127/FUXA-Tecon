# FUXA-Automation 技能使用手册

## 1. 技能介绍

FUXA-Automation 是一个用于远程管理 FUXA SCADA/HMI 系统的 AI 技能，通过 REST API 实现对 FUXA 服务器的全功能控制。

**核心功能**：

- 设备驱动配置（Modbus、S7、OPC UA 等 16 种协议）
- 标签读写操作
- 报警配置与管理
- 历史数据查询
- 系统管理与监控
- 批量操作支持

## 2. 安装方法

### 方法一：直接复制

将 `.trae/skills/fuxa-automation` 目录复制到其他项目的相应位置即可。

### 方法二：从 GitHub 安装

```bash
git clone https://github.com/HugeShao/Fuxa-automation-skill.git
cp -r Fuxa-automation-skill/.trae/skills/fuxa-automation /path/to/your/project/.trae/skills/
```

## 3. 基本使用

### 3.1 连接 FUXA 服务器

```javascript
const { FUXAClient } = require('./.trae/skills/fuxa-automation/references/fuxa-cli');

// 创建客户端实例
const client = new FUXAClient({
  url: 'http://192.168.1.100:1881',  // FUXA 服务器地址
  username: 'admin',                 // 用户名（如果启用了认证）
  password: 'password'               // 密码
});

// 登录获取 Token
await client.login();
console.log('连接成功！');
```

### 3.2 常用命令

| 中文命令         | 功能                     |
| ---------------- | ------------------------ |
| 连接 Modbus 设备 | 添加 Modbus TCP/RTU 设备 |
| 连接 S7 设备     | 添加西门子 S7 设备       |
| 连接 OPC UA      | 添加 OPC UA 设备         |
| 连接 BACnet      | 添加 BACnet 楼宇设备     |
| 连接三菱 PLC     | 添加三菱 MELSEC 设备     |
| 连接 AB PLC      | 添加罗克韦尔 PLC         |
| 连接倍福         | 添加倍福 TwinCAT         |
| 读取标签         | 读取标签值               |
| 写入标签         | 写入标签值               |
| 配置报警         | 配置报警规则             |
| 查看报警         | 查看当前报警             |
| 查询历史         | 查询历史数据             |
| 查看日志         | 查看系统日志             |
| 查看设备状态     | 查看设备连接状态         |

## 4. 设备配置

### 4.1 使用模板创建设备

**Modbus TCP 设备**：

```javascript
const device = FUXAClient.createModbusTCP({
  id: 'd_modbus_01',
  name: '温湿度传感器',
  property: {
    address: '192.168.1.100',
    port: '502',
    slaveid: '1'
  },
  polling: 1000,
  tags: {
    't_temp': FUXAClient.createModbusTag({
      id: 't_temp',
      name: '温度',
      type: 'Float32',
      memaddress: '400000',
      address: '1'
    }),
    't_humi': FUXAClient.createModbusTag({
      id: 't_humi',
      name: '湿度',
      type: 'Float32',
      memaddress: '400000',
      address: '3'
    })
  }
});

await client.setDevice(device);
console.log('设备创建成功！');
```

**S7 设备**：

```javascript
const s7Device = FUXAClient.createS7Device({
  id: 'd_s7_01',
  name: 'S7-1500 PLC',
  address: '192.168.1.200',
  rack: 0,
  slot: 1,
  tags: {
    't_speed': FUXAClient.createS7Tag({
      id: 't_speed',
      name: '速度',
      type: 'Float32',
      memaddress: 'DB1',
      address: 'DBD0'
    })
  }
});

await client.setDevice(s7Device);
```

**其他设备模板**：

- `createModbusRTU()` - Modbus 串口设备
- `createOPCUA()` - OPC UA 服务器
- `createBACnet()` - BACnet 楼宇设备
- `createEthernetIP()` - 罗克韦尔 PLC
- `createMELSEC()` - 三菱 PLC
- `createADS()` - 倍福 TwinCAT
- `createWebAPI()` - HTTP REST 接口
- `createFuxaServer()` - FUXA 内部通信
- `createODBC()` - 数据库连接
- `createRedis()` - Redis 缓存/消息

### 4.2 批量创建设备

```javascript
const devices = [
  FUXAClient.createModbusTCP({ name: '设备1', address: '192.168.1.100' }),
  FUXAClient.createModbusTCP({ name: '设备2', address: '192.168.1.101' })
];

const results = await client.setDevices(devices);
console.log('批量创建设备结果:', results);
```

### 4.3 查看设备状态

```javascript
// 单个设备状态
const status = await client.getDeviceConnectionStatus('d_modbus_01');
console.log('设备状态:', status.statusText); // '在线' | '离线' | '警告'

// 所有设备状态
const allStatus = await client.getAllDeviceConnectionStatus();
console.log('所有设备状态:', allStatus);
```

## 5. 标签操作

### 5.1 读取标签值

```javascript
// 读取单个标签
const values = await client.getTagValue(['t_temp']);
console.log('温度值:', values[0].value);

// 批量读取多个标签
const multipleValues = await client.getTagValue(['t_temp', 't_humi', 't_pressure']);
console.log('多个标签值:', multipleValues);
```

### 5.2 写入标签值

```javascript
// 写入单个标签
await client.setTagValue([{ id: 't_temp', value: 25.5 }]);

// 批量写入多个标签
await client.setTagValue([
  { id: 't_temp', value: 25.5 },
  { id: 't_humi', value: 60 }
]);
console.log('标签写入成功！');
```

## 6. 报警配置

### 6.1 创建报警

```javascript
await client.setAlarmDefinition({
  name: '温度报警',
  property: {
    variableId: 't_temp'
  },
  high: {
    enabled: true,
    min: 80,
    max: 100,
    checkdelay: 1,
    timedelay: 5,
    ackmode: 'float',
    text: '温度超过 80°C',
    group: '温度报警',
    bkcolor: '#ff8800',
    color: '#000000'
  },
  low: {
    enabled: true,
    min: 0,
    max: 20,
    checkdelay: 1,
    timedelay: 5,
    ackmode: 'float',
    text: '温度低于 0°C',
    group: '温度报警',
    bkcolor: '#0088ff',
    color: '#ffffff'
  },
  actions: {
    enabled: false,
    values: []
  }
});
console.log('报警配置成功！');
```

### 6.2 查看报警

```javascript
// 查看当前报警
const alarms = await client.getAlarms();
console.log('当前报警:', alarms);

// 查看报警历史
const history = await client.getAlarmsHistory(
  '2026-01-01T00:00:00Z',
  '2026-04-23T23:59:59Z'
);
console.log('报警历史:', history);
```

### 6.3 确认报警

```javascript
await client.ackAlarm('alarm_id');
console.log('报警已确认！');
```

## 7. 历史数据查询

```javascript
const from = new Date(Date.now() - 24*60*60*1000).toISOString(); // 24小时前
const to = new Date().toISOString(); // 现在
const tagIds = ['t_temp', 't_humi'];

const historyData = await client.getDaqData(from, to, tagIds);
console.log('历史数据:', historyData);
```

## 8. 系统管理

### 8.1 查看系统信息

```javascript
// 获取版本号
const version = await client.getVersion();
console.log('FUXA 版本:', version);

// 获取系统设置
const settings = await client.getSettings();
console.log('系统设置:', settings);
```

### 8.2 查看日志

```javascript
// 获取日志文件列表
const logFiles = await client.getLogFiles();
console.log('日志文件:', logFiles);

// 获取日志内容
const logContent = await client.getLogContent('fuxa.log');
console.log('日志内容:', logContent);
```

### 8.3 用户管理

```javascript
// 获取用户列表
const users = await client.getUsers();
console.log('用户列表:', users);

// 创建/更新用户
await client.setUsers([{
  username: 'newuser',
  password: 'password123',
  fullname: '新用户',
  groups: ['user']
}]);
console.log('用户创建成功！');
```

## 9. 高级功能

### 9.1 脚本执行

```javascript
// 执行脚本
const result = await client.runScript({
  name: 'test_script',
  content: 'console.log("Hello FUXA!"); return "Success";'
});
console.log('脚本执行结果:', result);
```

### 9.2 调度器管理

```javascript
// 获取调度器
const scheduler = await client.getScheduler('scheduler_01');
console.log('调度器:', scheduler);

// 设置调度器
await client.setScheduler('scheduler_01', {
  schedules: {},
  settings: {
    devices: [{ name: '设备1', variableId: 't_temp' }]
  }
});
console.log('调度器设置成功！');
```

### 9.3 报表生成

```javascript
// 生成报表
const report = await client.buildReport({
  name: '每日报表',
  template: 'default',
  from: '2026-04-22T00:00:00Z',
  to: '2026-04-23T23:59:59Z',
  tags: ['t_temp', 't_humi']
});
console.log('报表生成成功:', report);
```

## 10. 常见问题

### 10.1 连接问题

**问题**：连接 FUXA 服务器失败
**解决**：

- 检查 FUXA 服务器是否运行
- 确认服务器地址和端口正确
- 检查网络连接
- 验证用户名密码是否正确

### 10.2 设备配置问题

**问题**：Modbus 设备无法连接
**解决**：

- 确认 `slaveid` 字段名正确（全小写）
- 端口号必须是字符串类型（如 `'502'`）
- 检查 IP 地址和从站 ID 是否正确

**问题**：S7 设备无法连接
**解决**：

- 确保 `rack` 和 `slot` 参数正确设置
- 检查 PLC 是否允许远程访问
- 验证网络连接

### 10.3 标签读取问题

**问题**：标签值显示错误
**解决**：

- 检查标签数据类型是否正确
- 确认 `memaddress` 和 `address` 设置正确
- 对于 Modbus，检查寄存器类型和偏移量
- 对于 S7，检查地址格式（如 `DB1.DBD0`）

### 10.4 权限问题

**问题**：API 调用返回 401 错误
**解决**：

- 确保已登录并获取了有效的 Token
- 检查用户权限是否足够
- 验证 API Key 是否正确

## 11. API 参考

### 11.1 认证相关

| 方法                          | 说明           |
| ----------------------------- | -------------- |
| `login(username, password)` | 登录获取 Token |
| `logout()`                  | 登出           |
| `refreshToken()`            | 刷新 Token     |
| `heartbeat()`               | 心跳检测       |

### 11.2 设备管理

| 方法                                    | 说明                 |
| --------------------------------------- | -------------------- |
| `getDevices()`                        | 获取所有设备         |
| `getDevice(deviceId)`                 | 获取单个设备         |
| `setDevice(device)`                   | 创建/更新设备        |
| `removeDevice(deviceId)`              | 删除设备             |
| `setDevices(devices)`                 | 批量创建设备         |
| `removeDevices(deviceIds)`            | 批量删除设备         |
| `getDeviceConnectionStatus(deviceId)` | 获取设备连接状态     |
| `getAllDeviceConnectionStatus()`      | 获取所有设备连接状态 |

### 11.3 标签操作

| 方法                     | 说明           |
| ------------------------ | -------------- |
| `getTagValue(tagIds)`  | 读取标签值     |
| `setTagValue(tags)`    | 写入标签值     |
| `getTagsValue(tagIds)` | 批量读取标签值 |
| `setTagsValue(tags)`   | 批量写入标签值 |

### 11.4 报警管理

| 方法                                     | 说明          |
| ---------------------------------------- | ------------- |
| `getAlarms(filter)`                    | 获取当前报警  |
| `getAlarmsHistory(start, end, filter)` | 获取报警历史  |
| `ackAlarm(alarmId)`                    | 确认报警      |
| `clearAlarms()`                        | 清除报警      |
| `getAlarmDefinitions()`                | 获取报警定义  |
| `setAlarmDefinition(alarm)`            | 创建/更新报警 |
| `removeAlarmDefinition(alarmName)`     | 删除报警      |
| `setAlarmDefinitions(alarms)`          | 批量创建报警  |

### 11.5 历史数据

| 方法                             | 说明         |
| -------------------------------- | ------------ |
| `getDaqData(from, to, tagIds)` | 查询历史数据 |

### 11.6 系统管理

| 方法                         | 说明             |
| ---------------------------- | ---------------- |
| `getSettings()`            | 获取系统设置     |
| `updateSettings(settings)` | 更新系统设置     |
| `getVersion()`             | 获取版本号       |
| `getLogFiles()`            | 获取日志文件列表 |
| `getLogContent(filename)`  | 获取日志内容     |
| `sendTestMail(smtp, msg)`  | 发送测试邮件     |

### 11.7 用户管理

| 方法                       | 说明              |
| -------------------------- | ----------------- |
| `getUsers()`             | 获取用户列表      |
| `setUsers(users)`        | 创建/更新用户     |
| `deleteUser(username)`   | 删除用户          |
| `getRoles()`             | 获取角色列表      |
| `setRoles(roles)`        | 创建/更新角色     |
| `deleteRoles(roleNames)` | 删除角色          |
| `getApiKeys()`           | 获取 API Key 列表 |
| `setApiKeys(apiKeys)`    | 创建/更新 API Key |
| `deleteApiKeys(keyIds)`  | 删除 API Key      |

### 11.8 其他功能

| 方法                                         | 说明             |
| -------------------------------------------- | ---------------- |
| `runScript(script, toLogEvent)`            | 执行脚本         |
| `runSysFunction(functionName, parameters)` | 执行系统函数     |
| `getScheduler(schedulerId)`                | 获取调度器       |
| `setScheduler(schedulerId, data)`          | 设置调度器       |
| `deleteScheduler(schedulerId)`             | 删除调度器       |
| `queryReports(query)`                      | 查询报表         |
| `buildReport(reportConfig)`                | 生成报表         |
| `removeReport(fileName)`                   | 删除报表文件     |
| `getReportFiles(name)`                     | 获取报表文件列表 |
| `getEventsHistory(query)`                  | 获取事件历史     |
| `clearEventsHistory()`                     | 清除事件历史     |

## 12. 设备模板参数

### 12.1 Modbus TCP 模板

```javascript
FUXAClient.createModbusTCP({
  id: 'd_modbus_01',       // 设备 ID
  name: '设备名称',         // 设备名称
  property: {
    address: '192.168.1.100', // IP 地址
    port: '502',              // 端口字符串
    slaveid: '1'              // 从站 ID 字符串（字段名全小写）
  },
  polling: 1000,              // 轮询间隔（毫秒）
  enabled: true,              // 是否启用
  tags: {}                    // 标签配置
});
```

### 12.2 S7 模板

```javascript
FUXAClient.createS7Device({
  id: 'd_s7_01',           // 设备 ID
  name: 'S7-1500',         // 设备名称
  address: '192.168.1.200', // IP 地址
  rack: 0,                 // 机架号
  slot: 1,                 // 槽号
  polling: 1000,           // 轮询间隔
  enabled: true,           // 是否启用
  tags: {}                 // 标签配置
});
```

### 12.3 其他模板参数

- **OPC UA**：`endpoint`, `username`, `password`
- **BACnet**：`address`, `port`
- **EthernetIP**：`address`
- **MELSEC**：`address`, `port`, `protocol`
- **ADS**：`address`, `netId`, `port`
- **WebAPI**：`address`, `method`, `headers`, `body`
- **Redis**：`address`, `port`, `db`, `username`, `password`

## 13. 标签模板参数

### 13.1 Modbus 标签

```javascript
FUXAClient.createModbusTag({
  id: 't_temp',            // 标签 ID
  name: '温度',            // 标签名称
  type: 'Float32',         // 数据类型
  address: '1',            // 偏移地址（1-based）
  memaddress: '400000',    // 固定寄存器类型基址
  value: 0,                // 初始值
  write: true              // 是否可写
});
```

### 13.2 S7 标签

```javascript
FUXAClient.createS7Tag({
  id: 't_speed',           // 标签 ID
  name: '速度',            // 标签名称
  type: 'Float32',         // FUXA 数据模型中的 32 位浮点类型
  address: 'DBD0',         // 地址
  memaddress: 'DB1',       // DB 块
  value: 0,                // 初始值
  write: true              // 是否可写
});
```

## 14. 数据类型参考

### 14.1 Modbus 数据类型

| 类型      | 字节数 | 说明             |
| --------- | ------ | ---------------- |
| Bool      | 1      | 布尔值           |
| Int16     | 2      | 有符号 16 位整数 |
| UInt16    | 2      | 无符号 16 位整数 |
| Int32     | 4      | 有符号 32 位整数 |
| UInt32    | 4      | 无符号 32 位整数 |
| Float32   | 4      | 32 位浮点数      |
| Float64   | 8      | 64 位双精度浮点  |
| String    | 1      | ASCII 字符串     |
| Int16LE   | 2      | 小端有符号 16 位 |
| Float32LE | 4      | 小端 32 位浮点   |

### 14.2 S7 数据类型

| 类型    | 字节数 | 说明             |
| ------- | ------ | ---------------- |
| BOOL    | 1      | 布尔值           |
| BYTE    | 1      | 无符号 8 位      |
| WORD    | 2      | 无符号 16 位     |
| DWORD   | 4      | 无符号 32 位     |
| INT     | 2      | 有符号 16 位整数 |
| DINT    | 4      | 有符号 32 位整数 |
| Float32 | 4      | 32 位浮点数      |
| CHAR    | 1      | ASCII 字符       |

## 15. 上游仓库与本地维护

上游参考仓库：<https://github.com/HugeShao/Fuxa-automation-skill>

截至 2026-08-26 的核查结果：

- `main` 是唯一分支，暂无 tag、Release 或正式版本号。
- 仓库共有 3 次提交，最新提交 `2ba8220`（2026-04-23），内容主要是完善 README 示例。
- 当前仓库文件以 `skills/references` 下的基础技能、数据模型、设备模板、报警模板、配置模板和脚本模板为主，没有发现 2026-04-23 之后的新增功能提交。
- 本项目已经在 `.trae/skills/fuxa-automation` 中维护了适配 FUXA PRO 1.3.4-PRO 的 API 客户端、数据模型、报警模板、插件接口和部署约束，不能直接用上游文件覆盖本地版本。

后续维护规则：

1. 上游只作为功能参考，不作为自动同步源。
2. 每次评估上游时先记录最新 commit、分支、tag/release 和文件清单，再逐项比较本地实现。
3. 通用能力可以吸收，但必须按当前 FUXA PRO API 和 `references/data-models.md` 校验后再合并。
4. FUXA PRO 专用路由、插件持久化路径、Node-RED、Headless EXE 和兼容性修复只在本地维护，不回写为上游假设。
5. 新增功能应同步更新 `.trae/skills/fuxa-automation/SKILL.md`、对应 references 和本手册，并完成 API 回归验证。

## 16. 联系与支持

- **技术支持 QQ**：2492123056
- **FUXA 官方文档**：https://frangoteam.github.io/fuxa/
- **GitHub 仓库**：https://github.com/frangoteam/FUXA

---

**版本**：2.1.0（文档版本）
**更新日期**：2026-08-26
**适用产品版本**：FUXA PRO 1.3.4-PRO 及兼容版本

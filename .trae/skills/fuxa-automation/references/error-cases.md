---
name: FUXA Error Cases
description: FUXA 常见错误案例库 - 错误现象、根因分析、解决方案
type: reference
lastUpdated: 2026-05-12
---

# FUXA 错误案例库

> 本文档记录实际调试中遇到的错误案例，用于快速定位和解决问题。
> 每个案例包含：**现象 → 根因 → 解决方案 → 预防措施**。

---

## 案例 1: 寄存器类型下拉框为空

### 现象
- 打开标签属性对话框，"注册"字段显示为空
- 下拉框无法选择任何选项
- 其他字段（名称、类型、地址）正常显示

### 根因
**`memaddress` 字段类型错误**

FUXA 前端使用 `mat-select` 组件绑定 `tagMemoryAddress`，其选项值为字符串：
```typescript
// tag-property-edit-modbus.component.ts
memAddress = {
    'Coil Status (Read/Write 000001-065536)': '000000',
    'Digital Inputs (Read 100001-165536)': '100000',
    'Input Registers (Read 300001-365536)': '300000',
    'Holding Registers (Read/Write 400001-465535)': '400000'  // 必须是字符串！
};
```

当 `memaddress` 是数字（如 `400000`）时，无法匹配任何选项值。

### 错误示例
```json
{ "memaddress": 400000 }        // ❌ 数字类型
{ "memaddress": "4X101" }      // ❌ 格式错误
```

### 正确示例
```json
{ "memaddress": "400000" }     // ✅ 字符串类型
```

### 解决方案

**方法1: 使用工具函数自动修复**
```javascript
const utils = require('./modbus-tag-utils.js');
await utils.fixAllTagFieldTypes('d_xxx');
```

**方法2: 手动修复单个标签**
```javascript
// 从数据库读取
const device = await getDeviceFromDb('d_xxx');
// 修复所有标签
for (const tag of Object.values(device.tags)) {
    if (typeof tag.memaddress !== 'string') {
        tag.memaddress = String(tag.memaddress);
    }
}
// 写回数据库
await updateDeviceInDb('d_xxx', device);
```

### 预防措施
```javascript
// 使用 createModbusTag() 创建标签，自动保证类型正确
const tag = utils.createModbusTag({
    id: 't_d0_0100',
    name: '合模1压力1',
    fuxaAddress: '4X101'
});
// 自动生成: { memaddress: "400000", address: 101, ... }
```

---

## 案例 2: 地址偏移错误（差1位）

### 现象
- FUXA 读取的值与 PLC 实际值不一致
- 地址显示正确但数据错位
- 例如：D100 的数据显示 D99 的内容

### 根因
**`address` 字段使用了 0-based 偏移而非 1-based**

FUXA Modbus 驱动内部会进行 `-1` 转换：
```javascript
// modbus/index.js 内部逻辑
const actualAddress = tag.address - 1;  // 如果 address=101，实际读100
```

如果传入 `address=100`（0-based），实际会读 `99`，导致偏移。

### 错误示例
```json
// CSV标注: D100 对应 4X101
{ "address": 100 }        // ❌ 0-based偏移
{ "address": "101" }      // ❌ 字符串类型
```

### 正确示例
```json
// D100 → address=101 (+1)
{ "address": 101 }        // ✅ 数字类型，1-based偏移
```

### 地址转换规则

| PLC地址 | FUXA格式 | memaddress | address |
|---------|---------|------------|---------|
| D0 | 4X1 | `"400000"` | 1 |
| D100 | 4X101 | `"400000"` | 101 |
| D200 | 4X201 | `"400000"` | 201 |
| D65535 | 4X65536 | `"400000"` | 65536 |

### 解决方案
```javascript
// 使用标准转换函数
function plcAddrToFuxa(plcAddr) {
    // D100 → { memaddress: "400000", address: 101 }
    return {
        memaddress: "400000",
        address: plcAddr + 1  // +1 转为 1-based
    };
}
```

---

## 案例 3: 除数不生效

### 现象
- 界面显示原始整数值（如 1234）
- 应该显示工程值（如 12.34）
- divisor 字段已设置但未生效

### 根因
**使用了错误的字段名**

FUXA 有两个相关字段：
- `divisor`: 用于简单除法缩放 ✅ 正确
- `scale`: 用于复杂表达式缩放（线性/公式）

之前错误地使用了 `scale` 字段，而界面读取的是 `divisor`。

### 错误示例
```json
{ "scale": { mode: "linear", rawLow: 0, rawHigh: 10000 } }  // ❌ 复杂方式
```

### 正确示例
```json
{ "divisor": 10 }           // ✅ 简单除法
{ "divisor": 100 }          // ✅ 流量参数
{ "divisor": null }         // ✅ 无缩放
```

### 除数参考表

| 参数类型 | divisor | 示例计算 |
|---------|---------|---------|
| 压力 [bar] | 10 | 1234 ÷ 10 = 123.4 bar |
| 时间 [ms] | 10 | 500 ÷ 10 = 50 ms |
| 流量 [L/min] | 100 | 2500 ÷ 100 = 25 L/min |
| 温度 [°C] | 10 | 256 ÷ 10 = 25.6 °C |
| 位置 [mm] | null | 1234 = 1234 mm |

### 解决方案
```javascript
// 自动根据标签名设置除数
function autoSetDivisor(tagName) {
    if (tagName.includes('流量')) return 100;
    if (tagName.includes('压力') || tagName.includes('时间')) return 10;
    return null;  // 其他不设置
}
```

---

## 案例 4: 设备加载报错 Items undefined

### 现象
- FUXA 服务启动时大量报错：
  ```
  [ERR] 'modbus' load error! TypeError: Cannot read properties of undefined (reading 'Items')
  ```
- 设备显示离线状态
- 无法读取任何标签值

### 根因
**设备配置缺少必要字段**

Modbus 设备需要以下字段才能正常初始化：
- `driver`: 驱动标识（必须为 `"modbus"`）
- `hasCustomTags`: 是否有自定义标签（`true`）
- `settings`: 连接配置对象（IP、端口等）

当这些字段缺失时，驱动初始化失败。

### 错误示例
```json
{
    "id": "d_xxx",
    "name": "modbus",
    "type": "ModbusTCP"
    // 缺少 driver, hasCustomTags, settings
}
```

### 正确示例
```json
{
    "id": "d_xxx",
    "name": "modbus",
    "type": "ModbusTCP",
    "driver": "modbus",                    // ✅ 必须
    "hasCustomTags": true,                 // ✅ 必须
    "settings": {                          // ✅ 必须
        "ipaddress": "127.0.0.1",
        "port": 502,
        "slaveid": 1,
        "timeout": 5000,
        "interval": 1000,
        "reconnect": 5000,
        "debug": false,
        "usertag": false
    },
    "tags": { ... }
}
```

### 解决方案

**直接修复数据库**：
```javascript
async function fixDeviceConfig(deviceId) {
    const device = await getDeviceFromDb(deviceId);
    
    // 补全缺失字段
    if (!device.driver) device.driver = 'modbus';
    if (device.hasCustomTags === undefined) device.hasCustomTags = true;
    if (!device.settings) {
        device.settings = {
            ipaddress: '127.0.0.1',
            port: 502,
            slaveid: 1,
            timeout: 5000,
            interval: 1000,
            reconnect: 5000,
            debug: false,
            usertag: false
        };
    }
    
    await updateDeviceInDb(deviceId, device);
    console.log('设备配置已修复');
}
```

---

## 案例 5: 数据类型导致数值异常

### 现象
- 读取的数值完全错误（如温度显示几万）
- 数值在合理范围内但符号相反
- 浮点数显示为整数

### 根因
**使用了错误的 `type` 字段值**

不同字节序对应不同的类型后缀：

| 实际情况 | 正确 type | 错误 type | 后果 |
|---------|----------|----------|------|
| 大端16位整数 | `Int16` | `Int16LE` | 高低字节颠倒 |
| 小端32位浮点 | `Float32MLE` | `Float32` | 数值完全错误 |
| 中小端32位浮点 | `Float32MLE` | `Float32LE` | 数值异常 |

### 常见映射错误

| 文档描述 | 错误写法 | 正确写法 | 说明 |
|---------|---------|---------|------|
| 整型 | `Int32` | `Int32MLE` | 默认用MLE |
| 浮点型 | `Float32` | `Float32MLE` | 默认用MLE |
| 双整型 | `Int32` | `Int32MLE` | 同上 |
| 无符号整型 | `UInt` | `UInt16` | 全称 |

### 解决方案
```javascript
// 标准化数据类型
function normalizeDataType(rawType) {
    const map = {
        'Int32': 'Int32MLE',
        'UInt': 'UInt16',
        'Int': 'Int16',
        'Float': 'Float32',
        'Double': 'Float64',
        'Bool': 'Bool'
    };
    return map[rawType] || rawType;
}
```

---

## 案例 6: API 更新后界面不刷新

### 现象
- 通过 REST API 修改了标签配置
- 但 FUXA 界面仍显示旧值
- 刷新页面后才能看到更新

### 根因
**API 只更新了内存和数据库，前端需要手动刷新**

FUXA 的架构：
```
API 修改 → 内存中的 project 对象 → 持久化到 SQLite
                                        ↓
前端界面 ← WebSocket 推送（部分场景）或 手动刷新
```

不是所有修改都会触发 WebSocket 推送。

### 解决方案
```javascript
// 修改完成后提示用户刷新
async function updateAndNotify(deviceId, changes) {
    await updateDeviceTags(deviceId, changes);
    
    console.log('\n========================================');
    console.log('✅ 配置已更新！');
    console.log('⚠️  请在浏览器中按 Ctrl+F5 强制刷新页面');
    console.log('========================================\n');
}
```

---

## 案例 7: 数据库路径错误

### 现象
- 脚本报错 `❌ 数据库不存在`
- `MODULE_NOT_FOUND: sqlite3` 模块找不到
- 工具函数无法连接到 FUXA 数据库

### 根因
**FUXA 使用两个不同的数据目录，容易混淆**

| 目录 | 用途 | 关键文件 |
|------|------|---------|
| `server/_appdata/` | **项目配置数据** ⭐ | `project.fuxap.db`（设备+标签） |
| `server/_db/` | **运行时历史数据** | `daq-data_*.db`（DAQ记录） |

文档或脚本中错误地使用了 `_db/` 路径访问项目配置。

### 错误示例
```javascript
// ❌ 错误：DAQ历史目录，不包含设备配置
const DB_PATH = 'server/_db/project.fuxap.db';

// ❌ 错误：sqlite3模块在 server/node_modules 中
// 在根目录运行时 require('sqlite3') 会失败
```

### 正确示例
```javascript
// ✅ 正确：项目配置在 _appdata 目录
const DB_PATH = 'server/_appdata/project.fuxap.db';

// ✅ 正确：自动回退查找 sqlite3 模块
let sqlite3;
try {
    sqlite3 = require('sqlite3').verbose();
} catch (e) {
    // 从 server/node_modules 加载
    const serverPath = path.resolve(__dirname, '..', '..', '..', '..');
    sqlite3 = require(path.join(serverPath, 'server', 'node_modules', 'sqlite3')).verbose();
}
```

### 快速验证方法

```bash
# 确认数据库文件存在
dir server\_appdata\project.fuxap.db

# 确认 DAQ 历史数据目录
dir server\_db\daq-data_*.db

# 用 sqlite3 直接查询（确认文件有效）
sqlite3 server\_appdata\project.fuxap.db "SELECT count(*) FROM devices;"
```

### 解决方案

使用工具库中的路径常量（已自动处理）：
```javascript
const utils = require('./modbus-tag-utils.js');
console.log(utils.PROJECT_DB);  // 自动解析为正确路径
```

---

## 案例 8: 导航按钮添加后不显示（⭐ 高频错误）

### 现象
- 通过脚本或API添加了导航按钮到视图
- 数据库中确认items字段已更新
- 但界面中完全看不到添加的按钮
- 已有的用户手动添加的按钮可以正常显示

### 根因
**只更新了 `items` 字段，未同步更新 `svgcontent` 字段**

FUXA 组件渲染机制：
```
组件显示 = items（配置数据） + svgcontent（SVG DOM元素）
           ↓                        ↓
        属性、事件、绑定          实际可见的HTML/SVG结构
```

**两个字段必须同时存在且ID一致，组件才能显示！**

### 错误示例

```javascript
// ❌ 错误做法：只修改 items
const view = JSON.parse(row.value);
view.items['HXB_new'] = {
    id: 'HXB_new',
    type: 'svg-ext-html_button',
    name: '导航',
    property: { events: [...] },
    label: 'HtmlButton'
};
// ❌ 缺失：没有在 svgcontent 中添加对应的 <g> 元素
db.run("UPDATE views SET value = ?", [JSON.stringify(view), rowid]);
```

**结果**：数据库有配置，但界面无显示

### 正确示例

```javascript
// ✅ 正确做法：同时更新 items 和 svgcontent
const view = JSON.parse(row.value);

// 1. 添加到 items（配置数据）
view.items['HXB_new'] = {
    id: 'HXB_new',
    type: 'svg-ext-html_button',
    name: '导航',
    property: {
        ranges: [{ min: 20, max: 80, color: '', type: 2, stroke: '' }],
        events: [{
            type: 'click',
            action: 'onpage',
            actparam: 'v_target_id',  // 目标视图ID
            actoptions: {}
        }],
        actions: []
    },
    label: 'HtmlButton',
    hide: false,
    lock: false
};

// 2. 添加到 svgcontent（SVG渲染元素）
if (view.svgcontent) {
    // 在 </g></svg> 结束标签之前插入按钮的SVG
    const svgEnd = view.svgcontent.lastIndexOf('</g>\n</svg>');
    if (svgEnd > -1) {
        const btnSVG = ` <g stroke="rgba(0,0,0,0)" fill="rgba(0,0,0,0)" 
                             type="svg-ext-html_button" 
                             id="HXB_new">
   <rect id="svg_abc123" height="32" width="100" y="592" x="100" stroke-width="0"/>
   <foreignObject id="H-HXB_def456" width="100" height="32" y="592" x="100">     
    <BUTTON style="width:calc(100% - 6px);height:calc(100% - 6px);
               text-align:center;background-color:#FFFFFF;color:#000000;
               font-size:14px;font-family:sans-serif;" 
             class="md-btn md-btn-raised" 
             id="B-HXB_new">导航</BUTTON>  <!-- ⚠️ 注意 B- 前缀 -->
   </foreignObject>
  </g>`;
        
        view.svgcontent = view.svgcontent.substring(0, svgEnd) + 
                         btnSVG + '\n' + 
                         view.svgcontent.substring(svgEnd);
    }
}

// 3. 保存到数据库
db.run("UPDATE views SET value = ?", [JSON.stringify(view), rowid]);
```

### 关键要点

#### 1. SVG元素必须包含完整结构

```xml
<g type="svg-ext-html_button" id="HXB_xxx">     <!-- 外层容器，id与items一致 -->
   <rect ... />                                   <!-- 背景矩形 -->
   <foreignObject ...>                            <!-- HTML容器 -->
      <BUTTON id="B-HXB_xxx" ...>文字</BUTTON>   <!-- ⚠️ 按钮必须有B-前缀！ -->
   </foreignObject>
</g>
```

#### 2. ID对应关系

| 位置 | ID格式 | 示例 | 说明 |
|------|--------|------|------|
| items对象键 | 任意 | `'HXB_xxx'` | 对象属性名 |
| items.id | 与键相同 | `"HXB_xxx"` | 必须与键一致 |
| svgcontent `<g>` | 与items.id相同 | `id="HXB_xxx"` | **必须匹配！** |
| svgcontent `<foreignObject>` | `H-` + 随机ID | `id="H-HXB_abc"` | FUXA内部使用 |
| svgcontent `<BUTTON>` | **`B-` + 随机ID** | `id="B-HXB_def"` | **必须有B-前缀！** |

#### 3. 常见遗漏点

❌ **最易犯的错误**：
```javascript
// 只改了这里 ↓
view.items['HXB_new'] = config;

// 忘记改这里 ↓ （导致不显示）
// view.svgcontent = ...  ← 漏掉这行！
```

❌ **ID不一致**：
```javascript
view.items['HXB_123'].id = 'HXB_123';       // items中是 HXB_123
// 但SVG中却是：
// <g id="HXB_456">...                       // 不一致 → 无法交互
```

❌ **缺少B-前缀**：
```html
<BUTTON id="HXB_123">按钮</BUTTON>   <!-- ❌ 无B前缀 → 点击无效 -->
<BUTTON id="B-HXB_123">按钮</BUTTON> <!-- ✅ 正确 -->
```

### 排查步骤

当按钮不显示时，按以下顺序检查：

```bash
# 1️⃣ 检查items中是否有该按钮
sqlite3 _appdata/project.fuxap.db \
  "SELECT value FROM views WHERE rowid=1" | \
  grep -o "HXB_new"

# 2️⃣ 检查svgcontent中是否有对应的<g>元素
sqlite3 _appdata/project.fuxap.db \
  "SELECT value FROM views WHERE rowid=1" | \
  grep -o 'id="HXB_new"'

# 3️⃣ 确认两个ID完全一致
# items: "id": "HXB_new"
# svg: <g id="HXB_new">

# 4️⃣ 对于按钮，确认有B-前缀
# <BUTTON id="B-HXB_new">
```

### 解决方案工具函数

```javascript
/**
 * 安全地添加组件到视图（自动处理双字段）
 */
function addComponentToView(view, itemId, itemConfig, svgElement) {
    if (!view.items) view.items = {};
    
    // 1. 添加到items
    view.items[itemId] = itemConfig;
    
    // 2. 验证并添加到svgcontent
    if (!view.svgcontent) {
        console.error('❌ 视图缺少svgcontent字段');
        return false;
    }
    
    const svgEnd = view.svgcontent.lastIndexOf('</g>\n</svg>');
    if (svgEnd === -1) {
        console.error('❌ 无法找到SVG结尾标记');
        return false;
    }
    
    // 插入SVG元素
    view.svgcontent = 
        view.svgcontent.substring(0, svgEnd) + 
        '\n' + svgElement + '\n' + 
        view.svgcontent.substring(svgEnd);
    
    console.log(`✅ 组件 ${itemId} 已添加到 items 和 svgcontent`);
    return true;
}
```

### 预防措施

1. **始终使用封装函数**：不要手动操作单个字段
2. **添加后立即验证**：检查两个字段是否都更新成功
3. **参考已有组件**：复制用户手动创建的按钮结构作为模板
4. **单元测试**：在测试环境验证后再应用到生产环境

### 相关文档
- [SKILL.md - FUXA组件核心机制](../SKILL.md#fuxa组件核心机制双字段渲染重要)
- [plan-a-header-implementation.md](../../docs/plan-a-header-implementation.md)

---

## 快速诊断流程图

```
遇到问题时，按此顺序检查：

┌─────────────────────────────────────────┐
│ 0. 数据库能否连接？                       │
│    → 确认路径是 _appdata 不是 _db        │
│    → 确认在 server/ 目录下运行           │
├─────────────────────────────────────────┤
│ 1. 寄存器类型为空？                       │
│    → 检查 memaddress 是否为字符串         │
│    → 运行 fixAllTagFieldTypes()          │
├─────────────────────────────────────────┤
│ 2. 数据值偏移/错位？                      │
│    → 检查 address 是否为 1-based         │
│    → D100 应该是 address=101             │
├─────────────────────────────────────────┤
│ 3. 除数不生效？                           │
│    → 使用 divisor 字段，不是 scale        │
│    → 压力/时间=10, 流量=100              │
├─────────────────────────────────────────┤
│ 4. 设备报错？                             │
│    → 检查 driver/settings 字段是否完整    │
│    → 运行 diagnoseModbusConnection()     │
├─────────────────────────────────────────┤
│ 5. 数值异常？                             │
│    → 检查 type 字段是否匹配字节序         │
│    → Int32→Int32MLE, Float32→Float32MLE  │
└─────────────────────────────────────────┘
```

---

## 一键修复脚本索引

| 问题 | 脚本/函数 | 用法 |
|------|---------|------|
| 所有标签字段类型错误 | `fixAllTagFieldTypes(id)` | `await utils.fixAllTagFieldTypes('d_xxx')` |
| 设备配置缺失 | `fix-device.js` | `node server/fix-device.js` |
| 批量导入CSV | `importTagsToDatabaseFromCsv()` | 见文档示例 |
| 项目完整性检查 | `validate-project.js` | `node validate-project.js` |
| 单个标签验证 | `validateTag(tag)` | 返回 `{valid, errors, warnings}` |

---

*最后更新: 2026-05-12*
*基于实战经验整理，持续更新中...*
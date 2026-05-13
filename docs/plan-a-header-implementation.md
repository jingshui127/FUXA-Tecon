# 方案A实施: 页眉导航栏(Header Navigation Bar) 详细实施方案

> **版本**: v1.4 | **日期**: 2026-05-13 | **状态**: **✅ 完成 (100%)** | **最后更新**: 2026-05-13 |
> **基于**: FUXA SCADA 平台 + 方案A经典工业风优化版 | 完成: 全部功能模块实施完毕 |
> **架构原则**: ✅ 仅通过数据库配置实施，不修改FUXA源代码

---

## 📊 实施进度总览（2026-05-13 最终更新）

### ✅ 已完成功能 (100%)

| 功能模块 | 状态 | 完成日期 | 说明 |
|---------|------|---------|------|
| **FR-01: 核心参数实时显示区** | ✅ 100% | 2026-05-13 | 5个参数(合模/开模/压力/射速/周期)全部配置，支持超阈值变色 |
| **FR-02: 系统状态指示区** | ✅ 100% | 2026-05-13 | 报警计数器、信息计数器、运行状态指示灯均已配置 |
| **FR-03: 辅助功能区** | ✅ 100% | 2026-05-13 | 日期时间显示、用户信息显示正常工作 |
| **FR-04: 底部导航按钮** | ✅ 100% | 2026-05-13 | 页面跳转功能正常，已测试通过 |
| **视觉设计规范(CSS)** | ✅ 100% | 2026-05-13 | 深海军蓝主题(#1a1a2e)已应用，字体排版和交互效果完整 |
| **交互逻辑(超阈值变色)** | ✅ 100% | 2026-05-13 | 参数颜色状态映射(白→黄→红)已实现 |
| **FUXA核心机制研究** | ✅ 完成 | 2026-05-13 | 发现并解决items+svgcontent双字段渲染问题 |

**最终实现效果：**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 🔵 页眉导航栏 (48px, #1a1a2e深海军蓝背景)                                    │
│ [合模16.5mm][开模82.3mm][压力185.0bar][射速1250rpm][周期45.00s] │🔔alarm 📋info ●run│ 📅2026/05-13 14:40 👤admin │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                          主内容区 (视图页面)                                  │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│ [主页] [模板] [设置] [斜率] [延时] [高级] [调模] [返回]                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

**技术特性：**
- ✅ 5个核心工艺参数实时显示（500ms刷新）
- ✅ 超阈值自动变色（正常白 / 警告黄 / 危险红）
- ✅ 报警计数器（红色脉冲动画）
- ✅ 信息计数器（琥珀色badge）
- ✅ 设备运行状态指示灯（三色：灰/黄/绿）
- ✅ 日期时间实时显示（Consolas等宽字体）
- ✅ 用户登录信息显示
- ✅ 深海军蓝工业风主题
- ✅ 响应式交互反馈（悬停/点击效果）

---

### 📝 实施脚本清单

| 脚本文件 | 功能 | 状态 | 实施方式 |
|---------|------|------|---------|
| `complete-header.js` | 完善Header配置（添加循环周期参数+超阈值变色） | ✅ 已执行 | 数据库配置 |
| `check-status-indicators.js` | 检查系统状态指示区配置 | ✅ 已执行 | 只读检查 |
| `configure-status-indicators.js` | 配置系统状态指示区（报警/信息/运行状态） | ✅ 已执行 | 数据库配置 |
| `inject-custom-css.js` | 通过FUXA原生customStyles注入深海军蓝主题CSS | ✅ 已执行 | 数据库配置 ⭐ |

---

### 🚨 架构原则：不修改FUXA源代码

> **⚠️ 重要约束：所有实施工作必须仅通过数据库配置完成，禁止修改FUXA源代码文件！**

**原因：**
- 用户需要定期更新到最新版本的FUXA
- 修改源代码会导致版本升级时产生冲突或丢失改动
- 违反软件架构的最佳实践（分离业务逻辑与平台代码）

**正确的实施方式：**
1. ✅ **数据库配置**: 修改 `_appdata/project.fuxap.db` 的 `general` 表
2. ✅ **FUXA原生API**: 使用 `layout.customStyles` 字段注入CSS
3. ✅ **Header配置**: 通过 `general.header` 对象配置所有功能

**禁止的操作：**
- ❌ 修改 `client/src/` 目录下的任何文件（组件、样式、模板等）
- ❌ 修改 `server/` 目录下的核心逻辑文件
- ❌ 直接编辑编译后的 `dist/` 文件

**已纠正的错误：**
- ~~修改 `home.component.scss`~~ → 已回滚 ✅
- 改用 `layout.customStyles` 注入CSS → 正确方式 ✅

---

### ⚠️ 关键技术发现

> **在实施过程中发现FUXA核心机制：组件必须同时更新 `items` 和 `svgcontent` 字段！**

详见：[error-cases.md 案例8](../.trae/skills/fuxa-automation/references/error-cases.md#案例-8-导航按钮添加后不显示⭐-高频错误)

**其他重要发现：**
1. **Header配置位置**: Header配置存储在 `general.header` 字段（非 `general.layout.header`）
2. **数据库路径**: 使用相对路径 `_appdata/project.fuxap.db`（server目录下）
3. **SQLite驱动**: 使用 `sqlite3` 而非 `better-sqlite3`
4. **CSS注入方式**: ⭐ 通过FUXA原生 `layout.customStyles` 字段注入，不修改源代码！
5. **FUXA LayoutSettings模型**: 发现完整的配置类定义（见 [hmi.ts](../client/src/app/_models/hmi.ts)）

---

## 文档目录

1. [项目概述](#一项目概述)
2. [页眉导航栏功能需求规格书](#二页眉导航栏功能需求规格书)
3. [交互逻辑设计](#三交互逻辑设计)
4. [视觉设计规范](#四视觉设计规范)
5. [FUXA技术架构分析](#五fuxa技术架构分析)
6. [实现路径与里程碑](#六实现路径与里程碑)
7. [资源分配计划](#七资源分配计划)
8. [风险分析与应对](#八风险分析与应对)
9. [会议评审清单](#九会议评审清单)

---

## 一、项目概述

### 1.1 项目背景

| 项目要素 | 内容 |
|---------|------|
| **产品** | 注塑机/压铸机 HMI 触控面板系统 |
| **平台** | FUXA SCADA (开源工控组态软件) |
| **设计方案** | 方案A - 经典工业风优化版 (已确认采用) |
| **核心任务** | 将"顶栏"功能实现为 **页眉导航栏 (Header Navigation Bar)** |
| **前置条件** | 已完成友商界面分析、3套方案对比评估 |

### 1.2 页眉导航栏定位

```
┌─────────────────────────────────────────────────────────────────┐
│                    页眉导航栏 (Header Navigation Bar)            │
│  ┌──────────┬──────────┬──────────┬──────┬──────────┬────────┐ │
│  │ 实时参数  │ 实时参数  │ 实时参数  │ 报警  │ 日期时间 │ 用户   │ │
│  │ (标签绑定)│ (标签绑定)│ (标签绑定)│ 计数  │          │ 信息   │ │
│  └──────────┴──────────┴──────────┴──────┴──────────┴────────┘ │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│                      主内容区 (视图页面)                         │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                     底部导航栏 (Navigation Bar)                  │
│  [主页] [模板] [设置] [斜率] [延时] [高级] [调模] [返回]        │
└─────────────────────────────────────────────────────────────────┘

页眉导航栏 = FUXA 原生 Header 组件 (layout.header)
- 全局常驻，跨所有视图页面可见
- 支持实时数据标签绑定
- 内置报警/信息通知入口
- 集成日期时间显示和用户登录状态
```

### 1.3 设计目标

| 目标维度 | 具体指标 | 对标友商改进点 |
|---------|---------|--------------|
| **信息密度** | 单屏展示6个核心工艺参数 | 友商同区域仅4个，提升50% |
| **刷新频率** | 500ms 轮询更新 | 与友商持平 |
| **异常识别** | 超阈值自动变色 + 报警计数徽章 | 友商无变色机制 |
| **操作可达性** | 报警入口始终可见，点击直达详情 | 友商需切换页面 |
| **品牌一致性** | 深海军蓝(#1a1a2e)主题色贯穿全局 | 友商通用灰色无品牌感 |

---

## 二、页眉导航栏功能需求规格书

### 2.1 功能模块总览

```
页眉导航栏功能分解
├── FR-01: 核心参数实时显示区 (L1优先级)
│   ├── FR-01.1: 合模位置显示
│   ├── FR-01.2: 开模位置显示
│   ├── FR-01.3: 合模压力显示
│   ├── FR-01.4: 射胶速度显示
│   └── FR-01.5: 循环周期显示
│
├── FR-02: 系统状态指示区 (L2优先级)
│   ├── FR-02.1: 报警计数器 + 入口按钮
│   ├── FR-02.2: 信息/事件计数器 + 入口按钮
│   └── FR-02.3: 设备运行状态指示灯
│
├── FR-03: 辅助功能区 (L3优先级)
│   ├── FR-03.1: 日期时间显示
│   ├── FR-03.2: 语言切换器
│   └── FR-03.3: 用户登录/登出
│
└── FR-04: 导航控制区
    └── FR-04.1: 侧边菜单触发按钮 (可选)
```

### 2.2 详细功能规格

#### FR-01: 核心参数实时显示区

| 编号 | 功能项 | 优先级 | 输入 | 输出 | 前置条件 | 业务规则 |
|------|--------|--------|------|------|---------|---------|
| FR-01.1 | 合模位置 | P0 | 标签 `t_d0_0100` (合模AD) | 显示值+单位(mm) | 设备在线 | 格式: `{value} mm`，精度1位小数 |
| FR-01.2 | 开模位置 | P0 | 标签 `t_d0_0101` (移模AD) | 显示值+单位(mm) | 设备在线 | 同上 |
| FR-01.3 | 合模压力 | P0 | 标签 `t_d0_0201` (合模高压压力) | 显示值+单位(bar) | 设备在线 | 格式: `{value} bar`，除数10 |
| FR-01.4 | 射胶速度 | P1 | 标签 `t_d0_0301` (射速) | 显示值+单位(rpm) | 设备在线 | 格式: `{value} rpm` |
| FR-01.5 | 循环周期 | P1 | 标签 `t_d0_0401` (循环时间) | 显示值+单位(s) | 设备在线 | 格式: `{value}.00 s` |

**数据绑定方式**: 使用 FUXA `HeaderItem.property.variableId`

```javascript
// FR-01 数据绑定示例
{
    id: 'hdr_pos_close',
    type: 'label',
    text: '{value} mm',           // FUXA 自动替换 {value}
    property: {
        variableId: 't_d0_0100',  // 合模位置标签ID
        format: '#.#'             // 数值格式化模板
    }
}
```

#### FR-02: 系统状态指示区

| 编号 | 功能项 | 优先级 | 行为描述 | 状态映射 |
|------|--------|--------|---------|---------|
| FR-02.1 | 报警计数器 | P0 | 显示当前活跃报警数量；点击展开右侧报警面板 | count=0: 灰色隐藏badge; count>0: 红色闪烁badge |
| FR-02.2 | 信息计数器 | P1 | 显示未确认事件数量；点击展开事件列表 | 同FR-02.1，橙色 |
| FR-02.3 | 运行状态 | P1 | 三色LED指示: 绿=运行, 黄=待机, 红=故障/停止 | 绑定系统标签或根据报警推断 |

**FUXA内置支持**: `header.alarms` 和 `header.infos` 配置项

```javascript
// FR-02 配置示例
{
    alarms: 'item.notifymode-fix',    // 固定显示报警按钮
    infos: 'item.notifymode-fix',      // 固定显示信息按钮
}
```

#### FR-03: 辅助功能区

| 编号 | 功能项 | 优先级 | 默认配置 | 可配置项 |
|------|--------|--------|---------|---------|
| FR-03.1 | 日期时间 | P2 | `'yyyy/MM/dd HH:mm:ss'` | 格式字符串 |
| FR-03.2 | 语言切换 | P3 | `'key'`(显示语言代码) | nothing/simple/key/fullname |
| FR-03.3 | 用户信息 | P2 | `'username'` | nothing/username/fullname/both |

#### FR-04: 底部导航栏（已确认采用）

> **设计决策**: 经过多维度对比分析，**确定采用底部固定导航栏而非侧边菜单**。
> 详见附录A《底部导航 vs 侧边菜单设计决策分析》。

| 编号 | 功能项 | 优先级 | 触发条件 | 行为 |
|------|--------|--------|---------|------|
| FR-04.1 | 底部导航栏 | P1 | 始终可见 | 主功能4+次功能3+系统1分组排列 |
| FR-04.2 | 当前页高亮 | P1 | 页面切换时 | 当前页按钮底部显示3px主题色指示条 |

---

## 三、交互逻辑设计

### 3.1 状态转换图

```
                        ┌─────────────────┐
                        │     正常状态     │
                        │  参数正常显示    │
                        │  无活跃报警      │
                        └────────┬────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              │                  │                  │
              ▼                  ▼                  ▼
    ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
    │  参数超阈值警告  │ │   新报警触发     │ │   用户点击报警   │
    │  (数值变黄/红)  │ │ (badge闪烁+声音) │ │   按钮          │
    └────────┬────────┘ └────────┬────────┘ └────────┬────────┘
             │                  │                  │
             │                  ▼                  ▼
             │         ┌─────────────────┐ ┌─────────────────┐
             │         │  报警持续中      │ │  报警面板展开    │
             │         │  badge常亮红色   │ │  右侧滑出       │
             │         └────────┬────────┘ └────────┬────────┘
             │                  │                  │
             │                  │◄─────────────────┘
             │                  │  用户确认/处理
             │                  ▼
             │         ┌─────────────────┐
             └────────►│  报警消除        │
                       │  badge归零/隐藏  │
                       └────────┬────────┘
                                │
                                ▼
                        ┌─────────────────┐
                        │     正常状态     │
                        └─────────────────┘
```

### 3.2 交互流程详述

#### 流程1: 参数实时更新

```
[PLC设备] ──Modbus TCP──▶ [FUXA Server] ──WebSocket──▶ [客户端Header]
                                                    │
                                              每500ms轮询
                                                    │
                                                    ▼
                                           ┌────────────────┐
                                           │  更新HeaderItem │
                                           │  .property.value│
                                           └────────┬───────┘
                                                    │
                                          ┌─────────┴─────────┐
                                          │                   │
                                          ▼                   ▼
                                   ┌──────────┐       ┌──────────┐
                                   │ 在范围内  │       │ 超出范围  │
                                   │ 白色显示  │       │ 黄/红高亮 │
                                   └──────────┘       └──────────┘
```

**关键参数**:
- 刷新间隔: `500ms` (FUXA默认tag刷新率)
- 数值格式化: 通过 `property.format` 或 CSS 控制
- 超范围检测: 通过 `property.ranges[].color` 实现

#### 流程2: 报警交互

```
用户点击报警图标
    ↓
┌─────────────────────────────────────────────────────┐
│  home.component.ts: onAlarmsShowMode('collapse')    │
│                                                     │
│  → 切换 alarm-view 组件显示状态                      │
│  → 右侧面板滑出 (宽度可配)                           │
│  → 显示活跃报警列表                                  │
│                                                     │
│  ┌─ 报警面板 ──────────────────────────────────┐   │
│  │  🔴 高压超限  合模压力 185.0 bar  14:40:06  │   │
│  │    [确认] [详情]                              │   │
│  ├──────────────────────────────────────────────┤   │
│  │  🟡 温度偏高  料筒温度 245°C      14:39:52  │   │
│  │    [确认] [详情]                              │   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
    ↓
用户点击 [确认]
    ↓
→ POST /api/alarmack { alarmId }
→ badge计数减1
→ 若count=0则badge隐藏
```

#### 流程3: 参数颜色状态映射

| 条件 | 显示效果 | 实现方式 |
|------|---------|---------|
| 正常范围 | 白字 `#ffffff` | 默认fgcolor |
| 接近上限(>80%) | 黄字 `#fbbf24` | ranges color配置 |
| 超过上限 | 红字 `#ef4444` + 脉冲动画 | ranges color + blink action |
| 通信断开 | 灰字 `#999999` + `---` | 连接状态检测 |
| 写入锁定 | 半透明 `opacity: 0.6` | permission控制 |

### 3.3 触控手势支持

| 手势 | 目标元素 | 行为 |
|------|---------|------|
| 单击 | 报警/信息按钮 | 展开/收起对应面板 |
| 单击 | 参数label | 无响应(只读显示) |
| 长按(>800ms) | 参数label | 弹出tooltip显示详细信息(标签名、地址、范围) |
| 左滑 | 整个Header | 无(固定不动) |

---

## 四、视觉设计规范

### 4.1 整体布局尺寸

```
目标屏幕: 1280 × 800 px (10寸标准工业屏)

┌═══════════════════════════════════════════════════════════┐
║ 页眉导航栏                                                ║
║ 高度: 48px                                               ║
║ 背景: #1a1a2e (深海军蓝)                                 ║
║                                                            ║
║ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌────┐ ┌────────┐  ║
║ │参数1 │ │参数2 │ │参数3 │ │参数4 │ │🔔x3│ │日期 用户│  ║
║ │16px  │ │16px  │ │16px  │ │16px  │ │    │ │13px    │  ║
║ │Bold  │ │Bold  │ │Bold  │ │Bold  │ │    │ │Regular │  ║
║ └──────┘ └──────┘ └──────┘ └──────┘ └────┘ └────────┘  ║
║  ←—————— 核心参数区(左对齐) ————→ ←辅助区(右对齐)→      ║
║                                                            ║
╠═══════════════════════════════════════════════════════════╣
║                                                            ║
║                      主内容区                               ║
║                 (高度: 800-48-56 = 696px)                 ║
║                                                            ║
╠═══════════════════════════════════════════════════════════╣
║ 底部导航栏 56px                                            ║
╚═══════════════════════════════════════════════════════════╝
```

### 4.2 色彩规范 (方案A - 经典工业蓝)

```css
/* ===== 页眉导航栏色彩变量 ===== */
:root {
    /* --- 主色调 --- */
    --hdr-bg:                #1a1a2e;       /* 深海军蓝背景 */
    --hdr-text-primary:      #ffffff;       /* 主要文字白 */
    --hdr-text-secondary:    #94a3b8;       /* 次要文字灰蓝 */

    /* --- 参数数值色彩 --- */
    --param-normal:          #ffffff;       /* 正常: 白 */
    --param-warning:         #fbbf24;       /* 警告: 琥珀黄 */
    --param-danger:          #ef4444;       /* 危险: 红色 */
    --param-offline:         #64748b;       /* 离线: 暗灰 */

    /* --- 状态指示色彩 --- */
    --alarm-badge-bg:        #dc2626;       /* 报警badge背景 */
    --alarm-badge-pulse:     rgba(220,38,38,0.6); /* 报警脉冲 */
    --info-badge-bg:         #f59e0b;       /* 信息badge背景 */
    --status-running:        #22c55e;       /* 运行绿 */
    --status-standby:        #eab308;       /* 待机黄 */
    --status-fault:          #ef4444;       /* 故障红 */

    /* --- 分隔与边框 --- */
    --hdr-divider:           rgba(255,255,255,0.08); /* 分隔线 */

    /* --- 交互反馈 --- */
    --btn-hover-bg:          rgba(255,255,255,0.1); /* 悬停 */
    --btn-active-bg:         rgba(255,255,255,0.18);/* 点击 */
}

/* --- 特殊场景覆盖 --- */
@media (prefers-color-scheme: dark) {
    /* 工业环境通常保持深色header不变 */
}
```

### 4.3 字体排版规范

| 元素 | 字族 | 字号 | 字重 | 行高 | 对齐 |
|------|------|------|------|------|------|
| **参数数值** | Microsoft YaHei / system-ui | 16px | Bold (700) | 1.2 | center |
| **参数单位** | Microsoft YaHei / system-ui | 11px | Regular (400) | 1.2 | left (跟在数值后) |
| **参数标签名** | Microsoft YaHei / system-ui | 10px | Regular (400) | 1.2 | center (数值上方) |
| **报警/信息计数** | system-ui | 11px | Bold (700) | 1 | center |
| **日期时间** | Consolas / monospace | 13px | Regular (400) | 1.2 | right |
| **用户名** | Microsoft YaHei / system-ui | 12px | Medium (500) | 1.2 | right |
| **图标(Material)** | Material Icons | 20px | normal | - | - |

### 4.4 组件间距规范

```
┌─ 页眉内部布局网格 ——————————————————————————————┐
│                                                   │
│  外边距: padding: 0 16px                          │
│                                                   │
│  [参数块] 间距: margin-right: 24px                │
│  ┌─────────────────┐                             │
│  │ 标签名 (10px)    │  上内边距: 2px            │
│  │ 数值  (16px)     │                            │
│  │ 单位  (11px)     │  下内边距: 2px            │
│  └─────────────────┘                             │
│                                                   │
│  分隔符: │ (1px宽, rgba白8%透明度)               │
│                                                   │
│  右侧区域间距: gap: 12px                          │
│  [🔔(3)] [⚠️(1)] [2026/7/29 14:40] [admin▼]     │
│                                                   │
└————————————————————————————————───────────────────┘
```

### 4.5 动效规范

| 动效 | 触发 | 持续时间 | 缓动函数 | 说明 |
|------|------|---------|---------|------|
| **Badge脉冲** | 有未确认报警 | 1000ms循环 | ease-in-out | scale(1)→scale(1.15)→scale(1), opacity 0.7↔1 |
| **参数变色** | 值进入危险区间 | 300ms | ease-out | 颜色渐变过渡 |
| **按钮悬停** | 鼠标悬停 | 150ms | ease-out | bg透明度 0→10% |
| **按钮按下** | 鼠标按下 | 100ms | ease-in | bg透明度 10%→18%, scale 0.97 |
| **面板滑入** | 点击报警按钮 | 250ms | cubic-bezier(.4,0,.2,1) | transform translateX(100%→0) |

### 4.6 各状态视觉示意

```
状态1: 全部正常
┌──────────────────────────────────────────────────────────────┐
│ 📍488.9mm │ 📍0.0mm │ 🎯0.0bar │ ⚡0.0rpm │ 🔔 │ 14:40 admin│
│  白色      │  白色    │  白色     │  白色    │ 0 │           │
└──────────────────────────────────────────────────────────────┘

状态2: 有报警
┌──────────────────────────────────────────────────────────────┐
│ 📍488.9mm │ 📍0.0mm │ 🎯185.0bar│ ⚡0.0rpm │ 🔔③│ 14:40 admin│
│  白色      │  白色    │  ★红色!   │  白色    │红闪│           │
└──────────────────────────────────────────────────────────────┘

状态3: 通信中断
┌──────────────────────────────────────────────────────────────┐
│ 📍 ----   │ 📍 ----   │ 🎯 ----   │ ⚡ ----   │ 🔔 │ 14:40 admin│
│  灰色      │  灰色     │  灰色     │  灰色     │灰 │           │
└──────────────────────────────────────────────────────────────┘
```

---

## 五、FUXA技术架构分析

### 5.1 FUXA原生Header组件能力边界

通过深入分析FUXA源码([hmi.ts](file:///c:\Users\13971\Downloads/FUXA-master\client\src\app\_models\hmi.ts)、[home.component.html](file:///c:\Users\13971\Downloads\FUXA-master\client\src\app\home\home.component.html))，确认以下技术事实：

#### ✅ FUXA原生支持的Header能力

| 能力 | 支持方式 | 来源代码 |
|------|---------|---------|
| **自定义items数组** | `header.items: HeaderItem[]` | hmi.ts L157 |
| **3种item类型** | `button` / `label` / `image` | hmi.ts L162 |
| **变量绑定** | `item.property.variableId` | hmi.ts L158 |
| **数值格式化** | `item.text` 含 `{value}` 占位符 | home.component.html L44 |
| **颜色自定义** | `item.bkcolor` / `item.fgcolor` | home.component.html L22-23 |
| **字体控制** | `fontFamily` / `fontSize` | home.component.html L24-25 |
| **对齐方式** | `itemsAnchor`: left/center/right | hmi.ts L159 |
| **报警按钮** | `alarms`: hide/fix/float | hmi.ts L147 |
| **信息按钮** | `infos`: hide/fix/float | hmi.ts L148 |
| **日期时间** | `dateTimeDisplay`: 日期格式串 | hmi.ts L153 |
| **语言切换** | `language`: nothing/key/fullname | hmi.ts L154 |
| **用户信息** | `loginInfo`: nothing/username/fullname/both | hmi.ts L152 |
| **权限控制** | `permissionRoles.show/enabled` | index.js L959-962 |

#### ⚠️ FUXA原生限制 (需规避或扩展)

| 限制 | 影响 | 应对策略 |
|------|------|---------|
| **Label类型不支持icon** | 只有button/image有icon字段 | 用image类型模拟纯图标label，或用button禁用点击 |
| **无内置趋势箭头** | 无法直接显示 ↑↓ 变化方向 | 在text中预拼接(需脚本)，或放弃此特性 |
| **无内置迷你图表** | 无法在header中显示曲线 | 不在header放图表，保持简洁 |
| **ranges颜色作用于整行** | item级别无法单独设range-color | 利用bkcolor/fgcolor静态设置，动态变色需CSS注入 |
| **fontSize全局统一** | 所有items共享一个fontSize | 通过HTML style内联覆盖个别item |

### 5.2 推荐实现方案: FUXA原生Header + 自定义样式增强

```
┌─────────────────────────────────────────────────────────────┐
│                    实现方案架构                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Layer 1: FUXA Layout API (基础层)                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ POST /api/projectData { cmd:'layout', data: {...} } │   │
│  │                                                      │   │
│  │ layout: {                                            │   │
│  │   header: {                                          │   │
│  │     bkcolor: '#1a1a2e',                              │   │
│  │     fgcolor: '#ffffff',                              │   │
│  │     fontSize: 13,                                    │   │
│  │     fontFamily: 'Microsoft YaHei,sans-serif',        │   │
│  │     itemsAnchor: 'left',                             │   │
│  │     alarms: 'item.notifymode-fix',                   │   │
│  │     infos: 'item.notifymode-hide',                   │   │
│  │     dateTimeDisplay: 'yyyy/MM/dd HH:mm:ss',          │   │
│  │     language: 'nothing',                             │   │
│  │     loginInfo: 'username',                           │   │
│  │     items: [...]                                     │   │
│  │   }                                                  │   │
│  │ }                                                    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Layer 2: Custom CSS Injection (增强层)                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ layout.customStyles = `                               │   │
│  │   .header { height: 48px !important; }               │   │
│  │   .header-items-button button {                      │   │
│  │     padding: 4px 12px !important;                    │   │
│  │     border-radius: 4px !important;                   │   │
│  │     font-weight: bold !important;                    │   │
│  │     font-size: 16px !important;  /* 覆盖全局 */      │   │
│  │   }                                                  │   │
│  │   .button-counter { /* badge样式 */ }                │   │
│  │   @keyframes pulse { ... }  /* 报警脉冲 */           │   │
│  │ `                                                    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Layer 3: View-level Status Bar (备用/补充)                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 仅当FUXA Header能力不足时使用:                        │   │
│  │ - 在每个View SVG顶部绘制状态条                        │   │
│  │ - 用 svg-text 绑定更多标签                            │   │
│  │ - 缺点: 非全局常驻，每页重复定义                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 5.3 Header Items 数据结构设计

```javascript
/**
 * 方案A 页眉导航栏 - Header Items 完整配置
 * 
 * 适用API: POST /api/projectData { cmd: 'layout', data: layoutObj }
 * 
 * 关键约束:
 * - type='label': 用于只读数据显示 (推荐用于参数)
 * - type='button': 用于带图标的交互按钮
 * - type='image': 用于纯图标显示
 * - property.variableId: 绑定FUXA标签进行实时更新
 */

const headerConfig = {
    // === 全局属性 ===
    title: '注塑机HMI',
    bkcolor: '#1a1a2e',           // 深海军蓝背景
    fgcolor: '#ffffff',           // 白色前景
    fontFamily: 'Microsoft YaHei,system-ui,sans-serif',
    fontSize: 13,                  // 基础字号(会被CSS覆盖为16)
    itemsAnchor: 'left',          // 左对齐
    
    // === 系统功能开关 ===
    alarms: 'item.notifymode-fix',   // 固定显示报警按钮
    infos: 'item.notifymode-hide',   // 隐藏信息按钮(减少干扰)
    dateTimeDisplay: 'yyyy/MM/dd HH:mm:ss',
    language: 'nothing',             // 不显示语言切换(单语环境)
    loginInfo: 'username',
    
    // === 自定义Items (核心参数区) ===
    items: [
        // ----- 第1项: 合模位置 -----
        {
            id: 'hdr_pos_close',
            type: 'label',
            icon: '',
            image: '',
            text: '{value}',          // FUXA将{value}替换为实际值
            bkcolor: 'transparent',   // 透明背景
            fgcolor: '#ffffff',
            marginLeft: 0,
            marginRight: 4,
            property: {
                variableId: 't_d0_0100',  // ⚠️ 必须匹配实际标签ID
                format: '#.#',              // 格式: 1位小数
                permission: 7,
                permissionRoles: { show: [], enabled: [] },
                ranges: [],                 // 可选: 范围着色
                events: [],
                actions: [],
                options: {}
            },
            status: null
        },
        
        // ----- 第2项: 合模位置单位 -----
        {
            id: 'hdr_unit_close',
            type: 'label',
            text: 'mm',
            bkcolor: 'transparent',
            fgcolor: '#94a3b8',           // 浅灰色单位
            fontSizeOverride: 11,          // 小字号(需CSS配合)
            marginLeft: 0,
            marginRight: 24,
            property: null                 // 无绑定，静态文本
        },
        
        // ----- 第3项: 开模位置 -----
        {
            id: 'hdr_pos_open',
            type: 'label',
            text: '{value}',
            bkcolor: 'transparent',
            fgcolor: '#ffffff',
            marginLeft: 0,
            marginRight: 4,
            property: {
                variableId: 't_d0_0101',  // 移模AD/开模位置
                format: '#.#'
            }
        },
        
        // ----- 第4项: 开模位置单位 -----
        {
            id: 'hdr_unit_open',
            type: 'label',
            text: 'mm',
            bkcolor: 'transparent',
            fgcolor: '#94a3b8',
            marginLeft: 0,
            marginRight: 24,
            property: null
        },
        
        // ----- 第5项: 合模压力 -----
        {
            id: 'hdr_pressure',
            type: 'label',
            text: '{value}',
            bkcolor: 'transparent',
            fgcolor: '#ffffff',
            marginLeft: 0,
            marginRight: 4,
            property: {
                variableId: 't_d0_0201',  // 合模高压压力
                format: '#.#',
                ranges: [
                    { min: 0, max: 150, color: '#ffffff', type: 0 },   // 正常: 白
                    { min: 150, max: 175, color: '#fbbf24', type: 0 }, // 警告: 黄
                    { min: 175, max: 99999, color: '#ef4444', type: 0 } // 危险: 红
                ]
            }
        },
        
        // ----- 第6项: 压力单位 -----
        {
            id: 'hdr_unit_press',
            type: 'label',
            text: 'bar',
            bkcolor: 'transparent',
            fgcolor: '#94a3b8',
            marginLeft: 0,
            marginRight: 24,
            property: null
        },
        
        // ----- 第7项: 射胶速度 -----
        {
            id: 'hdr_speed',
            type: 'label',
            text: '{value}',
            bkcolor: 'transparent',
            fgcolor: '#ffffff',
            marginLeft: 0,
            marginRight: 4,
            property: {
                variableId: 't_d0_0301',  // 射速
                format: '#.#'
            }
        },
        
        // ----- 第8项: 速度单位 -----
        {
            id: 'hdr_unit_speed',
            type: 'label',
            text: 'rpm',
            bkcolor: 'transparent',
            fgcolor: '#94a3b8',
            marginLeft: 0,
            marginRight: 24,
            property: null
        },
        
        // ----- 第9项: 循环周期 -----
        {
            id: 'hdr_cycle',
            type: 'label',
            text: '{value}',
            bkcolor: 'transparent',
            fgcolor: '#ffffff',
            marginLeft: 0,
            marginRight: 4,
            property: {
                variableId: 't_d0_0401',  // 循环时间
                format: '#.00'
            }
        },
        
        // ----- 第10项: 周期单位 -----
        {
            id: 'hdr_unit_cycle',
            type: 'label',
            text: 's',
            bkcolor: 'transparent',
            fgcolor: '#94a3b8',
            marginLeft: 0,
            marginRight: 0,
            property: null
        }
        
        // 注意: 报警按钮、日期时间、用户信息由FUXA自动渲染
        // 位于 header.items 的右侧 (由框架控制)
    ]
};
```

### 5.4 自定义CSS增强样式

```css
/**
 * 方案A 页眉导航栏 - 自定义样式增强
 * 
 * 注入方式: layout.customStyles 字段
 * 生效时机: 项目加载时自动注入 <head>
 * 
 * 选择器来源: 分析 home.component.html 的DOM结构
 */

/* ========== 页眉容器 ========== */
.header {
    height: 48px !important;
    min-height: 48px !important;
    background-color: #1a1a2e !important;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15) !important;
    z-index: 100 !important;
}

/* ========== 参数标签 (核心) ========== */
.header-items-button button[type="label"],
.header-items-button button.mat-button {
    /* 覆盖Material默认样式 */
    padding: 4px 12px !important;
    margin: 0 !important;
    border-radius: 4px !important;
    
    /* 字体强化 */
    font-family: 'Microsoft YaHei', system-ui, sans-serif !important;
    font-size: 16px !important;
    font-weight: 700 !important;
    line-height: 1.2 !important;
    
    /* 交互过渡 */
    transition: background-color 150ms ease-out,
                color 300ms ease-out !important;
}

/* 参数悬停态 */
.header-items-button button:hover {
    background-color: rgba(255, 255, 255, 0.08) !important;
}

/* ========== 单位标签 (次要) ========== */
.header-items-button button:nth-of-type(even) {
    /* 假设偶数项是单位... 实际需要更精确选择器 */
    font-size: 11px !important;
    font-weight: 400 !important;
    color: #94a3b8 !important;
    opacity: 0.85 !important;
}

/* ========== 报警Badge ========== */
.button-counter.alarm-color {
    background-color: #dc2626 !important;
    color: #fff !important;
    font-size: 11px !important;
    font-weight: 700 !important;
    min-width: 18px !important;
    height: 18px !important;
    line-height: 18px !important;
    border-radius: 9px !important;
    padding: 0 5px !important;
    
    /* 脉冲动画 - 当有报警时 */
    animation: hdr-badge-pulse 1s ease-in-out infinite !important;
}

@keyframes hdr-badge-pulse {
    0%, 100% { 
        transform: scale(1); 
        opacity: 1; 
    }
    50% { 
        transform: scale(1.15); 
        opacity: 0.75; 
    }
}

/* 无报警时隐藏badge (opacity由FUXA控制) */
.button-counter.alarm-count[style*="opacity: 0"] {
    display: none !important;
}

/* ========== 日期时间 ========== */
.header-date-time {
    font-family: 'Consolas', 'Courier New', monospace !important;
    font-size: 13px !important;
    color: #cbd5e1 !important;
    letter-spacing: 0.5px !important;
}

/* ========== 登录信息 ========== */
.header-login .primary {
    font-size: 12px !important;
    color: #93c5fd !important;
}

/* ========== 分隔线 (伪元素) ========== */
/* 在特定items间添加视觉分隔 */
.header-items-button > button:not(:last-child)::after {
    content: '';
    display: inline-block;
    width: 1px;
    height: 20px;
    background-color: rgba(255, 255, 255, 0.08);
    vertical-align: middle;
    margin: 0 8px;
}

/* ========== 菜单按钮 (如果有侧边栏) ========== */
.header-menu button {
    color: #ffffff !important;
}

.header-menu button:hover {
    background-color: rgba(255, 255, 255, 0.1) !important;
}

/* ========== 响应式适配 ========== */
@media (max-width: 1024px) {
    .header-items-button button[type="label"] {
        font-size: 14px !important;
        padding: 4px 8px !important;
    }
    .header-date-time {
        font-size: 12px !important;
    }
}

@media (max-width: 800px) {
    .header {
        height: 40px !important;
    }
    .header-items-button button[type="label"] {
        font-size: 13px !important;
    }
    /* 隐藏部分次要参数 */
    .header-items-button button:nth-child(n+7) {
        display: none !important;
    }
}
```

### 5.5 底部导航栏配置 (配套)

> **设计决策**: 确定采用**底部固定导航**而非侧边菜单，理由见附录A。

```javascript
/**
 * 方案A 底部导航栏 - Navigation Settings
 *
 * 配合页眉导航栏形成完整的"三明治"布局
 *
 * 分组策略: 主功能(4) + 次功能(3) + 系统(1) = 8个入口
 * 视觉优化: 当前页底部3px高亮指示条
 */
const navConfig = {
    mode: 'item.navsmode-fix',                    // 固定底部模式
    type: 'item.navtype-icons-text-block',        // 图标+文字横向排列
    bkcolor: '#f0f0f0',                           // 浅灰背景
    fgcolor: '#1d1d1d',                           // 深色文字
    logo: false,
    items: [
        // ===== 主功能组 (前4个) =====
        { id: 'nav_home',     text: '主页',   link: '', view: 'v_home_main',  icon: 'home',         image: '' },
        { id: 'nav_template', text: '模板',   link: '', view: 'v_template',  icon: 'description',  image: '' },
        { id: 'nav_settings', text: '设置',   link: '', view: 'v_settings',  icon: 'settings',     image: '' },
        { id: 'nav_slope',    text: '斜率',   link: '', view: 'v_slope',     icon: 'show_chart',   image: '' },

        // ===== 次功能组 (3个) =====
        { id: 'nav_delay',    text: '延时',   link: '', view: 'v_delay',     icon: 'schedule',     image: '' },
        { id: 'nav_advanced', text: '高级',   link: '', view: 'v_advanced',   icon: 'build',        image: '' },
        { id: 'nav_tune',     text: '调模',   link: '', view: 'v_tune',      icon: 'tune',         image: '' },

        // ===== 系统组 (1个) =====
        { id: 'nav_back',     text: '返回',   link: '', view: '',            icon: 'arrow_back',   image: '' }
    ]
};
```

**CSS高亮指示条实现** (通过 `customStyles` 注入):

```css
/* 当前页底部高亮指示条 */
.mat-tab-link,
.mat-nav-item-active {
    position: relative !important;
}
.mat-nav-item-active::after {
    content: '' !important;
    position: absolute !important;
    bottom: 0 !important;
    left: 10% !important;
    width: 80% !important;
    height: 3px !important;
    background-color: #0f4c81 !important; /* 方案A主题蓝 */
    border-radius: 2px 2px 0 0 !important;
}
```

**响应式行为**:

| 屏幕宽度 | 行为 |
|---------|------|
| ≥1024px | 8个按钮完整显示 |
| 768-1023px | 隐藏次功能组(缩为"...更多"入口) |
| <768px | 仅显示主功能4个，其他收折 |

---

## 六、实现路径与里程碑

### 6.1 总体路线图

```
Phase 0 ──→ Phase 1 ──→ Phase 2 ──→ Phase 3 ──→ Phase 4
  │          │          │          │          │
  ▼          ▼          ▼          ▼          ▼
准备期     开发期     集成期     测试期     发布期
环境搭建   Header实现  视图对接   功能验收   部署上线
标签验证   样式调试   联调测试   性能优化   文档交付
```

### 6.2 详细里程碑

#### Phase 0: 准备期 (预计 0.5 天)

| 任务 | 产出 | 验收标准 | 负责人 |
|------|------|---------|--------|
| P0-T1: 确认标签ID清单 | 标签映射表 | 所有header使用的标签ID存在且可读写 | 开发 |
| P0-T2: 启动FUXA开发服务 | 服务可用 | http://localhost:1881 可访问 | 开发 |
| P0-T3: 备份现有项目 | 备份文件 | project.fuxap.db.bak 存在 | 开发 |
| P0-T4: 创建feature分支 | git分支 | feature/header-navbar-v1 | 开发 |

**P0-T1 标签清单模板**:

```javascript
const HEADER_TAG_MAP = {
    '合模位置':   { id: 't_d0_0100', unit: 'mm',  divisor: 1,   decimals: 1 },
    '开模位置':   { id: 't_d0_0101', unit: 'mm',  divisor: 1,   decimals: 1 },
    '合模压力':   { id: 't_d0_0201', unit: 'bar', divisor: 10,  decimals: 1 },
    '射胶速度':   { id: 't_d0_0301', unit: 'rpm', divisor: 1,   decimals: 1 },
    '循环周期':   { id: 't_d0_0401', unit: 's',   divisor: 10,  decimals: 2 },
};

// 验证命令
// GET /api/getTagValue?id=t_d0_0100
```

#### Phase 1: 开发期 (预计 1.5 天)

| 任务 | 产出 | 验收标准 | 负责人 |
|------|------|---------|--------|
| P1-T1: 编写Layout生成脚本 | `setup-header-layout.js` | 脚本可执行，输出JSON正确 | 开发 |
| P1-T2: 定义Header items配置 | config对象 | 包含5个参数+4个单位+样式 | 开发 |
| P1-T3: 编写Custom CSS | css字符串 | 符合4.4节规范 | UI |
| P1-T4: 本地测试Layout写入 | API调用成功 | GET /api/project 返回新layout | 开发 |

**P1-T1 脚本骨架**:

```javascript
// setup-header-layout.js
const http = require('http');
const FUXA_URL = 'http://127.0.0.1:1881';

const layoutPayload = {
    cmd: 'layout',
    data: {
        autoresize: false,
        start: 'v_home_main',
        navigation: { /* navConfig */ },
        header: { /* headerConfig */ },
        showdev: true,
        zoom: 'item.zoommode-disabled',
        inputdialog: 'item.inputmode-disabled',
        hidenavigation: false,
        customStyles: `/* css内容 */`
    }
};

// POST /api/projectData
function applyLayout() {
    // ... HTTP请求逻辑
}
```

#### Phase 2: 集成期 (预计 1 天)

| 任务 | 产出 | 验收标准 | 负责人 |
|------|------|---------|--------|
| P2-T1: 创建主页视图(含状态栏占位) | `v_home_main` 视图 | 1280×800, 内容区正确偏移 | 开发 |
| P2-T2: 调整现有视图Y坐标 | 更新后的views | 所有view内容下移48px避开header | 开发 |
| P2-T3: Header与View联动测试 | 测试报告 | 切换页面header保持不变 | 测试 |
| P2-T4: 报警面板联动测试 | 测试报告 | 点击header报警按钮正确展开 | 测试 |

#### Phase 3: 测试期 (预计 1 天)

| 任务 | 产出 | 验收标准 | 负责人 |
|------|------|---------|--------|
| P3-T1: 功能测试 | 测试用例报告 | FR-01~FR-04全部通过 | 测试 |
| P3-T2: 视觉走查 | UI评审记录 | 符合4.1~4.6节规范 | UI/产品 |
| P3-T3: 多分辨率测试 | 截图对比集 | 1024/1280/1920均正常 | 测试 |
| P3-T4: 性能测试 | 性能报告 | CPU<30%, 内存<200MB, 刷新无明显卡顿 | 测试 |

#### Phase 4: 发布期 (预计 0.5 天)

| 任务 | 产出 | 验收标准 | 负责人 |
|------|------|---------|--------|
| P4-T1: 最终打包 | 项目文件包 | 包含所有更新 | 开发 |
| P4-T2: 操作手册 | Markdown文档 | 含配置说明和常见问题 | 技术 |
| P4-T3: 回滚方案 | 回滚步骤 | 可在10min内恢复原状 | 开发 |
| P4-T4: 会议演示稿 | PPT/演示视频 | 展示最终效果 | 全员 |

### 6.3 依赖关系图

```
P0-T1(标签确认) ──────┐
P0-T2(服务启动) ──────┤
P0-T3(备份) ──────────┤──→ P1-T1(Layout脚本) ──→ P1-T2(Header配置) ─┐
P0-T4(分支) ──────────┘                                      │
                                                               │
P2-T1(主页视图) ←─────────────────────────────────────────────┤
                                                               ↓
                        P1-T3(CSS) ──→ P1-T4(本地测试) ──→ P2-T2(坐标调整)
                                                                       │
                                                               P2-T3(联动测试)
                                                                       │
                                                               P2-T4(报警联动)
                                                                       │
                        ┌───────────────────────────────────────────────┘
                        ↓
                  P3-T1(功能测试) ──→ P3-T2(视觉走查) ──→ P3-T3(多分辨率)
                        │                                       │
                        ↓                                       ↓
                  P3-T4(性能测试) ──────────────────────────────┘
                        │
                        ↓
                  P4-T1~T4(发布)
```

---

## 七、资源分配计划

### 7.1 团队角色与职责

| 角色 | 建议人数 | 主要职责 | 所需技能 |
|------|---------|---------|---------|
| **项目负责人(PM)** | 1 | 进度管控、会议组织、风险决策 | 项目管理、工控行业知识 |
| **前端/全栈开发** | 1-2 | FUXA API对接、SVG/CSS编写、脚本开发 | JavaScript、SVG、REST API |
| **UI设计师** | 0.5 (兼职) | 视觉规范审核、走查、调整建议 | 工业UI设计经验 |
| **测试工程师** | 0.5 (兼职) | 功能测试、多分辨率测试、性能测试 | HMI测试经验 |
| **领域专家(SME)** | 0.25 (顾问) | 注塑工艺参数确认、标签含义审核 | 注塑机工艺知识 |

### 7.2 时间估算 (人天)

| 阶段 | 开发 | UI | 测试 | PM | 合计 |
|------|------|-----|------|-----|------|
| Phase 0 准备 | 0.5 | - | - | 0.25 | **0.75** |
| Phase 1 开发 | 1.5 | 0.25 | - | 0.25 | **2.0** |
| Phase 2 集成 | 1.0 | 0.25 | 0.5 | 0.25 | **2.0** |
| Phase 3 测试 | 0.25 | 0.25 | 1.0 | 0.25 | **1.75** |
| Phase 4 发布 | 0.25 | - | 0.25 | 0.25 | **0.75** |
| **合计** | **3.5** | **0.75** | **1.75** | **1.25** | **7.25** |

### 7.3 环境资源

| 资源 | 规格 | 用途 |
|------|------|------|
| 开发机 | Windows 10+, Node.js 14+, SQLite3 | 运行FUXA Server + 开发脚本 |
| 测试触控屏 | 10寸 (1280×800) 或模拟器 | 真实触控体验验证 |
| FUXA Server | v1.1.x+ (master分支) | 组态运行时 |
| 版本控制 | Git | 代码管理 |
| 浏览器 | Chrome/Edge 最新版 | Web端预览调试 |

### 7.4 关键交付物清单

| 交付物 | 格式 | 交付时间 | 负责人 |
|--------|------|---------|--------|
| 标签ID映射表 | xlsx/csv | Phase 0结束 | 开发 |
| Layout配置脚本 | js | Phase 1结束 | 开发 |
| 自定义CSS文件 | css | Phase 1结束 | UI |
| 更新后的项目数据库 | db | Phase 2结束 | 开发 |
| 功能测试报告 | md/pdf | Phase 3结束 | 测试 |
| UI走查记录 | md | Phase 3结束 | UI |
| 多分辨率截图集 | png | Phase 3结束 | 测试 |
| 操作手册 | md | Phase 4结束 | 技术 |
| 回滚方案 | md | Phase 4结束 | 开发 |

---

## 八、风险分析与应对

### 8.1 风险登记册

| ID | 风险描述 | 概率 | 影响 | 风险等级 | 应对策略 | 责任人 | 触发条件 |
|----|---------|------|------|---------|---------|--------|---------|
| R01 | **标签ID不匹配或不存在** | 中 | 高 | 🔴高 | Phase 0提前验证全部标签GET读取；准备fallback空值显示 | 开发 | API返回error |
| R02 | **FUXA Header label不支持format** | 中 | 中 | 🟡中 | 备选方案: 用button替代label；或在text中硬编码格式 | 开发 | {value}不被替换 |
| R03 | **CSS选择器因FUXA升级失效** | 低 | 中 | 🟡中 | 锁定FUXA版本；注释关键选择器；准备降级方案 | 开发 | 样式完全不生效 |
| R04 | **Header高度挤压内容区** | 中 | 中 | 🟡中 | 所有视图预留48px顶部安全距；Phase 2批量调整y坐标 | 开发 | 内容被header遮挡 |
| R05 | **实时数据刷新延迟感知** | 低 | 低 | 🟢低 | 保持500ms默认刷新；对关键参数可考虑WebSocket推送 | 开发 | 数值变化滞后>1s |
| R06 | **customStyles被安全策略阻止** | 低 | 高 | 🟡中 | 提前测试注入可行性；备选: 修改FUXA源码或用浏览器插件 | 开发 | style标签未出现 |
| R07 | **触摸目标过小(密集参数)** | 中 | 中 | 🟡中 | 保证参数block最小44px触控区；适当减少参数数量至5个 | UI | 触控误操作频繁 |
| R08 | **范围着色(ranges)不生效于HeaderItem** | 高 | 中 | 🟡中 | Plan A: CSS class动态切换; Plan B: 放弃Header内着色，改用View内状态条 | 开发 | 颜色始终白色 |

### 8.2 Top 3 风险深度分析

#### R08: HeaderItem范围着色失效 (最高概率风险)

**根因分析**:
```
FUXA源码(home.component.html L35-46):
→ HeaderItem 渲染时只使用了 item.bkcolor 和 item.fgcolor
→ 未发现对 property.ranges[] 的遍历和颜色应用逻辑
→ ranges 可能仅在 Gauge/SVG 组件中生效，不在 Header 中
```

**应对方案矩阵**:

| 方案 | 可行性 | 效果 | 工作量 | 推荐 |
|------|-------|------|-------|------|
| **A: Client-side JS监听** | 中 | 好 | 2h | ⭐⭐ |
| **B: FUXA event-action** | 低 | 好 | 4h | ⭐ |
| **C: View内冗余状态条** | 高 | 一般 | 1h | ⭐⭐⭐ |
| **D: 放弃着色，接受单一颜色** | 最高 | 差 | 0h | 备选 |

**推荐方案A详解**:
```javascript
// 通过 customScripts 在客户端监听标签值变化
// 并动态修改Header DOM元素的style.color
const scriptCode = `
// Header Param Color Watcher
(function() {
    const WATCH_TAGS = [
        { id: 't_d0_0201', selector: '#hdr_pressure', warn: 150, danger: 175 }
        // ... 其他需要着色的标签
    ];
    
    function updateColor(tagId, value) {
        const cfg = WATCH_TAGS.find(t => t.id === tagId);
        if (!cfg) return;
        const el = document.querySelector(cfg.selector);
        if (!el) return;
        
        if (value >= cfg.danger) el.style.color = '#ef4444';
        else if (value >= cfg.warn) el.style.color = '#fbbf24';
        else el.style.color = '#ffffff';
    }
    
    // 注册到FUXA tag change hook
    // (具体API需查阅FUXA client-script文档)
})();
`;
```

#### R01: 标签不存在或不匹配

**预防措施**:
```javascript
// Phase 0 执行的标签预检脚本
async function preflightTagCheck() {
    const requiredTags = ['t_d0_0100', 't_d0_0101', 't_d0_0201', 't_d0_0301', 't_d0_0401'];
    const results = {};
    
    for (const tagId of requiredTags) {
        try {
            const resp = await apiGet(`/api/getTagValue?id=${tagId}`);
            results[tagId] = { ok: true, value: resp };
        } catch (e) {
            results[tagId] = { ok: false, error: e.message };
        }
    }
    
    console.table(results);
    const missing = Object.entries(results).filter(([,v]) => !v.ok);
    if (missing.length > 0) {
        console.error(`❌ 缺少 ${missing.length} 个标签:`);
        missing.forEach(([id]) => console.error(`  - ${id}`));
        process.exit(1);
    }
    console.log(`✅ 全部 ${requiredTags.length} 个标签验证通过`);
}
```

#### R04: Header遮挡内容

**解决方案**:
```javascript
// Phase 2 批量调整视图内容的Y坐标偏移
const HEADER_HEIGHT = 48;
const SAFE_MARGIN = 8; // 额外安全距离

function offsetViewItems(view, offsetY) {
    // 解析SVG，将所有元素的y坐标增加offsetY
    // 或者更简单: 在view的svgcontent外层包裹一个 <g transform="translate(0, offsetY)">
    const wrapTransform = `<g transform="translate(0, ${offsetY})">\n`;
    view.svgcontent = view.svgcontent.replace(
        '<svg ',
        `<svg >\n${wrapTransform}`
    );
    // 在</svg>前闭合</g>
    view.svgcontent = view.svgcontent.replace(
        '</svg>',
        '</g>\n</svg>'
    );
}
```

### 8.3 决策日志模板

```
风险决策记录
===============================================
日期: ____/____/____
决策者: _______________
议题: [风险编号] _______________

选项:
  A) ________________________
  B) ________________________

选择: ___
理由:
_______________________________________________
影响范围:
_______________________________________________
后续行动:
_______________________________________________

签字: _______________
===============================================
```

---

## 九、会议评审清单

### 9.1 专题会议议程 (建议时长: 90分钟)

| 时段 | 议题 | 时长 | 主持人 | 产出 |
|------|------|------|--------|------|
| 0-10min | 项目背景与目标回顾 | 10min | PM | 共识确认 |
| 10-30min | 页眉导航栏需求规格评审 | 20min | PM | 需求基线确认 |
| 30-50min | 技术架构与实现路径讨论 | 20min | Tech Lead | 架构决策 |
| 50-65min | 视觉规范走查 | 15min | UI | 设计确认 |
| 65-80min | 风险评估与应对策略 | 15min | 全员 | 风险登记册签署 |
| 80-90min | 资源确认与下一步行动 | 10min | PM | 行动计划签署 |

### 9.2 决策点清单

请在会议中对以下事项做出明确决策:

- [ ] **D1**: 确认采用方案A (经典工业风优化版)?
- [ ] **D2**: 确认页眉参数数量 (5个 vs 更多)?
- [ ] **D3**: 确认是否需要参数超范围变色功能?
- [ ] **D4**: 确认是否保留信息(infos)按钮?
- [ ] **D5**: 确认是否需要语言切换功能?
- [ ] **D6**: 确认目标屏幕分辨率 (1280×800 标准)?
- [ ] **D7**: 确认开发团队人员分配?
- [ ] **D8**: 确认项目时间表 (总工期约5个工作日)?
- [ ] **D9**: 是否同意Top 3风险的应对策略?
- [ ] **D10**: 是否授权进入Phase 0 (准备期)?

### 9.3 附录: 快速参考卡片

```
┌─────────────────────────────────────────────────────────────┐
│              方案A 页眉导航栏 快速参考                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  尺寸:  1280 × 48 px                                       │
│  背景:  #1a1a2e (深海军蓝)                                 │
│  参数:  5个核心 (合模位/开模位/压力/速度/周期)             │
│  刷新:  500ms                                              │
│  API:   POST /api/projectData { cmd:'layout', data:{}}     │
│                                                             │
│  关键文件:                                                  │
│  - create-kaihemo-views.js  (参考现有视图创建)              │
│  - client/src/app/_models/hmi.ts (HeaderSettings定义)       │
│  - client/src/app/home/home.component.html (Header渲染)     │
│                                                             │
│  风险Top3:                                                  │
│  1. ranges着色可能不生效 → 用JS动态改DOM                    │
│  2. 标签ID可能不存在 → Phase 0预检验                        │
│  3. Header遮挡内容 → 所有view y+56                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘

---

## 附录A: 底部导航 vs 侧边菜单 设计决策分析

### A.1 问题背景

在方案A设计中，底部导航栏的定位存在两种选择：
- **方案A-1**: 底部固定导航栏 (沿用友商成熟模式)
- **方案A-2**: 侧边抽屉菜单 (现代App常见模式)

### A.2 多维度对比

| 评估维度 | 底部导航 | 侧边菜单 | 权重 |
|---------|:-------:|:-------:|:----:|
| **物理操作合理性** | ⭐⭐⭐⭐⭐ 操作员站立前方，手臂自然下垂触及 | ⭐⭐⭐ 需侧伸手臂或移动位置 | 25% |
| **触控可达性** | ⭐⭐⭐⭐⭐ 拇指自然触及 | ⭐⭐⭐ 仅惯用手可及 | 20% |
| **单手操作** | ⭐⭐⭐⭐⭐ 右手/左手拇指均可 | ⭐⭐⭐ 仅惯用手可及 | 15% |
| **市场验证** | ⭐⭐⭐⭐⭐ 友商8按钮已被市场验证 | ⭐ 无市场数据 | 15% |
| **学习成本** | ⭐⭐⭐⭐⭐ 操作员已熟悉 | ⭐⭐⭐⭐ 需适应新模式 | 10% |
| **空间利用率** | ⭐⭐⭐⭐ 横向占用48px固定高度 | ⭐⭐⭐⭐⭐ 可完全隐藏释放空间 | 10% |
| **功能数量承载** | ⭐⭐⭐ 5-8个最优 | ⭐⭐⭐⭐⭐ 10+个更优 | 5% |

**加权得分**:
- 底部导航: **4.35** ⭐ 推荐
- 侧边菜单: **3.40**

### A.3 工业HMI特殊性分析

```
┌─────────────────────────────────────────────────────────────────┐
│                    工业HMI vs 消费App 关键差异                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  消费App (手机/平板)          工业HMI (10-15寸触控屏)            │
│  ─────────────────────        ─────────────────────────         │
│  用户: 坐姿/手持              用户: 站立/悬挂                    │
│  距离: 30-50cm               距离: 50-150cm                    │
│  输入: 精细触控               输入: 粗略触控/戴手套              │
│  目标: 内容消费               目标: 快速操作响应                  │
│  心理: 探索/娱乐              心理: 效率/安全                    │
│                                                                 │
│  → 消费App的侧边菜单模式不适合工业HMI                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### A.4 最终决策

**采用: 底部固定导航栏 (方案A-1)**

理由:
1. **操作员友好** — 站立操作时手臂自然下垂位置即为底部
2. **市场验证** — 友商8按钮底部导航已证明可行
3. **低学习成本** — 无需改变操作员现有习惯
4. **快速切换** — 底部导航切换页面只需1步

### A.5 优化措施

在保持底部导航的基础上，通过以下方式解决"8入口过载"问题：

| 优化项 | 实现方式 | 效果 |
|-------|---------|------|
| **视觉分组** | 主功能4个 + 次功能3个 + 系统1个，用分隔线/间距区分 | 认知分组减少杂乱感 |
| **当前页高亮** | 底部3px蓝色指示条替代背景色高亮 | 明确当前位置，减少误操作 |
| **响应式收折** | <1024px时次功能组收折为"更多"入口 | 保持主功能始终可见 |

### A.6 结论

侧边菜单不适合本项目的工业HMI场景。底部导航经过市场验证，配合分组和高亮优化，可在保持低学习成本的同时解决导航过载问题。

---

## 文档修订历史

| 版本 | 日期 | 作者 | 变更内容 |
|------|------|------|---------|
| v1.0 | 2026-05-12 | AI Assistant | 初版，完整方案A实施规划 |
| v1.1 | 2026-05-12 | AI Assistant | 新增附录A底部导航vs侧边菜单决策分析；更新FR-04为底部导航确认方案 |

---

*本文档为会议评审准备材料，请各相关方审阅后提出意见，经确认后作为项目执行基准。*

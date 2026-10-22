# FUXA Headless EXE 定制化优化指南

> 最后更新: 2026-10-22
> 当前版本: 1.3.5-2918（已同步上游正式版 tag `v1.3.5`）
> 分支: `1.3.5-2918`
> 仓库: https://github.com/jingshui127/FUXA-Tecon

---

## 目录

1. [修改文件清单](#一修改文件清单)
2. [核心修改详解](#二核心修改详解)
3. [构建与部署](#三构建与部署)
4. [排障经验](#四排障经验)
5. [待办事项](#五待办事项)

> **品牌化定制快速入口**：见 [2.12 节](#212-品牌化定制2026-08-10)，通过 `data/brand.json` 自定义品牌，无需改源码。

---

## 一、修改文件清单

| 文件                                                                  | 操作 | 用途                                                                              |
| --------------------------------------------------------------------- | :--: | --------------------------------------------------------------------------------- |
| `app/headless/headless-guardian.js`                                 | 新建 | 双模式 EXE 入口（Guardian + Server）                                              |
| `server/guard.js`                                                   | 新建 | 开发调试用守护脚本 (`node guard.js -p PORT`)                                    |
| `.github/workflows/headless_packaging.yml`                          | 修改 | GitHub Actions 自动构建配置                                                       |
| `server/runtime/devices/s7/index.js`                                | 修改 | 跳过 Disconnect + exit handler + **断连自动重连**（见 2.1）    |
| `server/runtime/devices/index.js`                                   | 修改 | 设备 start/stop try-catch 保护                                                    |
| `server/runtime/index.js`                                           | 修改 | 异步重启 + 500ms 延迟                                                             |
| `server/api/projects/index.js`                                      | 修改 | 视图修改免重启 + upload mkdir 修复 + 异步重启                                     |
| `server/runtime/project/index.js`                                   | 修改 | 新增 getRawProject() 供免重启对比用                                               |
| `server/api/resources/index.js`                                     | 修改 | fontkit 懒加载修复 windows-1252 崩溃                                              |
| `server/main.js`                                                    | 修改 | `PORT` 环境变量端口支持                                                         |
| `server/package.json`                                               | 修改 | 添加`modbus-serial`、`node-snap7` 等驱动包依赖，添加 `postinstall` 补丁脚本 |
| `server/scripts/patch-nodered.js`                                   | 新建 | pkg ESM 兼容补丁，修复 Node-RED httprequest 节点`got` 导入失败                  |
| `client/src/app/gauges/controls/html-image/html-image.component.ts` | 修改 | 解决上游合并冲突（BASE_PATH 反向代理）                                            |
| `client/src/app/maps/maps-view/maps-view.component.ts`              | 修改 | 地图源 `openstreetmap.fr/hot` + 子域轮询 `bc`（国内可用，见 2.6）                 |
| `server/brand.js`                                                   | 新建 | 品牌配置模块（读取 brand.json、API 端点、index.html 注入）                        |
| `server/main.js`                                                    | 修改 | 集成品牌模块，注册`/api/brand` 端点，注入 `window.__BRAND__`                  |
| `data/brand.json`                                                   | 新建 | 品牌配置文件（名称、标题、Logo、footer）                                          |
| `data/logo.svg`                                                     | 新建 | 品牌 Logo 图片                                                                    |
| `data/favicon.ico`                                                  | 新建 | 浏览器图标                                                                        |
| `client/src/app/_services/app.service.ts`                           | 修改 | 新增`BrandConfig` 接口、`getBrand()/getBrandName()/getBrandLogo()` 方法       |
| `client/src/app/sidenav/sidenav.component.ts`                       | 修改 | 侧边栏标题显示品牌名称，Logo 回退到品牌 Logo                                      |
| `client/src/app/sidenav/sidenav.component.html`                     | 修改 | 模板绑定`brandName` 替代硬编码 FUXA                                             |
| `client/src/app/header/header.component.ts`                         | 修改 | 编辑器"关于"对话框`DialogInfo` 注入 AppService 获取品牌信息                     |
| `client/src/app/header/info.dialog.html`                            | 修改 | 关于对话框：Logo/标题/footer 替换为品牌信息                                       |
| `client/src/app/home/home.component.ts`                             | 修改 | 用户信息对话框`DialogUserInfo` 注入 AppService 获取品牌信息                     |
| `client/src/app/home/userinfo.dialog.html`                          | 修改 | 用户信息对话框底部文字替换为品牌 footer                                           |
| `client/src/app/reports/report-editor/report-editor.component.ts`   | 修改 | PDF 报表 header 文字使用品牌信息                                                  |
| `server/runtime/plugins/recipes/recipes.ts`                         | 修改 | 配方下载/上传模板优先修复（官方 400 bug，见 2.14）                                |
| `.gitignore`                                                        | 修改 | 忽略 `client/dist/`（避免官方同步冲突，见 4.14）；官方新增 `.agents/`、`AGENTS.md` |
| `client/dist/`                                                      | 移除跟踪 | 构建产物不再入库，EXE 由 Actions 现场构建（见 4.14）                     |
| `server/i18n/*.json`                                                | 修改 | 官方新键与本地 `plugins-notice` 键深合并                                        |
| `.github/workflows/headless_packaging.yml`                          | 修改 | 版本统一为 `1.3.5-2918`（分支触发、pkg 版本、EXE 名、Artifact 名）              |
| `.github/workflows/docker_release.yml`                              | 修改 | 版本统一为 `1.3.5-2918`                                                        |

---

## 二、核心修改详解

### 2.1 S7 驱动修复（最重要）

**文件**: `server/runtime/devices/s7/index.js`

#### 上游修复（已合并）

| 修复项                   | 说明                                                                                                                                                |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `new` 关键字           | `new snap7.S7Client()` 替代 `snap7.S7Client()`，修复 Linux GC 导致的原型污染                                                                    |
| **Promise reject** | `_readVars/_writeDB/_writeVars` 错误回调中 `return _getErr(err)` → `return reject(_getErr(err))`，修复 Promise 卡死导致 working 标志永不清除 |
| 过载不断开               | 轮询过载时仅跳过当次轮询，不再调用`Disconnect()`                                                                                                  |
| 懒加载数据类型           | 从真实 S7Client 实例读取 datatypes，避免创建临时实例被 GC 回收                                                                                      |

#### 我们保留的定制修改

| 修改                                   | 说明                                  | 原因                                                                                         |
| -------------------------------------- | ------------------------------------- | -------------------------------------------------------------------------------------------- |
| `disconnect()` 跳过 `Disconnect()` | 仅清 JS 侧状态，不调用原生 Disconnect | node-snap7 原生层 bug：Disconnect 在回调中调用会触发`STATUS_ACCESS_VIOLATION` (3221225477) |
| `process.on('exit')` handler         | 退出前`s7client = null`             | 降低退出时原生模块清理冲突概率                                                               |

```javascript
// 当前 disconnect 实现
this.disconnect = function () {
    return new Promise(function (resolve) {
        _checkWorking(false);
        _emitStatus('connect-off');
        _clearVarsValue();
        resolve(true);
    });
};

// exit handler
process.on('exit', function () {
    if (typeof s7client !== 'undefined' && s7client) s7client = null;
});
```

#### 断连后不自动重连（2026-10-22 修复，commit `e591dd49`）

**现象**（对应官方 issue [#2626](https://github.com/frangoteam/FUXA/issues/2626)）：PLC 侧断电/拔网线后，日志每秒刷一条错误且**永不恢复**：

```
[ERR] 'S7-1500' _readVars error! Error: ISO : An error occurred during send TCP : Connection reset by peer
    at _getErr (.../runtime/devices/s7/index.js:677:16)
```

`runtime.update-project: restart!` 触发重启后才恢复正常。

**根因**：上层 `device.js` 的 `checkStatus()` 靠 `comm.isConnected()`（即 `s7client.Connected()`）判断是否需要重连。但 node-snap7 的 `Connected()` 只返回**原生库内部标志位**，不会探测 TCP 连接存活状态。PLC 主动断开后该标志仍为 true → `checkStatus()` 永不触发重连 → `polling()` 无限报错。

**修复**：在 `polling()` 的 catch 块里识别连接类错误，主动 `disconnect()` 重置原生状态，让下一轮 `checkStatus()` 检测到未连接并触发重连。

```javascript
} catch (reason) {
    if (reason && reason.stack) {
        logger.error(`'${data.name}' _readVars error! ${reason.stack}`);
    } else {
        logger.error(`'${data.name}' _readVars error! ${reason}`);
    }
    _checkWorking(false);
    // 连接类错误时主动断开：native 层 Connected() 标志不会自动更新，
    // 不断开则上层 device.js checkStatus() 永远检测不到断连、不会重连
    const msg = reason ? (reason.message || String(reason)) : '';
    if (/connection|reset|refused|timeout|broken pipe|peer/i.test(msg)) {
        logger.warn(`'${data.name}' connection lost detected, forcing disconnect to allow reconnect`);
        this.disconnect().catch(() => {});
    }
}
```

**注意**：本修复调用的是我们定制过的 `disconnect()`（只清 JS 状态、不调原生 `Disconnect()`），因此不会触发 2.1 节所述的 `STATUS_ACCESS_VIOLATION` 崩溃；如果哪天把 `disconnect()` 改回调用原生 `Disconnect()`，这个自动重连补丁会带来崩溃风险。

**验证**：拔掉 S7-1500 网线 → 出现 `connection lost detected, forcing disconnect to allow reconnect` → 约 5 秒内自动重连；插回网线后数据自动恢复。

### 2.2 守护进程（Guardian）

#### EXE 双模式入口

**文件**: `app/headless/headless-guardian.js`

同一个 EXE，两种运行模式：

- **Guardian 模式**（默认）：监控子进程，崩溃自动重启
- **Server 模式**（`FUXA_SERVER=1`）：实际运行 FUXA，由 Guardian spawn 启动

**守护参数**:

| 参数         | 值                                                  |
| ------------ | --------------------------------------------------- |
| 最大重启次数 | 1000                                                |
| 重启间隔     | 2 秒                                                |
| 快速重启上限 | 5 次/10 秒（超过则冷却 10 秒）                      |
| 端口传递     | 通过环境变量`PORT`（pkg EXE 不支持 CLI 参数透传） |

**命令行**:

```powershell
FUXA-1.3.5-2918-win-x64.exe              # 默认端口 1881
FUXA-1.3.5-2918-win-x64.exe -p 1882      # 指定端口
```

#### 开发调试守护脚本

**文件**: `server/guard.js`

为 `node main.js` 开发模式提供守护，与 EXE Guardian 行为一致：

```powershell
cd server
node guard.js -p 1886
```

启动日志包含配置参数、退出时显示 exit code 含义和运行时长，方便确认崩溃原因。

### 2.3 视图修改免重启

**文件**: `server/api/projects/index.js` + `server/runtime/project/index.js`

保存项目时对比新旧数据，仅在关键配置变化时重启：

| 保存入口           | 触发重启 | 原因                    |
| ------------------ | :------: | ----------------------- |
| `/editor` 编辑器 |    否    | 仅 views + hmi 布局变化 |
| `/device` 设备页 |    是    | 设备/标签变更需重启生效 |

对比字段：`devices` / `server` / `alarms` / `notifications`

同时修复了 upload 下载小部件在 pkg 快照中 `Cannot mkdir` 的问题（优先使用 `process.env.userDir` 数据目录）。

### 2.4 PORT 环境变量支持

**文件**: `server/main.js`

端口读取优先级：`CLI -p` > `PORT 环境变量` > `mysettings.json` > `默认 1881`

```javascript
if (parsedArgs.port !== undefined) {
    settings.uiPort = parsedArgs.port;
} else if (process.env.PORT) {
    settings.uiPort = parseInt(process.env.PORT, 10);
}
```

### 2.5 fontkit 懒加载

**文件**: `server/api/resources/index.js`

`fontkit` 顶层 require 在 pkg 打包后抛出 `windows-1252` 编码错误。改为懒加载 + try-catch。

### 2.6 地图源加速

**文件**: `client/src/app/maps/maps-view/maps-view.component.ts`

原配置（单节点、无子域轮询）：

```javascript
L.tileLayer('https://tile-c.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
    attribution: '&copy; TC'
})
```

**2026-10-22 调整后**（commit `6301cd53`）：

```javascript
L.tileLayer('https://tile-{s}.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Tiles courtesy of <a href="https://hot.openstreetmap.org/" target="_blank">Humanitarian OpenStreetMap Team</a>',
    subdomains: 'bc',
    maxZoom: 19
}).addTo(this.map);
```

调整点：

| 项 | 原 | 现 | 原因 |
| -- | -- | -- | ---- |
| 子域轮询 | 固定 `tile-c` | `{s}` 轮询 `b`/`c` | 分散单节点压力、避免限流 |
| attribution | `© TC` | OSM + HOT 规范署名 | 遵守 OSM 使用条款 |
| maxZoom | 未设（默认 18） | 19 | 与瓦片服务实际层级一致 |

**国内可用性实测**（2026-10-22，本地网络）：

| 瓦片源 | 结果 |
| ------ | ---- |
| `tile.openstreetmap.org`（官方） | ❌ 超时 |
| `basemaps.cartocdn.com`（CartoDB） | ❌ 超时 |
| **`tile-{b,c}.openstreetmap.fr/hot`** | ✅ 200，0.8–2.0s |

> `tile-a` 在本网络不可达，因此 `subdomains` 只写 `'bc'`。换网络环境需重新测 a/b/c 三个子域。


### 2.7 设备启动保护

**文件**: `server/runtime/devices/index.js`

`start()` / `stop()` 包裹 try-catch，单个设备崩溃不影响其他设备。

### 2.8 pkg ESM 兼容补丁（Node-RED httprequest）

**文件**: `server/scripts/patch-nodered.js`

Node-RED httprequest 节点在 EXE 环境下存在**两阶段**兼容问题，均由本补丁处理：

#### 阶段一（首次修复，v1.3.5-2918 引入）

pkg 打包的虚拟文件系统不支持 ESM 的 `import()` 动态导入解析。Node-RED httprequest 使用 `await import('got')` 加载 `got` 包，在 pkg EXE 中报错：

```
Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'got' imported from C:\snapshot\fuxa-headless\...\21-httprequest.js
```

**修复**：将 `const { got } = await import('got')` 替换为 CommonJS 的 `require('got')`。外层 `server/node_modules/got` 是 v11.x（CommonJS），`require()` 完全可用。

#### 阶段二（上游 Node-RED 4.x 升级触发，2026-08-10 追加修复）

上游升级到 Node-RED 4.1.10 后，`@node-red/nodes` 自带了嵌套的 got **v12.6.1**（ESM-only，`"type": "module"`，位于 `@node-red/nodes/node_modules/got`）。此时虽然外层 server/node_modules 仍是 got v11（CJS），但 httprequest 内部 `require('got')` 会优先命中**嵌套的 ESM got v12**，导致：

```
[warn] [node-red/httprequest] SyntaxError: Cannot use import statement outside a module
```

> 注：这也是用户反馈"1.3.3 没有这些警告"的原因 —— 1.3.3 用的是 Node-RED 3.x，单版本 got v11（CJS），不存在嵌套冲突。

**修复**：改用 `require.resolve('got', { paths: [...] })` 显式指定查找路径为外层 4 级以上的 `server/node_modules`，跳过嵌套的 ESM got v12，强制命中 CommonJS got v11。最终写法：

```js
const got = require(require.resolve('got', {
  paths: [require('path').resolve(__dirname, '..', '..', '..', '..')]
}));
```

> 每次 `npm install` 后自动执行补丁，无需手动干预。

### 2.11 i18n 翻译与 httprequest 二次修复（2026-08-10）

| 类别                 | 修复内容                                                                                                                                                                                                         |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| i18n en.json         | 上游合并冲突导致`client/src/assets/i18n/en.json` 被损坏为仅 `{}`，恢复为 1880 键完整版本（commit d0dd240，恢复自 commit 17fb009a）                                                                           |
| i18n 翻译键          | 为 12 种语言补充缺失的`device.plugins-notice-*` 按钮翻译键（commit ed6edf19），设备页插件通知对话框显示中文（"插件和驱动程序"/"不再显示此消息"/"打开插件"）而非原始键名                                        |
| httprequest 嵌套 ESM | 修复 Node-RED 4.x`@node-red/nodes/node_modules/got` v12（ESM-only）与外层 got v11 的嵌套冲突，消除 `SyntaxError: Cannot use import statement outside a module` 警告，确保 HTTP Request 节点在 EXE 中正常工作 |

### 2.9 上游 v1.3.5-2918 合并（2026-08-04）

从 `frangoteam/FUXA` 同步 37 个提交。

### 2.10 上游 v1.3.5-2918 合并（2026-08-08）

从 `jingshui127/FUXA` master 同步 8 个新提交：

| 类别     | 更新                                                         |
| -------- | ------------------------------------------------------------ |
| 反向代理 | 新增`BASE_PATH` 环境变量支持，WebSocket 和静态资源路径适配 |
| 报警     | 修复报警权限#2494、修复负时间输入 #1865                      |
| 资源     | 修复图片组递归#2489                                          |
| 安全     | socket.io origin 从 API endpoint 派生                        |

**合并冲突**：`server/main.js`（因 PORT 环境和 BASE_PATH 同时修改），已手动合并保留两者。

### 2.12 品牌化定制（2026-08-10）

通过 `data/brand.json` 配置文件实现全站品牌替换，无需修改源码即可自定义品牌名称、Logo、标题等。用户只需修改配置文件并重启服务器，**无需重新构建前端**。

#### 架构

```
data/brand.json  ──(服务器启动时读取)──▶  server/brand.js  ──(注入)──▶  index.html
                                              │                                    │
                                              ├─ GET /api/brand                    └─ window.__BRAND__
                                              ├─ GET /api/brand/logo                        │
                                              └─ GET /api/brand/favicon                     ▼
                                                                                      AppService.getBrand()
                                                                                              │
                                                                              ┌───────────────┼───────────────┐
                                                                              ▼               ▼               ▼
                                                                        Sidenav        关于对话框      用户信息对话框
```

#### 配置文件 `data/brand.json`

```json
{
    "name": "TcScada",
    "title": "TcScada - 工业监控平台",
    "logo": "logo.svg",
    "favicon": "favicon.ico",
    "shortName": "TCS",
    "footer": "© 2026 TcScada"
}
```

| 字段          | 说明                             | 影响位置                                                        |
| ------------- | -------------------------------- | --------------------------------------------------------------- |
| `name`      | 品牌名称                         | 侧边栏标题、加载页「XXX Loading...」、关于对话框标题            |
| `title`     | 浏览器标签页标题                 | `<title>` 标签                                                |
| `logo`      | Logo 文件名（相对于 data/ 目录） | 加载页 Logo、关于对话框 Logo、侧边栏 Logo                       |
| `favicon`   | 浏览器图标文件名                 | `<link rel="icon">`                                           |
| `shortName` | 短名称（预留）                   | 移动端显示（预留）                                              |
| `footer`    | 页脚文字                         | 加载页底部、关于对话框底部、用户信息对话框底部、PDF 报表 header |

#### 后端 `server/brand.js`

**查找顺序**（找到第一个即停止）：

1. `<userDir>/brand.json`
2. `<userDir>/data/brand.json` ← 默认位置
3. `<userDir>/../data/brand.json`
4. `<userDir>/../brand.json`

**API 端点**（`server/main.js` 注册，无需认证）：

| 端点                       | 作用                  |
| -------------------------- | --------------------- |
| `GET /api/brand`         | 返回品牌配置 JSON     |
| `GET /api/brand/logo`    | 返回 Logo 图片文件    |
| `GET /api/brand/favicon` | 返回 favicon 图标文件 |

**index.html 注入**（`injectBrandToHtml` 函数）：

- 替换 `<title>` 为 `brand.title`
- 替换 `<link rel="icon">` 为 `/api/brand/favicon`
- 替换加载占位符 `FUXA Loading...` → `{brand.name} Loading...`
- 替换加载页 Logo div → `<img src="/api/brand/logo">`
- 替换底部 `powered by frangoteam` → `brand.footer`
- 注入 `<script>window.__BRAND__={...}</script>`

#### 前端集成

**`AppService`**（`client/src/app/_services/app.service.ts`）：

```typescript
export interface BrandConfig {
    name: string;
    title: string;
    logo: string | null;
    favicon: string | null;
    shortName: string;
    footer: string;
}

// 从 window.__BRAND__ 读取（服务端注入）
private loadBrandConfig(): BrandConfig { ... }
getBrand(): BrandConfig { ... }
getBrandName(): string { ... }
getBrandLogo(): string | null { ... }
```

**各组件品牌化替换点**：

| 组件           | 文件                           | 替换内容                                            |
| -------------- | ------------------------------ | --------------------------------------------------- |
| 侧边栏         | `sidenav.component.ts/html`  | 标题`FUXA` → `brandName`；Logo 回退到品牌 Logo |
| 关于对话框     | `header/info.dialog.html`    | Logo/标题/底部文字                                  |
| 用户信息对话框 | `home/userinfo.dialog.html`  | 底部`powered by frangoteam` → `brandFooter`    |
| PDF 报表       | `report-editor.component.ts` | header`FUXA by frangoteam` → `brand.footer`    |

#### 使用方法

1. 编辑 `data/brand.json`（可选：放入 `logo.svg` 和 `favicon.ico` 到 `data/` 目录）
2. **重启服务器**（品牌配置在启动时一次性加载，修改文件后不会自动重新加载）
3. 浏览器强制刷新（`Ctrl + Shift + R`）清除缓存

> **重要**：修改 `brand.json` 后必须重启服务器才生效。启动日志会输出 `[Brand] Loaded brand config from ...: name="XXX"` 确认加载。

#### 回退规则

- `brand.json` 不存在或格式错误 → 使用默认配置（`name: "FUXA"`）
- `logo`/`favicon` 字段为 `null` 或文件不存在 → 使用默认 FUXA Logo/favicon
- 单个字段缺失 → 该字段回退到默认值

### 2.13 官方 1.3.5 同步与升级（2026-10-07）

**同步流程**（官方 frangoteam/FUXA master → 本地 fork）：

1. **查官方最新**：`https://api.github.com/repos/frangoteam/FUXA/commits?sha=master&per_page=5`（直接看 master，不等发布版）
2. **版本确认**：`server/package.json` 的 `version` + 构建号（本次官方 master 为 `1.3.5-2918`）
3. **本地对比**：落后 75 提交 → `git fetch official` + `git merge official/master`
4. **冲突处理**（本次 28 个冲突文件）：

| 冲突类型 | 策略 |
| -------- | ---- |
| `client/dist` | 采用官方版（本地已移除 dist 跟踪，见 4.14，今后不再冲突） |
| `server/main.js` | 采用本地版（官方版是本地版子集，本地含品牌注入 + BASE_PATH） |
| node-red 白名单 | 官方版 + 本地 BASE_PATH 补丁合并 |
| `server/auth` | 采用官方版 |
| i18n JSON | **深合并**：官方新键 + 本地 `plugins-notice` 键并集 |

5. **品牌化保护清单**（合并后必须确认都在）：`server/brand.js`、`/api/brand`、`/api/brand/logo`、`/api/brand/favicon` 路由、`injectBrandToHtml` 调用
6. **验证**：全部 server JS `node --check` 语法检查 + node-red/brand 模块可加载

**官方 1.3.5 值得关注的新增**：配方管理（#2492）、MQTT 每主题 retain（#2518）、MQTT/Modbus TimeOut 变量（#2507）、BASE_PATH 修复（#2571 Node-RED 路由 / #2550 上传资源 URL）、安全修复 4 项（#2479/#2480/#2553/#2494）、S7 Linux 稳定性（#2437，Windows 本地方案保留见 2.1）。

**版本统一**（分支/EXE/workflow 全部改为 `1.3.5-2918`，提交 `641961a1`）：

| 位置 | 内容 |
| ---- | ---- |
| 分支名 | 本地 `git branch -m` 重命名分支，推送后删远程旧分支 |
| `headless_packaging.yml` | `branches`、pkg 版本、EXE 名、Artifact 名 |
| `docker_release.yml` | `version` |
| 运行时日志 | 自动读 `package.json`，无需改代码 |
| 文档/skill | README、指南、`fuxa-maintainer`、`build-fuxa-exe` |

### 2.14 配方管理修复（2026-10-07）

**背景**: 官方 1.3.5 新增配方管理（#2492）。UI 配方列表操作的是**模板**（ProjectRecipe type），但官方 `downloadRecipe`/`uploadRecipe` 只查询**实例存储**（SetRecipe）→ 下载模板报 `400 "Recipe not found"`。

**修复**（`server/runtime/plugins/recipes/recipes.ts`，提交 `77783dff`）：

- 取数与 `export` 一致：**模板优先（`getRecipeOrInstance`），实例兜底**
- 下载：模板 → 从模板取 entries 执行写入；实例 → 按原逻辑
- 上传：模板 → 写回项目数据；实例 → 写实例存储

**验证**：官方 recipes 单元测试 112 全部通过 + 端到端 API（创建模板 → `POST /api/recipes/download` → `202 {"result":"started","totalEntries":N}`）。

### 2.15 官方 v1.3.5 正式版同步（2026-10-22）

官方打 tag `v1.3.5`（commit `cf0a44c7`），比上次同步的官方 master 多 **50 个提交**，merge 后本地分支提交 `8a111469`（merge commit）。

**官方新增/修复中与本地强相关的项**：

| 项 | PR | 本地影响 |
| -- | -- | -------- |
| **安全加固**（认证、Node-RED 授权、DAQ 查询限制、设置泄露） | #2598 | 高危，必合 |
| DAQ 查询作用域隔离（session 隔离，`socket.emit` 不再广播） | #2604 / #2606 | 安全 |
| DAQ `sids` 上限 100（超出返回 `invalid_query`） | #2604 | 已验证 |
| signin 空用户名/密码直接拒绝（不再遍历用户表） | #2598 | 已验证 |
| **S7 Bool 标签写入**（`toBoolean()`） | #2579 | S7 用户必看 |
| Node-RED tag-change 改为按值比较 | #2607 | Node-RED 用户 |
| Node-RED DAQ 时间戳归一化 | #2600 | Node-RED 用户 |
| Node-RED BASE_PATH 路由修复 | #2571 / #2577 | 反向代理 |
| 中文翻译术语修正（zh-cn / zh-tw） | #2601 | 本地化改善 |
| Enter 键防重复提交 | #2584 | 交互改善 |
| 通用 EtherNet/IP 驱动 | #2586 | 新增驱动，不影响现有设备 |
| 可配置 MQTT/Modbus 超时、MQTT per-topic retain | #2507 / #2518 | 新能力 |

**冲突处理（本次 4 处需要手工合并，其余自动）**：

| 文件 | 处理 |
| ---- | ---- |
| `server/runtime/devices/s7/index.js` | 官方 S7 改动 + 本地"跳过原生 Disconnect"合并，**保留本地定制** |
| `server/runtime/plugins/recipes/recipes.ts` | 本地"模板优先"逻辑下沉到 `recipeStorage.getRecipeData`，与官方 export 路径对齐 |
| `server/main.js` | 保留本地版（品牌注入 + BASE_PATH + PORT 环境变量） |
| i18n JSON | 深合并（官方新键 + 本地 `plugins-notice` 键） |

**合并后必须回归验证的清单**：
品牌注入（`/api/brand`、标题、favicon）、BASE_PATH 反向代理、PORT 优先级、S7 `disconnect()` 不调原生接口、配方模板下载、patch-nodered、DAQ sids 限制、signin 空值拒绝。

### 2.16 官方同步检查清单（每次同步照做）

1. `gh api repos/frangoteam/FUXA/releases/latest --jq '.tag_name,.target_commitish'` 拿正式版 tag
2. `git fetch official --tags` → `git merge official/vX.Y.Z`
3. 冲突按 2.15 的表格处理；**i18n 一律深合并**
4. 合并后跑：`git diff --stat` 逐个确认本地定制文件是否被覆盖
5. 本地源码模式验证（见 3.4）→ 通过后再 push 出 EXE
6. 更新本文档 2.x 与 `fuxa-maintainer` / `build-fuxa-exe` skill 的版本与要点

---

## 三、构建与部署

### 3.1 GitHub Actions 自动构建（推荐）

推送代码到 `1.3.5-2918` 分支后自动触发构建，产物上传到 Release。

**手动触发**:

```bash
gh workflow run "Build FUXA Headless (Latest)" --ref 1.3.5-2918
```

或浏览器打开 [Actions 页面](https://github.com/jingshui127/FUXA-Tecon/actions) → 选择 workflow → Run workflow。

**监控构建**:

```bash
gh run list --workflow=headless_packaging.yml --limit 3
gh run view <RUN_ID>
```

**下载 EXE**:

```bash
# 直连
gh release download headless-latest --repo jingshui127/FUXA-Tecon --pattern "*.exe" --dir ./download

# 国内镜像
# https://gh-proxy.com/https://github.com/jingshui127/FUXA-Tecon/releases/download/headless-latest/FUXA-headless-windows-x64.exe
```

### 3.2 本地打包（备选）

当 GitHub Actions 不可用时使用，或通过 `build-fuxa-exe` Skill 一键执行：

```powershell
# Step 1: 构建前端
cd client && npm run build -- --configuration=production

# Step 2: 同步文件
robocopy "server" "fuxa-headless\server" /E /NFL /NDL /XD .git
robocopy "client\dist" "fuxa-headless\client\dist" /E /NFL /NDL
Copy-Item "app\headless\headless-guardian.js" "fuxa-headless\main.js" -Force

# Step 3: 打包
pkg fuxa-headless/package.json --targets node18-win-x64 --output artifacts/FUXA-1.3.5-2918-win-x64.exe
```

### 3.3 测试验证

```powershell
# 启动
.\artifacts\FUXA-1.3.5-2918-win-x64.exe -p 1882

# 访问 http://127.0.0.1:1882/
```

| 验证项   | 预期                                        |
| -------- | ------------------------------------------- |
| Web 页面 | 200 响应                                    |
| S7 通讯  | 标签数据正常刷新                            |
| 项目保存 | `/editor` 免重启，`/device` 重启        |
| 视图修改 | 日志输出`views-only change, skip restart` |
| 地图     | 法国 OSM 镜像正常加载                       |
| 守护     | 崩溃后 2 秒自动重启                         |

### 3.4 本地源码模式快速验证（推荐优先于 EXE 构建）

**核心原则**：改 `server/` 后端代码（驱动、API、runtime）时，**不必每次等 Actions 构建 6 分钟**，直接跑源码即可验证；只有需要交付、或改了前端/依赖时才构建 EXE。

```powershell
cd c:\Users\13971\Downloads\FUXA-master\server
node guard.js -p 2999
```

本地环境（已具备）：Node.js **18.20.8**、`server/node_modules`、`client/dist`、`server/guard.js`。

| 改动位置 | 本地源码验证 | 需要重建 EXE |
| -------- | ------------ | ------------ |
| `server/**/*.js`（驱动/API） | ✅ 直接 `node guard.js` | 交付时 |
| `client/src/**`（前端） | 需先 `npm run build`；**纯字符串级小改可直接改 dist 对应的 `main.*.js` 快速验证** | 交付时（Actions 会现场构建） |
| `server/package.json`（依赖） | ⚠️ 需 `npm install` | ✅ 必须 |
| `data/brand.json` | ✅ 启动时读取，改完重启即可 | ❌ 不用 |

**推荐工作流**：本地源码验证 → 通过后 `git push private 1.3.5-2918` → Actions 出正式 EXE → 只做一次打包回归。

> 直接改 dist 仅用于**本地快速看效果**，不能替代提交 `client/src` 源码；dist 已从 git 移除跟踪，Actions 永远用 src 现场构建。

### 3.5 下载 Release 产物（CDN 慢时用分段并行）

`gh release download` 与单连接 `curl` 在国内常卡在几百 KB。实测单连接 ~130 KB/s（283MB 需 30+ 分钟），改用 **8 线程 Range 并行 + 本地拼接** 约 6 分钟完成。

```powershell
# 1) 取资产 ID 与字节数
$assetId = gh api "repos/jingshui127/FUXA-Tecon/releases/tags/headless-latest-<run_id>" --jq '.assets[0].id'
$total   = gh api "repos/jingshui127/FUXA-Tecon/releases/tags/headless-latest-<run_id>" --jq '.assets[0].size'

# 2) 取带签名的 CDN 跳转地址
$token = gh auth token
$loc = (curl.exe -sI -H "Authorization: token $token" -H "Accept: application/octet-stream" `
        "https://api.github.com/repos/jingshui127/FUXA-Tecon/releases/assets/$assetId") |
        Select-String '^Location:' | ForEach-Object { $_.ToString().Substring(9).Trim() }

# 3) 8 段并行下载（每段写 partNN），再按顺序拼成一个文件
# 4) 校验最终字节数 == $total，否则重新下载失败的分段
```

**要点**：
- 必须校验**最终字节数与 API 返回的 `size` 完全一致**，否则 EXE 无法启动（截断包通常也能"启动"一会儿才崩）
- 分段文件大小必须等于 `end - start + 1`，缺一段就整体重下该段
- 下载完成后删除临时目录，避免残留几百 MB


---

## 四、排障经验

### 4.1 S7 保存项目崩溃 (exit code 3221225477)

**症状**: `/device` 页面保存后进程退出，code=3221225477。

**根因**: `node-snap7` 原生模块的 `Disconnect()` 在 TCP 回调中调用时触发 native `STATUS_ACCESS_VIOLATION`。

**修复**: 跳过 `Disconnect()` 调用，OS 会在进程退出时回收 TCP 连接。详见 2.1 节。

### 4.2 S7 Promise reject 缺失导致数据不刷新

**症状**: 标签数值始终显示 `--`，`working` 标志卡死，后续操作全部阻塞。

**根因**: `_readVars/_writeDB/_writeVars` 错误回调中 `return _getErr(err)` 仅格式化错误字符串，未调用 `reject()`，Promise 永久 pending。

**修复**: 上游已修复，改为 `return reject(_getErr(err))`。

### 4.3 S7 标签解析失败（旧版）

**症状**: `load called, tags: 4` 但 `data loaded (0)`。

**根因**: `_getTagItem()` 访问 `s7client['S7AreaDB']` 时 s7client 未初始化。

**修复**: 上游通过懒加载 datatypes 从真实 S7Client 实例解决。旧版方案（模块级 S7Area 常量）已废弃。

### 4.4 pkg 端口参数崩溃

**症状**: `Cannot find module '-p'`，Guardian 反复重启。

**根因**: pkg 打包的 EXE 将第一个 CLI 参数当作 JS 文件路径。

**修复**: 改为环境变量 `PORT` 传递端口。

### 4.5 fontkit windows-1252 编码错误

**症状**: 启动时 `Error: encoding not supported: windows-1252`。

**修复**: 懒加载 + try-catch（见 2.5 节）。

### 4.6 upload mkdir in pkg snapshot

**症状**: 下载小部件报 `Cannot mkdir in a snapshot`。

**修复**: 优先使用 `process.env.userDir` 数据目录（见 2.3 节）。

### 4.7 Git 合并冲突标记

**症状**: `SyntaxError: Unexpected token '<<'`。

**修复**: 手动移除 `<<<<<<< HEAD` / `=======` / `>>>>>>>` 标记。

### 4.8 Agent.exe 退出后孤儿进程

**症状**: 第三方守护程序 `Agent.exe` 退出后 FUXA 未完全退出，端口被占用。

**根因**: 进程链 `Agent.exe → node(guardian) → node(server)` 中信号未传递。

**解决方案**:

| 方案                | 复杂度 | 说明                                                |
| ------------------- | :----: | --------------------------------------------------- |
| 修复 main.js SIGINT |   低   | 移除同步`process.exit()`，等 `FUXA.stop()` 完成 |
| 进程组              |   中   | Windows 使用进程组确保连带终止                      |
| 父进程监控          |   中   | Guardian 检测 Agent.exe 存活状态                    |

> 此问题仅在使用第三方守护程序时出现，直接运行 EXE 或 `node guard.js` 不受影响。

### 4.9 GitHub Actions 相关

| 问题                     | 解决                                                  |
| ------------------------ | ----------------------------------------------------- |
| Artifact 配额满          | 改用`softprops/action-gh-release@v2` 上传到 Release |
| DNS 污染                 | 使用加速镜像`gh-proxy.com` 下载                     |
| 私有仓库 runner 不可用   | 改用本地 pkg 打包                                     |
| Brotli 压缩导致 pkg 卡死 | 改用 GZip 压缩                                        |

### 4.10 节点版本

node-snap7 不支持 Node.js 20+，全部使用 Node.js 18 LTS。

> **补充**：`ng build`（前端构建）对 Node 版本无要求（v22 可用）；但 server 运行与 pkg 打包**必须 Node 18**（S7 原生模块）。EXE 内 pkg target 固定 `node18-win-x64`。

### 4.11 前端白屏 "Server connection failed!"（端口错位）

**症状**: server 跑在非 1881 端口（如 `-p 1886`），浏览器打开 `/editor` 白屏，提示 "Server connection failed!"，控制台 `ERR_CONNECTION_REFUSED` 指向 `127.0.0.1:1881`。

**根因**: 前端 `EndPointApi.getURL()`（`client/src/app/_helpers/endpointapi.ts`）逻辑——只要 `environment.apiPort` 有值，就强制用它拼 API 地址。官方**旧构建的 dist** 里 `apiPort=1881`（构建于同源改造前）；当前 src 的 `environment.prod.ts` 已是 `apiPort: null`（**同源**，任意端口可用）。

**解决**:

- **EXE 场景**：无此问题——EXE 里的 dist 是 Actions 现场 `npm run build` 构建的（同源逻辑），`-p 2999` 等任意端口正常
- **本地源码模式**（`node guard.js -p XXXX`）：必须**先用当前 src 本地构建 dist**（`ng build`），否则 server 服务的是工作区残留的旧 dist

**品牌化同理**：改 `brand.json` 无需重建前端（server 运行时注入 `__BRAND__`）；但前端读 `__BRAND__` 的代码（`loadBrandConfig`）必须构建进 dist 才生效。

### 4.12 本地构建崩溃 / git 命令失败（虚拟内存不足）

**症状**:

- `ng build` 崩溃，exit `0xC0000409`（Angular 在 setup 阶段）
- `git push` 报 `os error 1455 页面文件太小，无法完成操作`、`LoadLibraryExW() failed`（连 libcurl DLL 都加载不了）

**根因**: 系统**页面文件（虚拟内存）仅 4GB**，物理内存不足时高峰需求无法满足。

**解决**:

- 增大虚拟内存：系统属性 → 高级 → 性能 → 虚拟内存 → 自定义 **8192/16384MB**（需重启生效）
- 或构建时加大堆：`$env:NODE_OPTIONS='--max-old-space-size=4096'`
- 构建命令建议直接用 ng.js（npm.ps1 包装在 PowerShell 下有输出误判）：`node node_modules\@angular\cli\bin\ng.js build --configuration=production`

### 4.13 EXE 下载 404（CDN/认证问题）

**症状**: `curl <browser_download_url>` 返回 404（无 `-f` 时留 0 字节文件）；`gh release download` 报 "release not found"；未认证的 API 资产 URL 也 404。

**解决**（带认证走 API 资产签名 URL）：

```powershell
$token = gh auth token
$assetId = gh api "repos/{owner}/{repo}/releases/tags/{tag}" --jq '.assets[0].id'
curl.exe -fL --retry 10 -H "Authorization: token $token" -H "Accept: application/octet-stream" `
  -o "target.exe" "https://api.github.com/repos/{owner}/{repo}/releases/assets/$assetId"
```

> **务必加 `-f`**，否则 404 也返回 exit 0，留下 0 字节文件无法启动。

### 4.14 client/dist 移除跟踪

**原因**: 官方每次更新都提交 dist → merge 官方 master 必然冲突；且本地 dist 常为官方旧构建（与本地 src 不一致，见 4.11）。

**操作**: `git rm -r --cached client/dist` + `.gitignore` 加 `client/dist/`（本地 `.gitignore` 第 100 行）。

**影响**:

- EXE 构建**不受影响**：Actions 现场 `npm run build` 生成 dist 后打包
- 本地源码模式需自行构建 dist（见 4.11）
- 仓库不再管理 dist，merge 官方不再有 dist 冲突

### 4.15 官方 "agent" 提交（误解澄清）

**结论**: 官方**没有运行时 agent 功能**。提交 `95f1148 "feat: add skip agents"` 仅修改 `.gitignore`，忽略 `.agents/` 和 `AGENTS.md`（AI 编程工具生成的产物），防止仓库被污染。

### 4.16 PowerShell 写 JSON 带入 BOM 导致 Actions 构建失败

**症状**：push 后 Actions 的 `Build client` 步骤直接失败：`client/package.json SyntaxError`（本地 `npm install` 却正常）。

**根因**：合并冲突时用 `Set-Content` 重写 `package.json`，PowerShell 5 默认写 **UTF-8 with BOM**（文件头 `EF BB BF`）。Node.js 的 `JSON.parse` / npm 在某些环境下不接受带 BOM 的 JSON，Actions 的 Node 环境直接报语法错误。

**修复**（无 BOM 重写）：

```powershell
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$content = [System.IO.File]::ReadAllText($path)
[System.IO.File]::WriteAllText($path, $content, $utf8NoBom)
```

**检查**：`Get-Content $path -Encoding Byte -TotalCount 3` 应是 `123 13 10`（`{` + CRLF），而不是 `239 187 191`（BOM）。

**教训**：任何 `.json` / `.ts` / `.js` 文件经 PowerShell 改写后都要检查 BOM；优先用编辑工具而不是 `Set-Content`。

### 4.17 浏览器自动化子代理无法访问 localhost（误报）

**症状**：`browser_use` 子代理报告 `socket.io net::ERR_CONNECTION_REFUSED`、页面白屏，但同时刻 `netstat` 显示端口 LISTENING、`curl` 返回 200。

**根因**：该子代理的浏览器运行环境与本地主机网络不共享，`localhost` 指向的是它自己的沙箱。

**处理**：用 CLI 交叉验证（`netstat` + `curl http://localhost:PORT/` + `/socket.io/?EIO=4&transport=polling`），不要仅凭子代理结论判断服务异常。涉及 localhost 的 UI 验证，让用户在本机浏览器确认。

---

## 五、待办事项

### 已完成

- [X] 安装全部 10 个设备驱动 npm 包
- [X] pkg CLI 参数兼容修复
- [X] Git 合并冲突修复
- [X] upload mkdir pkg 快照修复
- [X] 视图修改免重启优化
- [X] 上游 v1.3.5-2918 合并同步（反向代理、报警权限、输入验证）
- [X] 修复 `html-image.component.ts` 冲突标记残留，恢复构建
- [X] 修复 `server/package.json` 缺少 `modbus-serial` 和 `node-snap7` 依赖，导致 EXE 中插件未识别
- [X] 修复 Node-RED httprequest 节点 `got` 包 pkg ESM 导入失败，新增 `postinstall` 自动补丁
- [X] **品牌化定制**（2026-08-10）— 通过 `data/brand.json` 实现全站品牌替换（名称、Logo、标题、footer），覆盖加载页、侧边栏、关于对话框、用户信息对话框、PDF 报表，详见 2.12 节
- [X] **官方 1.3.5 全量同步**（2026-10-07）— merge 官方 master（75 提交），版本升级至 `1.3.5-2918`，详见 2.13 节
- [X] **版本统一**（2026-10-07）— 分支名/EXE 命名/workflow/docker/文档/skill 全部统一为 `1.3.5-2918`，提交 `641961a1`
- [X] **配方管理修复**（2026-10-07）— 官方 recipes 下载/上传模板 400 bug，模板优先修复，单元 112 通过 + 端到端 202，提交 `77783dff`，详见 2.14 节
- [X] **GitHub Actions 构建恢复**（2026-10-07）— `1.3.5-2918` 分支推送自动触发 `headless_packaging.yml` 构建成功，产物 `FUXA-1.3.5-2918-win-x64.exe` 上传 Release `headless-latest-{run_id}`
- [X] **client/dist 移除跟踪**（2026-10-07）— 避免官方同步 dist 冲突，见 4.14 节
- [X] **官方 v1.3.5 正式版同步**（2026-10-22）— merge tag `v1.3.5`（`cf0a44c7`，50 提交），合并 `8a111469`，含安全加固 #2598、DAQ 作用域隔离 #2604/#2606、S7 Bool 写入 #2579、中文翻译 #2601，详见 2.15 节
- [X] **S7 断连自动重连**（2026-10-22）— 对应官方 issue #2626，`polling()` 检测连接类错误主动 `disconnect()`，提交 `e591dd49`，详见 2.1 节
- [X] **地图源改为子域轮询**（2026-10-22）— `openstreetmap.fr/hot` + `subdomains:'bc'` + 规范 attribution，提交 `6301cd53`，详见 2.6 节
- [X] **EXE 下载手段升级**（2026-10-22）— CDN 单连接过慢时用 8 线程 Range 分段并行下载，见 3.5 节
- [X] **本地源码快速验证流程**（2026-10-22）— 后端改动先用 `node guard.js -p 2999` 验证，再 push 出 EXE，见 3.4 节

### 待处理

- [ ] **main.js SIGINT 处理修复**
  当前 `FUXA.stop().then()` 后立即执行 `process.exit()`，清理逻辑从未执行。修复方案：

  ```javascript
  process.on('SIGINT', function () {
      logger.info('FUXA stopping...');
      FUXA.stop().then(function () {
          logger.info('FUXA end!');
          process.exit(0);
      }).catch(function (err) {
          logger.error('Failed to stop: ' + err);
          process.exit(1);
      });
  });
  ```
- [ ] **S7 设备差异重启**
  只停/启变化的设备，未变化的保持运行。
- [ ] **数据目录统一到 `data/`**
  当前部分路径仍使用 `_appdata`。

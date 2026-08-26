# FUXA Headless EXE 定制化优化指南

> 最后更新: 2026-08-10
> 当前版本: 1.3.4-2888
> 分支: `1.3.4-2888`
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
| `server/runtime/devices/s7/index.js`                                | 修改 | 跳过 Disconnect + exit handler（上游 v1.3.4 修复了 Promise reject 等关键 bug）    |
| `server/runtime/devices/index.js`                                   | 修改 | 设备 start/stop try-catch 保护                                                    |
| `server/runtime/index.js`                                           | 修改 | 异步重启 + 500ms 延迟                                                             |
| `server/api/projects/index.js`                                      | 修改 | 视图修改免重启 + upload mkdir 修复 + 异步重启                                     |
| `server/runtime/project/index.js`                                   | 修改 | 新增 getRawProject() 供免重启对比用                                               |
| `server/api/resources/index.js`                                     | 修改 | fontkit 懒加载修复 windows-1252 崩溃                                              |
| `server/main.js`                                                    | 修改 | `PORT` 环境变量端口支持                                                         |
| `server/package.json`                                               | 修改 | 添加`modbus-serial`、`node-snap7` 等驱动包依赖，添加 `postinstall` 补丁脚本 |
| `server/scripts/patch-nodered.js`                                   | 新建 | pkg ESM 兼容补丁，修复 Node-RED httprequest 节点`got` 导入失败                  |
| `client/src/app/gauges/controls/html-image/html-image.component.ts` | 修改 | 解决上游合并冲突（BASE_PATH 反向代理）                                            |
| `client/src/app/maps/maps-view/maps-view.component.ts`              | 修改 | 地图源改为法国 OSM 热区镜像（国内加速）                                           |
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

---

## 二、核心修改详解

### 2.1 S7 驱动修复（最重要）

**文件**: `server/runtime/devices/s7/index.js`

#### 上游 v1.3.4 修复（已合并）

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
FUXA-1.3.4-2888-win-x64.exe              # 默认端口 1881
FUXA-1.3.4-2888-win-x64.exe -p 1882      # 指定端口
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

默认 `tile.openstreetmap.org` 国内访问慢，改用法国 OSM 热区镜像 `tile-c.openstreetmap.fr/hot/`。

### 2.7 设备启动保护

**文件**: `server/runtime/devices/index.js`

`start()` / `stop()` 包裹 try-catch，单个设备崩溃不影响其他设备。

### 2.8 pkg ESM 兼容补丁（Node-RED httprequest）

**文件**: `server/scripts/patch-nodered.js`

Node-RED httprequest 节点在 EXE 环境下存在**两阶段**兼容问题，均由本补丁处理：

#### 阶段一（首次修复，v1.3.4-2888 引入）

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

### 2.9 上游 v1.3.4-2888 合并（2026-08-04）

从 `frangoteam/FUXA` 同步 37 个提交。

### 2.10 上游 v1.3.4-2888 合并（2026-08-08）

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

---

## 三、构建与部署

### 3.1 GitHub Actions 自动构建（推荐）

推送代码到 `1.3.4-2888` 分支后自动触发构建，产物上传到 Release。

**手动触发**:

```bash
gh workflow run "Build FUXA Headless (Latest)" --ref 1.3.4-2888
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
pkg fuxa-headless/package.json --targets node18-win-x64 --output artifacts/FUXA-1.3.4-2888-win-x64.exe
```

### 3.3 测试验证

```powershell
# 启动
.\artifacts\FUXA-1.3.4-2888-win-x64.exe -p 1882

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

---

## 四、排障经验

### 4.1 S7 保存项目崩溃 (exit code 3221225477)

**症状**: `/device` 页面保存后进程退出，code=3221225477。

**根因**: `node-snap7` 原生模块的 `Disconnect()` 在 TCP 回调中调用时触发 native `STATUS_ACCESS_VIOLATION`。

**修复**: 跳过 `Disconnect()` 调用，OS 会在进程退出时回收 TCP 连接。详见 2.1 节。

### 4.2 S7 Promise reject 缺失导致数据不刷新

**症状**: 标签数值始终显示 `--`，`working` 标志卡死，后续操作全部阻塞。

**根因**: `_readVars/_writeDB/_writeVars` 错误回调中 `return _getErr(err)` 仅格式化错误字符串，未调用 `reject()`，Promise 永久 pending。

**修复**: 上游 v1.3.4 已修复，改为 `return reject(_getErr(err))`。

### 4.3 S7 标签解析失败（旧版）

**症状**: `load called, tags: 4` 但 `data loaded (0)`。

**根因**: `_getTagItem()` 访问 `s7client['S7AreaDB']` 时 s7client 未初始化。

**修复**: 上游 v1.3.4 通过懒加载 datatypes 从真实 S7Client 实例解决。旧版方案（模块级 S7Area 常量）已废弃。

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

---

## 五、待办事项

### 已完成

- [X] 安装全部 10 个设备驱动 npm 包
- [X] pkg CLI 参数兼容修复
- [X] Git 合并冲突修复
- [X] upload mkdir pkg 快照修复
- [X] 视图修改免重启优化
- [X] 上游 v1.3.4-2888 合并同步（反向代理、报警权限、输入验证）
- [X] 修复 `html-image.component.ts` 冲突标记残留，恢复构建
- [X] 修复 `server/package.json` 缺少 `modbus-serial` 和 `node-snap7` 依赖，导致 EXE 中插件未识别
- [X] 修复 Node-RED httprequest 节点 `got` 包 pkg ESM 导入失败，新增 `postinstall` 自动补丁
- [X] **品牌化定制**（2026-08-10）— 通过 `data/brand.json` 实现全站品牌替换（名称、Logo、标题、footer），覆盖加载页、侧边栏、关于对话框、用户信息对话框、PDF 报表，详见 2.12 节

### 待处理

- [ ] **GitHub Actions 构建恢复**
  私有仓库 runner 当前不可用，待排查。可考虑迁移到公开仓库或使用自托管 runner。
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

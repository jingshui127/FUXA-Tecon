# FUXA PRO 1.3.4-PRO 插件与 Node-RED 部署指南

本文档适用于当前 `fuxa-pro-headless.exe`。网页安装的插件、Node-RED 流程和 FUXA 数据均保存在 EXE 同目录的 `data\` 中。

## 通讯插件列表

| 插件名称 | 依赖包 | 版本 | 类型 | 状态 |
|---------|--------|------|------|------|
| MODBUS-TCP/RTU | modbus-serial | ^8.0.19 | Native | ✅ 正常 |
| S7-1200/1500 | node-snap7 | ^1.0.9 | Native | ✅ 正常 |
| OPC UA | node-opcua | ^2.149.0 | Pure JS | ✅ 正常 |
| BACnet | node-bacnet | ^0.2.4 | Pure JS | ✅ 正常 |
| ADS | ads-client | ^2.1.0 | Native | ✅ 正常 |

## 安装方式

### 当前推荐：网页插件管理

启动 `fuxa-pro-headless.exe` 后，在 FUXA 中打开：

```text
http://127.0.0.1:1881/plugins
```

在此页面安装或更新通讯插件。插件运行时目录为：

```text
<EXE目录>\data\_pkg\runtime\node_modules\
```

复制 EXE 到其他 Windows x64 电脑时，同时复制完整的 `data\` 文件夹即可保留已安装的插件和配置，通常无需重新安装。

### 历史方案：手工 npm 安装

以下命令仅用于旧版本、离线构建或明确要求将插件内置到 EXE 的场景，不是当前运行时安装方式：

```bash
cd server
npm install modbus-serial@8.0.19 node-snap7@1.0.9 node-opcua@2.149.0 node-bacnet@0.2.4 ads-client@2.1.0
```

Node-RED 本体是 FUXA 的内置服务依赖，不等同于网页通讯插件。它的管理编辑器入口是 `/flows`，兼容入口是 `/nodered`，Dashboard/HTTP 节点入口是 `/dashboard`。

## pkg 打包配置

### 当前 EXE 打包配置
```json
{
  "name": "fuxa-pro-headless",
  "version": "1.3.4-PRO",
  "bin": "main.js",
  "pkg": {
    "assets": ["server/**/*", "node_modules/**/*", "client/dist/**/*", "_reports/**/*"],
    "publicPackages": ["bindings", "@serialport/bindings-cpp"],
    "compression": "None"
  }
}
```

### 当前打包命令
```powershell
cd fuxa-headless
pkg package.json --targets node18-win-x64 --output ../artifacts/fuxa-pro-headless.exe --public-packages "bindings,@serialport/bindings-cpp"
```

不再使用旧的 `FuxaPro-Single.exe`、`_appdata` 或 GZip 配置。

### 当前数据目录配置
数据目录是 EXE 同目录下的 `data` 文件夹，由 `headless-guardian.js` 自动创建。

```text
fuxa-pro-headless.exe
└─ data\
   ├─ _pkg\runtime\node_modules\   # 网页安装的 npm 插件
   ├─ node-red\flows.json          # Node-RED 流程
   ├─ _db\                         # SQLite 数据
   ├─ _logs\                       # 日志
   └─ 其他运行目录
```

迁移到其他电脑时，必须复制整个 `data\` 文件夹。

## 核心代码修改清单

### 1. server/main.js (第 114 行)
```javascript
// 修改前
settings.appDir = __dirname;

// 修改后
settings.appDir = rootDir;
```
**原因**: pkg 打包后 `__dirname` 指向快照内部，导致上传功能失败。

### 2. server/main.js (Stardust 部分)
```javascript
// 修改前
stardustTracker = new StardustTracker({
    enabled: true
});

// 修改后
stardustTracker = new StardustTracker({
    enabled: false
});
```
**原因**: 避免连接失败产生大量错误日志。

### 3. server/runtime/plugins/index.js
在 `_checkPluginsSupported` 函数中增加多重路径检测逻辑。

### 4. fontkit 编码修复
修改 `node_modules/fontkit/dist/main.cjs` 第 5424 行，将 `ascii` 改为 `utf-8`。

## 已知问题及修复方案

### 问题1: MODBUS-TCP 插件加载失败
**错误信息**: `try to create MODBUS-TCP but plugin is missing!`

**原因分析**: `modbus-serial` 依赖于 native module `@serialport/bindings-cpp`，pkg 打包时需要特殊处理。

**修复方案**:
1. 在 `package.json` 的 `pkg.assets` 中添加 `"node_modules/@serialport/**/*"`
2. 在打包命令中添加 `--public-packages "@serialport/bindings-cpp"`

### 问题2: fontkit 编码错误
**错误信息**: `"windows-1252" encoding not supported`

**原因分析**: fontkit 模块使用不支持的编码初始化 TextDecoder。

**修复方案**:
修改 `fontkit/dist/main.cjs` 第 5424 行：`new TextDecoder('ascii')` → `new TextDecoder('utf-8')`

### 问题3: 插件检测失败
**原因分析**: 打包环境下路径解析失败。

**修复方案**:
修改 `server/runtime/plugins/index.js` 中的 `_checkPluginsSupported` 函数，增加多重路径检测和 `require.resolve()` 逻辑。

### 问题4: pkg 打包失败（文件被占用）
**错误信息**: `EPERM: operation not permitted, unlink 'xxx.exe'`

**修复方案**:
```powershell
Get-Process -Name FuxaPro-Single -ErrorAction SilentlyContinue | Stop-Process -Force
```

### 问题5: Stardust APM 遥测报错
**错误信息**: `[Stardust] Track event failed: Request failed with status code 404`

**修复方案**:
修改 `server/main.js`，设置 `enabled: false`。

### 问题6: 文件上传/下载小部件失败
**错误信息**: `Cannot mkdir in a snapshot. Try mountpoints instead.`

**根本原因分析**:
1. **headless-start.js 传递错误的 userDir**: 如果传递 `fuxaDataDir`（已包含 `_appdata`），main.js 会再加一层变成 `_appdata/_appdata`
2. **settings.appDir 指向快照内部**: `__dirname` 在 pkg 中指向 `C:\snapshot\...`，导致上传时尝试在快照内创建目录

**完整修复方案**:

**Step 1**: 修改 `headless-start.js`，传递 `execDir` 而不是 `fuxaDataDir`:
```javascript
// 修改前
env: { ...process.env, userDir: fuxaDataDir }

// 修改后  
env: { ...process.env, userDir: execDir }
```

**Step 2**: 修改 `main.js`，使用 `rootDir` 而不是 `__dirname`:
```javascript
// 修改前
settings.appDir = __dirname;

// 修改后
settings.appDir = rootDir;
```

### 问题7: 默认数据目录不在 exe 同目录
**现象**: 数据目录创建在 `C:\Users\<用户名>\fuxa-headless-data`

**修复方案**:
修改 `main.js` 中的默认 workDir 计算：
```javascript
// 修改前
var workDir = path.resolve(process.cwd(), '_appdata');

// 修改后
var execDir = path.dirname(process.execPath);
var workDir = path.join(execDir, '_appdata');
```

## 测试验证

### 启动验证
运行 exe 后检查日志是否包含以下关键信息：

```
✅ FUXA Headless starting...
✅ Using existing data directory: D:\...\artifacts\_appdata   ← 必须是 exe 同目录
✅ Launching FUXA server with userDir: D:\...\artifacts         ← 不带 _appdata
✅ [Stardust] APM tracer disabled                                 ← Stardust 已禁用
✅ 'MODBUS-TCP' created                                          ← 插件创建成功
✅ 'S7-1200' created                                             ← 插件创建成功
✅ FUXA started!                                                 ← 服务启动成功
✅ WebServer is running http://127.0.0.1:1881/                   ← Web 服务正常
```

### 功能测试清单
- [ ] MODBUS-TCP 通讯正常
- [ ] S7-1200 通讯正常
- [ ] OPC UA 插件可加载
- [ ] BACnet 插件可加载
- [ ] ADS 插件可加载
- [ ] 上传图片/文件正常
- [ ] 下载小部件正常
- [ ] 无 Stardust 错误日志
- [ ] 数据目录在 exe 同目录下

### 完整启动日志示例
```
FUXA Headless starting...
Using existing data directory: D:\FUXA\FUXApro1.3.1已部署版\artifacts\_appdata
Launching FUXA server with userDir: D:\FUXA\FUXApro1.3.1已部署版\artifacts
[Stardust] APM tracer disabled
2026-05-29T03:38:09.510Z [INF]  FUXA V.1.3.2-2827
2026-05-29T03:38:09.667Z [INF]  FUXA init in 170 ms.
2026-05-29T03:38:09.679Z [INF]  'FUXA Server' created
2026-05-29T03:38:09.683Z [INF]  'FUXA Server' start
2026-05-29T03:38:09.687Z [INF]  FUXA started!
2026-05-29T03:38:09.692Z [INF]  WebServer is running http://127.0.0.1:1881/
2026-05-29T03:38:10.794Z [INF]  socket.io client connected xxx
```

## 快速打包流程

```powershell
# 1. 停止可能运行的进程
Get-Process -Name FuxaPro-Single -ErrorAction SilentlyContinue | Stop-Process -Force

# 2. 进入 fuxa-headless 目录
Set-Location "D:\FUXA\FUXApro1.3.1已部署版\fuxa-headless"

# 3. 执行打包（约需 10-15 分钟）
pkg package.json --targets node18-win-x64 --out-path ../artifacts --public-packages "node-snap7,bindings,nan,@serialport/bindings-cpp"

# 4. 测试
Set-Location ..\artifacts
.\FuxaPro-Single.exe
```

## 版本历史

| 日期 | 版本 | 变更说明 |
|------|------|----------|
| 2026-05-29 | 2.0 | 全面重构文档；新增 appDir 修复方案；完善测试验证流程 |
| 2026-05-28 | 1.5 | 修复 appDir 导致的文件上传失败问题（settings.appDir = rootDir） |
| 2026-05-28 | 1.4 | 修复文件上传失败问题（传递 execDir） |
| 2026-05-28 | 1.3 | 修复默认数据目录配置 |
| 2026-05-27 | 1.2 | 添加 Stardust 配置解决方案 |
| 2026-05-26 | 1.1 | 初始版本 |

## 注意事项

1. **Native Module 处理**: 所有包含 native module 的依赖都需要在 `--public-packages` 中声明
2. **路径问题**: pkg 打包后 `__dirname` 指向快照内部，应使用 `rootDir` 或 `process.execPath`
3. **权限问题**: 打包和运行时确保无进程占用目标文件
4. **依赖版本**: 确保所有依赖版本与 Node.js 18 兼容
5. **端口冲突**: 确保 1881 和 8080 端口未被占用
6. **数据迁移**: 如需保留旧数据，手动复制旧 `_appdata` 目录到新位置

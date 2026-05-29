# FUXA Pro 通讯插件部署指南

## 概述
本文档记录了 FUXA Pro 通讯插件的安装、打包流程及常见问题修复方案，旨在帮助开发人员快速部署和维护通讯插件。

## 通讯插件列表

| 插件名称 | 依赖包 | 版本 | 类型 | 状态 |
|---------|--------|------|------|------|
| MODBUS-TCP/RTU | modbus-serial | ^8.0.19 | Native | ✅ 正常 |
| S7-1200/1500 | node-snap7 | ^1.0.9 | Native | ✅ 正常 |
| OPC UA | node-opcua | ^2.149.0 | Pure JS | ✅ 正常 |
| BACnet | node-bacnet | ^0.2.4 | Pure JS | ✅ 正常 |
| ADS | ads-client | ^2.1.0 | Native | ✅ 正常 |

## 安装步骤

### 1. 安装依赖
```bash
cd server
npm install modbus-serial@8.0.19 node-snap7@1.0.9 node-opcua@2.149.0 node-bacnet@0.2.4 ads-client@2.1.0
```

### 2. 同步依赖到 fuxa-headless
```bash
cd ../fuxa-headless
npm install modbus-serial@8.0.19 node-snap7@1.0.9 node-opcua@2.149.0 node-bacnet@0.2.4 ads-client@2.1.0
```

### 3. 更新 package.json
确保 `server/package.json` 和 `fuxa-headless/package.json` 中包含所有通讯插件依赖。

## pkg 打包配置

### package.json 配置（关键）
```json
{
  "name": "FuxaPro-Single",
  "version": "1.3.2-PRO",
  "bin": "server/headless-start.js",
  "pkg": {
    "assets": [
      "server/**/*",
      "client/dist/**/*",
      "_reports/**/*",
      "node_modules/@serialport/**/*"
    ],
    "compression": "Brotli"
  }
}
```

**重要**: `"bin"` 必须设置为 `"server/headless-start.js"`，而不是 `"main.js"`。

### 打包命令
```powershell
cd fuxa-headless
pkg package.json --targets node18-win-x64 --out-path ../artifacts --public-packages "node-snap7,bindings,nan,@serialport/bindings-cpp"
```

**注意**: 打包前必须确保没有正在运行的 FuxaPro-Single.exe 进程。

### 默认数据目录配置
默认数据目录已修改为 exe 文件的同目录下的 `_appdata` 文件夹。

**修改文件**: 
- `server/headless-start.js`
- `fuxa-headless/server/headless-start.js`

```javascript
// headless-start.js 关键代码
const exePath = process.execPath;
const exeDir = path.dirname(exePath);
const fuxaDataDir = path.join(exeDir, '_appdata');

// 创建数据目录
if (!fs.existsSync(fuxaDataDir)) {
    fs.mkdirSync(fuxaDataDir, { recursive: true });
}

// 启动服务器 - 注意：传递 execDir 而不是 fuxaDataDir
const serverProcess = fork(serverPath, [], {
    env: { ...process.env, userDir: execDir },
    stdio: 'inherit'
});
```

**关键配置说明**:
| 配置项 | 值 | 说明 |
|--------|-----|------|
| `"bin"` | `server/headless-start.js` | pkg 入口文件 |
| `process.execPath` | exe 所在路径 | 获取运行位置 |
| `userDir` | `execDir` | 传递给 main.js 的根目录 |

这样配置后，数据目录结构如下：
```
D:\FUXA\FUXApro1.3.1已部署版\artifacts\
├── FuxaPro-Single.exe          # 可执行文件
└── _appdata/                    # 数据目录（自动创建）
    ├── _db/                     # 数据库文件
    ├── _logs/                   # 日志文件
    ├── _upload_files/           # 上传文件目录
    ├── _images/                 # 图片资源
    ├── _widgets/                # 小部件资源
    ├── _reports/                # 报告文件
    ├── settings.js              # 配置文件
    └── fuxa.db                  # SQLite 数据库
```

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

# FUXA Headless EXE 定制化优化指南

> 最后更新: 2026-08-08
> 当前版本: 1.3.4 (基于上游 v1.3.4-2888)
> 分支: `1.3.4-2881`
> 仓库: https://github.com/jingshui127/FUXA-Tecon

---

## 目录

1. [修改文件清单](#一修改文件清单)
2. [核心修改详解](#二核心修改详解)
3. [构建与部署](#三构建与部署)
4. [排障经验](#四排障经验)
5. [待办事项](#五待办事项)

---

## 一、修改文件清单

| 文件 | 操作 | 用途 |
|------|:----:|------|
| `app/headless/headless-guardian.js` | 新建 | 双模式 EXE 入口（Guardian + Server） |
| `server/guard.js` | 新建 | 开发调试用守护脚本 (`node guard.js -p PORT`) |
| `.github/workflows/headless_packaging.yml` | 修改 | GitHub Actions 自动构建配置 |
| `server/runtime/devices/s7/index.js` | 修改 | 跳过 Disconnect + exit handler（上游 v1.3.4 修复了 Promise reject 等关键 bug） |
| `server/runtime/devices/index.js` | 修改 | 设备 start/stop try-catch 保护 |
| `server/runtime/index.js` | 修改 | 异步重启 + 500ms 延迟 |
| `server/api/projects/index.js` | 修改 | 视图修改免重启 + upload mkdir 修复 + 异步重启 |
| `server/runtime/project/index.js` | 修改 | 新增 getRawProject() 供免重启对比用 |
| `server/api/resources/index.js` | 修改 | fontkit 懒加载修复 windows-1252 崩溃 |
| `server/main.js` | 修改 | `PORT` 环境变量端口支持 |
| `server/package.json` | 修改 | 添加 10 个驱动包 |
| `client/src/app/maps/maps-view/maps-view.component.ts` | 修改 | 地图源改为法国 OSM 热区镜像（国内加速） |

---

## 二、核心修改详解

### 2.1 S7 驱动修复（最重要）

**文件**: `server/runtime/devices/s7/index.js`

#### 上游 v1.3.4 修复（已合并）

| 修复项 | 说明 |
|--------|------|
| `new` 关键字 | `new snap7.S7Client()` 替代 `snap7.S7Client()`，修复 Linux GC 导致的原型污染 |
| **Promise reject** | `_readVars/_writeDB/_writeVars` 错误回调中 `return _getErr(err)` → `return reject(_getErr(err))`，修复 Promise 卡死导致 working 标志永不清除 |
| 过载不断开 | 轮询过载时仅跳过当次轮询，不再调用 `Disconnect()` |
| 懒加载数据类型 | 从真实 S7Client 实例读取 datatypes，避免创建临时实例被 GC 回收 |

#### 我们保留的定制修改

| 修改 | 说明 | 原因 |
|------|------|------|
| `disconnect()` 跳过 `Disconnect()` | 仅清 JS 侧状态，不调用原生 Disconnect | node-snap7 原生层 bug：Disconnect 在回调中调用会触发 `STATUS_ACCESS_VIOLATION` (3221225477) |
| `process.on('exit')` handler | 退出前 `s7client = null` | 降低退出时原生模块清理冲突概率 |

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

| 参数 | 值 |
|------|-----|
| 最大重启次数 | 1000 |
| 重启间隔 | 2 秒 |
| 快速重启上限 | 5 次/10 秒（超过则冷却 10 秒） |
| 端口传递 | 通过环境变量 `PORT`（pkg EXE 不支持 CLI 参数透传） |

**命令行**:

```powershell
fuxa-headless.exe              # 默认端口 1881
fuxa-headless.exe -p 1882      # 指定端口
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

| 保存入口 | 触发重启 | 原因 |
|----------|:--------:|------|
| `/editor` 编辑器 | 否 | 仅 views + hmi 布局变化 |
| `/device` 设备页 | 是 | 设备/标签变更需重启生效 |

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

### 2.8 上游 v1.3.4-2881 合并（2026-08-04）

从 `frangoteam/FUXA` 同步 37 个提交。

### 2.9 上游 v1.3.4-2888 合并（2026-08-08）

从 `jingshui127/FUXA` master 同步 8 个新提交：

| 类别 | 更新 |
|------|------|
| 反向代理 | 新增 `BASE_PATH` 环境变量支持，WebSocket 和静态资源路径适配 |
| 报警 | 修复报警权限 #2494、修复负时间输入 #1865 |
| 资源 | 修复图片组递归 #2489 |
| 安全 | socket.io origin 从 API endpoint 派生 |

**合并冲突**：`server/main.js`（因 PORT 环境和 BASE_PATH 同时修改），已手动合并保留两者。

---

## 三、构建与部署

### 3.1 GitHub Actions 自动构建（推荐）

推送代码到 `1.3.4-2881` 分支后自动触发构建，产物上传到 Release。

**手动触发**:

```bash
gh workflow run "Build FUXA Headless (Latest)" --ref 1.3.4-2881
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
robocopy "server" "fuxa-headless-local\server" /E /NFL /NDL /XD .git
robocopy "client\dist" "fuxa-headless-local\client\dist" /E /NFL /NDL
Copy-Item "app\headless\headless-guardian.js" "fuxa-headless-local\main.js" -Force

# Step 3: 打包
pkg fuxa-headless-local/package.json --targets node18-win-x64 --output fuxa-headless-local/fuxa-headless.exe
```

### 3.3 测试验证

```powershell
# 启动
.\fuxa-headless-local\fuxa-headless.exe -p 1882

# 访问 http://127.0.0.1:1882/
```

| 验证项 | 预期 |
|--------|------|
| Web 页面 | 200 响应 |
| S7 通讯 | 标签数据正常刷新 |
| 项目保存 | `/editor` 免重启，`/device` 重启 |
| 视图修改 | 日志输出 `views-only change, skip restart` |
| 地图 | 法国 OSM 镜像正常加载 |
| 守护 | 崩溃后 2 秒自动重启 |

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

| 方案 | 复杂度 | 说明 |
|------|:------:|------|
| 修复 main.js SIGINT | 低 | 移除同步 `process.exit()`，等 `FUXA.stop()` 完成 |
| 进程组 | 中 | Windows 使用进程组确保连带终止 |
| 父进程监控 | 中 | Guardian 检测 Agent.exe 存活状态 |

> 此问题仅在使用第三方守护程序时出现，直接运行 EXE 或 `node guard.js` 不受影响。

### 4.9 GitHub Actions 相关

| 问题 | 解决 |
|------|------|
| Artifact 配额满 | 改用 `softprops/action-gh-release@v2` 上传到 Release |
| DNS 污染 | 使用加速镜像 `gh-proxy.com` 下载 |
| 私有仓库 runner 不可用 | 改用本地 pkg 打包 |
| Brotli 压缩导致 pkg 卡死 | 改用 GZip 压缩 |

### 4.10 节点版本

node-snap7 不支持 Node.js 20+，全部使用 Node.js 18 LTS。

---

## 五、待办事项

### 已完成

- [x] 安装全部 10 个设备驱动 npm 包
- [x] pkg CLI 参数兼容修复
- [x] Git 合并冲突修复
- [x] upload mkdir pkg 快照修复
- [x] 视图修改免重启优化
- [x] 上游 v1.3.4-2888 合并同步（反向代理、报警权限、输入验证）

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
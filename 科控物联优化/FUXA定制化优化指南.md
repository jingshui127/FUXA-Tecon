![1781532469406](image/FUXA定制化优化指南/1781532469406.png)# FUXA Headless EXE 定制化优化指南

> 最后更新: 2026-06-15
> 基于版本: 1.3.3-2843
> 分支: `1.3.3-2843`
> 仓库: https://github.com/jingshui127/FUXA-Tecon

---

## 目录

1. [本次修改的完整文件清单](#一本次修改的完整文件清单)
2. [各文件修改详情](#二各文件修改详情)
3. [构建与部署流程](#三构建与部署流程)
4. [排障经验](#四排障经验)
5. [待办事项](#五待办事项)

---

## 一、本次修改的完整文件清单

| 文件 | 操作 | 用途 |
|------|:----:|------|
| `app/headless/headless-guardian.js` | 新建 | EXE 双模式入口（Guardian + Server） |
| `.github/workflows/headless_packaging.yml` | 修改 | 构建配置：Node.js 18 + Release 上传 |
| `server/api/resources/index.js` | 修改 | fontkit 懒加载修复 windows-1252 崩溃 |
| `server/runtime/devices/s7/index.js` | 修改（之前已完成）| S7 驱动优化：延迟初始化 + 跳过 Disconnect() |
| `server/runtime/devices/index.js` | 修改（之前已完成）| 设备 start/stop try-catch 保护 |
| `server/api/projects/index.js` | 修改（之前已完成）| API 异步重启，消除"保存失败"提示 |
| `client/src/app/maps/maps-view/maps-view.component.ts` | 修改 | 地图源改为法国 OSM 热区镜像（国内加速） |
| `server/package.json` | 修改 | 添加设备驱动依赖 + 修正版本号 |

---

## 二、各文件修改详情

### 2.1 headless-guardian.js — 双模式 EXE 入口

**路径**: `app/headless/headless-guardian.js`
**用途**: 作为 pkg 打包的入口点（main.js），实现两种运行模式：

**模式一：Server 模式** (`FUXA_SERVER=1`)
- 由 Guardian 进程以子进程方式启动
- 设置数据目录为 `%USERPROFILE%\fuxa-headless-data\`
- 直接 require FUXA server 主程序

**模式二：Guardian 模式** (默认)
- 监控子进程（Server 模式），崩溃后自动重启
- 防止无限循环崩溃：10 秒窗口内最多 5 次快速重启
- 最大重启次数：1000 次（基本无限制）
- 重启间隔：2 秒
- 日志输出带时间戳和重启计数

**关键代码结构**:
```javascript
// Server 模式检测
if (process.env.FUXA_SERVER === '1') {
    const homeDir = os.homedir();
    const fuxaDataDir = path.join(homeDir, 'fuxa-headless-data');
    // 确保目录存在 → 设置环境变量 → 启动 server
    require(serverPath);
    return;
}

// Guardian 模式配置
const CONFIG = {
    maxRestarts: 1000,
    restartDelay: 2000,
    cooldownWindow: 10000,
    maxRapidRestarts: 5,
};

function startServer() {
    // 冷却窗口检查 → spawn 子进程(FUXA_SERVER=1) → 监控退出事件
}
```

### 2.2 headless_packaging.yml — GitHub Actions 构建

**路径**: `.github/workflows/headless_packaging.yml`
**关键变更**:

| 配置项 | 旧值 | 新值 | 原因 |
|--------|------|------|------|
| Node.js 版本 | 20 | **18** | node-snap7 不支持 Node.js 20 |
| 入口文件 | headless-entry.js | **headless-guardian.js** | 使用双模式守护入口 |
| 上传方式 | actions/upload-artifact | **softprops/action-gh-release@v2** | 绕过 Artifacts 存储配额限制 |
| Build target | node20-* | **node18-*** | 匹配 Node.js 版本 |

**Release 信息**:
- Tag: `headless-latest` (每次构建覆盖更新)
- 访问地址: https://github.com/jingshui127/FUXA-Tecon/releases/tag/headless-latest

### 2.3 resources/index.js — fontkit 懒加载修复

**路径**: `server/api/resources/index.js`

**问题**: `fontkit` 在模块顶层 `require('fontkit')`，打包后加载时抛出 `Error: encoding not supported: windows-1252`，导致整个服务无法启动。

**修复方案**: 改为懒加载 + try-catch 包裹。

```javascript
// 修改前:
const fontkit = require('fontkit');  // 顶层直接 require → 加载即崩溃

// 修改后:
var fontkit;  // 声明但不加载

// 使用时才加载:
if (!fontkit) { fontkit = require('fontkit'); }  // 懒加载
const font = fontkit.openSync(filePath);           // try-catch 包裹
```

### 2.4 S7 驱动优化（之前已完成）

**路径**: `server/runtime/devices/s7/index.js`

| 优化项 | 说明 |
|--------|------|
| 延迟初始化 S7Client | 不在构造函数中 new S7Client()，改为首次连接时创建 |
| 跳过 Disconnect() | stop() 中不调用 client.disconnect()，避免 native 模块崩溃 |
| Connect/Disconnect 异常捕获 | 所有 S7 调用加 try-catch |

### 2.5 设备启动保护（之前已完成）

**路径**: `server/runtime/devices/index.js`

- `start()` 函数包裹 try-catch，单个设备崩溃不影响其他设备
- `stop()` 函数同样保护

### 2.6 API 异步重启（之前已完成）

**路径**: `server/api/projects/index.js`

- 保存项目时先返回 `{ success: true }` 给前端
- 重启操作在 setTimeout(0) 中异步执行
- 彻底消除"保存失败"的误报提示

### 2.7 地图源修改（国内加速）

**路径**: `client/src/app/maps/maps-view/maps-view.component.ts`

**问题**: 默认使用 OpenStreetMap 官方瓦片服务器 (`tile.openstreetmap.org`)，国内访问慢或无法访问。

**解决方案**: 改用法国 OSM 热区镜像服务器，该服务器在国内访问速度较快。

```typescript
// 修改前（第80行）:
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {

// 修改后:
L.tileLayer('https://tile-c.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
```

**注意事项:**
- 此文件是 **前端 TypeScript 源码**，修改后需要重新构建前端 (`npm run build`)
- GitHub Actions 构建流程会自动执行前端构建，所以推送后会自动生效
- 所有 Leaflet 功能（标记、弹窗、轨迹、右键菜单等）完全保留，不受影响
- 无需申请 API Key

**备选方案（如果法国镜像也变慢）：**
| 镜像源 | URL | 说明 |
|--------|-----|------|
| 法国 OSM 热区 (当前使用) | `https://tile-c.openstreetmap.fr/hot/` | 已验证可用 |
| 天地图 | `https://t{0-7}.tianditu.gov.cn/DataServer?...` | 需免费申请 Key |
| 高德 | `https://webrd0{1-4}.is.autonavi.com/appmaptile?...` | 需免费申请 Key |

---

## 三、构建与部署流程

### 3.1 触发构建

```bash
# 方式一：命令行触发（推荐）
gh workflow run "Build FUXA Headless (Latest)" --ref 1.3.3-2843

# 方式二：浏览器操作
# 打开 https://github.com/jingshui127/FUXA-Tecon/actions
# 选择 "Build FUXA Headless (Latest)" → Run workflow → 选分支 → 运行
```

### 3.2 监控构建状态

```bash
# 查看 run 列表获取最新 Run ID
gh run list --workflow=headless_packaging.yml --limit 3

# 实时监控某个 run 的状态
gh run view <RUN_ID> --json status,conclusion

# 或用循环自动等待完成
$done = $false; while (-not $done) {
    Start-Sleep -Seconds 60
    $result = gh run view <RUN_ID> --json status,conclusion | ConvertFrom-Json
    if ($result.status -eq 'completed') { $done = $true; $result }
}
```

### 3.3 下载 EXE

**直连下载（需要能访问 GitHub）：**
```bash
gh release download headless-latest --repo jingshui127/FUXA-Tecon \
    --pattern "fuxa-headless.exe" --dir ./fuxa-headless-local
```

**加速镜像下载（国内推荐）：**
```
https://gh-proxy.com/https://github.com/jingshui127/FUXA-Tecon/releases/download/headless-latest/fuxa-headless.exe
```

其他可用镜像：
- https://ghproxy.net/
- https://github.akams.cn/

**API + curl 下载（绕过 DNS 问题）：**
```bash
# 1. 获取 asset ID
gh api repos/jingshui127/FUXA-Tecon/releases/tags/headless-latest \
    --jq '.assets[] | select(.name == "fuxa-headless.exe") | .id'

# 2. 通过 API 下载（需指定 CDN IP 绕过 DNS）
curl.exe -L \
    --resolve "api.github.com:443:140.82.112.6" \
    --resolve "release-assets.githubusercontent.com:443:185.199.110.133" \
    -H "Authorization: Bearer $(gh auth token)" \
    -H "Accept: application/octet-stream" \
    -o fuxa-headless.exe \
    "https://api.github.com/repos/jingshui127/FUXA-Tecon/releases/assets/<ASSET_ID>"
```

### 3.4 本地测试

```bash
# 直接运行（默认 Guardian 守护模式）
.\fuxa-headless-local\fuxa-headless.exe

# 访问 Web 界面
# 浏览器打开 http://127.0.0.1:1881/
```

**预期日志输出：**
```
[Guardian] Starting FUXA server (restart #1)...
FUXA V.1.3.3-2843
'FUXA Server' created
'S7-1200' created          ← S7 设备正常初始化
'FUXA Server' start
'S7-1200' start            ← S7 设备正常启动
FUXA started!
WebServer is running http://127.0.0.1:1881/

# 如果发生崩溃：
[Guardian] Server exited (code=3221225477, signal=none)  ← 检测到崩溃
[Guardian] Restarting in 2s...                            ← 2秒后自动重启
[Guardian] Starting FUXA server (restart #2)...           ← 自动恢复
```

---

## 四、排障经验

### 4.1 GitHub Actions Artifacts 存储配额满

**症状**: 所有 job 失败，错误信息 `Artifact storage quota exceeded`。

**原因**: GitHub 免费账户 Artifact 存储限制 500MB/月。旧仓库 `jingshui127/FUXA` 有 20 个 artifacts 占用了数 GB。

**解决方法**:
```bash
# 查看所有 artifacts
gh api repos/<OWNER>/<REPO>/actions/artifacts --jq '.artifacts[] | {name, id, size_in_bytes}'

# 删除指定 artifact
gh api -X DELETE repos/<OWNER>/<REPO>/actions/artifacts/<ART_ID>

# 根本解决方案：改用 Release 上传（不占 Artifact 配额）
# 在 yml 中将 actions/upload-artifact 替换为 softprops/action-gh-release@v2
```

### 4.2 DNS 被 GitHub Accelerator Pro 污染

**症状**: Ping github.com 正常但浏览器/HTTPS 无法访问。

**原因**: GitHub Accelerator Pro 工具写入 hosts 文件的 IP 已过期，`github.com` 的 443 端口被阻断；`release-assets.githubusercontent.com` 被指向 `127.0.0.1`。

**排查命令**:
```powershell
# 测试各域名的 HTTPS 连通性
$domains = @("github.com", "api.github.com", "release-assets.githubusercontent.com")
foreach ($d in $domains) {
    $tcp = New-Object System.Net.Sockets.TcpClient
    $r = $tcp.BeginConnect($d, 443, $null, $null)
    $ok = $r.AsyncWaitHandle.WaitOne(5000, $false)
    Write-Host "$d : $(if($ok){'OK'}else{'FAIL'})"
}

# 检查 hosts 文件中 github 相关条目
Select-String C:\Windows\System32\drivers\etc\hosts -Pattern "github"
```

**解决方法**:
- 更新 GitHub Accelerator Pro 的 IP 数据库
- 或使用加速镜像下载：`https://gh-proxy.com/https://github.com/...`

### 4.3 Git rebase 后文件丢失

**症状**: rebase 后 `科控物联优化/` 目录消失。

**原因**: rebase 跳过了包含该目录的 commit（因为那个 commit 包含大文件被移除）。

**解决方法**: 重新创建需要的文件，内容从 git 历史或备份中恢复。

### 4.4 fontkit windows-1252 编码错误

**症状**: 启动时报 `Error: encoding not supported: windows-1252`，服务立即崩溃。

**原因**: `fontkit` npm 包依赖 iconv-lite，在 Windows 打包环境下缺少编码支持。且在模块顶层 require，无法被外层 try-catch 捕获。

**解决**: 懒加载 + try-catch（见 2.3 节）。

### 4.5 node-snap7 与 Node.js 版本兼容性

**问题**: node-snap7 不支持 Node.js 20+。

**解决**: 全部使用 Node.js 18 LTS（本地开发 + GitHub Actions + pkg 打包目标）。

---

## 五、待办事项

### 高优先级（下次构建必做）

- [ ] **安装全部 6 个缺失的设备驱动 npm 包**

FUXA 内置了 16 种设备驱动（位于 `server/runtime/devices/`），代码已全部包含。但其中 **6 种依赖外部 npm 包**，打包进 EXE 时可能缺失导致选设备时提示"not supported"。建议全部预装：

| 设备驱动 | 需安装的 npm 包 | 大小估算 |
|----------|----------------|---------|
| Modbus (RTU/TCP) | `modbus-serial` | ~1MB |
| OPC UA | `node-opcua` | ~30MB |
| BACnet (楼宇自动化) | `node-bacnet` | ~2MB |
| ODBC (数据库) | `odbc` | ~1MB |
| ADS (倍福 PLC) | `ads-client` | ~0.5MB |
| Redis (缓存) | `redis` | ~1MB |

**无需额外包的驱动（已开箱即用，共10种）：**
S7 (西门子)、MQTT、Ethernet/IP (AB罗克韦尔)、Omron Ethernet/IP (欧姆龙)、MELSEC (三菱)、HTTP Request、GPIO、Webcam、FUXA Server、Template

> **为什么全装？**
> 1. 全部加起来约 +35MB（266MB → ~300MB），增量可接受
> 2. 工控机通常离线/网络差，现场缺驱动无法补救
> 3. 所有包都是懒加载（try/catch），未使用时不占内存、不拖慢启动
> 4. 科控物联是通用方案，提前装好最省心

**操作方法：**
1. 在 `server/package.json` 的 `dependencies` 中添加：
```json
"modbus-serial": "^8.0.19",
"node-opcua": "^2.149.0",
"node-bacnet": "^0.2.4",
"odbc": "^2.4.9",
"ads-client": "^2.1.0",
"redis": "^5.8.2"
```
2. 在 `server/` 目录执行 `npm install`
3. 提交推送后触发 GitHub Actions 构建

- [ ] **修复 got 包缺失**（可选）
在 `server/package.json` dependencies 添加 `"got": "^12"`
影响：Node-RED HTTP Request 节点

### 低优先级（按需处理）

- [ ] Guardian 模式增加日志输出到文件（当前只输出到 stdout）
- [ ] 考虑增加 graceful shutdown（Ctrl+C 时优雅关闭而非强制杀进程）
- [ ] hosts 文件中的 `gist.github.com` IP (37.61.54.158) 已失效，需更新

---

## 六、快速参考卡片

```
┌─────────────────────────────────────────────────────┐
│           FUXA Headless 快速操作指南                  │
├─────────────────────────────────────────────────────┤
│ 触发构建:                                             │
│   gh workflow run "Build FUXA Headless (Latest)"     │
│              --ref 1.3.3-2843                        │
│                                                      │
│ 下载 EXE (加速):                                      │
│   https://gh-proxy.com/https://github.com/...        │
│       .../releases/download/headless-latest/         │
│       .../fuxa-headless.exe                          │
│                                                      │
│ 运行测试:                                             │
│   .\fuxa-headless-local\fuxa-headless.exe            │
│   浏览器 http://127.0.0.1:1881/                      │
│                                                      │
│ 关键文件:                                             │
│   入口: app/headless/headless-guardian.js             │
│   构建: .github/workflows/headless_packaging.yml      │
│   S7驱动: server/runtime/devices/s7/index.js          │
│   API:  server/api/projects/index.js                  │
│   字体:  server/api/resources/index.js                │
│   地图: client/src/app/maps/maps-view/               │
│         maps-view.component.ts (第80行)              │
└─────────────────────────────────────────────────────┘
```

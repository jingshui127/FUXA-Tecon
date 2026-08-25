---
name: "build-fuxa-exe"
description: "Builds FUXA Headless EXE in one step. Invoke when user asks to 'pack EXE', 'build EXE', 'package FUXA', '打包EXE', '构建EXE', '一键打包', or after code changes that need a new EXE."
---

# Build FUXA Headless EXE

一键打包 FUXA Headless EXE，自动完成：文件同步 → pkg 打包。

## 前提条件

- 项目根目录: `d:\FUXA\FUXApro最新版`
- `@yao-pkg/pkg` 已全局安装 (`npm ls -g @yao-pkg/pkg`)
- `client/dist` 已预编译（无需前端构建）
- `fuxa-headless/package.json` 打包配置已存在

## 打包流程

### 1. 同步 server 代码到打包目录

```powershell
Write-Host "[1/3] Syncing server to fuxa-headless..."
robocopy "server" "fuxa-headless\server" /E /NFL /NDL /XD .git
```

### 2. 同步 client/dist 到打包目录

```powershell
Write-Host "[2/3] Syncing client dist to fuxa-headless..."
robocopy "client\dist" "fuxa-headless\client\dist" /E /NFL /NDL
```

### 3. 更新入口文件

```powershell
Copy-Item "app\headless\headless-guardian.js" "fuxa-headless\main.js" -Force
Write-Host "[3/3] main.js updated from headless-guardian.js"
```

### 4. pkg 打包

```powershell
Write-Host "Packaging EXE (this takes a few minutes)..."
pkg fuxa-headless/package.json --targets node18-win-x64 --output fuxa-headless/fuxa-headless.exe
```

### 5. 输出结果

```powershell
$exe = Get-Item "fuxa-headless\fuxa-headless.exe"
Write-Host ""
Write-Host "=========================================="
Write-Host "  Build Complete!"
Write-Host "  File: $($exe.FullName)"
Write-Host "  Size: $([math]::Round($exe.Length/1MB,1)) MB"
Write-Host "  Time: $($exe.LastWriteTime)"
Write-Host "=========================================="
```

## 快速测试

打包完成后测试:

```powershell
# 先杀掉可能占用的进程
Get-Process fuxa-headless -ErrorAction SilentlyContinue | Stop-Process -Force

# 启动（默认端口 1881）
Start-Process ".\fuxa-headless\fuxa-headless.exe"

# 等待 8 秒后测试
Start-Sleep 8
try { $r = Invoke-WebRequest -Uri "http://127.0.0.1:1881/" -UseBasicParsing -TimeoutSec 10; "HTTP $($r.StatusCode) - OK" } catch { "Failed: $_" }
```

## 注意事项

- 打包耗时约 5-10 分钟（取决于机器性能）
- 最终 EXE 约 385 MB
- 使用 `compression: "None"` 避免 GZip 压缩阶段长时间占用 CPU；如需减小体积，可在发布前单独启用 GZip。
- Node.js 版本必须是 18.x（node-snap7 兼容性）
- 工作目录必须是项目根目录 `d:\FUXA\FUXApro最新版`
- `client/dist` 已预编译，不需要前端构建步骤
- EXE 打包内嵌的是构建时快照，修改源码后需重新打包才能生效
- **开发调试推荐用 `guard.js`**：`cd server && node guard.js -p PORT`，无需重新打包 EXE
- `server/node_modules` 不重复复制；运行时依赖由 headless 根目录 `node_modules/**/*` 作为 pkg assets 打入，避免同一套依赖被扫描两次。

## EXE 部署说明

- **单文件运行**: `fuxa-headless.exe` 自包含 Node.js 运行时，直接拷贝到任意 Windows 电脑即可运行
- **首次启动**: 自动在 EXE 同级创建 `data/` 目录（数据库、日志、设置）
- **端口修改**: `fuxa-headless.exe -p 8899`
- **更换 LOGO**: 在 EXE 同级创建 `customization/` 文件夹，放入 `config.json`、`logo.svg`、`favicon.ico` 即可覆盖默认品牌标识（可选，不影响运行）

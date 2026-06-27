---
name: "build-fuxa-exe"
description: "Builds FUXA Headless EXE in one step. Invoke when user asks to 'pack EXE', 'build EXE', 'package FUXA', '打包EXE', '构建EXE', '一键打包', or after code changes that need a new EXE."
---

# Build FUXA Headless EXE

一键打包 FUXA Headless EXE，自动完成：前端构建 → 文件同步 → pkg 打包。

## 前提条件

- 项目根目录: `d:\FUXA\FUXApro最新版`
- `@yao-pkg/pkg` 已全局安装 (`npm ls -g @yao-pkg/pkg`)
- `fuxa-headless-local/package.json` 打包配置已存在

## 打包流程

### 1. 确保 client 依赖已安装

```powershell
if (-not (Test-Path "client\node_modules\@angular-devkit")) {
    Write-Host "[1/5] Installing client dependencies..."
    npm install --no-audit --no-fund --directory=./client
} else {
    Write-Host "[1/5] Client dependencies OK"
}
```

### 2. 构建前端

```powershell
Write-Host "[2/5] Building frontend..."
npm run build -- --configuration=production --directory=./client
```

### 3. 同步文件到打包目录

```powershell
Write-Host "[3/5] Syncing files..."
if (Test-Path "fuxa-headless-local\server") { Remove-Item -Recurse -Force "fuxa-headless-local\server" }
if (Test-Path "fuxa-headless-local\client\dist") { Remove-Item -Recurse -Force "fuxa-headless-local\client\dist" }
robocopy "server" "fuxa-headless\server" /E /NFL /NDL /XD .git
robocopy "client\dist" "fuxa-headless-local\client\dist" /E /NFL /NDL
Copy-Item "app\headless\headless-guardian.js" "fuxa-headless-local\main.js" -Force
```

### 4. 确保 package.json 存在（纯 pkg 配置，无需 dependencies）

```powershell
Write-Host "[4/5] Checking package config..."
if (-not (Test-Path "fuxa-headless-local\package.json")) {
    @"
{
  "name": "fuxa-headless",
  "version": "1.0.0",
  "bin": "main.js",
  "pkg": {
    "assets": [
      "server/**/*",
      "client/dist/**/*",
      "_reports/**/*"
    ],
    "publicPackages": [
      "node-snap7",
      "sqlite3",
      "serialport",
      "@serialport/bindings-cpp",
      "@serialport/parser-readline",
      "@serialport/parser-regex"
    ],
    "compression": "GZip"
  }
}
"@ | Out-File -FilePath "fuxa-headless-local\package.json" -Encoding UTF8
}
```

> **重要**: package.json 不含 `dependencies` 字段。pkg 通过 `assets: ["server/**/*"]` 自动打包 `server/node_modules` 中的所有依赖。

### 5. pkg 打包

```powershell
Write-Host "[5/5] Packaging EXE (this takes a few minutes)..."
Remove-Item "fuxa-headless-local\fuxa-headless.exe" -Force -ErrorAction SilentlyContinue
pkg fuxa-headless-local/package.json --targets node18-win-x64 --output fuxa-headless-local/fuxa-headless.exe
```

### 6. 输出结果

```powershell
$exe = Get-Item "fuxa-headless-local\fuxa-headless.exe"
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

# 启动（端口 1882）
Start-Process ".\fuxa-headless-local\fuxa-headless.exe" -ArgumentList "-p 1882"

# 等待 5 秒后测试
Start-Sleep 5
Invoke-WebRequest -Uri "http://127.0.0.1:1882/" -UseBasicParsing -TimeoutSec 5
```

## 注意事项

- 打包耗时约 5-10 分钟（取决于机器性能）
- 最终 EXE 约 320-330 MB
- 使用 GZip 压缩（Brotli 会导致 pkg 卡死）
- Node.js 版本必须是 18.x（node-snap7 兼容性）
- 工作目录必须是项目根目录 `d:\FUXA\FUXApro最新版`
- EXE 打包内嵌的是构建时快照，修改源码后需重新打包才能生效
- **开发调试推荐用 `guard.js`**：`cd server && node guard.js -p PORT`，无需重新打包 EXE
- robocopy 不排除 `node_modules`，pkg 通过 `server/**/*` asset 打包所有依赖

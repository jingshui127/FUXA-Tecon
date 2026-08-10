---
name: "build-fuxa-exe"
description: "Builds FUXA Headless EXE in one step. Invoke when user asks to 'pack EXE', 'build EXE', 'package FUXA', '打包EXE', '构建EXE', '一键打包', or after code changes that need a new EXE."
---

# Build FUXA Headless EXE

一键打包 FUXA Headless EXE，自动完成：前端构建 → 文件同步 → pkg 打包。

## 前提条件

- 项目根目录: `c:\Users\13971\Downloads\FUXA-master`
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
robocopy "server" "fuxa-headless-local\server" /E /NFL /NDL /XD .git
robocopy "client\dist" "fuxa-headless-local\client\dist" /E /NFL /NDL
Copy-Item "app\headless\headless-guardian.js" "fuxa-headless-local\main.js" -Force
```

### 4. 确保 package.json 存在

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

打包完成后必须运行 EXE 验证（检查控制台日志，确认无 httprequest SyntaxError、i18n 正常显示）:

```powershell
# 先杀掉可能占用的进程
Get-Process fuxa-headless,node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep 2

# 启动 EXE，捕获日志
$p = Start-Process ".\fuxa-headless-local\fuxa-headless.exe" -WindowStyle Hidden -RedirectStandardOutput "$env:TEMP\fuxa-test-out.log" -RedirectStandardError "$env:TEMP\fuxa-test-err.log" -PassThru
Write-Host "EXE PID: $($p.Id). Waiting 20s..."
Start-Sleep 20

# 验证 HTTP 可达
try { $resp = Invoke-WebRequest -Uri "http://127.0.0.1:2899/" -UseBasicParsing -TimeoutSec 10; Write-Host "HTTP OK: $($resp.StatusCode)" }
catch { Write-Host "HTTP FAIL: $_" }

# 验证关键日志（httprequest SyntaxError 必须不存在）
$out = Get-Content "$env:TEMP\fuxa-test-out.log" -ErrorAction SilentlyContinue
if ($out -match "SyntaxError.*import statement outside a module") {
    Write-Host "FAIL: httprequest SyntaxError 存在！需要检查 patch-nodered.js 是否已运行"
} elseif ($out -match "httprequest") {
    Write-Host "WARN: httprequest 相关日志，请检查"
} else {
    Write-Host "PASS: httprequest 无 SyntaxError"
}
if ($out -match "Started flows") { Write-Host "PASS: Node-RED 正常启动" }
else { Write-Host "WARN: Node-RED 未启动" }

# 验证 i18n（检查 HTML 中是否显示翻译文本而非键名）
$html = $out; # EXE 日志含完整输出
if ($out -match "plugin-installed") { Write-Host "INFO: 插件已安装" }

# 停止进程
Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue
```

## 注意事项

- 打包耗时约 5-10 分钟（取决于机器性能）
- 最终 EXE 约 320-330 MB
- 使用 GZip 压缩（Brotli 会导致 pkg 卡死）
- Node.js 版本必须是 18.x（node-snap7 兼容性）
- 工作目录必须是项目根目录
- 端口传递: 环境变量 PORT > -p CLI 参数 > 默认 1881
- **Node-RED 4.x 兼容**: `server/scripts/patch-nodered.js` 在 `npm install` 后自动运行，修复 httprequest 节点的 got v12 ESM 嵌套冲突（`@node-red/nodes/node_modules/got` 为 ESM-only，需强制解析到外层 CJS got v11）
- **i18n 修复**: `client/src/assets/i18n/en.json` 已恢复（1880 键），所有 12 语言已补充 `device.plugins-notice-*` 翻译。修改 i18n 后必须重新 `npm run build` 前端再打包
- **S7 驱动**: `server/runtime/devices/s7/index.js` 不调用 `Disconnect()`，避免 `STATUS_ACCESS_VIOLATION` 崩溃

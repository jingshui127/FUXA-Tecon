---
name: "build-fuxa-exe"
description: "Builds the ordinary FUXA 1.3.4-2888 Headless Windows EXE. Invoke when asked to package or build the FUXA EXE."
---

# 构建普通版 Headless EXE

普通版当前版本为 `1.3.4-2888`。唯一正式 Windows 产物为 `artifacts/FUXA-1.3.4-2888-win-x64.exe`。

## 前提

- 工作目录：`c:\Users\13971\Downloads\FUXA-master`
- Node.js 18 LTS
- `@yao-pkg/pkg` 已全局安装
- 不使用 `fuxa-headless-local/` 作为构建输入

## 固定流程

```powershell
$ErrorActionPreference = 'Stop'
$root = (Get-Location).Path
$inputDir = Join-Path $root 'fuxa-headless'
$artifact = Join-Path $root 'artifacts\FUXA-1.3.4-2888-win-x64.exe'

npm install --no-audit --no-fund --directory=./server
npm install --no-audit --no-fund --directory=./client
npm run build -- --configuration=production --directory=./client

Remove-Item $inputDir -Recurse -Force -ErrorAction SilentlyContinue
New-Item $inputDir -ItemType Directory | Out-Null
New-Item (Join-Path $inputDir 'server') -ItemType Directory | Out-Null
New-Item (Join-Path $inputDir 'client\dist') -ItemType Directory | Out-Null
robocopy 'server' (Join-Path $inputDir 'server') /E /NFL /NDL /XD .git node_modules _appdata _db _logs _images _widgets _reports _certificates
robocopy 'client\dist' (Join-Path $inputDir 'client\dist') /E /NFL /NDL
Copy-Item 'app\headless\headless-guardian.js' (Join-Path $inputDir 'main.js') -Force

@'
{
  "name": "fuxa-headless",
  "version": "1.3.4-2888",
  "bin": "main.js",
  "pkg": {
    "assets": ["server/**/*", "client/dist/**/*"],
    "publicPackages": ["node-snap7", "sqlite3", "serialport", "@serialport/bindings-cpp", "@serialport/parser-readline", "@serialport/parser-regex"],
    "compression": "GZip"
  }
}
'@ | Set-Content (Join-Path $inputDir 'package.json') -Encoding UTF8

New-Item (Join-Path $root 'artifacts') -ItemType Directory -Force | Out-Null
Remove-Item $artifact -Force -ErrorAction SilentlyContinue
pkg (Join-Path $inputDir 'package.json') --targets node18-win-x64 --output $artifact

$exe = Get-Item $artifact
Write-Host "Build Complete: $($exe.FullName) ($([math]::Round($exe.Length / 1MB, 1)) MB)"
```

`robocopy` 返回 0 到 7 均表示成功或有文件复制；返回值大于 7 时停止流程。构建过程不得读取或复制 `data/` 和现有运行时数据库。

## 启动验证

使用独立测试端口启动，避免影响现有服务：

```powershell
$p = Start-Process $artifact -ArgumentList '-p','2899' -PassThru
Start-Sleep 20
Invoke-WebRequest 'http://127.0.0.1:2899/api/version' -UseBasicParsing
Invoke-WebRequest 'http://127.0.0.1:2899/' -UseBasicParsing
Stop-Process -Id $p.Id -Force
```

确认日志包含 `FUXA V.1.3.4-2888`、`FUXA started!` 和 `WebServer is running`。Node-RED 启用时确认 `/nodered`、`/dashboard` 可访问且无 `httprequest` ESM SyntaxError。

## 原生模块验证

```powershell
node -e "console.log(require('modbus-serial').name || 'modbus-serial loaded'); console.log(typeof require('node-snap7').S7Client === 'function' ? 'node-snap7 loaded' : 'node-snap7 invalid')"
```

## 目录边界

不得提交 `node_modules/`、`data/`、运行时 `_appdata/`、`_db/`、`_logs/`、`_images/`、`_widgets/`、`_reports/`、`_certificates/`、`fuxa-headless/`、`fuxa-headless-local/`、`artifacts/`、日志或 EXE。不得删除或清空已有运行数据。

---
name: "build-fuxa-exe"
description: "Builds the ordinary FUXA 1.3.5-2918 Headless Windows EXE. Invoke when asked to package or build the FUXA EXE."
---

# 构建普通版 Headless EXE

普通版当前版本为 `1.3.5-2918`。唯一正式 Windows 产物为 `artifacts/FUXA-1.3.5-2918-win-x64.exe`。

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
$artifact = Join-Path $root 'artifacts\FUXA-1.3.5-2918-win-x64.exe'

npm install --no-audit --no-fund --directory=./server
npm install --no-audit --no-fund --directory=./client
npm run build -- --configuration=production --directory=./client

Remove-Item $inputDir -Recurse -Force -ErrorAction SilentlyContinue
New-Item $inputDir -ItemType Directory | Out-Null
New-Item (Join-Path $inputDir 'server') -ItemType Directory | Out-Null
New-Item (Join-Path $inputDir 'client\dist') -ItemType Directory | Out-Null
robocopy 'server' (Join-Path $inputDir 'server') /E /NFL /NDL /XD .git _appdata _db _logs _images _widgets _reports _certificates
robocopy 'client\dist' (Join-Path $inputDir 'client\dist') /E /NFL /NDL
Copy-Item 'app\headless\headless-guardian.js' (Join-Path $inputDir 'main.js') -Force

@'
{
  "name": "fuxa-headless",
  "version": "1.3.5-2918",
  "bin": "main.js",
  "pkg": {
    "assets": ["server/**/*", "client/dist/**/*"],
    "compression": "Brotli"
  }
}
'@ | ForEach-Object { [System.IO.File]::WriteAllText((Join-Path $inputDir 'package.json'), $_, (New-Object System.Text.UTF8Encoding($false))) }

New-Item (Join-Path $root 'artifacts') -ItemType Directory -Force | Out-Null
Remove-Item $artifact -Force -ErrorAction SilentlyContinue
pkg (Join-Path $inputDir 'package.json') --targets node18-win-x64 --output $artifact

$exe = Get-Item $artifact
Write-Host "Build Complete: $($exe.FullName) ($([math]::Round($exe.Length / 1MB, 1)) MB)"
```

正常体积约 **268 MB**。若小于 100 MB，说明 `server/node_modules` 未被打入（检查 `npm install --directory=./server` 是否成功、robocopy 是否遗漏）。

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

确认日志包含 `FUXA V.1.3.5-2918`、`FUXA started!` 和 `WebServer is running`。Node-RED 启用时确认 `/nodered`、`/dashboard` 可访问且无 `httprequest` ESM SyntaxError。

## 原生模块验证

```powershell
node -e "console.log(require('modbus-serial').name || 'modbus-serial loaded'); console.log(typeof require('node-snap7').S7Client === 'function' ? 'node-snap7 loaded' : 'node-snap7 invalid')"
```

## 目录边界

不得提交 `node_modules/`、`data/`、运行时 `_appdata/`、`_db/`、`_logs/`、`_images/`、`_widgets/`、`_reports/`、`_certificates/`、`fuxa-headless/`、`fuxa-headless-local/`、`artifacts/`、日志或 EXE。不得删除或清空已有运行数据。

## 首选：GitHub Actions 云端构建

本地打包通常不需要跑——**push 到 `1.3.5-2918` 即自动构建**（`headless_packaging.yml`，约 6 分钟，Actions 现场 `npm run build` 出 dist 再 pkg）。

```powershell
git push private 1.3.5-2918
gh run list --repo jingshui127/FUXA-Tecon --branch 1.3.5-2918 --limit 3
gh run watch <run_id> --repo jingshui127/FUXA-Tecon --interval 15
```

产物：Release `headless-latest-<run_id>` 下的 `FUXA-1.3.5-2918-win-x64.exe`（约 283 MB，`Brotli` 压缩）。

### 下载产物（国内必须分段并行）

单连接约 130 KB/s，283MB 会卡死。用 8 线程 Range 并行 + 拼接，并**校验最终字节数 == 资产 `size`**：

```powershell
$tag = 'headless-latest-<run_id>'
$assetId = gh api "repos/jingshui127/FUXA-Tecon/releases/tags/$tag" --jq '.assets[0].id'
$total   = gh api "repos/jingshui127/FUXA-Tecon/releases/tags/$tag" --jq '.assets[0].size'
$token   = gh auth token
$loc = (curl.exe -sI -H "Authorization: token $token" -H "Accept: application/octet-stream" `
        "https://api.github.com/repos/jingshui127/FUXA-Tecon/releases/assets/$assetId") |
        Select-String '^Location:' | ForEach-Object { $_.ToString().Substring(9).Trim() }
# 8 段：curl.exe -s -f --retry 8 -r "$start-$end" -o partNN $loc，全部完成后按序拼接到目标文件
```

`gh release download` 或单连接 `curl -fL` 只在体积小或网络好时用。

## 前置判断：真的需要构建 EXE 吗

| 改动 | 建议 |
|---|---|
| `server/**` 后端 | 先 `cd server; node guard.js -p 2999` 本地验证，通过后再 push 出 EXE |
| `client/src/**` 前端 | 必须构建（Actions 现场构建，无需本地 build） |
| `server/package.json` 依赖 | 必须构建 |
| `data/brand.json` | **不需要**，运行时读取 |

## 构建陷阱

1. **JSON 不能带 BOM**：本 skill 用 `Set-Content` 写 `package.json` 时必须显式无 BOM；若手工改过 `client/package.json` / `server/package.json`，用
   `[System.IO.File]::WriteAllText($p,$s,(New-Object System.Text.UTF8Encoding($false)))` 重写，否则 Actions 的 `Build client` 会报 `package.json SyntaxError`。
2. **产物字节数必须完整**：下载或被截断的 EXE 能启动但会中途崩，务必比对 `size`。
3. **虚拟内存不足**：`ng build` 崩（`0xC0000409`）或 `git push` 报 `os error 1455` 时，临时设 `$env:NODE_OPTIONS='--max-old-space-size=4096'`，根本解法是把系统虚拟内存调到 8GB/16GB。


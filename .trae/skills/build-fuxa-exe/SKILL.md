---
name: "build-fuxa-exe"
description: "Builds FUXA Headless EXE in one step. Invoke when user asks to 'pack EXE', 'build EXE', 'package FUXA', '打包EXE', '构建EXE', '一键打包', or after code changes that need a new EXE."
---
# Build FUXA Headless EXE

一键打包 FUXA Headless EXE，自动完成：源码同步 → `npm ci` → Node-RED patch 与验证 → pkg 打包 → 健康检查。

当前唯一入口和产物：

- 入口：项目根目录 `build-and-push.ps1`
- 入口脚本：`app/headless/headless-guardian.js`
- 目标：`node18-win-x64`
- 产物：`artifacts\fuxa-pro-headless.exe`
- 数据：`<EXE目录>\data\`

## 前提条件

- 项目根目录: `d:\FUXA\FUXApro最新版`
- `@yao-pkg/pkg` 已全局安装 (`npm ls -g @yao-pkg/pkg`)
- `client/dist` 已预编译（无需前端构建）
- `fuxa-headless/package.json` 打包配置已存在

## 打包流程

### 1. 单实例前置检查

- 停止正在运行的 FUXA EXE、`npm ci` 和 `pkg` 进程。
- 不允许多个任务同时操作 `fuxa-headless\node_modules`。
- 不要把 `artifacts\`、`data\` 或异常嵌套的 `fuxa-headless\fuxa-headless\` 目录作为构建输入。

### 2. 同步源码

```powershell
robocopy "server" "fuxa-headless\server" /E /NFL /NDL /XD .git node_modules _pkg _appdata data
robocopy "client\dist" "fuxa-headless\client\dist" /E /NFL /NDL
Copy-Item "app\headless\headless-guardian.js" "fuxa-headless\main.js" -Force
```

### 3. 安装依赖并应用 Node-RED patch

```powershell
Push-Location "fuxa-headless"
npm ci --omit=dev --no-audit --no-fund
if ($LASTEXITCODE -ne 0) { throw "npm ci failed: $LASTEXITCODE" }
Pop-Location
node "fuxa-headless/server/scripts/patch-nodered.js"
if ($LASTEXITCODE -ne 0) { throw "Node-RED patch failed: $LASTEXITCODE" }
```

必须看到 `[patch-nodered] verification passed`。当前 Node-RED 4.1.10 的 `got` 动态导入位于 `@node-red/runtime/lib/telemetry/index.js`；旧版本可能存在的 `@node-red/nodes/core/network/21-httprequest.js` 不是当前固定目标。目标不存在、依赖缺失、模式不匹配或验证失败时必须停止构建。

### 4. 保留运行时 data 并验证原生插件

打包前和打包后都必须保留已有的 `artifacts\data\`。该目录不是构建临时目录，不能删除或用空目录覆盖。它包含：

```text
artifacts\data\_db\
artifacts\data\_appdata\
artifacts\data\_pkg\runtime\node_modules\
artifacts\data\_resources\
```

当前必须预置并验证的原生插件：

```text
odbc@2.4.9
chartjs-node-canvas@3.2.0
canvas@2.11.2
```

至少执行以下验证：

```powershell
node -e "require('odbc'); const {ChartJSNodeCanvas}=require('chartjs-node-canvas'); new ChartJSNodeCanvas({width:320,height:180}).renderToBuffer({type:'bar',data:{labels:['A'],datasets:[{data:[1]}]}}).then(()=>console.log('native plugins verified'))"
```

必须确认 `canvas\build\Release\canvas.node` 及其 Windows DLL 存在。若验证失败，不能继续交付。

### 5. pkg 打包

```powershell
pkg fuxa-headless/package.json --targets node18-win-x64 --output artifacts/fuxa-pro-headless.exe
```

### 6. 输出结果

必须确认构建日志包含：

```text
[patch-nodered] verification passed
[BUILD] SUCCESS
```

构建完成后才可以运行 EXE；仅看到 `npm ci` 完成，不能视为打包成功。

## 快速测试

打包完成后测试。先做健康检查（`/dashboard` 在未配置 Dashboard 流程时返回 404，属正常）：

```powershell
Get-Process fuxa-pro-headless, fuxa-headless -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Process ".\artifacts\fuxa-pro-headless.exe"
Start-Sleep 10

$paths = '/', '/flows', '/nodered'
foreach ($path in $paths) {
    $r = Invoke-WebRequest -Uri "http://127.0.0.1:1881$path" -UseBasicParsing -TimeoutSec 10
    if ($r.StatusCode -lt 200 -or $r.StatusCode -ge 400) { throw "Health check failed: $path" }
}
```

必须再做**前端静态资源检查**，防止出现“健康检查通过但页面白屏”（bundle 未进包时 `/` 仍返回 200）：

```powershell
$html = (Invoke-WebRequest -Uri 'http://127.0.0.1:1881/' -UseBasicParsing).Content
$refs = [regex]::Matches($html, '(?:src|href)="((?!http|//)[^"]+\.(?:js|css))"') | ForEach-Object { $_.Groups[1].Value }
foreach ($ref in $refs) {
    $r = Invoke-WebRequest -Uri "http://127.0.0.1:1881/$ref" -UseBasicParsing -TimeoutSec 15
    if ($r.StatusCode -ne 200) { throw "静态资源缺失（会导致白屏）: $ref -> $($r.StatusCode)" }
    Write-Host "static ok: $ref ($($r.RawContentLength) bytes)"
}
```

同时确认启动日志不含 `Cannot find package 'got'`。

## 注意事项

- 使用 `compression: "None"` 避免 GZip 压缩阶段长时间占用 CPU；实际耗时和文件大小以构建日志为准。
- Node.js 版本必须是 18.x（node-snap7 兼容性）
- 工作目录必须是项目根目录 `d:\FUXA\FUXApro最新版`
- `client/dist` 已预编译，不需要前端构建步骤。
- `client/dist` 必须在 git 中跟踪（`.gitignore` 保留 `!client/dist/`）。CI 从全新克隆构建时若缺 `main.*.js` / `styles.*.css`，EXE 首页会 404 白屏。
- EXE 打包内嵌的是构建时快照，修改源码后需重新打包才能生效
- **开发调试推荐用 `guard.js`**：`cd server && node guard.js -p PORT`，无需重新打包 EXE
- `server/node_modules` 不重复复制；运行时依赖由 headless 根目录 `node_modules/**/*` 作为 pkg assets 打入，避免同一套依赖被扫描两次。

## EXE 部署说明

- **单文件运行**: `fuxa-pro-headless.exe` 自包含 Node.js 运行时，直接拷贝到任意 Windows 电脑即可运行
- **迁移**: 必须复制 EXE + 完整 `data/` 目录；若使用了外部品牌目录，还需一并复制 `customization/`（它不在 `data/` 内）
- **首次启动**: 自动在 EXE 同级创建 `data/` 目录（数据库、日志、设置）
- **端口修改**: `fuxa-pro-headless.exe -p 8899`
- **更换 LOGO / 品牌**: 两种方式任选
  - 运行时覆盖（推荐，免重打包）：在 EXE 同级创建 `customization/` 文件夹，放入 `config.json`、`logo.svg`、`favicon.ico`，重启 EXE 即生效。外部文件优先于内置，未提供的文件自动回退内置默认，可只放其中一部分。生效时启动日志会出现 `Customization: using external brand assets from <路径>`。
  - 打包内置：替换 `client/dist/assets/customization/` 下的对应文件后重新打包。注意官方约定该目录会随版本升级被覆盖，需先备份。

## 版本升级（换官方源码包）

PRO 与开源版分开维护，禁止混用。升级走分支合并，不要解压覆盖工作区：

```powershell
git checkout -b upstream-1.3.6
# 解压官方源码包到工作区（先删掉包内 node_modules / artifacts / fuxa-headless）
git add -A; git commit -m "vendor: FUXA PRO 1.3.6 源码"
git checkout 1.3.6-PRO
git merge upstream-1.3.6
```

合并后按以下顺序复查，任一项不过就不允许打包：

1. 品牌回填：`node server/scripts/patch-brand-assets.js`，日志必须出现 `[patch-brand] verification passed`（打包时自动执行，无需手工复制）
2. 地图瓦片：`node server/scripts/patch-map-tiles.js`，日志必须出现 `[patch-map] verification passed`；报「官方可能更换了地图服务商」时须人工确认新瓦片源并更新脚本
3. `node fuxa-headless/server/scripts/patch-nodered.js`，日志必须出现 `[patch-nodered] verification passed`
4. 原生插件：在部署机上执行 `node scripts\verify-native-plugins.js`，必须输出 `[verify-native] ALL CHECKS PASSED`（插件装在 `data\_pkg\runtime`，不在仓库内，CI 无法覆盖）
5. `/`、`/flows`、`/nodered`、`/dashboard` 四个地址均 200，且首页引用的 `*.js` / `*.css` 逐个 200
6. 启动日志含 `[Node-RED] Started at /flows (dashboard: /dashboard)`，不含 `Cannot find package 'got'`
7. 冒烟测试：`powershell -NoProfile -ExecutionPolicy Bypass -File scripts\smoke-test.ps1 -LogFile <启动日志>`，必须输出 `[smoke] ALL CHECKS PASSED`（本地与 CI 共用同一脚本，勿在别处重复实现检查）

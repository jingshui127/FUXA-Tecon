# FUXA PRO 项目规则

## 构建与发布

- 当前唯一 Headless 产物是 `artifacts\fuxa-pro-headless.exe`，目标必须是 Node.js 18 `node18-win-x64`。
- 打包前必须按顺序执行源码同步、`npm ci --omit=dev --no-audit --no-fund`、`patch-nodered.js`、pkg；不能只复制文件后直接打包。
- `patch-nodered.js` 必须定位 `fuxa-headless\node_modules`，修复 Node-RED registry 以及 Node-RED 4.1.10 telemetry 对 `got` 的加载；旧版 `21-httprequest.js` 只能作为兼容性可选目标，不能假设必然存在。依赖缺失、模式不匹配或验证失败时退出非零。
- 构建日志必须出现 `[patch-nodered] verification passed` 和 `[BUILD] SUCCESS`；只有看到 `[BUILD] SUCCESS` 才能认为 `artifacts\fuxa-pro-headless.exe` 已被本次构建覆盖。启动日志不得出现 `Cannot find package 'got'`。
- `build-and-push.ps1` 的成功判定必须依据日志标记（构建日志含 `[BUILD] SUCCESS`，推送日志含 `[GIT] SUCCESS pushed` 或 `[GIT] Push skipped`）。不得用 `Start-Process -PassThru` 返回对象的 `ExitCode` 判断：PowerShell 5.1 下它可能为 `$null`，`$null -ne 0` 成立，会把成功误报为失败。
- `client\dist` 是交付必需的前端静态资源，必须纳入版本控制；`.gitignore` 不得用 `dist/` 规则把它整体忽略（需保留 `!client/dist/` 例外）。否则 CI 从全新克隆构建出的 EXE 缺少 `main.*.js`、`styles.*.css`，打开页面 404 白屏。

- 不允许多个 `npm ci`、pkg 或构建脚本同时操作 `fuxa-headless\node_modules`。
- 不得把 `artifacts\`、运行时 `data\` 或异常嵌套的 `fuxa-headless\fuxa-headless\` 目录作为构建输入或提交内容。
- 重新打包只覆盖 `artifacts\fuxa-pro-headless.exe`；不得删除、清空或重新初始化已有的 `artifacts\data\`。该目录保存数据库、Node-RED flows、插件和业务资源。
- `odbc@2.4.9` 与 `chartjs-node-canvas@3.2.0`（依赖 `canvas@2.11.2`）属于原生插件，必须在目标 Node.js 18 / Windows x64 环境中预置并验证后再交付；不能只验证 npm 包下载成功。
- 原生插件验证必须至少通过 `require('odbc')` 和 `chartjs-node-canvas` 实际图表渲染；缺少 `canvas.node` 或其 DLL 时不得宣称插件可用。

## Node-RED 验证

- 管理入口为 `/flows`，兼容入口为 `/nodered`，Dashboard/HTTP 入口为 `/dashboard`。
- 修改 Node-RED 路由前先确认 FUXA 默认配置弹窗仍使用 `/flows`，不要把入口问题误改成前端跳转问题。
- EXE 健康检查必须覆盖 `/`、`/flows`、`/nodered`、`/dashboard`，并检查启动日志中的 `[Node-RED] Started at /flows (dashboard: /dashboard)`。

## 数据与文档

- 网页安装插件保存于 `<EXE目录>\data\_pkg\runtime\node_modules\`。
- Node-RED 流程保存于 `<EXE目录>\data\_appdata\node-red\flows.json`。
- 品牌资源内置路径为 `client\dist\assets\customization\`（打入 EXE 快照，打包后不可修改），内置默认品牌为科控物联（`TcScada`）。支持 `<EXE目录>\customization\` 运行时覆盖：外部文件优先、缺失文件回退内置；该目录不在 `data\` 内，迁移时必须单独复制。`docs\customization\` 为回填母本，官方升级覆盖 `client\dist` 后需重新写回。
- 工作分支为 `1.3.5-PRO`，CI 触发分支与 `build-and-push.ps1` 默认分支必须保持一致。
- 当前操作文档只描述 1.3.5-PRO 和 `fuxa-pro-headless.exe`；旧版本方案必须明确标记为历史，不得混入当前命令。
- 当前项目不保留旧版本排查文档；可执行规则以本文件和 build skill 为准。

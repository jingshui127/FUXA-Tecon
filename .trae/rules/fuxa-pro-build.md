# FUXA PRO 项目规则

## 构建与发布

- 当前唯一 Headless 产物是 `artifacts\fuxa-pro-headless.exe`，目标必须是 Node.js 18 `node18-win-x64`。
- 打包前必须按顺序执行源码同步、`npm ci --omit=dev --no-audit --no-fund`、`patch-nodered.js`、pkg；不能只复制文件后直接打包。
- `patch-nodered.js` 必须定位 `fuxa-headless\node_modules`，修复 Node-RED registry 以及 Node-RED 4.1.10 telemetry 对 `got` 的加载；旧版 `21-httprequest.js` 只能作为兼容性可选目标，不能假设必然存在。依赖缺失、模式不匹配或验证失败时退出非零。
- 构建日志必须出现 `[patch-nodered] verification passed` 和 `[BUILD] SUCCESS`；只有看到 `[BUILD] SUCCESS` 才能认为 `artifacts\fuxa-pro-headless.exe` 已被本次构建覆盖。启动日志不得出现 `Cannot find package 'got'`。

- 不允许多个 `npm ci`、pkg 或构建脚本同时操作 `fuxa-headless\node_modules`。
- 不得把 `artifacts\`、运行时 `data\` 或异常嵌套的 `fuxa-headless\fuxa-headless\` 目录作为构建输入或提交内容。

## Node-RED 验证

- 管理入口为 `/flows`，兼容入口为 `/nodered`，Dashboard/HTTP 入口为 `/dashboard`。
- 修改 Node-RED 路由前先确认 FUXA 默认配置弹窗仍使用 `/flows`，不要把入口问题误改成前端跳转问题。
- EXE 健康检查必须覆盖 `/`、`/flows`、`/nodered`、`/dashboard`，并检查启动日志中的 `[Node-RED] Started at /flows (dashboard: /dashboard)`。

## 数据与文档

- 网页安装插件保存于 `<EXE目录>\data\_pkg\runtime\node_modules\`。
- Node-RED 流程保存于 `<EXE目录>\data\_appdata\node-red\flows.json`。
- 当前操作文档只描述 1.3.4-PRO 和 `fuxa-pro-headless.exe`；旧版本方案必须明确标记为历史，不得混入当前命令。
- 当前项目不保留旧版本排查文档；可执行规则以本文件和 build skill 为准。

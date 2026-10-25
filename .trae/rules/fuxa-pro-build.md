# FUXA PRO 项目规则

## 构建与发布

- 当前唯一 Headless 产物是 `artifacts\fuxa-pro-headless.exe`，目标必须是 Node.js 18 `node18-win-x64`。
- 打包前必须按顺序执行源码同步、`npm ci --omit=dev --no-audit --no-fund`、`patch-nodered.js`、pkg；不能只复制文件后直接打包。
- `patch-nodered.js` 必须定位 `fuxa-headless\node_modules`，修复 Node-RED registry 以及 Node-RED 4.1.10 telemetry 对 `got` 的加载；旧版 `21-httprequest.js` 只能作为兼容性可选目标，不能假设必然存在。依赖缺失、模式不匹配或验证失败时退出非零。
- 构建日志必须出现 `[patch-nodered] verification passed` 和 `[BUILD] SUCCESS`；只有看到 `[BUILD] SUCCESS` 才能认为 `artifacts\fuxa-pro-headless.exe` 已被本次构建覆盖。启动日志不得出现 `Cannot find package 'got'`。
- `build-and-push.ps1` 的成功判定必须依据日志标记（构建日志含 `[BUILD] SUCCESS`，推送日志含 `[GIT] SUCCESS pushed` 或 `[GIT] Push skipped`）。不得用 `Start-Process -PassThru` 返回对象的 `ExitCode` 判断：PowerShell 5.1 下它可能为 `$null`，`$null -ne 0` 成立，会把成功误报为失败。
- `client\dist` 是交付必需的前端静态资源，必须纳入版本控制；`.gitignore` 不得用 `dist/` 规则把它整体忽略（需保留 `!client/dist/` 例外）。否则 CI 从全新克隆构建出的 EXE 缺少 `main.*.js`、`styles.*.css`，打开页面 404 白屏。
- 本地打包与 CI 共用 `scripts\smoke-test.ps1` 做健康检查：覆盖 `/`、`/flows`、`/nodered`、`/dashboard`，逐个请求首页引用的 `main.*.js` / `styles.*.css`，并校验启动日志含 `[Node-RED] Started at /flows` 且无 `Cannot find package 'got'`。禁止 workflow 与本地脚本各自维护一套检查逻辑。
- 品牌资源由 `server\scripts\patch-brand-assets.js` 在打包时从 `docs\customization\` 自动回填到 `client\dist\assets\customization\` 并校验 `appTitle`，日志须出现 `[patch-brand] verification passed`；不得手工替换 `client\dist` 内的品牌文件。

- 不允许多个 `npm ci`、pkg 或构建脚本同时操作 `fuxa-headless\node_modules`。
- 不得把 `artifacts\`、运行时 `data\` 或异常嵌套的 `fuxa-headless\fuxa-headless\` 目录作为构建输入或提交内容。
- 交付母本统一存放于 `deploy\`（`Agent.exe`、`Config\Agent.config`、`Config\Star.config`、`Config\StarAgent.config`、`一键安装服务.bat`、`一键卸载服务.bat`），该目录必须入库；`artifacts\` 只作为构建输出与运行目录。打包时 `Agent.exe` 与两个 `.bat` 从 `deploy\` 覆盖复制到 `artifacts\`；`Config\` 仅在目标缺失时复制，避免覆盖现场改过的配置与安装时生成的 `httpConfig_StarAgent.json`；`data\`、`Log\` 永不参与同步。
- `fuxa-headless\` 为构建中间目录，必须整体忽略，不得纳入版本控制；`node_modules\`、`artifacts\`、`FuxaPro已部署版\` 同样不入库。入库判定标准是「换一台干净机器能否可靠重建」：能重建的不入库，不可重建的（Agent.exe、GBK 批处理母本、`client\dist`）必须入库。
- 重新打包只覆盖 `artifacts\fuxa-pro-headless.exe`；不得删除、清空或重新初始化已有的 `artifacts\data\`。该目录保存数据库、Node-RED flows、插件和业务资源。
- `odbc@2.4.9` 与 `chartjs-node-canvas@3.2.0`（依赖 `canvas@2.11.2`）属于原生插件，必须在目标 Node.js 18 / Windows x64 环境中预置并验证后再交付；不能只验证 npm 包下载成功。它们安装在 `<EXE目录>\data\_pkg\runtime\node_modules\`，**不在构建仓库内，CI 无法验证**，必须在部署机上执行 `node scripts\verify-native-plugins.js`，看到 `[verify-native] ALL CHECKS PASSED` 才算通过。
- 原生插件验证必须至少通过 `require('odbc')` 和 `chartjs-node-canvas` 实际图表渲染；缺少 `canvas.node` 或其 DLL 时不得宣称插件可用。

## Node-RED 验证

- 管理入口为 `/flows`，兼容入口为 `/nodered`，Dashboard/HTTP 入口为 `/dashboard`。
- 修改 Node-RED 路由前先确认 FUXA 默认配置弹窗仍使用 `/flows`，不要把入口问题误改成前端跳转问题。
- EXE 健康检查必须覆盖 `/`、`/flows`、`/nodered`、`/dashboard`，并检查启动日志中的 `[Node-RED] Started at /flows (dashboard: /dashboard)`。

## 数据与文档

- 网页安装插件保存于 `<EXE目录>\data\_pkg\runtime\node_modules\`。
- Node-RED 流程保存于 `<EXE目录>\data\_appdata\node-red\flows.json`。
- 品牌资源内置路径为 `client\dist\assets\customization\`（打入 EXE 快照，打包后不可修改），内置默认品牌为科控物联（`TcScada`）。支持 `<EXE目录>\customization\` 运行时覆盖：外部文件优先、缺失文件回退内置；该目录不在 `data\` 内，迁移时必须单独复制。`docs\customization\` 为回填母本，官方升级覆盖 `client\dist` 后需重新写回。
- 面向最终用户的 `.bat`（`artifacts\一键安装服务.bat`、`artifacts\一键卸载服务.bat`）必须以 **GBK（代码页 936）编码、CRLF 换行、无 BOM** 保存。这类脚本内部会 `chcp 936`，若文件本身是 UTF-8，cmd 会按 GBK 读文件字节，导致中文全部乱码，并可能把乱码字节当成非法路径报出「文件名、目录名或卷标语法不正确」。不得用编辑器把这类文件另存为 UTF-8；重新生成后须实测回显确认中文正常。
- 工作分支为 `1.3.5-PRO`，CI 触发分支与 `build-and-push.ps1` 默认分支必须保持一致。
- 当前操作文档只描述 1.3.5-PRO 和 `fuxa-pro-headless.exe`；旧版本方案必须明确标记为历史，不得混入当前命令。
- 当前项目不保留旧版本排查文档；可执行规则以本文件和 build skill 为准。

## 版本升级（换官方源码）

- PRO 版与开源版分开维护，**不得把开源版源码合入 PRO 分支**，也不得用开源版产物替换当前交付。
- 升级必须走分支合并，禁止把官方源码包直接解压覆盖工作区（会静默冲掉品牌化与补丁）。标准流程：在只装官方源码的 `upstream-X.Y.Z` 分支提交一次，再 `git merge` 到 `1.3.x-PRO`；冲突应集中在我们改过的文件上，其余自动合并。
- 合并对象只包含源码，**不得把压缩包里的 `node_modules`、`artifacts\`、`fuxa-headless\` 带进仓库**。
- 厂家交付形态为「后端源码 + 前端编译产物」：`client\dist` 按二进制资产处理，合并时整体采用官方版本，**不要尝试逐文件三方合并**；随后由 `patch-brand-assets.js` 自动回填品牌资源。合并后必须核对后端 `package.json` 版本与前端构建产物版本一致，避免前后端错配。前端源码不可用：地图瓦片由 `server\scripts\patch-map-tiles.js` 脚本化处理（见下条），其余前端改动只能在编译产物上修补（不推荐）或反馈厂家。
- 升级后必须完成六项复查：① 品牌回填：`node server/scripts/patch-brand-assets.js`，确认 `[patch-brand] verification passed`（`docs\customization\` → `client\dist\assets\customization\`）；② 重跑 `patch-nodered.js` 并确认 `[patch-nodered] verification passed`；③ 在部署机上运行 `node scripts\verify-native-plugins.js` 并确认 `[verify-native] ALL CHECKS PASSED`（该目录在 `data\_pkg\runtime`，CI 覆盖不到）；④ 确认 `/flows`、`/nodered`、`/dashboard` 三条入口；⑤ 健康检查覆盖 `/`、`/flows`、`/nodered`、`/dashboard`，并确认启动日志 `[Node-RED] Started at /flows (dashboard: /dashboard)` 且不含 `Cannot find package 'got'`；⑥ 运行 `scripts\smoke-test.ps1` 并确认 `[smoke] ALL CHECKS PASSED`。
- 地图瓦片源内置在编译后的 `client\dist\main.*.js` 中，必须由 `server\scripts\patch-map-tiles.js` 自动回填（官方默认 `openstreetmap.org` → `https://tile-{s}.openstreetmap.fr/hot/{z}/{x}/{y}.png`）。`build-and-push.ps1` 在同步 `client\dist` 前自动执行；若报「官方可能更换了地图服务商」不得跳过，须人工确认新瓦片源后更新脚本中的替换规则。禁止手工编辑 `client\dist`。
- 前端静态资源检查不可省略：`/` 返回 200 不代表页面可用，必须逐个请求首页引用的 `*.js` / `*.css`。

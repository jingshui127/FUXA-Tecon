# FUXA PRO 项目索引

本文件只作为入口索引，不复制具体实现细节。发生冲突时，以以下当前规范文件为准：

1. **硬性项目规则**：`.trae/rules/fuxa-pro-build.md`
2. **Headless 构建流程**：`.trae/skills/build-fuxa-exe/SKILL.md`
3. **运行与迁移说明**：`docs/PLUGIN_DEPLOYMENT_GUIDE.md`
4. **自动化数据模型**：`.trae/skills/fuxa-automation/references/data-models.md`
5. **用户操作说明**：`docs/FUXA_PRO_用户操作手册.md`

## 当前基线

- 版本：`1.3.5-PRO`（基于官方 `1.3.5-2968` 源码）
- 工作分支：`1.3.5-PRO`（CI 触发分支与 `build-and-push.ps1` 默认分支一致）
- 正式 EXE：`artifacts\\fuxa-pro-headless.exe`
- 构建目标：`node18-win-x64`
- 运行数据：`<EXE目录>\\data\\`
- 网页安装插件：`<EXE目录>\\data\\_pkg\\runtime\\node_modules\\`
- 品牌资源：内置 `client\\dist\\assets\\customization\\`（默认科控物联 `TcScada`），支持 `<EXE目录>\\customization\\` 运行时覆盖
- Node-RED 管理入口：`/flows`
- 兼容入口：`/nodered`
- Dashboard/HTTP 入口：`/dashboard`

## 维护原则

- 修改源码后必须按正式构建流程重新打包；仅完成 `npm ci` 不代表构建成功。
- 只有日志出现 `[BUILD] SUCCESS`，才能确认正式 EXE 已被本次构建覆盖。
- EXE 与运行时数据严格分离：重新构建只覆盖 `artifacts\\fuxa-pro-headless.exe`，绝不删除或清空已有 `artifacts\\data\\`；发布或迁移必须复制 EXE 和完整 data。
- `odbc@2.4.9`、`chartjs-node-canvas@3.2.0` 与 `canvas@2.11.2` 已在 Node.js 18 / Windows x64 runtime 中预置并通过实际加载、图表渲染验证；下一版本沿用该预置流程，不要仅依赖网页安装或重新下载原生依赖。
- `client\\dist` 必须纳入版本控制（`.gitignore` 保留 `!client/dist/` 例外）；它被忽略时 CI 构建的 EXE 会缺少前端 bundle 而白屏。
- 品牌定制支持两级：内置默认（科控物联）打入 EXE 快照、打包后不可改；`<EXE目录>\\customization\\` 运行时覆盖优先。`docs\\customization\\` 为官方升级后的回填母本。
- 旧版本代码、资源、发布包和历史排查文档不保留在项目目录；当前只维护 1.3.5-PRO 的源码、构建输入和必要运行数据。
- 不创建第二套与 rules、skill、部署指南重复的长期说明。
- FUXA-Automation 上游参考仓库为 `https://github.com/HugeShao/Fuxa-automation-skill`；截至 2026-08-26，最新提交为 2026-04-23，只有 3 次提交、无 tag/release。当前以本地 `.trae/skills/fuxa-automation` 为维护基线，吸收上游前必须逐项核对 API 和数据模型。

---
name: "fuxa-maintainer"
description: "FUXA 项目维护知识库：版本线、硬约束、GitHub Actions 构建、Release 产物位置与常见陷阱。处理任何 FUXA 构建、打包、Actions、版本维护任务时调用。"
---

# FUXA 项目维护知识库

处理 FUXA 相关任务（构建、打包、CI/CD、版本维护）时必须先阅读本文件。

## 版本线

| 版本 | 分支 | 本地目录 | 说明 |
|---|---|---|---|
| 普通版 | `1.3.5-2918` | `c:\Users\13971\Downloads\FUXA-master` | 开源版定制，remote 名 `private` |
| PRO 版 | `1.3.4-PRO` | `D:\FUXA\FUXApro最新版\` | 商业版，文档与配置不同 |

- 上游原版仓库：`https://github.com/frangoteam/FUXA`（仅参考，不直接同步）
- 本项目远程仓库：`jingshui127/FUXA-Tecon`（remote 名 `private`）

## 已同步的上游版本

| 上游版本 | 时间 | 合并提交 | 备注 |
|---|---|---|---|
| v1.3.5 正式版（tag `cf0a44c7`，50 提交） | 2026-10-22 | `8a111469` | 安全加固 #2598、DAQ 作用域隔离 #2604/#2606、S7 Bool 写入 #2579、中文翻译 #2601 |
| 官方 master（75 提交） | 2026-10-07 | `d3694928` | 反向代理、报警权限、输入验证 |

## 本地定制（同步上游时必须保留）

| # | 定制 | 位置 | 不可丢失的原因 |
|---|---|---|---|
| 1 | S7 **跳过原生 `Disconnect()`** | `server/runtime/devices/s7/index.js` | 调用会触发 `STATUS_ACCESS_VIOLATION`（0xC0000409/3221225477） |
| 2 | S7 **断连自动重连** | `server/runtime/devices/s7/index.js` `polling()` catch | native `Connected()` 不反映 TCP 断开，不主动断开就永不重连（官方 issue #2626） |
| 3 | 品牌化注入 | `server/main.js` + `server/api/brand.js` + `data/brand.json` | 全站名称/logo/标题 |
| 4 | `BASE_PATH` 环境变量 | `server/main.js`、Node-RED 白名单 | 反向代理部署 |
| 5 | PORT 优先级：CLI `-p` > `PORT` env > mysettings.json > 1881 | `server/main.js` | 部署灵活性 |
| 6 | `patch-nodered`（got v11 强制路径） | `server/scripts/patch-nodered.js`（postinstall） | pkg 环境下 Node-RED 4.x 的 ESM got 不可用 |
| 7 | 配方**模板优先** | `server/runtime/recipes/recipeStorage` + `plugins/recipes/recipes.ts` | UI 操作的是模板，官方只查实例 → 400 |
| 8 | 地图源 `tile-{s}.openstreetmap.fr/hot`，`subdomains:'bc'` | `client/src/app/maps/maps-view/maps-view.component.ts` | OSM 官方/CartoDB 在国内超时 |

## 上游同步流程

1. `gh api repos/frangoteam/FUXA/releases/latest --jq '.tag_name'` 确认正式版 tag
2. `git fetch official --tags` → `git merge official/vX.Y.Z`
3. 冲突策略：
   - `client/dist` → 官方版（本地已移除跟踪，理论上不再冲突）
   - `server/main.js` → **本地版**（官方是子集）
   - `server/runtime/devices/s7/index.js` → 官方改动 + 保留本地定制 1、2
   - `server/runtime/plugins/recipes/recipes.ts` → 保留模板优先
   - `client/**` i18n JSON → **深合并**（官方新键 + 本地 `plugins-notice` 键并集）
4. 合并后逐项回归：`/api/brand`、标题、BASE_PATH、PORT 优先级、S7 不调原生 Disconnect、配方下载、patch-nodered、DAQ sids ≤100、signin 空值拒绝
5. 先本地源码模式验证（见下），通过后 push
6. 更新本文件与本仓库 `科控物联优化/FUXA定制化优化指南.md`

## 验证策略（避免每次都等 6 分钟构建）

| 改动 | 验证方式 | 需重建 EXE |
|---|---|---|
| `server/**` 后端 | `cd server; node guard.js -p 2999` | 交付时 |
| `client/src/**` | `npm run build`；纯字符串小改可直接改 dist 的 `main.*.js` 快速看效果 | 交付时（Actions 现场构建） |
| `server/package.json` | `npm install` | 必须 |
| `data/brand.json` | 重启即可 | 不需要 |

> 直接改 dist 只用于本地验证，必须同时提交 `client/src` 源码；dist 不被 git 跟踪。

## 硬约束（不可违反）

1. **必须使用 Node 18**。S7 通讯（node-snap7）在 Node 20 上不工作。上游原版用 Node 20，不可照搬其 `setup-node` 版本。
2. **server 目录必须全量复制（含 `node_modules`）进打包输入**。pkg 将依赖全部打进 EXE 快照。排除 `node_modules` 会导致 EXE 只剩约 25 MB 的残缺框架（缺失 Modbus/S7/OPC UA/BACnet/ADS/ODBC 等全部通讯插件）。
3. 只排除运行时/构建污染目录：`.git`、`_appdata`、`_db`、`_logs`、`_images`、`_widgets`、`_reports`、`_certificates`。
4. 不得提交 `node_modules/`、`data/`、运行时目录、`fuxa-headless/`、`artifacts/`、EXE 文件到 git。

## 正常 EXE 指标

- 产物：`artifacts/FUXA-1.3.5-2918-win-x64.exe`
- **正常体积约 268 MB**（含全部通讯插件）。若构建产物小于 100 MB，说明打包流程错误（大概率漏了 node_modules）。
- pkg target：`node18-win-x64`，压缩用 `Brotli`（与上游一致）。
- 不使用 `publicPackages`（全部 bundle 进 EXE，避免原生模块加载问题）。

## GitHub Actions 构建（云端）

- Workflow：`.github/workflows/headless_packaging.yml`（分支 `1.3.5-2918`）
- 触发：push 到 `1.3.5-2918`（路径过滤：`server/**`、`client/src/**`、`app/headless/**`、workflow 自身）或 `workflow_dispatch` 手动
- 手动触发：`gh workflow run headless_packaging.yml --repo jingshui127/FUXA-Tecon --ref 1.3.5-2918`
- 查看 run：`gh run list --repo jingshui127/FUXA-Tecon --workflow headless_packaging.yml --limit 5`

### 产物位置（构建成功后）

1. **Release**（永久）：每次构建独立 tag `headless-latest-<run_id>`
   ```
   https://github.com/jingshui127/FUXA-Tecon/releases/download/headless-latest-<run_id>/FUXA-1.3.5-2918-win-x64.exe
   ```
   查询：`gh api /repos/jingshui127/FUXA-Tecon/releases --jq '.[].tag_name'`
2. **Artifact**（90 天）：Actions run 页面 `FUXA-1.3.5-2918-win-x64`

## 已知陷阱

1. **PowerShell 不是 Bash**：workflow 步骤若用 `rsync`、here-doc `<<EOF`、BOM 敏感的文本处理会在 windows runner 失败。一律用 `shell: powershell` + `Copy-Item`。
2. **`env` 上下文不可在 `with:` 中引用**：Release tag 必须直接写 `headless-latest-${{ github.run_id }}`。
3. **Release tag 不可用固定名滚动覆盖**：会累积重复资产且不可追溯。已改为每次构建独立 `headless-latest-<run_id>`。
4. **`gh run view --log` 返回 `log not found`**：说明 job 未真正开始（`startup_failure` 或排队失败），需到 Actions 页面 UI 查原因。
5. **Node.js 版本警告**：runner 日志出现 Node 20/24 弃用警告属平台演进提示，不改变我们 Node 18 的约束。
6. **推送失败 `Connection was reset`**：网络瞬时故障，稍等重试；可用 `git -c http.postBuffer=524288000 push` 增加缓冲。
7. **PowerShell 改写 JSON 带入 BOM**：`Set-Content` 默认写 UTF-8 with BOM，会导致 Actions 的 `Build client` 报 `package.json SyntaxError`。改用 `[System.IO.File]::WriteAllText($p,$s,(New-Object System.Text.UTF8Encoding($false)))`，并用字节检查确认前 3 字节不是 `239 187 191`。
8. **下载 Release 产物不要用单连接**：国内单连接约 130 KB/s，283MB 会卡死/超 30 分钟。用 8 线程 `curl -r start-end` 并行 + 拼接，并校验最终字节数等于 API `assets[0].size`。
9. **`browser_use` 子代理访问不到本地 localhost**：会误报 `ERR_CONNECTION_REFUSED`。以 `netstat` + `curl` + `/socket.io/?EIO=4&transport=polling` 交叉验证，UI 渲染让用户在本机浏览器确认。

## 与上游 frangoteam 的差异（有意为之）

| 项 | 上游 | 我们 | 原因 |
|---|---|---|---|
| Node | 20 | **18** | S7 通讯要求 |
| 平台 matrix | 5 平台 | 仅 win-x64 | 当前只需 Windows |
| Release tag | 固定 | `headless-latest-<run_id>` | 避免累积 |
| server 复制 | 全量 | 全量（已对齐） | 必须含 node_modules |

## 提交规范

- 只提交目标文件，不要 `git add -A`（工作区常有大量历史删除状态）。
- 提交后推送：`git push private 1.3.5-2918`。

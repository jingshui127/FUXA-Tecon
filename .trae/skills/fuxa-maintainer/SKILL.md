---
name: "fuxa-maintainer"
description: "FUXA 项目维护知识库：版本线、硬约束、GitHub Actions 构建、Release 产物位置与常见陷阱。处理任何 FUXA 构建、打包、Actions、版本维护任务时调用。"
---

# FUXA 项目维护知识库

处理 FUXA 相关任务（构建、打包、CI/CD、版本维护）时必须先阅读本文件。

## 版本线

| 版本 | 分支 | 本地目录 | 说明 |
|---|---|---|---|
| 普通版 | `1.3.4-2888` | `c:\Users\13971\Downloads\FUXA-master` | 开源版定制，remote 名 `private` |
| PRO 版 | `1.3.4-PRO` | `D:\FUXA\FUXApro最新版\` | 商业版，文档与配置不同 |

- 上游原版仓库：`https://github.com/frangoteam/FUXA`（仅参考，不直接同步）
- 本项目远程仓库：`jingshui127/FUXA-Tecon`（remote 名 `private`）

## 硬约束（不可违反）

1. **必须使用 Node 18**。S7 通讯（node-snap7）在 Node 20 上不工作。上游原版用 Node 20，不可照搬其 `setup-node` 版本。
2. **server 目录必须全量复制（含 `node_modules`）进打包输入**。pkg 将依赖全部打进 EXE 快照。排除 `node_modules` 会导致 EXE 只剩约 25 MB 的残缺框架（缺失 Modbus/S7/OPC UA/BACnet/ADS/ODBC 等全部通讯插件）。
3. 只排除运行时/构建污染目录：`.git`、`_appdata`、`_db`、`_logs`、`_images`、`_widgets`、`_reports`、`_certificates`。
4. 不得提交 `node_modules/`、`data/`、运行时目录、`fuxa-headless/`、`artifacts/`、EXE 文件到 git。

## 正常 EXE 指标

- 产物：`artifacts/FUXA-1.3.4-2888-win-x64.exe`
- **正常体积约 268 MB**（含全部通讯插件）。若构建产物小于 100 MB，说明打包流程错误（大概率漏了 node_modules）。
- pkg target：`node18-win-x64`，压缩用 `Brotli`（与上游一致）。
- 不使用 `publicPackages`（全部 bundle 进 EXE，避免原生模块加载问题）。

## GitHub Actions 构建（云端）

- Workflow：`.github/workflows/headless_packaging.yml`（分支 `1.3.4-2888`）
- 触发：push 到 `1.3.4-2888`（路径过滤：`server/**`、`client/src/**`、`app/headless/**`、workflow 自身）或 `workflow_dispatch` 手动
- 手动触发：`gh workflow run headless_packaging.yml --repo jingshui127/FUXA-Tecon --ref 1.3.4-2888`
- 查看 run：`gh run list --repo jingshui127/FUXA-Tecon --workflow headless_packaging.yml --limit 5`

### 产物位置（构建成功后）

1. **Release**（永久）：每次构建独立 tag `headless-latest-<run_id>`
   ```
   https://github.com/jingshui127/FUXA-Tecon/releases/download/headless-latest-<run_id>/FUXA-1.3.4-2888-win-x64.exe
   ```
   查询：`gh api /repos/jingshui127/FUXA-Tecon/releases --jq '.[].tag_name'`
2. **Artifact**（90 天）：Actions run 页面 `FUXA-1.3.4-2888-win-x64`

## 已知陷阱

1. **PowerShell 不是 Bash**：workflow 步骤若用 `rsync`、here-doc `<<EOF`、BOM 敏感的文本处理会在 windows runner 失败。一律用 `shell: powershell` + `Copy-Item`。
2. **`env` 上下文不可在 `with:` 中引用**：Release tag 必须直接写 `headless-latest-${{ github.run_id }}`。
3. **Release tag 不可用固定名滚动覆盖**：会累积重复资产且不可追溯。已改为每次构建独立 `headless-latest-<run_id>`。
4. **`gh run view --log` 返回 `log not found`**：说明 job 未真正开始（`startup_failure` 或排队失败），需到 Actions 页面 UI 查原因。
5. **Node.js 版本警告**：runner 日志出现 Node 20/24 弃用警告属平台演进提示，不改变我们 Node 18 的约束。
6. **推送失败 `Connection was reset`**：网络瞬时故障，稍等重试；可用 `git -c http.postBuffer=524288000 push` 增加缓冲。

## 与上游 frangoteam 的差异（有意为之）

| 项 | 上游 | 我们 | 原因 |
|---|---|---|---|
| Node | 20 | **18** | S7 通讯要求 |
| 平台 matrix | 5 平台 | 仅 win-x64 | 当前只需 Windows |
| Release tag | 固定 | `headless-latest-<run_id>` | 避免累积 |
| server 复制 | 全量 | 全量（已对齐） | 必须含 node_modules |

## 提交规范

- 只提交目标文件，不要 `git add -A`（工作区常有大量历史删除状态）。
- 提交后推送：`git push private 1.3.4-2888`。

# FUXA PRO 1.3.4-PRO 插件与 Node-RED 部署指南

本文档是当前 `fuxa-pro-headless.exe` 的运行、迁移和回归验证指南。当前版本固定约定：

| 项目 | 当前值 |
|---|---|
| 版本 | `1.3.4-PRO` |
| 产物 | `artifacts\fuxa-pro-headless.exe` |
| Node.js | 18.x |
| pkg target | `node18-win-x64` |
| pkg compression | `None` |

## 一、运行时安装插件

启动 `fuxa-pro-headless.exe` 后访问：

```text
http://127.0.0.1:1881/plugins
```

网页安装的通讯插件保存于：

```text
<EXE目录>\data\_pkg\runtime\node_modules\
```

迁移到其他 Windows x64 电脑时，必须同时复制 EXE 和完整的 `data\` 文件夹，已安装插件、项目数据和配置才会保留。Node-RED 内置依赖不属于网页通讯插件，不要混用两套安装方式。

## 二、Node-RED 入口

- 管理编辑器：`http://127.0.0.1:1881/flows`
- 兼容入口：`http://127.0.0.1:1881/nodered`
- Dashboard/HTTP 节点：`http://127.0.0.1:1881/dashboard`

FUXA 默认配置弹窗中的 “Node-RED Flows” 图标仍然跳转到 `/flows`，不应通过修改前端跳转来规避后端路由问题。

流程文件位置：

```text
<EXE目录>\data\_appdata\node-red\flows.json
```

启动日志必须包含：

```text
[Node-RED] Started at /flows (dashboard: /dashboard)
```

如果 `/flows` 返回 404 或 `Cannot GET /flows`，按以下顺序排查：

1. 确认日志中 FUXA 和 Node-RED 均已启动；
2. 确认 `<EXE目录>\data\_appdata\mysettings.json` 中 `nodeRedEnabled` 未被关闭；
3. 分别检查 `/flows`、`/nodered`、`/dashboard`；
4. 不要先修改默认配置弹窗的前端地址。

## 三、当前唯一构建流程

项目根目录唯一推荐入口：

```powershell
.\build-and-push.ps1 -SkipCommit -SkipPush
```

构建脚本必须按以下顺序执行：

1. 同步 `server`、`client\dist` 和 Headless 入口；
2. 在 `fuxa-headless` 目录执行：
   ```powershell
   npm ci --omit=dev --no-audit --no-fund
   ```
3. 执行：
   ```powershell
   node fuxa-headless/server/scripts/patch-nodered.js
   ```
4. 确认出现：
   ```text
   [patch-nodered] verification passed
   ```
5. 使用 Node.js 18、`node18-win-x64` 和 `compression: "None"` 执行 pkg；
6. 确认出现：
   ```text
   [BUILD] SUCCESS
   ```

当前 Node-RED 4.1.10 的 `got` 动态导入位于：

```text
fuxa-headless\node_modules\@node-red\runtime\lib\telemetry\index.js
```

`patch-nodered.js` 还会修复 Node-RED registry 的 pkg 元数据读取。旧版本可能存在的 `@node-red\nodes\core\network\21-httprequest.js` 只能作为兼容性目标，不能假设它必然存在。patch 目标缺失、依赖缺失、模式不匹配或验证失败时，构建必须停止。

## 四、构建后健康检查

新 EXE 必须使用独立的 `data\` 目录启动，然后检查：

```text
/
/flows
/nodered
/dashboard
```

同时确认启动日志：

- 包含 `[Node-RED] Started at /flows (dashboard: /dashboard)`；
- 不包含 `Cannot find package 'got'`；
- 不把数据写入 `C:\snapshot\...`。

如果 EXE 的修改时间和构建日志中的 `[BUILD] SUCCESS` 对不上，说明运行的不是本次构建产物，不能据此判断修复是否生效。

## 五、构建输入与迁移边界

不得将以下内容作为构建输入或提交内容：

```text
artifacts\
data\
fuxa-headless\fuxa-headless\
临时构建日志
```

不要同时运行多个 `npm ci`、pkg 或完整构建脚本；Windows 文件锁会导致 `EPERM`，并可能生成未经过 patch 的旧 EXE。

旧版本 EXE、旧用户目录数据、手工 pkg 命令和旧 patch 路径均已从项目中移除，不属于当前操作步骤。

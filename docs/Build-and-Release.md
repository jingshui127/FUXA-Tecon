# 普通版构建与发布规范

## 当前版本

- 普通版版本：`1.3.5-2918`
- 正式发布分支：`1.3.5-2918`
- Node.js：18 LTS
- Windows pkg target：`node18-win-x64`
- 正式产物：`artifacts/FUXA-1.3.5-2918-win-x64.exe`

## 唯一构建入口

本地构建统一使用 `.trae/skills/build-fuxa-exe/SKILL.md`。GitHub Actions 使用 `.github/workflows/headless_packaging.yml`，两者都从源码创建临时 `fuxa-headless/` 输入目录，不使用 `fuxa-headless-local/` 作为构建源。

固定顺序：

1. 确认当前分支和工作区，保持运行数据不变。
2. 在 `server` 和 `client` 目录安装依赖。
3. 由 `server` 的 `postinstall` 自动运行 `scripts/patch-nodered.js`。
4. 在 `client` 目录执行 `npm run build -- --configuration=production`。
5. 将 `server`、`client/dist` 和 `app/headless/headless-guardian.js` 同步到临时输入目录。
6. 使用 `@yao-pkg/pkg` 和 `node18-win-x64` 生成正式产物。
7. 启动 EXE，检查日志和 HTTP 健康入口。
8. 实际加载并验证 `modbus-serial`、`node-snap7`。

## 运行目录

Headless EXE 使用 EXE 同目录的 `data/`。运行时目录包括：

- `data/_appdata/`：项目、用户、设置和 Node-RED 流程
- `data/_appdata/node-red/flows.json`：Node-RED flow 文件
- `data/_db/`：DAQ 和历史数据
- `data/_logs/`：服务日志
- `data/_images/`、`data/_widgets/`、`data/_reports/`：运行时资源
- `data/_certificates/`：证书

Node-RED 管理入口为 `/nodered`，HTTP 节点和 Dashboard 入口为 `/dashboard`。设置 `BASE_PATH=/fuxa` 时，入口分别为 `/fuxa/nodered` 和 `/fuxa/dashboard`。

## 健康检查

启动后必须检查：

```powershell
Invoke-WebRequest http://127.0.0.1:1881/api/version -UseBasicParsing
Invoke-WebRequest http://127.0.0.1:1881/ -UseBasicParsing
```

`/api/version` 应返回 HTTP 200，并包含版本 `1.3.5-2918`。Node-RED 启用时还应检查 `/nodered` 和 `/dashboard` 的实际响应。

## 构建成功标准

日志至少应出现：

- `FUXA V.1.3.5-2918`
- `FUXA started!`
- `WebServer is running`
- 启用 Node-RED 时出现 `[Node-RED] Started at /nodered`

不得出现 Node-RED `httprequest` 的 `SyntaxError` 或 `Cannot use import statement outside a module`。

## Git 边界

不得将以下内容作为构建输入或提交内容：`node_modules/`、`data/`、`_appdata/`、`_db/`、`_logs/`、`_images/`、`_widgets/`、`_reports/`、`_certificates/`、`fuxa-headless/`、`fuxa-headless-local/`、`artifacts/`、日志和 EXE。已有运行数据不得删除、清空或覆盖。

## 原生模块验证

在服务实际运行的 Node.js 18 环境中执行：

```powershell
node -e "console.log(require('modbus-serial').name || 'modbus-serial loaded'); console.log(typeof require('node-snap7').S7Client === 'function' ? 'node-snap7 loaded' : 'node-snap7 invalid')"
```

这项检查不能由 `package.json` 版本声明替代。

# FUXA PRO 1.3.4-PRO

## 当前标准运行方式

当前 Windows Headless 版本是 **FUXA PRO 1.3.4-PRO**，正式产物为：

```text
artifacts\fuxa-pro-headless.exe
```

将 EXE 复制到目标电脑后直接运行。运行时会在 EXE 同级创建并使用：

```text
data\
```

网页安装的插件保存在 `data\_pkg\runtime\node_modules\`，Node-RED 流程保存在 `data\_appdata\node-red\flows.json`。复制 EXE 和同级 `data\` 目录即可保留已安装插件、流程和运行数据。

默认端口为 `1881`，可使用以下入口：

- FUXA：`http://127.0.0.1:1881/`
- Node-RED 管理界面：`http://127.0.0.1:1881/flows`
- Node-RED 兼容入口：`http://127.0.0.1:1881/nodered`
- Dashboard/HTTP 入口：`http://127.0.0.1:1881/dashboard`

`/flows` 是 FUXA 默认配置弹窗中 “Node-RED flows” 使用的正式管理入口；不要改为其他路径。没有配置 Dashboard 流程时，直接访问 `/dashboard` 返回 404 属于正常现象。

## 本地构建

工作目录：

```text
d:\FUXA\FUXApro最新版
```

唯一正式构建入口：

```powershell
.\build-and-push.ps1 -SkipCommit -SkipPush
```

构建顺序是源码同步、依赖安装、Node-RED patch、pkg 打包和结果验证。必须同时看到以下日志，才算构建成功：

```text
[patch-nodered] verification passed
[BUILD] SUCCESS
```

构建目标为 Node.js 18 `node18-win-x64`，pkg 压缩为 `None`。详细规则见：

- [.trae/rules/fuxa-pro-build.md](.trae/rules/fuxa-pro-build.md)
- [.trae/skills/build-fuxa-exe/SKILL.md](.trae/skills/build-fuxa-exe/SKILL.md)
- [docs/PLUGIN_DEPLOYMENT_GUIDE.md](docs/PLUGIN_DEPLOYMENT_GUIDE.md)

## 项目结构

- `server\`：后端源码
- `client\`：前端源码和构建结果
- `app\headless\`：Headless 启动入口源码
- `fuxa-headless\`：正式 Headless 构建输入目录
- `artifacts\`：本地构建产物和运行时 data，不提交到 Git
- `docs\`：当前运行、迁移和自动化文档
- `.trae\rules\`：必须遵守的项目规则
- `.trae\skills\`：可执行技能和 API 参考

## 文档入口

- 构建和发布：`.trae\rules\fuxa-pro-build.md`、`.trae\skills\build-fuxa-exe\SKILL.md`
- 运行、迁移和插件：`docs\PLUGIN_DEPLOYMENT_GUIDE.md`
- 用户操作：`docs\FUXA_PRO_用户操作手册.md`
- REST API 自动化：`.trae\skills\fuxa-automation\SKILL.md`
- 自动化数据模型：`.trae\skills\fuxa-automation\references\data-models.md`

# FUXA PRO 用户操作手册

## 一、产品简介

FUXA PRO 是基于 FUXA 开源 SCADA 系统的科控物联定制版，支持西门子 S7 PLC 通讯，适用于工业自动化监控场景。

**版本信息：** 1.3.5-PRO  
**技术支持：** QQ 2492123056

---

## 二、获取软件

### 2.1 下载地址

访问 GitHub Actions 构建页面下载最新版本：  
<https://github.com/jingshui127/FUXA-Tecon/actions>

选择对应的工作流运行记录获取产物，两种方式任选：

**方式一：Release（推荐，直接下 EXE）**

<https://github.com/jingshui127/FUXA-Tecon/releases/tag/headless-pro-latest>

Release 中的 `fuxa-pro-headless.exe` 即最终交付文件，无需解压。

**方式二：Actions Artifacts（需解压）**

| Artifacts 产物名称            | 说明                                |
| ------------------------- | --------------------------------- |
| `fuxa-pro-headless-1.3.5` | 压缩包，解压后得到 `fuxa-pro-headless.exe` |

Artifacts 名称带版本号并自动压缩，需解压后使用；保留天数跟随仓库设置（当前上限为 3 天），过期后需重新运行工作流。Release 中的产物名称固定为 `fuxa-pro-headless.exe`，始终为最新构建且长期保留，正式交付建议使用 Release。

---

## 三、Windows 版本使用

### 3.1 运行方式

**方式一：双击运行**

直接双击 `fuxa-pro-headless.exe` 启动，默认使用 1881 端口。

**方式二：命令行运行**

```bash
# 使用默认端口 1881
.\fuxa-pro-headless.exe

# 指定端口
.\fuxa-pro-headless.exe -p 1882
```

### 3.2 启动信息

启动后控制台会显示以下信息（时间戳与路径随实际环境变化）：

```
[FUXA PRO] 2026-10-23T02:47:34.582Z | FUXA PRO Headless Guardian starting...
[FUXA PRO] 2026-10-23T02:47:34.583Z | 科控物联提供技术支持 | QQ: 2492123056
[FUXA PRO] 2026-10-23T02:47:34.584Z | Working directory: <EXE目录>
[FUXA PRO] 2026-10-23T02:47:34.588Z | =====================================
[FUXA PRO] 2026-10-23T02:47:34.590Z | Starting FUXA server (restart #0)...
[Server] FUXA PRO Headless Server starting...
[Server] Data directory: <EXE目录>\data
[Server] Node.js: v18.20.8
2026-10-23T02:47:35.979Z [INF]  TcScada V.1.3.5-2968
2026-10-23T02:47:36.310Z [INF]  TcScada started!
2026-10-23T02:47:38.006Z [INF]  [Node-RED] Started at /flows (dashboard: /dashboard)
2026-10-23T02:47:38.011Z [INF]  WebServer is running http://127.0.0.1:1881/
```

说明：

- 日志中的应用名（上例为 `TcScada`）来自品牌配置，内置默认为科控物联品牌；配置了外部 `customization\` 目录时会跟随外部 `config.json` 的 `appName` 变化。
- 启动日志出现 `WebServer is running` 表示服务已就绪。
- 使用 `-p 1882` 指定端口时，`WebServer is running` 显示的端口同步变为 1882。

### 3.3 访问界面

启动成功后，在浏览器访问：

- FUXA 主界面：<http://127.0.0.1:1881/>
- Node-RED 管理界面：<http://127.0.0.1:1881/flows>
- Node-RED 兼容入口：<http://127.0.0.1:1881/nodered>
- Dashboard/HTTP 入口：<http://127.0.0.1:1881/dashboard>
- 插件管理：<http://127.0.0.1:1881/plugins>

使用 `-p 1882` 时，将上述地址中的端口替换为 `1882`。没有配置 Dashboard 流程时，直接访问 `/dashboard` 返回 404 属于正常现象。

### 3.4 数据存储位置

所有项目数据存储在 EXE 同级的 `data\` 目录中，首次运行会自动创建该目录。Node-RED 流程位于 `data\_appdata\node-red\flows.json`，网页安装插件位于 `data\_pkg\runtime\node_modules\`。

### 3.5 品牌定制（LOGO / 名称）

在 EXE 同级创建 `customization\` 目录，放入需要替换的文件后重启 EXE 即可，**不需要重新打包**：

| 文件            | 作用                                         |
| ------------- | ------------------------------------------ |
| `config.json` | 应用名、浏览器标题、侧边栏标题、服务器名、帮助页信息、闪屏文案、日志文件名、报表页眉 |
| `logo.svg`    | 闪屏与帮助页使用的 LOGO 图片                          |
| `favicon.ico` | 浏览器标签页图标                                   |

规则：

- 外部目录中的文件**优先于** EXE 内置资源，未提供的文件自动回退内置默认，因此可以只覆盖其中一部分（例如只放 `logo.svg`）。
- 目录不存在或文件缺失时，界面保持内置默认品牌，不影响运行。
- 生效时启动日志会输出 `Customization: using external brand assets from <路径>`。
- 可参考交付素材 `docs\customization\` 的 `config.json` 格式。
- 与官方约定一致：升级 FUXA 版本时 `client\dist` 会被覆盖，内置品牌会回退为官方 FUXA 默认，需要用项目内 `docs\customization\` 重新写回；外部 `customization\` 目录不受升级影响。

### 3.6 停止服务

在控制台窗口中按 `Ctrl+C` 停止服务。

---

## 四、功能说明

### 4.1 S7 通讯

本版本已集成 `node-snap7` 插件，支持与西门子 S7 系列 PLC 通讯：

- S7-200
- S7-300
- S7-400
- S7-1200
- S7-1500

**配置路径：** 管理界面 → 设备 → 添加设备 → 选择 S7 通讯协议

### 4.2 控件下载

支持从在线控件库下载控件到本地使用。

**操作路径：** 管理界面 → 资源 → 控件

### 4.3 地图功能

地图瓦片源已由默认的 `tile.openstreetmap.org` 替换为 OpenStreetMap HOT 瓦片服务：

```text
https://tile-{s}.openstreetmap.fr/hot/{z}/{x}/{y}.png
```

若网络环境无法访问该瓦片服务，地图将无法显示，需自行部署或改用可访问的瓦片源。

该替换由打包脚本 `server\scripts\patch-map-tiles.js` 自动完成并校验，不需要手工修改前端文件。

---

## 五、常见问题

### 5.1 端口被占用

**现象：** 启动时提示 `Error: listen EADDRINUSE: address already in use 0.0.0.0:1881`

**解决方法：**

```bash
# 方法一：更换端口
.\fuxa-pro-headless.exe -p 1882

# 方法二：查找并关闭占用端口的程序
netstat -ano | findstr :1881
taskkill /PID <进程ID> /F
```

### 5.2 控件下载后不显示

**解决方法：** 重新启动应用，控件会在启动时加载。

### 5.3 Windows 防火墙阻止访问

**解决方法：**

1. 打开 Windows 防火墙设置
2. 添加入站规则，允许 TCP 端口 1881
3. 或临时关闭防火墙测试

### 5.4 浏览器无法访问

**检查清单：**

- 确认服务已启动（控制台显示 `<应用名> started!`，内置默认品牌下为 `TcScada started!`）
- 确认使用正确的地址和端口
- 确认防火墙未阻止访问
- 尝试使用 `http://127.0.0.1:1881` 代替 `localhost`

---

## 六、系统要求

### 6.1 Windows 版本

| 项目   | 要求                                                                                           |
| ---- | -------------------------------------------------------------------------------------------- |
| 操作系统 | Windows 10 / 11 / Server 2016+（x64）。Node.js 18 官方支持 Windows 8.1 及以上，本项目仅在 Windows 10 / 11 实测 |
| 架构   | x64                                                                                          |
| 内存   | 建议 2GB 以上；上千数据点的大规模项目请参考 [Modbus/MQTT 大规模项目准备指南](Modbus_MQTT_大规模项目准备指南.md)（建议 8GB）           |
| 磁盘   | EXE 本体约 315MB，另需为 `data\` 预留空间，建议 ≥2GB 可用空间                                                  |
| 浏览器  | Chrome、Edge、Firefox 最新版                                                                      |

### 6.2 运行环境

| 项目   | 要求                                                                      |
| ---- | ----------------------------------------------------------------------- |
| 运行时  | 已包含于 `fuxa-pro-headless.exe`，无需单独安装 Node.js 或 Docker                    |
| 网络   | 浏览器访问服务端口；跨设备访问时放行 TCP 1881                                             |
| 数据迁移 | 复制 EXE 与同级 `data\` 目录；若使用了外部品牌目录，还需一并复制 `customization\`（它不在 `data\` 内） |

# FUXA PRO 用户操作手册

## 一、产品简介

FUXA PRO 是基于 FUXA 开源 SCADA 系统的科控物联定制版，支持西门子 S7 PLC 通讯，适用于工业自动化监控场景。

**版本信息：** 1.3.5-PRO  
**技术支持：** QQ 2492123056

---

## 二、获取软件

### 2.1 下载地址

访问 GitHub Actions 构建页面下载最新版本：  
https://github.com/jingshui127/FUXA-Tecon/actions

选择对应的工作流运行记录，在页面底部的 **Artifacts** 区域下载：

| 产物名称 | 说明 |
|---------|------|
| `fuxa-pro-headless.exe` | Windows 独立可执行文件 |

当前版本仅发布 `fuxa-pro-headless.exe` 这一种 Windows 独立可执行文件。

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

启动后控制台会显示以下信息：

```
FUXA PRO starting...
技术支持QQ：2492123056
FUXA PRO 科控物联定制版
版本：1.3.5-PRO

Using existing data directory: <EXE目录>\data
Launching FUXA server with userDir: <EXE目录>\data
```

### 3.3 访问界面

启动成功后，在浏览器访问：

- FUXA 主界面：http://127.0.0.1:1881/
- Node-RED 管理界面：http://127.0.0.1:1881/flows
- Node-RED 兼容入口：http://127.0.0.1:1881/nodered
- Dashboard/HTTP 入口：http://127.0.0.1:1881/dashboard
- 插件管理：http://127.0.0.1:1881/plugins

使用 `-p 1882` 时，将上述地址中的端口替换为 `1882`。没有配置 Dashboard 流程时，直接访问 `/dashboard` 返回 404 属于正常现象。

### 3.4 数据存储位置

所有项目数据存储在 EXE 同级的 `data\` 目录中，首次运行会自动创建该目录。Node-RED 流程位于 `data\_appdata\node-red\flows.json`，网页安装插件位于 `data\_pkg\runtime\node_modules\`。

### 3.5 停止服务

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

地图源已优化为国内可访问的 OpenStreetMap 服务器。

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
- 确认服务已启动（控制台显示 "FUXA started!"）
- 确认使用正确的地址和端口
- 确认防火墙未阻止访问
- 尝试使用 `http://127.0.0.1:1881` 代替 `localhost`

---

## 六、系统要求

### 6.1 Windows 版本

| 项目 | 要求 |
|------|------|
| 操作系统 | Windows 7/10/11/Server 2016+ |
| 架构 | x64 |
| 内存 | 最低 512MB，推荐 1GB+ |
| 磁盘 | 最低 200MB 可用空间 |
| 浏览器 | Chrome、Edge、Firefox 最新版 |

### 6.2 运行环境

| 项目 | 要求 |
|------|------|
| 运行时 | 已包含于 `fuxa-pro-headless.exe`，无需单独安装 Node.js 或 Docker |
| 网络 | 浏览器访问服务端口；跨设备访问时放行 TCP 1881 |
| 数据迁移 | 复制 EXE 与同级 `data\` 目录 |

# FUXA PRO 用户操作手册

## 一、产品简介

FUXA PRO 是基于 FUXA 开源 SCADA 系统的科控物联定制版，支持西门子 S7 PLC 通讯，适用于工业自动化监控场景。

**版本信息：** 1.3.1-PRO  
**技术支持：** QQ 2492123056

---

## 二、获取软件

### 2.1 下载地址

访问 GitHub Actions 构建页面下载最新版本：  
https://github.com/jingshui127/FUXA-Tecon/actions

选择对应的工作流运行记录，在页面底部的 **Artifacts** 区域下载：

| 产物名称 | 说明 |
|---------|------|
| `FuxaPro-Single-xxxxxx` | Windows 独立可执行文件 |
| `fuxa-pro-latest-amd64` | Docker 镜像文件（Linux amd64） |
| `fuxa-pro-snap7-1.3.1-amd64` | Docker 镜像文件（含 S7 通讯支持） |

### 2.2 产物类型说明

| 类型 | 文件格式 | 适用场景 |
|------|---------|---------|
| Windows 可执行文件 | `.exe` | Windows 服务器/工控机直接运行 |
| Docker 镜像 | `.tar` | Linux 环境通过 Docker 运行 |

---

## 三、Windows 版本使用

### 3.1 运行方式

**方式一：双击运行**

直接双击 `FuxaPro-Single-windows-x64.exe` 启动，默认使用 1881 端口。

**方式二：命令行运行**

```bash
# 使用默认端口 1881
.\FuxaPro-Single-windows-x64.exe

# 指定端口（大写 -P 或小写 -p 均可）
.\FuxaPro-Single-windows-x64.exe -P 1882
.\FuxaPro-Single-windows-x64.exe -p 1882
```

### 3.2 启动信息

启动后控制台会显示以下信息：

```
FUXA PRO starting...
技术支持QQ：2492123056
FUXA PRO 科控物联定制版
版本：1.3.1-PRO

Using existing data directory: C:\Users\<用户名>\fuxa-headless-data
Launching FUXA server with userDir: C:\Users\<用户名>\fuxa-headless-data
FUXA V.1.3.1-2789
FUXA started!
```

### 3.3 访问界面

启动成功后，在浏览器中访问：

- 默认地址：http://localhost:1881
- 自定义端口：http://localhost:1882（如果使用了 -P 1882）

### 3.4 数据存储位置

所有项目数据存储在：`C:\Users\<用户名>\fuxa-headless-data`

首次运行会自动创建该目录。

### 3.5 停止服务

在控制台窗口中按 `Ctrl+C` 停止服务。

---

## 四、Docker 版本使用

### 4.1 导入镜像

将下载的 `.tar` 文件传输到 Linux 服务器后，执行以下命令导入：

```bash
# 导入镜像
docker load -i fuxa-pro-latest-amd64.tar

# 验证镜像是否导入成功
docker images | grep fuxa-pro
```

### 4.2 运行容器

```bash
# 基本运行
docker run -d -p 1881:1881 --name fuxa-pro jingshui127/fuxa-pro:latest

# 带数据持久化
docker run -d -p 1881:1881 \
  -v /data/fuxa:/usr/src/app/FUXA/server/_appdata \
  --name fuxa-pro \
  jingshui127/fuxa-pro:latest

# 使用自定义端口
docker run -d -p 1882:1881 \
  -v /data/fuxa:/usr/src/app/FUXA/server/_appdata \
  --name fuxa-pro \
  jingshui127/fuxa-pro:latest
```

### 4.3 访问界面

- 本机访问：http://localhost:1881
- 局域网访问：http://<服务器IP>:1881

### 4.4 常用命令

```bash
# 查看运行状态
docker ps

# 查看日志
docker logs fuxa-pro

# 停止容器
docker stop fuxa-pro

# 启动容器
docker start fuxa-pro

# 删除容器
docker rm -f fuxa-pro

# 删除镜像
docker rmi jingshui127/fuxa-pro:latest
```

### 4.5 开机自启动

```bash
# 运行时添加重启策略
docker run -d -p 1881:1881 \
  --restart=always \
  --name fuxa-pro \
  jingshui127/fuxa-pro:latest

# 为已存在的容器设置重启策略
docker update --restart=always fuxa-pro
```

---

## 五、功能说明

### 5.1 S7 通讯

本版本已集成 `node-snap7` 插件，支持与西门子 S7 系列 PLC 通讯：

- S7-200
- S7-300
- S7-400
- S7-1200
- S7-1500

**配置路径：** 管理界面 → 设备 → 添加设备 → 选择 S7 通讯协议

### 5.2 控件下载

支持从在线控件库下载控件到本地使用。

**操作路径：** 管理界面 → 资源 → 控件

### 5.3 地图功能

地图源已优化为国内可访问的 OpenStreetMap 服务器。

---

## 六、常见问题

### 6.1 端口被占用

**现象：** 启动时提示 `Error: listen EADDRINUSE: address already in use 0.0.0.0:1881`

**解决方法：**
```bash
# 方法一：更换端口
.\FuxaPro-Single-windows-x64.exe -P 1882

# 方法二：查找并关闭占用端口的程序
netstat -ano | findstr :1881
taskkill /PID <进程ID> /F
```

### 6.2 控件下载后不显示

**解决方法：** 重新启动应用，控件会在启动时加载。

### 6.3 Docker 容器无法启动

**检查步骤：**
```bash
# 查看容器日志
docker logs fuxa-pro

# 检查端口是否被占用
netstat -tlnp | grep 1881

# 检查数据目录权限
ls -la /data/fuxa
```

### 6.4 Windows 防火墙阻止访问

**解决方法：**
1. 打开 Windows 防火墙设置
2. 添加入站规则，允许 TCP 端口 1881
3. 或临时关闭防火墙测试

### 6.5 浏览器无法访问

**检查清单：**
- 确认服务已启动（控制台显示 "FUXA started!"）
- 确认使用正确的地址和端口
- 确认防火墙未阻止访问
- 尝试使用 `http://127.0.0.1:1881` 代替 `localhost`

---

## 七、系统要求

### 7.1 Windows 版本

| 项目 | 要求 |
|------|------|
| 操作系统 | Windows 7/10/11/Server 2016+ |
| 架构 | x64 |
| 内存 | 最低 512MB，推荐 1GB+ |
| 磁盘 | 最低 200MB 可用空间 |
| 浏览器 | Chrome、Edge、Firefox 最新版 |

### 7.2 Docker 版本

| 项目 | 要求 |
|------|------|
| 操作系统 | Linux（推荐 Ubuntu 20.04+） |
| 架构 | amd64 |
| Docker | 20.10+ |
| 内存 | 最低 512MB，推荐 1GB+ |
| 磁盘 | 最低 500MB 可用空间 |

# FUXA Headless 部署包

便携式免安装部署方案，拷贝到目标电脑即可运行，无需单独安装 Node.js。

## 目录结构

```
fuxa-headless/
├── main.js                    # 入口脚本（bootstrap）
├── package.json               # 包配置
├── nodejs/                    # Node.js 18 免部署运行时（自包含）
│   ├── node.exe
│   ├── npm.cmd / npx.cmd
│   └── ...
├── server/                    # 服务端代码
│   ├── fuxa-wrapper.js        # 自动重启保护器（崩溃自动恢复）
│   ├── main.js                # FUXA 主入口
│   ├── headless-start.js      # headless 启动入口
│   ├── fuxa.js                # 核心初始化
│   ├── runtime/               # 运行时模块
│   │   ├── project/           # 项目管理
│   │   ├── devices/           # 设备驱动（Modbus/OpcUA/MQTT/S7等）
│   │   ├── storage/           # 数据存储（SQLite/InfluxDB/TDengine等）
│   │   ├── alarms/            # 报警系统
│   │   ├── jobs/              # 定时任务/报表
│   │   ├── scheduler/         # 调度器
│   │   ├── scripts/           # 脚本引擎
│   │   ├── users/             # 用户管理
│   │   ├── plugins/           # 插件系统
│   │   ├── events_history/    # 历史事件
│   │   └── notificator/       # 通知系统
│   ├── api/                   # REST API 接口
│   ├── _images/               # SVG 图标资源库
│   ├── _widgets/              # 自定义组件
│   ├── integrations/node-red/ # Node-RED 集成
│   ├── lib/                   # Stardust APM 监控
│   ├── docs/                  # OpenAPI 文档
│   ├── dist/                  # 编译输出
│   ├── project.demo.fuxap     # 示例项目文件
│   └── package.json
└── client/dist/               # 前端构建产物（Web UI）
    ├── index.html
    ├── *.js / *.css
    └── assets/
```

## 部署步骤

### 1. 拷贝整个目录

将 `fuxa-headless` 整个文件夹拷贝到目标电脑的任意位置。

### 2. 启动方式

**方式一：使用自动重启保护器（推荐）**
```bash
cd fuxa-headless\server
..\nodejs\node.exe fuxa-wrapper.js
```

**方式二：直接启动**
```bash
cd fuxa-headless\server
..\nodejs\node.exe main.js
```

**方式三：通过外层入口启动**
```bash
cd fuxa-headless
.\nodejs\node.exe main.js
```

### 3. 访问

浏览器打开：`http://localhost:1881`

## 启动方式说明

| 入口脚本 | 说明 | 适用场景 |
|---------|------|---------|
| `server/fuxa-wrapper.js` | 带自动重启保护 | 生产环境推荐 |
| `server/main.js` | 直接启动服务 | 调试/开发 |
| `main.js` (外层) | Bootstrap 入口 | pkg 打包后使用 |

## 注意事项

1. **端口冲突**：默认端口 1881，如需修改编辑 `server/_appdata/settings.js` 中的 `uiPort`
2. **数据目录**：首次启动会在当前目录生成 `_appdata/` 存储配置和数据库
3. **防火墙**：确保目标端口已放行
4. **依赖安装**：部署前需在本机执行 `npm install --production` 安装 node_modules

## 环境要求

- 操作系统：Windows 10+ / Windows Server 2016+
- 无需预装 Node.js（自带 Node.js 18）
- 无需预装任何运行时环境

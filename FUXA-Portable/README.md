# FUXA 精简版使用说明

## 简介
这是一个精简版的FUXA，包含了运行FUXA所需的最小文件集，并且包含Node.js便携版，解压即用。

## 目录结构
```
FUXA-Portable/
├── download-nodejs.bat  # 下载Node.js便携版脚本
├── start.bat            # 启动脚本
├── stop.bat             # 停止脚本
├── README.md            # 本文件
├── nodejs/              # Node.js便携版（需要先运行download-nodejs.bat）
├── client/              # 前端编译文件
└── server/              # 后端代码和依赖
```

## 使用方法

### 第一次使用（需要下载Node.js）

1. **下载Node.js便携版**
   - 双击 `download-nodejs.bat` 文件
   - 脚本会自动下载Node.js v20.19.0便携版并解压到 `nodejs` 目录

2. **启动FUXA**
   - 双击 `start.bat` 文件
   - 脚本会自动使用内置的Node.js启动FUXA

3. **访问FUXA**
   - 打开浏览器，访问 http://localhost:1881/

### 后续使用

1. **直接启动**
   - 双击 `start.bat` 文件即可启动FUXA
   - 无需再次运行 `download-nodejs.bat`

2. **停止FUXA**
   - 双击 `stop.bat` 文件，或按 Ctrl+C

## 注意事项
- Node.js版本：v20.19.0（LTS）
- 第一次运行会自动安装依赖，可能需要一些时间
- 所有数据（项目、历史数据等）会保存在 `server/_appdata` 目录中
- 如果需要更新Node.js，重新运行 `download-nodejs.bat` 即可

## 文件大小
- 原版：约 500+ MB
- 精简版（不含Node.js）：约 100+ MB
- 精简版（包含Node.js）：约 150+ MB

## 包含的功能
- Modbus RTU/TCP 通信
- Siemens S7 通信
- OPC-UA 通信
- MQTT 通信
- BACnet IP 通信
- 数据存储（SQLite）
- 报表生成
- 调度任务
- 脚本执行
- 用户管理
- 项目管理

## 不包含的功能
- Node-RED 集成（可选）
- 开发工具（如 TypeScript 编译器）
- 测试文件
- 文档

## 自定义
如需修改配置，请编辑 `server/settings.default.js` 文件。

## 故障排除

### Node.js not found
请先运行 `download-nodejs.bat` 下载Node.js便携版。

### Port 1881 already in use
请关闭其他占用1881端口的程序，或修改 `server/settings.default.js` 中的端口配置。

### npm install failed
请检查网络连接，或手动运行 `npm install` 安装依赖。

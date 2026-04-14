# FUXA 精简版使用说明

## 简介
这是一个精简版的FUXA，包含了运行FUXA所需的最小文件集。

## 目录结构
```
FUXA-Portable/
├── start.bat          # 启动脚本
├── stop.bat           # 停止脚本
├── client/            # 前端编译文件
└── server/            # 后端代码和依赖
```

## 使用方法

### 在其他电脑上运行

1. **复制整个FUXA-Portable目录到目标电脑**

2. **运行启动脚本**
   - 双击 `start.bat` 文件
   - 脚本会自动安装依赖并启动FUXA

3. **访问FUXA**
   - 打开浏览器，访问 http://localhost:1881/

### 停止FUXA
- 双击 `stop.bat` 文件，或按 Ctrl+C

## 注意事项
- 需要安装 Node.js 18+ 版本
- 第一次运行会自动安装依赖，可能需要一些时间
- 所有数据（项目、历史数据等）会保存在 `server/_appdata` 目录中

## 文件大小
- 原版：约 500+ MB
- 精简版：约 100+ MB

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

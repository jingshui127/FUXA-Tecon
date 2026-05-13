# FUXA 定制化补丁包 - 客户操作手册

## 📖 手册说明

本手册详细介绍了如何使用 FUXA 定制化补丁包，为您的 FUXA SCADA/HMI 系统添加专属的定制化功能。

---

## 🎯 补丁包功能概述

本补丁包包含以下定制化功能：

### ✅ Stardust APM 性能监控
- 实时监控应用性能
- HTTP 请求追踪
- 错误率统计
- 响应时间分析
- **适用场景**：需要监控系统性能和健康状态

### ✅ 地图源优化
- 替换为国内优化的地图服务器
- 提升地图加载速度
- 改善用户体验
- **适用场景**：使用地图功能的客户

### ✅ S7 通讯插件
- 支持西门子 S7 系列 PLC
- S7-200/300/400/1200/1500
- 完整的数据类型支持
- **适用场景**：使用西门子 PLC 的客户

### ✅ 品牌标识定制
- 替换为您的品牌 Logo
- 自定义应用图标
- 提升品牌识别度
- **适用场景**：需要品牌定制的客户

### ✅ GitHub Actions 自动构建
- 自动化构建流程
- 多平台支持
- 持续集成
- **适用场景**：需要自动化部署的客户

### ✅ FUXA 自动化技能
- REST API 自动化
- 设备配置自动化
- 标签管理自动化
- **适用场景**：需要自动化管理的客户

---

## 🚀 快速开始

### 前置要求

在开始之前，请确保：

1. ✅ 已安装 FUXA SCADA/HMI 系统
2. ✅ 有 FUXA 项目的管理员权限
3. ✅ 已安装 Node.js 18.x（推荐）
4. ✅ 有足够的磁盘空间（至少 500MB）
5. ✅ 熟悉基本的命令行操作

### 系统要求

| 组件 | 最低要求 | 推荐配置 |
|------|----------|----------|
| 操作系统 | Windows 10 / Linux / macOS | Windows 11 / Ubuntu 20.04 / macOS 12+ |
| Node.js | 18.x | 18.x LTS |
| 内存 | 4GB | 8GB+ |
| 磁盘空间 | 500MB | 1GB+ |
| 网络 | 稳定的网络连接 | 高速网络连接 |

---

## 📦 获取补丁包

### 方式一：直接下载（推荐）

**适用人群**：不熟悉 Git 操作的客户

#### 步骤 1：访问下载页面

1. 打开浏览器，访问补丁包下载页面：
   ```
   https://github.com/your-org/fuxa-custom-patches/releases
   ```

2. 在 Releases 页面中，找到对应的客户补丁包
   - 补丁包格式：`tecon-patch-客户名称.tar.gz`
   - 例如：`tecon-patch-ABC公司.tar.gz`

#### 步骤 2：下载补丁包

1. 点击补丁包名称进入详情页
2. 在 "Assets" 部分找到补丁包文件
3. 点击下载按钮开始下载

#### 步骤 3：验证下载

下载完成后，验证文件完整性：
- 检查文件大小是否正常（通常 10-50MB）
- 确认文件扩展名为 `.tar.gz` 或 `.zip`

---

### 方式二：克隆仓库生成

**适用人群**：需要自定义配置的客户

#### 步骤 1：安装 Git

**Windows：**
1. 访问 https://git-scm.com/download/win
2. 下载并安装 Git for Windows
3. 安装完成后，打开 Git Bash

**Linux：**
```bash
sudo apt-get install git
# 或
sudo yum install git
```

**macOS：**
```bash
# 使用 Homebrew
brew install git
```

#### 步骤 2：克隆仓库

```bash
# 克隆仓库
git clone https://github.com/your-org/fuxa-custom-patches.git

# 进入仓库目录
cd fuxa-custom-patches
```

#### 步骤 3：创建客户配置

1. 复制配置模板：
   ```bash
   cp config-template.json customer-my.json
   ```

2. 编辑配置文件：
   ```bash
   # Windows: 使用记事本或其他文本编辑器
   notepad customer-my.json

   # Linux/Mac: 使用 vim 或 nano
   vim customer-my.json
   ```

3. 修改以下内容：
   ```json
   {
     "customer": {
       "name": "我的公司",           // 修改为您的公司名称
       "version": "1.3.1-my",       // 修改为您的版本号
       "supportQQ": "123456789"     // 修改为您的技术支持QQ
     },
     "features": {
       "stardust": {
         "enabled": true,           // true=启用，false=禁用
         "server": "http://your-server:6600",  // 星尘服务器地址
         "appName": "FUXA-My"       // 应用名称
       }
     }
   }
   ```

#### 步骤 4：生成补丁包

**Windows：**
```bash
generate-customer-patch.bat customer-my.json
```

**Linux/Mac：**
```bash
chmod +x generate-customer-patch.sh
./generate-customer-patch.sh customer-my.json
```

#### 步骤 5：查看生成的补丁包

生成的补丁包位于：
```
tecon-patch-我的公司/
```

---

## 🔧 应用补丁包

### 准备工作

1. **备份现有 FUXA 项目**
   ```bash
   # 备份整个项目目录
   cp -r /path/to/fuxa /path/to/fuxa-backup-$(date +%Y%m%d)
   ```

2. **停止 FUXA 服务**
   ```bash
   # 如果 FUXA 正在运行，先停止
   # Windows: Ctrl+C 或关闭命令行窗口
   # Linux/Mac: kill <pid>
   ```

### 应用步骤

#### 步骤 1：解压补丁包

**Windows：**
1. 使用 7-Zip 或 WinRAR 解压 `.tar.gz` 文件
2. 或使用 PowerShell：
   ```powershell
   Expand-Archive -Path tecon-patch-我的公司.zip -DestinationPath .
   ```

**Linux/Mac：**
```bash
# 解压到 FUXA 根目录
tar -xzf tecon-patch-我的公司.tar.gz -C /path/to/fuxa/
```

#### 步骤 2：运行应用脚本

**Windows：**
1. 打开命令提示符或 PowerShell
2. 进入补丁包目录：
   ```powershell
   cd C:\path\to\fuxa\tecon-patch-我的公司
   ```

3. 运行应用脚本：
   ```powershell
   apply-patch.bat
   ```

**Linux/Mac：**
1. 打开终端
2. 进入补丁包目录：
   ```bash
   cd /path/to/fuxa/tecon-patch-我的公司
   ```

3. 运行应用脚本：
   ```bash
   chmod +x apply-patch.sh
   ./apply-patch.sh
   ```

#### 步骤 3：等待应用完成

脚本会自动执行以下操作：
```
开始应用 FUXA 定制化补丁...
1. 应用 Stardust APM 集成...
2. 应用地图源修改...
3. 应用 S7 通讯插件依赖...
4. 应用 GitHub Actions 配置...
5. 应用 FUXA 自动化技能...
6. 应用品牌标识...
补丁应用完成！
```

#### 步骤 4：重新构建项目

**安装服务端依赖：**
```bash
cd /path/to/fuxa/server
npm install
```

**安装前端依赖并构建：**
```bash
cd /path/to/fuxa/client
npm install
npx ng build --configuration=production
```

#### 步骤 5：启动 FUXA

**开发模式：**
```bash
cd /path/to/fuxa/server
npm start
```

**Headless 模式：**
```bash
# 双击运行
./FUXA-single-windows-x64.exe

# 或指定端口
./FUXA-single-windows-x64.exe -p 1882
```

---

## ✅ 验证安装

### 1. 检查 Stardust APM

1. 访问星尘控制台：
   ```
   http://your-stardust-server:6600
   ```

2. 登录后，查看应用列表
3. 找到您的应用名称（如 `FUXA-My`）
4. 点击应用名称查看详情

**预期结果：**
- ✅ 应用已注册
- ✅ 心跳正常（每 60 秒）
- ✅ 追踪数据正常上报

### 2. 检查地图源

1. 打开 FUXA 界面
2. 进入地图视图
3. 观察地图加载速度

**预期结果：**
- ✅ 地图正常显示
- ✅ 加载速度明显提升

### 3. 检查 S7 插件

1. 打开 FUXA 设备配置
2. 查看设备驱动列表
3. 查找 "Siemens S7" 驱动

**预期结果：**
- ✅ S7 驱动已安装
- ✅ 可以正常创建 S7 设备

### 4. 检查品牌标识

1. 打开 FUXA 界面
2. 查看左上角 Logo
3. 查看浏览器标签页图标

**预期结果：**
- ✅ Logo 已替换为您的品牌
- ✅ 浏览器图标已替换

---

## 🔍 常见问题

### 问题 1：下载补丁包失败

**症状：** 无法从 GitHub 下载补丁包

**解决方案：**
1. 检查网络连接是否正常
2. 尝试使用不同的浏览器
3. 如果使用代理，检查代理设置
4. 联系技术支持获取补丁包

### 问题 2：解压补丁包失败

**症状：** 解压 `.tar.gz` 文件时出错

**解决方案：**

**Windows：**
- 安装 7-Zip：https://www.7-zip.org/
- 或使用 PowerShell：
  ```powershell
  Expand-Archive -Path tecon-patch-我的公司.zip -DestinationPath .
  ```

**Linux/Mac：**
```bash
# 确保安装了 tar
tar --version

# 重新解压
tar -xzf tecon-patch-我的公司.tar.gz
```

### 问题 3：npm install 失败

**症状：** 运行 `npm install` 时出现错误

**解决方案：**

1. **检查 Node.js 版本：**
   ```bash
   node --version
   # 应该显示 v18.x.x
   ```

2. **清理缓存：**
   ```bash
   npm cache clean --force
   ```

3. **删除 node_modules 重新安装：**
   ```bash
   rm -rf node_modules
   npm install
   ```

4. **使用国内镜像：**
   ```bash
   npm config set registry https://registry.npmmirror.com
   npm install
   ```

### 问题 4：前端构建失败

**症状：** 运行 `npx ng build` 时出现错误

**解决方案：**

1. **检查 Angular CLI 版本：**
   ```bash
   ng version
   ```

2. **清理构建缓存：**
   ```bash
   cd client
   rm -rf dist
   npm run build -- --configuration=production
   ```

3. **增加内存限制：**
   ```bash
   export NODE_OPTIONS=--max-old-space-size=4096
   npm run build -- --configuration=production
   ```

### 问题 5：FUXA 启动失败

**症状：** 运行 `npm start` 时出现错误

**解决方案：**

1. **检查端口占用：**
   ```bash
   # Windows
   netstat -ano | findstr :1881

   # Linux/Mac
   lsof -i :1881
   ```

2. **更换端口：**
   ```bash
   npm start -p 1882
   ```

3. **检查日志文件：**
   ```bash
   tail -f /path/to/fuxa/logs/fuxa.log
   ```

### 问题 6：Stardust APM 不工作

**症状：** 星尘控制台看不到数据

**解决方案：**

1. **检查配置：**
   ```bash
   # 查看 main.js 中的配置
   grep -A 5 "stardust" server/main.js
   ```

2. **检查网络连接：**
   ```bash
   # 测试星尘服务器连接
   curl http://your-stardust-server:6600
   ```

3. **查看日志：**
   ```bash
   # 查看 Stardust 相关日志
   grep "Stardust" /path/to/fuxa/logs/fuxa.log
   ```

### 问题 7：地图无法加载

**症状：** 地图显示空白或加载失败

**解决方案：**

1. **检查地图源配置：**
   ```bash
   # 查看地图源配置
   grep "tile" client/src/app/maps/maps-view/maps-view.component.ts
   ```

2. **检查网络连接：**
   - 确保可以访问地图服务器
   - 检查防火墙设置

3. **清除浏览器缓存：**
   - 按 Ctrl+Shift+Delete
   - 清除缓存和 Cookie

### 问题 8：品牌标识未替换

**症状：** Logo 和图标仍然是默认的

**解决方案：**

1. **检查品牌文件：**
   ```bash
   # 确认文件存在
   ls -la /path/to/fuxa/client/src/assets/images/logo.svg
   ls -la /path/to/fuxa/client/src/favicon.ico
   ```

2. **检查文件权限：**
   ```bash
   # 确保文件可读
   chmod 644 /path/to/fuxa/client/src/assets/images/logo.svg
   ```

3. **清除浏览器缓存：**
   - 按 Ctrl+Shift+R 强制刷新

---

## 📞 技术支持

### 联系方式

- **技术支持QQ**：2492123056
- **邮箱**：support@example.com
- **GitHub Issues**：https://github.com/your-org/fuxa-custom-patches/issues

### 联系时请提供以下信息

1. **系统信息：**
   - 操作系统版本
   - Node.js 版本
   - FUXA 版本

2. **问题描述：**
   - 遇到的问题
   - 错误信息
   - 复现步骤

3. **日志文件：**
   - FUXA 日志文件
   - 浏览器控制台错误

### 获取日志文件

**FUXA 日志：**
```bash
# Linux/Mac
cat /path/to/fuxa/logs/fuxa.log

# Windows
type C:\path\to\fuxa\logs\fuxa.log
```

**浏览器控制台：**
1. 按 F12 打开开发者工具
2. 切换到 "Console" 标签
3. 复制错误信息

---

## 📚 附录

### A. 配置文件详解

#### Stardust 配置

```json
{
  "stardust": {
    "enabled": true,                    // 是否启用
    "server": "http://47.113.219.65:6600",  // 星尘服务器地址
    "appName": "FUXA-My",               // 应用名称
    "description": "星尘应用性能监控"    // 描述
  }
}
```

#### 地图源配置

```json
{
  "mapSource": {
    "enabled": true,                                          // 是否启用
    "url": "https://tile-c.openstreetmap.fr/hot/{z}/{x}/{y}.png",  // 地图瓦片地址
    "description": "法国 OpenStreetMap 热区服务器"            // 描述
  }
}
```

#### S7 插件配置

```json
{
  "s7Plugin": {
    "enabled": true,                    // 是否启用
    "description": "西门子 S7 PLC 通讯支持"  // 描述
  }
}
```

#### 品牌标识配置

```json
{
  "branding": {
    "enabled": true,                    // 是否启用
    "logo": "logo.svg",                 // Logo 文件名
    "favicon": "favicon.ico",           // 图标文件名
    "description": "品牌标识替换"        // 描述
  }
}
```

### B. 端口说明

| 端口 | 用途 | 说明 |
|------|------|------|
| 1881 | FUXA 默认端口 | Web 界面访问 |
| 6600 | Stardust 服务端口 | 星尘 APM 服务 |
| 502 | Modbus TCP | Modbus 通讯 |
| 102 | S7 PLC | 西门子 S7 通讯 |

### C. 目录结构

```
FUXA/
├── server/                          # 服务端
│   ├── main.js                     # 主程序
│   ├── package.json                # 依赖配置
│   ├── runtime/                    # 运行时
│   │   ├── stardust.js            # Stardust 追踪器
│   │   └── stardust-middleware.js # 中间件
│   └── logs/                       # 日志文件
├── client/                         # 客户端
│   ├── src/                        # 源代码
│   │   └── app/
│   │       └── maps/
│   │           └── maps-view/
│   │               └── maps-view.component.ts
│   ├── dist/                       # 构建产物
│   └── package.json                # 依赖配置
└── tecon-patch-客户名称/            # 补丁包目录
    ├── apply-patch.sh              # 应用脚本
    ├── apply-patch.bat
    └── files/                      # 补丁文件
```

### D. 命令速查

```bash
# 启动 FUXA
cd server && npm start

# 停止 FUXA
# 按 Ctrl+C

# 查看日志
tail -f logs/fuxa.log

# 清理缓存
npm cache clean --force

# 重新构建
cd client && npm run build -- --configuration=production

# 检查端口占用
netstat -ano | findstr :1881  # Windows
lsof -i :1881                  # Linux/Mac
```

---

## 🎓 学习资源

### FUXA 官方文档
- 官网：https://www.fuxa.io/
- 文档：https://www.fuxa.io/docs/
- GitHub：https://github.com/frangoteam/FUXA

### Stardust 文档
- 官网：https://newlifex.com/stardust
- 文档：https://newlifex.com/stardust/docs

### Node.js 文档
- 官网：https://nodejs.org/
- 文档：https://nodejs.org/docs/

---

## 📝 更新日志

### v1.0.0 (2026-04-24)
- 初始版本发布
- 支持基本的客户定制化功能
- 提供补丁生成工具
- 完整的客户操作手册

---

## 🙏 致谢

感谢您选择我们的 FUXA 定制化服务！

如果您在使用过程中遇到任何问题，请随时联系我们的技术支持团队。

---

**科控物联**
**技术支持QQ：2492123056**
**邮箱：support@example.com**

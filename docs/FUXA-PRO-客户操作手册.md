# FUXA PRO 定制化补丁包 - 客户操作手册

## 📖 手册说明

本手册详细介绍了如何使用 FUXA PRO 定制化补丁包，为您的 FUXA SCADA/HMI PRO 系统添加专属的定制化功能。

---

## 🎯 补丁包功能概述

本补丁包包含以下定制化功能：

### ✅ 基础功能（继承自普通版）
- **Stardust APM 性能监控**：实时监控应用性能、HTTP 请求追踪、错误率统计、响应时间分析
- **地图源优化**：替换为国内优化的地图服务器、提升地图加载速度、改善用户体验
- **S7 通讯插件**：支持西门子 S7 系列 PLC、S7-200/300/400/1200/1500、完整的数据类型支持
- **品牌标识定制**：替换为您的品牌 Logo、自定义应用图标、提升品牌识别度
- **GitHub Actions 自动构建**：自动化构建流程、多平台支持、持续集成
- **FUXA 自动化技能**：REST API 自动化、设备配置自动化、标签管理自动化

### ✅ PRO 版专属功能
- **控件库扩展**：提供更多专业工业控件、支持自定义控件、控件参数高级配置
- **高级报警管理**：多级报警策略、报警联动、报警确认流程、报警统计分析
- **数据可视化增强**：高级图表、3D 可视化、实时趋势分析、自定义仪表盘
- **多语言支持**：完整的国际化支持、自定义语言包、语言切换功能
- **安全增强**：用户权限细粒度控制、API 访问控制、审计日志、HTTPS 支持
- **批量操作工具**：批量设备配置、批量标签管理、批量报警设置、批量数据导出
- **离线运行模式**：支持无网络环境运行、数据本地缓存、网络恢复后自动同步
- **高级数据处理**：数据过滤、数据转换、数据聚合、自定义计算

---

## 🚀 快速开始

### 前置要求

在开始之前，请确保：

1. ✅ 已安装 FUXA PRO SCADA/HMI 系统
2. ✅ 有 FUXA PRO 项目的管理员权限
3. ✅ 已安装 Node.js 18.x（推荐）
4. ✅ 有足够的磁盘空间（至少 1GB）
5. ✅ 熟悉基本的命令行操作

### 系统要求

| 组件 | 最低要求 | 推荐配置 |
|------|----------|----------|
| 操作系统 | Windows 10 / Linux / macOS | Windows 11 / Ubuntu 20.04 / macOS 12+ |
| Node.js | 18.x | 18.x LTS |
| 内存 | 8GB | 16GB+ |
| 磁盘空间 | 1GB | 2GB+ |
| 网络 | 稳定的网络连接 | 高速网络连接 |
| CPU | 4 核 | 8 核+ |

---

## 📦 获取补丁包

### 方式一：直接下载（推荐）

**适用人群**：不熟悉 Git 操作的客户

#### 步骤 1：访问下载页面

1. 打开浏览器，访问补丁包下载页面：
   ```
   https://github.com/your-org/fuxa-pro-custom-patches/releases
   ```

2. 在 Releases 页面中，找到对应的客户补丁包
   - 补丁包格式：`tecon-pro-patch-客户名称.tar.gz`
   - 例如：`tecon-pro-patch-ABC公司.tar.gz`

#### 步骤 2：下载补丁包

1. 点击补丁包名称进入详情页
2. 在 "Assets" 部分找到补丁包文件
3. 点击下载按钮开始下载

#### 步骤 3：验证下载

下载完成后，验证文件完整性：
- 检查文件大小是否正常（通常 50-150MB）
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
git clone https://github.com/your-org/fuxa-pro-custom-patches.git

# 进入仓库目录
cd fuxa-pro-custom-patches
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
       "version": "1.3.1-my-pro",   // 修改为您的版本号
       "supportQQ": "123456789"     // 修改为您的技术支持QQ
     },
     "features": {
       "stardust": {
         "enabled": true,           // true=启用，false=禁用
         "server": "http://your-server:6600",  // 星尘服务器地址
         "appName": "FUXA-Pro-My"   // 应用名称
       },
       "proFeatures": {
         "enabled": true,           // true=启用 PRO 功能
         "advancedAlarming": true,  // 高级报警
         "dataVisualization": true, // 数据可视化增强
         "multiLanguage": true,     // 多语言支持
         "securityEnhance": true,   // 安全增强
         "batchOperations": true,   // 批量操作
         "offlineMode": true,       // 离线运行模式
         "advancedDataProcessing": true // 高级数据处理
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
tecon-pro-patch-我的公司/
```

---

## 🔧 应用补丁包

### 准备工作

1. **备份现有 FUXA PRO 项目**
   ```bash
   # 备份整个项目目录
   cp -r /path/to/fuxa-pro /path/to/fuxa-pro-backup-$(date +%Y%m%d)
   ```

2. **停止 FUXA PRO 服务**
   ```bash
   # 如果 FUXA PRO 正在运行，先停止
   # Windows: Ctrl+C 或关闭命令行窗口
   # Linux/Mac: kill <pid>
   ```

### 应用步骤

#### 步骤 1：解压补丁包

**Windows：**
1. 使用 7-Zip 或 WinRAR 解压 `.tar.gz` 文件
2. 或使用 PowerShell：
   ```powershell
   Expand-Archive -Path tecon-pro-patch-我的公司.zip -DestinationPath .
   ```

**Linux/Mac：**
```bash
# 解压到 FUXA PRO 根目录
tar -xzf tecon-pro-patch-我的公司.tar.gz -C /path/to/fuxa-pro/
```

#### 步骤 2：运行应用脚本

**Windows：**
1. 打开命令提示符或 PowerShell
2. 进入补丁包目录：
   ```powershell
   cd C:\path\to\fuxa-pro\tecon-pro-patch-我的公司
   ```

3. 运行应用脚本：
   ```powershell
   apply-patch.bat
   ```

**Linux/Mac：**
1. 打开终端
2. 进入补丁包目录：
   ```bash
   cd /path/to/fuxa-pro/tecon-pro-patch-我的公司
   ```

3. 运行应用脚本：
   ```bash
   chmod +x apply-patch.sh
   ./apply-patch.sh
   ```

#### 步骤 3：等待应用完成

脚本会自动执行以下操作：
```
开始应用 FUXA PRO 定制化补丁...
1. 应用 Stardust APM 集成...
2. 应用地图源修改...
3. 应用 S7 通讯插件依赖...
4. 应用 GitHub Actions 配置...
5. 应用 FUXA 自动化技能...
6. 应用品牌标识...
7. 应用 PRO 版控件库扩展...
8. 应用高级报警管理...
9. 应用数据可视化增强...
10. 应用多语言支持...
11. 应用安全增强...
12. 应用批量操作工具...
13. 应用离线运行模式...
14. 应用高级数据处理...
补丁应用完成！
```

#### 步骤 4：重新构建项目

**安装服务端依赖：**
```bash
cd /path/to/fuxa-pro/server
npm install
```

**安装前端依赖并构建：**
```bash
cd /path/to/fuxa-pro/client
npm install
npx ng build --configuration=production
```

#### 步骤 5：启动 FUXA PRO

**开发模式：**
```bash
cd /path/to/fuxa-pro/server
npm start
```

**Headless 模式：**
```bash
# 双击运行
./FuxaPro-Single.exe

# 或指定端口
./FuxaPro-Single.exe -P 1882
```

---

## ✅ 验证安装

### 1. 检查基础功能

- **Stardust APM**：访问星尘控制台，查看应用状态
- **地图源**：打开地图视图，确认地图正常加载
- **S7 插件**：查看设备驱动列表，确认 S7 驱动已安装
- **品牌标识**：确认 Logo 和图标已替换

### 2. 检查 PRO 版功能

#### 2.1 控件库扩展

1. 打开 FUXA PRO 界面
2. 进入组态编辑模式
3. 查看控件库

**预期结果：**
- ✅ 控件库中包含更多专业工业控件
- ✅ 支持自定义控件上传
- ✅ 控件参数支持高级配置

#### 2.2 高级报警管理

1. 打开报警配置页面
2. 查看报警设置选项

**预期结果：**
- ✅ 支持多级报警策略
- ✅ 支持报警联动设置
- ✅ 支持报警确认流程
- ✅ 支持报警统计分析

#### 2.3 数据可视化增强

1. 打开数据可视化页面
2. 查看图表类型

**预期结果：**
- ✅ 支持高级图表类型
- ✅ 支持 3D 可视化
- ✅ 支持实时趋势分析
- ✅ 支持自定义仪表盘

#### 2.4 多语言支持

1. 打开系统设置
2. 查看语言选项

**预期结果：**
- ✅ 支持多种语言切换
- ✅ 支持自定义语言包
- ✅ 界面元素正确翻译

#### 2.5 安全增强

1. 打开用户管理页面
2. 查看权限设置

**预期结果：**
- ✅ 支持细粒度权限控制
- ✅ 支持 API 访问控制
- ✅ 支持审计日志
- ✅ 支持 HTTPS 配置

#### 2.6 批量操作工具

1. 打开设备管理页面
2. 查看批量操作选项

**预期结果：**
- ✅ 支持批量设备配置
- ✅ 支持批量标签管理
- ✅ 支持批量报警设置
- ✅ 支持批量数据导出

#### 2.7 离线运行模式

1. 断开网络连接
2. 验证系统运行状态

**预期结果：**
- ✅ 系统正常运行
- ✅ 数据本地缓存
- ✅ 网络恢复后自动同步

#### 2.8 高级数据处理

1. 打开标签配置页面
2. 查看数据处理选项

**预期结果：**
- ✅ 支持数据过滤
- ✅ 支持数据转换
- ✅ 支持数据聚合
- ✅ 支持自定义计算

---

## 🔍 常见问题

### 基础功能问题（参考普通版手册）
- **问题 1：下载补丁包失败**
- **问题 2：解压补丁包失败**
- **问题 3：npm install 失败**
- **问题 4：前端构建失败**
- **问题 5：FUXA 启动失败**
- **问题 6：Stardust APM 不工作**
- **问题 7：地图无法加载**
- **问题 8：品牌标识未替换**

### PRO 版特有问题

#### 问题 9：控件上传失败

**症状：** 上传自定义控件时出现错误

**解决方案：**
1. **检查文件格式：** 确保控件文件格式正确（.zip 格式）
2. **检查文件大小：** 控件文件大小不超过 50MB
3. **检查权限：** 确保有上传控件的权限
4. **查看日志：** 检查 FUXA 日志文件中的错误信息

#### 问题 10：高级报警不触发

**症状：** 配置的高级报警规则不触发

**解决方案：**
1. **检查报警配置：** 确认报警规则设置正确
2. **检查标签值：** 确认标签值达到报警条件
3. **检查报警服务：** 确认报警服务正常运行
4. **查看报警日志：** 检查报警日志中的相关信息

#### 问题 11：离线模式数据不同步

**症状：** 网络恢复后数据不自动同步

**解决方案：**
1. **检查网络连接：** 确认网络连接正常
2. **检查同步设置：** 确认同步设置正确
3. **手动触发同步：** 在系统设置中手动触发同步
4. **查看同步日志：** 检查同步日志中的错误信息

#### 问题 12：批量操作超时

**症状：** 执行批量操作时超时

**解决方案：**
1. **减少批量操作数量：** 分批执行批量操作
2. **增加超时时间：** 在系统设置中增加操作超时时间
3. **检查系统资源：** 确保系统资源充足
4. **优化网络连接：** 确保网络连接稳定

---

## 📞 技术支持

### 联系方式

- **技术支持QQ**：2492123056
- **邮箱**：support@example.com
- **GitHub Issues**：https://github.com/your-org/fuxa-pro-custom-patches/issues

### 联系时请提供以下信息

1. **系统信息：**
   - 操作系统版本
   - Node.js 版本
   - FUXA PRO 版本

2. **问题描述：**
   - 遇到的问题
   - 错误信息
   - 复现步骤

3. **日志文件：**
   - FUXA PRO 日志文件
   - 浏览器控制台错误

### 获取日志文件

**FUXA PRO 日志：**
```bash
# Linux/Mac
cat /path/to/fuxa-pro/logs/fuxa.log

# Windows
type C:\path\to\fuxa-pro\logs\fuxa.log
```

**浏览器控制台：**
1. 按 F12 打开开发者工具
2. 切换到 "Console" 标签
3. 复制错误信息

---

## 📚 附录

### A. 配置文件详解

#### PRO 版特有配置

```json
{
  "proFeatures": {
    "enabled": true,                    // 是否启用 PRO 功能
    "advancedAlarming": true,           // 高级报警管理
    "dataVisualization": true,          // 数据可视化增强
    "multiLanguage": true,              // 多语言支持
    "securityEnhance": true,            // 安全增强
    "batchOperations": true,            // 批量操作工具
    "offlineMode": true,                // 离线运行模式
    "advancedDataProcessing": true,     // 高级数据处理
    "controlsLibrary": true,            // 控件库扩展
    "customWidgets": true               // 自定义控件
  }
}
```

### B. 端口说明

| 端口 | 用途 | 说明 |
|------|------|------|
| 1881 | FUXA PRO 默认端口 | Web 界面访问 |
| 6600 | Stardust 服务端口 | 星尘 APM 服务 |
| 502 | Modbus TCP | Modbus 通讯 |
| 102 | S7 PLC | 西门子 S7 通讯 |
| 8883 | MQTT 安全 | MQTT 加密通讯 |
| 443 | HTTPS | 安全 Web 访问 |

### C. 目录结构

```
FUXA-PRO/
├── server/                          # 服务端
│   ├── main.js                     # 主程序
│   ├── package.json                # 依赖配置
│   ├── runtime/                    # 运行时
│   │   ├── stardust.js            # Stardust 追踪器
│   │   ├── stardust-middleware.js # 中间件
│   │   └── pro-features/          # PRO 版功能
│   └── logs/                       # 日志文件
├── client/                         # 客户端
│   ├── src/                        # 源代码
│   │   ├── app/
│   │   │   ├── maps/
│   │   │   │   └── maps-view/
│   │   │   └── pro/               # PRO 版前端
│   │   └── assets/
│   │       ├── images/
│   │       └── controls/           # 控件库
│   ├── dist/                       # 构建产物
│   └── package.json                # 依赖配置
└── tecon-pro-patch-客户名称/        # 补丁包目录
    ├── apply-patch.sh              # 应用脚本
    ├── apply-patch.bat
    └── files/                      # 补丁文件
        ├── pro-features/           # PRO 版功能文件
        └── controls/               # 控件库文件
```

### D. 命令速查

```bash
# 启动 FUXA PRO
cd server && npm start

# 停止 FUXA PRO
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

# 启动 PRO 版功能检查
cd server && node check-pro-features.js
```

---

## 🎓 学习资源

### FUXA PRO 官方文档
- 官网：https://www.fuxa.io/pro
- 文档：https://www.fuxa.io/pro/docs
- GitHub：https://github.com/frangoteam/FUXA

### Stardust 文档
- 官网：https://newlifex.com/stardust
- 文档：https://newlifex.com/stardust/docs

### Node.js 文档
- 官网：https://nodejs.org/
- 文档：https://nodejs.org/docs/

---

## 📝 更新日志

### v1.3.1 (2026-04-24)
- FUXA PRO 1.3.1 版本发布
- 支持完整的 PRO 版功能
- 提供补丁生成工具
- 完整的客户操作手册

---

## 🙏 致谢

感谢您选择我们的 FUXA PRO 定制化服务！

如果您在使用过程中遇到任何问题，请随时联系我们的技术支持团队。

---

**科控物联**
**技术支持QQ：2492123056**
**邮箱：support@example.com**
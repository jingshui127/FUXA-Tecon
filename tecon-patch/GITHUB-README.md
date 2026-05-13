# FUXA 客户定制化补丁仓库

## 📋 仓库说明

本仓库为 FUXA SCADA/HMI 项目提供客户定制化补丁包，支持为不同客户快速获取专属的定制化功能。

## 🚀 快速开始

### 方式一：直接下载补丁包

1. 访问 [Releases](https://github.com/your-org/fuxa-custom-patches/releases) 页面
2. 找到对应的客户补丁包
3. 下载并解压到 FUXA 根目录
4. 运行应用脚本

### 方式二：克隆仓库并生成

1. 克隆仓库：
   ```bash
   git clone https://github.com/your-org/fuxa-custom-patches.git
   cd fuxa-custom-patches
   ```

2. 复制配置模板：
   ```bash
   cp config-template.json customer-your-name.json
   ```

3. 编辑配置文件，修改客户信息

4. 生成补丁包：
   ```bash
   # Windows
   generate-customer-patch.bat customer-your-name.json

   # Linux/Mac
   chmod +x generate-customer-patch.sh
   ./generate-customer-patch.sh customer-your-name.json
   ```

5. 应用补丁包：
   ```bash
   # 将生成的补丁包复制到 FUXA 根目录
   cp -r tecon-patch-客户名称 /path/to/fuxa/

   # 运行应用脚本
   cd /path/to/fuxa/tecon-patch-客户名称
   ./apply-patch.sh
   ```

## 📦 可用的补丁包

### 官方补丁包

| 补丁包 | 版本 | 描述 | 下载 |
|--------|------|------|------|
| tecon-patch | 1.3.1-tecon | 科控物联定制版 | [下载](https://github.com/your-org/fuxa-custom-patches/releases/tag/v1.3.1-tecon) |

### 客户专属补丁包

如需客户专属补丁包，请按照"快速开始"中的方式二生成。

## 🎯 支持的定制化功能

### ✅ Stardust APM 集成
- 应用性能监控
- HTTP 请求追踪
- 错误率统计
- 响应时间分析

### ✅ 地图源优化
- 自定义地图服务器
- 提升国内访问速度
- 支持多种地图源

### ✅ S7 通讯插件
- 西门子 PLC 支持
- S7-200/300/400/1200/1500
- 完整的数据类型支持

### ✅ 品牌标识定制
- 自定义 Logo
- 自定义图标
- 品牌一致性

### ✅ GitHub Actions 配置
- 自动构建流程
- 多平台支持
- 持续集成

### ✅ FUXA 自动化技能
- REST API 自动化
- 设备配置自动化
- 标签管理自动化

## 📖 详细文档

- [客户使用指南](CUSTOMER-GUIDE.md) - 详细的客户定制化使用文档
- [系统概述](SYSTEM-OVERVIEW.md) - 整个系统的架构说明
- [配置模板](config-template.json) - 客户配置文件的标准格式
- [示例配置](customer-demo.json) - 演示如何为客户创建配置

## 🔧 配置选项

### 客户信息
- `customer.name` - 客户名称
- `customer.version` - 客户版本号
- `customer.supportQQ` - 技术支持联系方式

### 功能配置
每个功能都可以独立启用或禁用：
- `stardust` - 星尘应用性能监控
- `mapSource` - 地图源优化
- `s7Plugin` - S7 通讯插件
- `branding` - 品牌标识定制
- `githubActions` - GitHub Actions 配置
- `automationSkill` - FUXA 自动化技能

## 📋 仓库结构

```
fuxa-custom-patches/
├── README.md                          # 本文件
├── CUSTOMER-GUIDE.md                  # 客户使用指南
├── SYSTEM-OVERVIEW.md                 # 系统概述
├── config-template.json               # 配置模板
├── customer-demo.json                 # 示例配置
├── generate-customer-patch.sh         # Linux/Mac 补丁生成器
├── generate-customer-patch.bat        # Windows 补丁生成器
├── tecon-patch/                       # 科控物联补丁包（示例）
│   ├── README.md
│   ├── apply-patch.sh
│   ├── apply-patch.bat
│   ├── logo.svg
│   ├── favicon.ico
│   └── files/
│       ├── server/
│       ├── client/
│       ├── .github/
│       └── .trae/
└── patches/                           # 客户补丁包存放目录
    ├── customer-abc/
    ├── customer-xyz/
    └── ...
```

## 🔄 更新日志

### v1.0.0 (2026-04-24)
- 初始版本发布
- 支持基本的客户定制化功能
- 提供补丁生成工具

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 📞 技术支持

- 技术支持QQ：2492123056
- 邮箱：support@example.com
- GitHub Issues：https://github.com/your-org/fuxa-custom-patches/issues

## 🌟 Star History

如果这个项目对你有帮助，请给我们一个 Star！

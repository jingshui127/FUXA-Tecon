# FUXA 客户定制化补丁仓库 - GitHub 设置指南

## 📋 仓库创建步骤

### 1. 创建 GitHub 仓库

1. 访问 https://github.com/new
2. 填写仓库信息：
   - **仓库名称**：`fuxa-custom-patches`
   - **描述**：FUXA SCADA/HMI 客户定制化补丁包
   - **可见性**：根据需要选择 Public 或 Private
   - **初始化**：不添加 README、.gitignore 或 LICENSE（我们已经有这些文件）

### 2. 初始化本地仓库

```bash
cd tecon-patch
git init
```

### 3. 添加文件到仓库

```bash
# 添加所有文件
git add .

# 提交
git commit -m "Initial commit: FUXA 客户定制化补丁系统"
```

### 4. 关联远程仓库

```bash
# 替换为你的 GitHub 用户名
git remote add origin https://github.com/your-username/fuxa-custom-patches.git
```

### 5. 推送到 GitHub

```bash
# 推送主分支
git branch -M main
git push -u origin main
```

## 🚀 客户使用流程

### 方式一：直接下载 Release

1. **管理员操作**：
   - 在 GitHub 仓库中手动触发 "Build and Release Customer Patches" workflow
   - 填写客户名称和配置文件名
   - 等待构建完成
   - 在 Releases 页面下载生成的补丁包

2. **客户操作**：
   ```bash
   # 下载补丁包
   wget https://github.com/your-username/fuxa-custom-patches/releases/download/v1.3.1-customer-name/tecon-patch-customer-name.tar.gz
   
   # 解压到 FUXA 根目录
   tar -xzf tecon-patch-customer-name.tar.gz -C /path/to/fuxa/
   
   # 应用补丁
   cd /path/to/fuxa/tecon-patch-customer-name
   ./apply-patch.sh
   ```

### 方式二：克隆仓库并生成

1. **客户操作**：
   ```bash
   # 克隆仓库
   git clone https://github.com/your-username/fuxa-custom-patches.git
   cd fuxa-custom-patches
   
   # 复制配置模板
   cp config-template.json customer-my-company.json
   
   # 编辑配置文件
   # 修改 customer.name, customer.version 等信息
   
   # 生成补丁包
   chmod +x generate-customer-patch.sh
   ./generate-customer-patch.sh customer-my-company.json
   
   # 应用补丁包
   cp -r tecon-patch-我的公司 /path/to/fuxa/
   cd /path/to/fuxa/tecon-patch-我的公司
   ./apply-patch.sh
   ```

## 🔧 GitHub Actions 配置

### 自动构建功能

仓库包含一个 GitHub Actions workflow，可以自动构建和发布客户补丁包：

**触发方式**：
1. **手动触发**：在 GitHub Actions 页面手动运行 workflow
2. **自动触发**：推送 `customer-*.json` 文件或修改 `tecon-patch/` 目录时自动运行

**功能**：
- 根据配置文件生成客户专属补丁包
- 创建补丁包压缩文件
- 上传到 GitHub Releases
- 自动创建 Release 页面

### 使用手动触发

1. 访问仓库的 Actions 页面
2. 选择 "Build and Release Customer Patches" workflow
3. 点击 "Run workflow"
4. 填写参数：
   - `customer_name`: 客户名称
   - `config_file`: 配置文件名（如 `customer-abc.json`）
5. 点击 "Run workflow" 开始构建

## 📦 仓库结构说明

```
fuxa-custom-patches/
├── .github/
│   └── workflows/
│       └── build-patches.yml      # GitHub Actions 配置
├── README.md                       # 仓库说明文档
├── LICENSE                         # MIT 许可证
├── .gitignore                      # Git 忽略文件
├── CUSTOMER-GUIDE.md               # 客户使用指南
├── SYSTEM-OVERVIEW.md              # 系统概述
├── config-template.json            # 配置模板
├── customer-demo.json              # 示例配置
├── generate-customer-patch.sh      # Linux/Mac 补丁生成器
├── generate-customer-patch.bat     # Windows 补丁生成器
└── tecon-patch/                    # 科控物联补丁包（示例）
    ├── README.md
    ├── apply-patch.sh
    ├── apply-patch.bat
    ├── logo.svg
    ├── favicon.ico
    └── files/
        ├── server/
        ├── client/
        ├── .github/
        └── .trae/
```

## 🎯 客户配置文件管理

### 添加新客户配置

1. **创建配置文件**：
   ```bash
   cp config-template.json customer-abc.json
   ```

2. **编辑配置**：
   ```json
   {
     "customer": {
       "name": "ABC公司",
       "version": "1.3.1-abc",
       "supportQQ": "123456789"
     },
     "features": {
       "stardust": {
         "enabled": true,
         "server": "http://your-server:6600",
         "appName": "FUXA-ABC"
       }
     }
   }
   ```

3. **提交到仓库**：
   ```bash
   git add customer-abc.json
   git commit -m "Add customer ABC configuration"
   git push origin main
   ```

4. **触发构建**：
   - GitHub Actions 会自动检测到新的配置文件
   - 或者手动触发 workflow 构建补丁包

## 📊 版本管理

### Release 版本号格式

```
v1.3.1-<客户名称>
```

示例：
- `v1.3.1-tecon` - 科控物联版本
- `v1.3.1-abc` - ABC公司版本
- `v1.3.1-xyz` - XYZ公司版本

### 版本更新策略

1. **小功能更新**：修改 `customer.version` 字段
2. **重大更新**：修改主版本号（如 1.3.1 → 1.4.0）
3. **客户特定更新**：修改客户标识后缀

## 🔐 权限管理

### 公开仓库
- 任何人都可以克隆和下载
- 适合公开项目或开源项目

### 私有仓库
- 需要授权才能访问
- 适合商业项目或客户专属项目

### 访问控制

1. **设置仓库为私有**：
   - 仓库设置 → Danger Zone → Change visibility
   - 选择 "Make private"

2. **邀请协作者**：
   - 仓库设置 → Manage access
   - 邀请团队成员或客户

3. **创建团队**：
   - 组织设置 → Teams
   - 创建团队并分配权限

## 📈 监控和维护

### 查看构建状态

1. 访问仓库的 Actions 页面
2. 查看所有 workflow 运行历史
3. 检查构建日志和结果

### 处理构建失败

1. 查看构建日志
2. 检查配置文件格式
3. 验证基础补丁包完整性
4. 修复问题后重新触发构建

### 定期维护

1. **更新基础补丁包**：
   - 修改 `tecon-patch/` 目录中的文件
   - 提交更改到仓库
   - 为所有客户重新生成补丁包

2. **清理旧版本**：
   - 定期清理过期的 Releases
   - 删除不再需要的配置文件

3. **更新文档**：
   - 根据实际使用情况更新 README
   - 添加常见问题和解决方案

## 🎉 总结

通过将补丁系统推送到 GitHub，你可以：

1. **集中管理**：所有客户配置和补丁包集中在一个仓库中
2. **自动化构建**：使用 GitHub Actions 自动生成和发布补丁包
3. **版本控制**：完整的版本历史和回滚能力
4. **客户友好**：客户可以直接下载或克隆仓库获取补丁
5. **易于维护**：统一的更新流程和文档管理

现在你的客户可以通过以下方式获取补丁包：
- 直接下载 GitHub Releases
- 克隆仓库并自行生成
- 通过授权访问私有仓库

这样大大简化了补丁分发和管理流程！

# FUXA 客户定制化补丁包使用指南

## 概述

本指南介绍如何为不同客户创建专属的 FUXA 定制化补丁包。

## 快速开始

### 1. 创建客户配置文件

复制配置模板并根据客户需求修改：

```bash
cp tecon-patch/config-template.json customer-abc.json
```

### 2. 编辑客户配置

打开 `customer-abc.json`，修改以下内容：

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
      "server": "http://your-stardust-server:6600",
      "appName": "FUXA-ABC"
    },
    "mapSource": {
      "enabled": true,
      "url": "https://your-map-server/{z}/{x}/{y}.png"
    },
    "s7Plugin": {
      "enabled": true
    },
    "branding": {
      "enabled": true
    },
    "githubActions": {
      "enabled": true,
      "branch": "abc-custom"
    },
    "automationSkill": {
      "enabled": true
    }
  }
}
```

### 3. 生成客户补丁包

**Windows 系统：**
```bash
cd tecon-patch
generate-customer-patch.bat customer-abc.json
```

**Linux/Mac 系统：**
```bash
cd tecon-patch
chmod +x generate-customer-patch.sh
./generate-customer-patch.sh customer-abc.json
```

### 4. 添加客户品牌标识

将客户的品牌文件复制到生成的补丁包目录：

```bash
# 复制客户 Logo
copy abc-logo.svg tecon-patch-ABC公司\logo.svg

# 复制客户图标
copy abc-favicon.ico tecon-patch-ABC公司\favicon.ico
```

### 5. 打包和分发

将整个补丁包目录打包：

```bash
# Windows
powershell Compress-Archive -Path tecon-patch-ABC公司 -DestinationPath tecon-patch-ABC公司.zip

# Linux/Mac
tar -czf tecon-patch-ABC公司.tar.gz tecon-patch-ABC公司
```

## 配置选项详解

### 客户信息

| 字段 | 说明 | 示例 |
|------|------|------|
| `customer.name` | 客户名称 | "ABC公司" |
| `customer.version` | 客户版本号 | "1.3.1-abc" |
| `customer.supportQQ` | 技术支持QQ | "123456789" |

### 功能配置

#### Stardust APM
- `enabled`: 是否启用星尘监控
- `server`: 星尘服务器地址
- `appName`: 应用名称（在星尘控制台显示）

#### 地图源
- `enabled`: 是否启用地图源优化
- `url`: 地图瓦片服务器地址

#### S7 插件
- `enabled`: 是否启用西门子 S7 支持

#### 品牌标识
- `enabled`: 是否启用品牌替换
- `logo`: Logo 文件名
- `favicon`: 图标文件名

#### GitHub Actions
- `enabled`: 是否启用自动构建
- `branch`: 触发构建的分支名

#### 自动化技能
- `enabled`: 是否启用 FUXA 自动化技能

## 常见场景

### 场景1：仅启用 Stardust 监控

```json
{
  "customer": {
    "name": "XYZ公司",
    "version": "1.3.1-xyz"
  },
  "features": {
    "stardust": {
      "enabled": true,
      "server": "http://192.168.1.100:6600",
      "appName": "FUXA-XYZ"
    },
    "mapSource": {
      "enabled": false
    },
    "s7Plugin": {
      "enabled": false
    },
    "branding": {
      "enabled": false
    },
    "githubActions": {
      "enabled": false
    },
    "automationSkill": {
      "enabled": false
    }
  }
}
```

### 场景2：启用所有功能

```json
{
  "customer": {
    "name": "全功能客户",
    "version": "1.3.1-full"
  },
  "features": {
    "stardust": {
      "enabled": true,
      "server": "http://47.113.219.65:6600",
      "appName": "FUXA-Full"
    },
    "mapSource": {
      "enabled": true,
      "url": "https://tile-c.openstreetmap.fr/hot/{z}/{x}/{y}.png"
    },
    "s7Plugin": {
      "enabled": true
    },
    "branding": {
      "enabled": true
    },
    "githubActions": {
      "enabled": true,
      "branch": "full-custom"
    },
    "automationSkill": {
      "enabled": true
    }
  }
}
```

## 客户补丁包目录结构

```
tecon-patch-客户名称/
├── README.md                    # 客户专属说明文档
├── apply-patch.bat              # Windows 应用脚本
├── apply-patch.sh               # Linux/Mac 应用脚本
├── logo.svg                     # 客户 Logo（需手动添加）
├── favicon.ico                  # 客户图标（需手动添加）
└── files/
    ├── server/
    │   ├── runtime/
    │   │   ├── stardust.js
    │   │   └── stardust-middleware.js
    │   ├── main.js
    │   └── package.json
    ├── client/
    │   └── src/
    │       └── app/
    │           └── maps/
    │               └── maps-view/
    │                   └── maps-view.component.ts
    ├── .github/
    │   └── workflows/
    │       └── fuxa-single.yml
    └── .trae/
        └── skills/
            └── fuxa-automation/
                └── SKILL.md
```

## 客户使用补丁包

### 1. 解压补丁包

将补丁包解压到 FUXA 根目录

### 2. 运行应用脚本

**Windows：**
```bash
tecon-patch-客户名称\apply-patch.bat
```

**Linux/Mac：**
```bash
cd tecon-patch-客户名称
chmod +x apply-patch.sh
./apply-patch.sh
```

### 3. 重新构建

```bash
cd ./server
npm install

cd ../client
npm install
npx ng build --configuration=production
```

### 4. 启动验证

```bash
cd ./server
npm start
```

访问 FUXA 界面，验证定制化功能是否正常工作。

## 维护和更新

### 更新基础补丁包

当需要更新所有客户的补丁包时：

1. 更新 `tecon-patch` 目录中的基础文件
2. 为每个客户重新生成补丁包：
   ```bash
   ./generate-customer-patch.sh customer-abc.json
   ./generate-customer-patch.sh customer-xyz.json
   ```

### 批量生成补丁包

创建批量生成脚本：

```bash
#!/bin/bash
# batch-generate.sh

for config in customer-*.json; do
    echo "处理配置: $config"
    ./generate-customer-patch.sh "$config"
done
```

## 注意事项

1. **配置文件命名**：建议使用 `customer-<客户名>.json` 格式
2. **品牌标识**：确保 Logo 和图标文件名与配置一致
3. **版本管理**：每次更新时修改 `customer.version` 字段
4. **备份**：在生成新补丁包前备份旧版本
5. **测试**：生成补丁包后先在测试环境验证

## 故障排除

### 问题1：配置文件解析失败

**解决方案**：检查 JSON 格式是否正确，确保使用 UTF-8 编码

### 问题2：补丁包生成失败

**解决方案**：确保基础补丁包 `tecon-patch` 目录存在且完整

### 问题3：品牌标识未替换

**解决方案**：检查品牌文件是否已复制到补丁包目录，文件名是否与配置一致

## 技术支持

如有问题，请联系技术支持：
- QQ：2492123056
- 邮箱：support@example.com

# FUXA Headless 打包常见问题及解决方案

## 目录

1. [Node.js 版本不匹配问题](#1-nodejs-版本不匹配问题)
2. [原生模块打包问题](#2-原生模块打包问题)
3. [fontkit 编码问题](#3-fontkit-编码问题)
4. [S7 插件缺失问题](#4-s7-插件缺失问题)
5. [正确的打包流程](#5-正确的打包流程)

---

## 1. Node.js 版本不匹配问题

### 问题现象
- workflow 配置文件中指定 `node18-win-x64` 作为目标平台
- 但实际打包时使用 Node.js 20
- 导致运行时提示 `"try to create S7-1500 but plugin is missing!"`

### 根本原因
- `headless_packaging.yml` 中 `actions/setup-node@v4` 使用了 `node-version: '20'`
- 而 `pkg` 打包命令使用 `--targets node18-win-x64`
- 原生模块（如 `node-snap7`）是为 Node.js 18 编译的（NODE_MODULE_VERSION 108）
- 运行时使用 Node.js 20（NODE_MODULE_VERSION 115）无法加载为 Node.js 18 编译的模块

### 解决方案
确保 Node.js 安装版本与目标平台版本一致：

```yaml
# headless_packaging.yml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '18'  # 必须与目标平台版本一致
```

---

## 2. 原生模块打包问题

### 问题现象
- 打包后的 EXE 文件运行时无法加载 `node-snap7` 模块
- 错误信息：`Cannot find module 'node-snap7'`

### 根本原因
- `pkg` 默认不会打包原生模块（native modules）
- 需要通过 `--public-packages` 参数显式指定需要打包的原生模块

### 解决方案
在 `pkg` 打包命令中添加 `--public-packages` 参数：

```bash
pkg fuxa-single/package.json \
  --targets node18-win-x64 \
  --out-path artifacts \
  --public-packages "node-snap7,bindings,nan"
```

**说明**：
- `node-snap7`: S7 协议通信核心模块
- `bindings`: node-snap7 的依赖
- `nan`: Node.js 原生模块开发工具

---

## 3. fontkit 编码问题

### 问题现象
- 打包后的 EXE 文件启动时崩溃
- 错误信息：`RangeError [ERR_ENCODING_NOT_SUPPORTED]: The "windows-1252" encoding is not supported`

### 根本原因
- `fontkit` 模块在加载时会尝试使用 `windows-1252` 编码创建 `TextDecoder`
- 在 `pkg` 打包后的环境中，Node.js 18 不支持此编码

### 解决方案
**方案一：移除 fontkit 依赖（推荐）**

fontkit 仅用于读取 TTF 字体文件的名称，属于非核心功能：

1. 从 `server/package.json` 中移除 fontkit：
```json
{
  "dependencies": {
    // 移除 "fontkit": "^2.0.4",
  }
}
```

2. 从 `server/api/resources/index.js` 中移除 fontkit 引用：
```javascript
// 移除以下代码：
const fontkit = require('fontkit');

// 以及相关使用代码：
if (resourcesFilter.fonts.some(suffix => fileName.endsWith(suffix))) {
    const font = fontkit.openSync(filePath);
    fileLabel = font.fullName;
}
```

**方案二：降级 fontkit 版本**

如果需要保留字体名称读取功能，可以尝试降级 fontkit 版本。

---

## 4. S7 插件缺失问题

### 问题现象
- 启动后日志显示：`"try to create S7-1500 but plugin is missing!"`
- S7-1200/S7-1500 设备无法创建

### 根本原因
这通常是由以下两个问题共同导致：
1. Node.js 版本不匹配（见问题1）
2. 原生模块未被正确打包（见问题2）

### 解决方案
同时解决上述两个问题：
1. 使用 Node.js 18 进行打包
2. 添加 `--public-packages "node-snap7,bindings,nan"` 参数

---

## 5. 正确的打包流程

### 本地测试打包

```powershell
# 1. 确保使用 Node.js 18
node --version  # 应显示 v18.x.x

# 2. 创建打包目录结构
mkdir -p fuxa-single/server
mkdir -p fuxa-single/client/dist

# 3. 复制文件
cp -r server/. fuxa-single/server/
cp -r client/dist/. fuxa-single/client/dist/
cp app/headless/headless-entry.js fuxa-single/main.js

# 4. 创建 package.json
cat > fuxa-single/package.json <<EOF
{
  "name": "fuxa-single",
  "version": "1.3.2-tecon",
  "bin": "main.js",
  "pkg": {
    "assets": [
      "server/**/*",
      "client/dist/**/*",
      "_reports/**/*"
    ],
    "compression": "Brotli"
  }
}
EOF

# 5. 安装 pkg（如果未安装）
npm install -g @yao-pkg/pkg

# 6. 执行打包
pkg fuxa-single/package.json \
  --targets node18-win-x64 \
  --out-path artifacts \
  --public-packages "node-snap7,bindings,nan"
```

### GitHub Actions 配置示例

```yaml
name: Build FUXA Headless

on:
  workflow_dispatch:
  push:
    branches: [main]

jobs:
  build:
    runs-on: windows-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js 18
        uses: actions/setup-node@v4
        with:
          node-version: '18'  # 关键：必须与目标平台版本一致

      - name: Install server dependencies
        run: npm install --prefer-offline --no-audit
        working-directory: ./server

      - name: Build client
        run: npm run build -- --configuration=production
        working-directory: ./client

      - name: Setup Headless Package Directory
        run: |
          mkdir -p fuxa-single/server
          mkdir -p fuxa-single/client/dist
          cp -r server/. fuxa-single/server/
          cp -r client/dist/. fuxa-single/client/dist/
          cp app/headless/headless-entry.js fuxa-single/main.js
        shell: bash

      - name: Create Package Config
        run: |
          cat > fuxa-single/package.json <<EOF
          {
            "name": "fuxa-single",
            "version": "1.3.2",
            "bin": "main.js",
            "pkg": {
              "assets": [
                "server/**/*",
                "client/dist/**/*",
                "_reports/**/*"
              ],
              "compression": "Brotli"
            }
          }
          EOF
        shell: bash

      - name: Install pkg
        run: npm install -g @yao-pkg/pkg

      - name: Build Standalone Binaries
        run: |
          TARGET="node18-win-x64"
          pkg fuxa-single/package.json \
            --targets $TARGET \
            --out-path artifacts \
            --public-packages "node-snap7,bindings,nan"  # 关键：打包原生模块
        shell: bash

      - name: Upload artifact
        uses: actions/upload-artifact@v4
        with:
          name: FUXA-headless
          path: artifacts/*
```

---

## 验证方法

打包完成后，运行 EXE 文件并检查日志：

```powershell
.\artifacts\fuxa-single.exe
```

**成功标志**：
- ✅ 日志显示 `'S7-1500' created` 和 `'S7-1200' created`
- ✅ 没有出现 `"try to create S7-1500 but plugin is missing!"`
- ✅ 没有出现 `ERR_ENCODING_NOT_SUPPORTED` 错误
- ✅ 服务器正常启动，可访问 `http://localhost:1881`

---

## 版本兼容性矩阵

| Node.js 版本 | 目标平台 | 兼容性 | 说明 |
|--------------|----------|--------|------|
| 18.x | node18-win-x64 | ✅ | 推荐使用，`node-snap7` 已预编译支持 |
| 20.x | node18-win-x64 | ❌ | 原生模块 NODE_MODULE_VERSION 不匹配 |
| 18.x | node20-win-x64 | ❌ | 原生模块 NODE_MODULE_VERSION 不匹配 |
| 20.x | node20-win-x64 | ✅ | 需要确保 `node-snap7` 针对 Node.js 20 编译 |

### 注意事项

- **`headless_tecon.yml`**：使用 Node.js 18 + `node18-win-x64`，适用于已安装 Node.js 18 的环境
- **`headless_packaging.yml`**：使用 Node.js 20 + `node20-win-x64`，适用于已安装 Node.js 20 的环境
- 关键原则：**Node.js 安装版本必须与 `--targets` 参数指定的版本一致**

---

## 常见错误速查

| 错误信息 | 原因 | 解决方案 |
|----------|------|----------|
| `try to create S7-1500 but plugin is missing!` | Node.js 版本不匹配或原生模块未打包 | 检查 Node.js 版本，添加 `--public-packages` |
| `ERR_ENCODING_NOT_SUPPORTED: The "windows-1252" encoding is not supported` | fontkit 编码问题 | 移除 fontkit 依赖 |
| `Cannot find module 'node-snap7'` | 原生模块未被打包 | 添加 `--public-packages "node-snap7,bindings,nan"` |
| `NODE_MODULE_VERSION mismatch` | Node.js 运行时与编译时版本不一致 | 使用相同版本的 Node.js |

---

**最后更新**：2026年5月  
**适用版本**：FUXA 1.3.2+
#!/bin/bash

# FUXA 客户定制化补丁生成器
# 根据配置文件自动生成客户专属补丁包

set -e

# 检查参数
if [ $# -ne 1 ]; then
    echo "用法: $0 <客户配置文件>"
    echo "示例: $0 customer-config.json"
    exit 1
fi

CONFIG_FILE=$1

# 检查配置文件是否存在
if [ ! -f "$CONFIG_FILE" ]; then
    echo "错误：配置文件 $CONFIG_FILE 不存在"
    exit 1
fi

# 读取配置
CUSTOMER_NAME=$(jq -r '.customer.name' "$CONFIG_FILE")
CUSTOMER_VERSION=$(jq -r '.customer.version' "$CUSTOMER_VERSION")
SUPPORT_QQ=$(jq -r '.customer.supportQQ' "$CONFIG_FILE")
STARDUST_ENABLED=$(jq -r '.features.stardust.enabled' "$CONFIG_FILE")
STARDUST_SERVER=$(jq -r '.features.stardust.server' "$CONFIG_FILE")
STARDUST_APPNAME=$(jq -r '.features.stardust.appName' "$CONFIG_FILE")
MAP_SOURCE_ENABLED=$(jq -r '.features.mapSource.enabled' "$CONFIG_FILE")
MAP_SOURCE_URL=$(jq -r '.features.mapSource.url' "$CONFIG_FILE")
BRANCH=$(jq -r '.features.githubActions.branch' "$CONFIG_FILE")

# 创建客户补丁目录
PATCH_DIR="tecon-patch-${CUSTOMER_NAME}"
echo "为客户 $CUSTOMER_NAME 创建补丁包..."

# 复制基础补丁文件
if [ -d "tecon-patch" ]; then
    cp -r tecon-patch "$PATCH_DIR"
else
    echo "错误：找不到基础补丁包目录 tecon-patch"
    exit 1
fi

# 根据配置定制化文件
if [ "$STARDUST_ENABLED" = "true" ]; then
    echo "定制化 Stardust 配置..."
    sed -i "s/fuxaScada/$STARDUST_APPNAME/g" "$PATCH_DIR/files/server/main.js"
    sed -i "s|http://47.113.219.65:6600|$STARDUST_SERVER|g" "$PATCH_DIR/files/server/main.js"
fi

if [ "$MAP_SOURCE_ENABLED" = "true" ]; then
    echo "定制化地图源..."
    sed -i "s|https://tile-c.openstreetmap.fr/hot/{z}/{x}/{y}.png|$MAP_SOURCE_URL|g" "$PATCH_DIR/files/client/src/app/maps/maps-view/maps-view.component.ts"
fi

# 更新 GitHub Actions 配置
if [ -f "$PATCH_DIR/files/.github/workflows/fuxa-single.yml" ]; then
    echo "更新 GitHub Actions 配置..."
    sed -i "s/1.3.1-minimal/$BRANCH/g" "$PATCH_DIR/files/.github/workflows/fuxa-single.yml"
fi

# 创建客户专属 README
cat > "$PATCH_DIR/README.md" <<EOF
# FUXA $CUSTOMER_NAME 定制化补丁包

## 客户信息

- **客户名称**: $CUSTOMER_NAME
- **版本**: $CUSTOMER_VERSION
- **技术支持QQ**: $SUPPORT_QQ

## 补丁内容

EOF

# 添加功能列表
if [ "$STARDUST_ENABLED" = "true" ]; then
    cat >> "$PATCH_DIR/README.md" <<EOF
### 1. Stardust APM 集成
- 服务地址: $STARDUST_SERVER
- 应用名称: $STARDUST_APPNAME
EOF
fi

if [ "$MAP_SOURCE_ENABLED" = "true" ]; then
    cat >> "$PATCH_DIR/README.md" <<EOF
### 2. 地图源优化
- 地图源: $MAP_SOURCE_URL
EOF
fi

cat >> "$PATCH_DIR/README.md" <<EOF
### 3. S7 通讯插件
- 西门子 S7 PLC 通讯支持

### 4. GitHub Actions 配置
- 分支: $BRANCH
- 自动构建流程

### 5. 品牌标识替换
- 需要客户提供 Logo 和图标

### 6. FUXA 自动化技能
- FUXA 自动化配置技能

## 使用方法

1. 将此补丁包复制到 FUXA 根目录
2. 运行应用脚本：
   - Windows: 双击 \`$PATCH_DIR/apply-patch.bat\`
   - Linux/Mac: 执行 \`./$PATCH_DIR/apply-patch.sh\`
3. 重新构建项目

## 星尘控制台访问

- 服务地址: $STARDUST_SERVER
- 应用名称: $STARDUST_APPNAME
EOF

echo "✅ 客户补丁包创建完成: $PATCH_DIR"
echo "请检查并补充客户品牌标识文件到 $PATCH_DIR 目录"

#!/bin/bash

# FUXA 科控物联定制化补丁脚本
# 用于在官方版本升级后应用定制化修改

echo "开始应用 FUXA 科控物联定制化补丁..."

# 检查当前目录是否为 FUXA 根目录
if [ ! -d "server" ] || [ ! -d "client" ]; then
    echo "错误：请在 FUXA 根目录运行此脚本"
    exit 1
fi

# 应用 Stardust APM 集成
echo "1. 应用 Stardust APM 集成..."
cp -f tecon-patch/files/server/runtime/stardust.js server/runtime/
cp -f tecon-patch/files/server/runtime/stardust-middleware.js server/runtime/
cp -f tecon-patch/files/server/main.js server/

# 应用地图源修改
echo "2. 应用地图源修改..."
cp -f tecon-patch/files/client/src/app/maps/maps-view/maps-view.component.ts client/src/app/maps/maps-view/

# 应用 S7 通讯插件依赖
echo "3. 应用 S7 通讯插件依赖..."
cp -f tecon-patch/files/server/package.json server/

# 应用 GitHub Actions 配置
echo "4. 应用 GitHub Actions 配置..."
cp -f tecon-patch/files/.github/workflows/fuxa-single.yml .github/workflows/

# 应用 FUXA 自动化技能
echo "5. 应用 FUXA 自动化技能..."
cp -f tecon-patch/files/.trae/skills/fuxa-automation/SKILL.md .trae/skills/fuxa-automation/

# 应用品牌标识
echo "6. 应用品牌标识..."
if [ -f "logo.svg" ]; then
    cp -f logo.svg client/src/assets/images/
fi
if [ -f "favicon.ico" ]; then
    cp -f favicon.ico client/src/
fi

echo "补丁应用完成！"
echo "请执行以下命令重新构建："
echo "1. cd ./server && npm install"
echo "2. cd ../client && npm install && npx ng build --configuration=production"
echo "3. 使用 GitHub Actions 构建或运行 npm start 启动开发模式"

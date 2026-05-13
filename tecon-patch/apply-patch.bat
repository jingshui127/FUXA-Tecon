@echo off

REM FUXA 科控物联定制化补丁脚本
REM 用于在官方版本升级后应用定制化修改

echo 开始应用 FUXA 科控物联定制化补丁...

REM 检查当前目录是否为 FUXA 根目录
if not exist "server" (    
    echo 错误：请在 FUXA 根目录运行此脚本
    pause
    exit /b 1
)

if not exist "client" (
    echo 错误：请在 FUXA 根目录运行此脚本
    pause
    exit /b 1
)

REM 应用 Stardust APM 集成
echo 1. 应用 Stardust APM 集成...
copy /Y "tecon-patch\files\server\runtime\stardust.js" "server\runtime\"
copy /Y "tecon-patch\files\server\runtime\stardust-middleware.js" "server\runtime\"
copy /Y "tecon-patch\files\server\main.js" "server\"

REM 应用地图源修改
echo 2. 应用地图源修改...
copy /Y "tecon-patch\files\client\src\app\maps\maps-view\maps-view.component.ts" "client\src\app\maps\maps-view\"

REM 应用 S7 通讯插件依赖
echo 3. 应用 S7 通讯插件依赖...
copy /Y "tecon-patch\files\server\package.json" "server\"

REM 应用 GitHub Actions 配置
echo 4. 应用 GitHub Actions 配置...
copy /Y "tecon-patch\files\.github\workflows\fuxa-single.yml" ".github\workflows\"

REM 应用 FUXA 自动化技能
echo 5. 应用 FUXA 自动化技能...
copy /Y "tecon-patch\files\.trae\skills\fuxa-automation\SKILL.md" ".trae\skills\fuxa-automation\"

REM 应用品牌标识
echo 6. 应用品牌标识...
if exist "logo.svg" (
    copy /Y "logo.svg" "client\src\assets\images\"
)
if exist "favicon.ico" (
    copy /Y "favicon.ico" "client\src\"
)

echo 补丁应用完成！
echo 请执行以下命令重新构建：
echo 1. cd .\server && npm install
echo 2. cd ..\client && npm install && npx ng build --configuration=production
echo 3. 使用 GitHub Actions 构建或运行 npm start 启动开发模式

pause

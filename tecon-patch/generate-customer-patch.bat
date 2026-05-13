@echo off
REM FUXA 客户定制化补丁生成器
REM 根据配置文件自动生成客户专属补丁包

setlocal enabledelayedexpansion

REM 检查参数
if "%1"=="" (
    echo 用法: %0 ^<客户配置文件^>
    echo 示例: %0 customer-config.json
    pause
    exit /b 1
)

set CONFIG_FILE=%1

REM 检查配置文件是否存在
if not exist "%CONFIG_FILE%" (
    echo 错误：配置文件 %CONFIG_FILE% 不存在
    pause
    exit /b 1
)

REM 使用 PowerShell 读取 JSON 配置
for /f "delims=" %%i in ('powershell -Command "(Get-Content '%CONFIG_FILE%' | ConvertFrom-Json).customer.name"') do set CUSTOMER_NAME=%%i
for /f "delims=" %%i in ('powershell -Command "(Get-Content '%CONFIG_FILE%' | ConvertFrom-Json).customer.version"') do set CUSTOMER_VERSION=%%i
for /f "delims=" %%i in ('powershell -Command "(Get-Content '%CONFIG_FILE%' | ConvertFrom-Json).customer.supportQQ"') do set SUPPORT_QQ=%%i
for /f "delims=" %%i in ('powershell -Command "(Get-Content '%CONFIG_FILE%' | ConvertFrom-Json).features.stardust.enabled"') do set STARDUST_ENABLED=%%i
for /f "delims=" %%i in ('powershell -Command "(Get-Content '%CONFIG_FILE%' | ConvertFrom-Json).features.stardust.server"') do set STARDUST_SERVER=%%i
for /f "delims=" %%i in ('powershell -Command "(Get-Content '%CONFIG_FILE%' | ConvertFrom-Json).features.stardust.appName"') do set STARDUST_APPNAME=%%i
for /f "delims=" %%i in ('powershell -Command "(Get-Content '%CONFIG_FILE%' | ConvertFrom-Json).features.mapSource.enabled"') do set MAP_SOURCE_ENABLED=%%i
for /f "delims=" %%i in ('powershell -Command "(Get-Content '%CONFIG_FILE%' | ConvertFrom-Json).features.mapSource.url"') do set MAP_SOURCE_URL=%%i
for /f "delims=" %%i in ('powershell -Command "(Get-Content '%CONFIG_FILE%' | ConvertFrom-Json).features.githubActions.branch"') do set BRANCH=%%i

REM 创建客户补丁目录
set PATCH_DIR=tecon-patch-%CUSTOMER_NAME%
echo 为客户 %CUSTOMER_NAME% 创建补丁包...

REM 复制基础补丁文件
if exist "tecon-patch" (
    xcopy /E /I /Y tecon-patch %PATCH_DIR%
) else (
    echo 错误：找不到基础补丁包目录 tecon-patch
    pause
    exit /b 1
)

REM 根据配置定制化文件
if "%STARDUST_ENABLED%"=="true" (
    echo 定制化 Stardust 配置...
    powershell -Command "(Get-Content '%PATCH_DIR%\files\server\main.js') -replace 'fuxaScada', '%STARDUST_APPNAME%' | Set-Content '%PATCH_DIR%\files\server\main.js'"
    powershell -Command "(Get-Content '%PATCH_DIR%\files\server\main.js') -replace 'http://47.113.219.65:6600', '%STARDUST_SERVER%' | Set-Content '%PATCH_DIR%\files\server\main.js'"
)

if "%MAP_SOURCE_ENABLED%"=="true" (
    echo 定制化地图源...
    powershell -Command "(Get-Content '%PATCH_DIR%\files\client\src\app\maps\maps-view\maps-view.component.ts') -replace 'https://tile-c.openstreetmap.fr/hot/\{z\}/\{x\}/\{y\}.png', '%MAP_SOURCE_URL%' | Set-Content '%PATCH_DIR%\files\client\src\app\maps\maps-view\maps-view.component.ts'"
)

REM 更新 GitHub Actions 配置
if exist "%PATCH_DIR%\files\.github\workflows\fuxa-single.yml" (
    echo 更新 GitHub Actions 配置...
    powershell -Command "(Get-Content '%PATCH_DIR%\files\.github\workflows\fuxa-single.yml') -replace '1.3.1-minimal', '%BRANCH%' | Set-Content '%PATCH_DIR%\files\.github\workflows\fuxa-single.yml'"
)

echo ✅ 客户补丁包创建完成: %PATCH_DIR%
echo 请检查并补充客户品牌标识文件到 %PATCH_DIR% 目录

pause

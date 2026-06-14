@echo off
chcp 65001 >nul 2>&1
title FUXA Server

echo =====================================
echo   FUXA Server 启动脚本
echo =====================================.
echo.

:: 检查 node 是否可用
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未找到 Node.js，请先安装！
    pause
    exit /b 1
)

:: 切换到 server 目录
cd /d "%~dp0server"

:: 检查是否有 S7 设备配置（检查数据库或配置文件）
set USE_WRAPPER=false
if exist "data\project.db" (
    :: 简单检测：检查项目中是否有 S7 类型设备
    findstr /i "SiemensS7" data\project.db >nul 2>&1
    if %errorlevel% equ 0 set USE_WRAPPER=true
)

:: 也检查 package.json 中是否有 node-snap7 依赖
findstr /i "node-snap7" package.json >nul 2>&1
if %errorlevel% equ 0 set USE_WRAPPER=true

if "%USE_WRAPPER%"=="true" (
    echo [信息] 检测到 S7 设备，使用 Wrapper 模式（自动重启）
    echo [信息] 按 Ctrl+C 停止服务
    echo.
    node fuxa-wrapper.js
) else (
    echo [信息] 未检测到 S7 设备，使用标准模式
    echo [信息] 按 Ctrl+C 停止服务
    echo.
    node main.js
)

pause

@echo off
chcp 65001 >nul 2>&1
title FUXA Server

echo =====================================
echo   FUXA Server Launcher
echo =====================================
echo.

:: Get the directory where this bat file is located
set "FUXA_ROOT=%~dp0"
set "FUXA_SERVER=%FUXA_ROOT%server"

:: Check if server directory exists
if not exist "%FUXA_SERVER%\main.js" (
    echo [ERROR] Cannot find main.js in %FUXA_SERVER%
    pause
    exit /b 1
)

:: Check node
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found!
    pause
    exit /b 1
)

:: Change to server directory
cd /d "%FUXA_SERVER%"
echo [INFO] Working directory: %cd%
echo.

:: Check for node-snap7 dependency (S7 support)
set "USE_WRAPPER=false"
findstr /i "node-snap7" "%FUXA_SERVER%\package.json" >nul 2>&1
if %errorlevel% equ 0 (
    set "USE_WRAPPER=true"
)

if "%USE_WRAPPER%"=="true" (
    echo [INFO] S7 detected - using Wrapper mode (auto-restart)
) else (
    echo [INFO] Standard mode (no S7)
)
echo.
echo [INFO] Press Ctrl+C to stop
echo.

if "%USE_WRAPPER%"=="true" (
    node fuxa-wrapper.js
) else (
    node main.js
)

pause

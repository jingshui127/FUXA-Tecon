@echo off
chcp 936 >nul
setlocal

rem ============================================================
rem  FUXA PRO  -  install background guardian service
rem  Must be placed in the same folder as Agent.exe / FuxaPro.exe
rem ============================================================

cd /d "%~dp0"

fltmc >nul 2>&1
if errorlevel 1 (
    echo 正在请求管理员权限，请在弹窗中点击"是"...
    powershell -NoProfile -Command "Start-Process cmd -ArgumentList '/c ""%~f0""' -Verb RunAs"
    exit /b
)

if not exist "%~dp0Agent.exe" (
    echo [错误] 未找到 Agent.exe，请确认本脚本与 Agent.exe、FuxaPro.exe 在同一目录。
    pause
    exit /b 1
)

if not exist "%~dp0FuxaPro.exe" (
    echo [错误] 未找到 FuxaPro.exe，请确认程序文件完整。
    pause
    exit /b 1
)

echo.
echo ============================================================
echo   FUXA PRO  后台守护服务安装
echo ============================================================
echo   安装目录 : %~dp0
echo   服务名称 : StarAgent（显示名：进程守护）
echo   启动方式 : 开机自动启动，无需登录桌面
echo   守护策略 : 每 10 秒检测一次，异常退出后自动重启
echo ============================================================
echo.

echo 正在安装，请稍候（约 20 秒）...
"%~dp0Agent.exe" -install -server http://47.113.219.65:6600

echo.
echo 正在检查服务状态...
sc query StarAgent | findstr /C:"STATE"

echo.
echo 安装完成。浏览器访问 http://127.0.0.1:1881/ 确认页面可以打开。
echo 日志目录：%~dp0Log
echo.
pause
endlocal

@echo off
chcp 936 >nul
setlocal

rem ============================================================
rem  FUXA PRO  -  uninstall background guardian service
rem  Must be placed in the same folder as Agent.exe
rem ============================================================

cd /d "%~dp0"

fltmc >nul 2>&1
if errorlevel 1 (
    echo 正在请求管理员权限，请在弹窗中点击"是"...
    powershell -NoProfile -Command "Start-Process cmd -ArgumentList '/c ""%~f0""' -Verb RunAs"
    exit /b
)

if not exist "%~dp0Agent.exe" (
    echo [错误] 未找到 Agent.exe，请确认本脚本与 Agent.exe 在同一目录。
    pause
    exit /b 1
)

echo.
echo ============================================================
echo   FUXA PRO  后台守护服务卸载
echo ============================================================
echo   卸载后 FUXA 将不再开机自启，也不再自动重启。
echo   项目数据 data\ 与品牌目录 customization\ 不会被删除。
echo ============================================================
echo.
choice /C YN /M "确认卸载守护服务? (Y=卸载 N=取消)"
if errorlevel 2 (
    echo 已取消。
    pause
    exit /b 0
)

echo.
echo 正在卸载，请稍候（约 15 秒）...
"%~dp0Agent.exe" -uninstall -server http://47.113.219.65:6600

echo.
echo 正在检查服务状态...
sc query StarAgent 2>nul | findstr /C:"STATE"
if errorlevel 1 echo 服务已移除。

echo.
echo 正在检查 FUXA 进程...
tasklist /FI "IMAGENAME eq FuxaPro.exe" 2>nul | findstr /I "FuxaPro.exe" >nul
if errorlevel 1 goto :noprocess

echo 检测到 FuxaPro 进程仍在运行。它由两个进程组成：
echo   守护进程：内存约 24 MB，不占端口，崩溃后负责自动拉起
echo   服务进程：占用 1881 端口，真正提供网页服务
echo 注意：只结束服务进程，守护进程会在 2 秒后重新拉起一个新的，
echo       必须结束整个进程树，否则看起来像"卸载无效"。
echo.
choice /C YN /M "是否同时结束所有 FuxaPro 进程? (Y=结束 N=保留)"
if errorlevel 2 goto :kept

taskkill /F /T /IM FuxaPro.exe
echo.
echo 已结束所有 FuxaPro 进程。
goto :done

:noprocess
echo 没有正在运行的 FuxaPro 进程。
goto :done

:kept
echo.
echo 已保留运行中的 FuxaPro 进程。如需停止，请以管理员身份执行：
echo   taskkill /F /T /IM FuxaPro.exe

:done
echo.
echo 卸载完成。
echo.
pause
endlocal

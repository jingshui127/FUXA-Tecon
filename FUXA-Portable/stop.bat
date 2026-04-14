@echo off
cd /d "%~dp0server"
echo Stopping FUXA...
echo.
taskkill /F /IM node.exe
echo FUXA stopped.
pause

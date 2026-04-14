@echo off
cd /d "%~dp0server"
echo Starting FUXA...
echo.
if not exist "..\nodejs\node.exe" (
    echo Node.js not found. Please run download-nodejs.bat first.
    pause
    exit /b 1
)
set PATH=%~dp0..\nodejs;%PATH%
npm start
pause

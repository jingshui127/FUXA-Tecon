@echo off
cd /d "%~dp0server"
echo Starting FUXA...
echo.
npm install
npm start
pause

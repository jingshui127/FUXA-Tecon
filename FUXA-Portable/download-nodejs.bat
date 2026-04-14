@echo off
cd /d "%~dp0"
echo Downloading Node.js portable version...
echo.
powershell -Command "Invoke-WebRequest -Uri 'https://nodejs.org/dist/v20.19.0/node-v20.19.0-win-x64.zip' -OutFile 'nodejs\node.zip'"
echo.
echo Extracting Node.js...
echo.
powershell -Command "Expand-Archive -Path 'nodejs\node.zip' -DestinationPath 'nodejs' -Force"
echo.
echo Cleaning up...
del "nodejs\node.zip"
echo.
echo Node.js downloaded successfully!
echo.
pause

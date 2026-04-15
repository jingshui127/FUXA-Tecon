@echo off
setlocal enabledelayedexpansion

echo ========================================
echo FUXA Headless Binary Builder
echo ========================================
echo.

set PROJECT_DIR=%cd%
set BUILD_DIR=%PROJECT_DIR%\build-headless
set SERVER_DIR=%PROJECT_DIR%\server
set CLIENT_DIST_DIR=%PROJECT_DIR%\client\dist
set NODE_DIR=%PROJECT_DIR%\FUXA-Portable\nodejs

echo Project Directory: %PROJECT_DIR%
echo Build Directory: %BUILD_DIR%
echo Server Directory: %SERVER_DIR%
echo Client Dist Directory: %CLIENT_DIST_DIR%
echo Node Directory: %NODE_DIR%
echo.

REM Clean up previous build
echo Cleaning up previous build...
if exist "%BUILD_DIR%" (
    rmdir /s /q "%BUILD_DIR%"
)
mkdir "%BUILD_DIR%"
mkdir "%BUILD_DIR%\server"
mkdir "%BUILD_DIR%\client\dist"
echo Done.
echo.

REM Copy server files (exclude node_modules and test)
echo Copying server files...
xcopy /E /I /Y "%SERVER_DIR%\*" "%BUILD_DIR%\server\" 2>nul

REM Remove node_modules from copied files
if exist "%BUILD_DIR%\server\node_modules" (
    echo Removing node_modules...
    rmdir /s /q "%BUILD_DIR%\server\node_modules"
)

REM Remove test files
if exist "%BUILD_DIR%\server\test" (
    echo Removing test files...
    rmdir /s /q "%BUILD_DIR%\server\test"
)

REM Remove docs
if exist "%BUILD_DIR%\server\docs" (
    echo Removing docs...
    rmdir /s /q "%BUILD_DIR%\server\docs"
)

REM Remove tsconfig
if exist "%BUILD_DIR%\server\tsconfig.json" (
    echo Removing tsconfig.json...
    del "%BUILD_DIR%\server\tsconfig.json"
)

echo Done.
echo.

REM Copy client dist
echo Copying client dist...
xcopy /E /I /Y "%CLIENT_DIST_DIR%\*" "%BUILD_DIR%\client\dist\" 2>nul
echo Done.
echo.

REM Copy nodejs
echo Copying nodejs...
if exist "%NODE_DIR%\node.exe" (
    xcopy /E /I /Y "%NODE_DIR%\*" "%BUILD_DIR%\node\" 2>nul
) else (
    echo Node.js not found at %NODE_DIR%
    echo Please run download-nodejs.bat first in FUXA-Portable directory.
    pause
    exit /b 1
)
echo Done.
echo.

REM Copy pre-created package.json
echo Copying package.json...
copy "%PROJECT_DIR%\package-headless.json" "%BUILD_DIR%\package.json"
echo Done.
echo.

REM Install dependencies
echo Installing dependencies...
cd /d "%BUILD_DIR%"
call npm install
echo Done.
echo.

REM Install yao-pkg
echo Installing @yao-pkg/pkg...
call npm install -g @yao-pkg/pkg
echo Done.
echo.

REM Build headless binary
echo Building Headless Binary...
cd /d "%BUILD_DIR%"
call npx pkg . --node-resource-path=node
echo.

REM Check if build succeeded
if exist "%BUILD_DIR%\dist\fuxa-headless-win-x64.exe" (
    echo.
    echo ========================================
    echo Build succeeded!
    echo ========================================
    echo Output: %BUILD_DIR%\dist\fuxa-headless-win-x64.exe
    echo.
    echo Size:
    dir "%BUILD_DIR%\dist\fuxa-headless-win-x64.exe" | find "fuxa-headless-win-x64.exe"
    echo.
) else (
    echo.
    echo ========================================
    echo Build failed!
    echo ========================================
    echo Please check the error messages above.
    echo.
)

pause

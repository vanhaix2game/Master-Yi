@echo off
title Flow Factory
set "REPO=D:\Project\LV\MASTER\FlowFactory"
set "URL=http://127.0.0.1:8765/"

REM Server da chay? Bo qua buoc khoi dong
curl -s -o NUL --max-time 3 "%URL%"
if %errorlevel%==0 goto OPEN

REM Khoi dong server
if not exist "%REPO%\data" mkdir "%REPO%\data"
if not exist "%REPO%\logs" mkdir "%REPO%\logs"
set "FLOWFACTORY_DATA_DIR=%REPO%\data"
set "FLOWFACTORY_DEV_LICENSE=1"
set "AUTOMONEY_NO_BROWSER=1"
set "PYTHONIOENCODING=utf-8"
start "FlowFactoryServer" /min cmd /c "cd /d "%REPO%" && python server.py >> "%REPO%\logs\server.log" 2>&1"

REM Doi server san sang (toi da 20s)
for /L %%i in (1,1,20) do (
    curl -s -o NUL --max-time 2 "%URL%"
    if %errorlevel%==0 goto OPEN
    timeout /t 1 /nobreak > NUL
)
echo Khong khoi dong duoc server, xem: %REPO%\logs\server.log
pause
exit /b 1

:OPEN
start "" "%URL%"
exit /b 0

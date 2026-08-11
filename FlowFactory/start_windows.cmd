@echo off
REM Flow Factory - khoi dong tren Windows
setlocal
set "REPO=D:\Project\LV\MASTER\FlowFactory"
set "PORT=8765"
set "URL=http://127.0.0.1:%PORT%/"
set "DATA_DIR=%REPO%\data"
set "LOG_DIR=%REPO%\logs"
set "PID_FILE=%REPO%\server.pid"

if not exist "%DATA_DIR%" mkdir "%DATA_DIR%"
if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"

curl -s -o NUL --max-time 3 "%URL%"
if %errorlevel%==0 (
    echo Flow Factory dang chay: %URL%
    exit /b 0
)

set "FLOWFACTORY_DATA_DIR=%DATA_DIR%"
set "FLOWFACTORY_DEV_LICENSE=1"
set "AUTOMONEY_NO_BROWSER=1"
set "PYTHONIOENCODING=utf-8"
REM python3 shim phai dung truoc WindowsApps stub
set "PATH=%REPO%\bin;%PATH%"
start "" /b "%PYTHON%" "%REPO%\server.py" >> "%LOG_DIR%\server.log" 2>&1
if not defined PYTHON (
    start "" /b python "%REPO%\server.py" >> "%LOG_DIR%\server.log" 2>&1
)

for /L %%i in (1,1,20) do (
    curl -s -o NUL --max-time 2 "%URL%"
    if %errorlevel%==0 (
        echo Flow Factory san sang: %URL%
        echo Du lieu: %DATA_DIR%
        echo Log: %LOG_DIR%\server.log
        exit /b 0
    )
    timeout /t 1 /nobreak > NUL
)
echo Flow Factory khoi dong that bai, xem: %LOG_DIR%\server.log
exit /b 1
@echo off
REM pxhopencode Start — init memory + remove nested .git + launch opencode
REM Usage: from project root: .opencode\start.bat

setlocal enabledelayedexpansion

REM Normalize: always run from project root
if exist ".opencode\_shared\scripts\start.ps1" (
  REM Already at project root — good
  set PROJ=.
) else if exist "..\..\_shared\scripts\start.ps1" (
  REM Deep inside .opencode/ — probably at .opencode/
  set PROJ=..
) else if exist "..\_shared\scripts\start.ps1" (
  REM Inside .opencode/ root
  set PROJ=..
) else (
  echo [FAIL] Run from project root: .opencode\start.bat
  pause
  exit /b 1
)

cd /d "!PROJ!"
echo ==^> Initializing pxhopencode...
powershell -ExecutionPolicy Bypass -File ".opencode/_shared/scripts/start.ps1"
if !errorlevel! neq 0 (
  pause
  exit /b !errorlevel!
)

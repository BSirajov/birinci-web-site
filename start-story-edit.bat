@echo off
setlocal EnableExtensions
cd /d "%~dp0"

set "HOST=127.0.0.1"
set "SITE_PORT=8765"
set "EDIT_PORT=8768"
set "START_URL=http://%HOST%:%SITE_PORT%/en/categories/iman-ve-meneviyyat.html?edit=1"

where python >nul 2>&1
if errorlevel 1 (
  echo Python was not found on PATH.
  echo Install Python and try again.
  pause
  exit /b 1
)

echo Starting BirInci story edit mode...
echo   Site:  http://%HOST%:%SITE_PORT%/
echo   Edit:  http://%HOST%:%EDIT_PORT%/api/dev/ping
echo.

start "BirInci story edit API" /min cmd /c "cd /d ""%~dp0"" && python tools\dev_story_edit_server.py"
start "BirInci local site" /min cmd /c "cd /d ""%~dp0"" && python -m http.server %SITE_PORT% --bind %HOST%"

REM Give the servers a moment to bind.
timeout /t 2 /nobreak >nul

start "" "%START_URL%"

echo Servers are running in minimized windows.
echo Close those windows to stop edit mode.
echo.
echo Opened: %START_URL%
echo Tip: use the Dev story edit panel (bottom-right), turn Edit on, then Save.
pause

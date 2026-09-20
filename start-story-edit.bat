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
echo   Site:  http://%HOST%:%SITE_PORT%/index.html
echo   Edit:  http://%HOST%:%EDIT_PORT%/api/dev/ping
echo.

echo Checking http://%HOST%:%SITE_PORT%/index.html ...
python tools\serve_site.py --host %HOST% --port %SITE_PORT%
if errorlevel 1 (
  echo Could not start the site server on port %SITE_PORT%.
  pause
  exit /b 1
)

start "BirInci story edit API" /min cmd /c "cd /d ""%~dp0"" && python tools\dev_story_edit_server.py"

set /a _n=0
:wait_site
python -c "import urllib.request,sys; urllib.request.urlopen('http://127.0.0.1:8765/index.html', timeout=2)" >nul 2>&1
if not errorlevel 1 goto site_ok
set /a _n+=1
if %_n% geq 20 goto site_fail
timeout /t 1 /nobreak >nul
goto wait_site

:site_fail
echo Timed out waiting for the site on port %SITE_PORT%.
pause
exit /b 1

:site_ok
start "" "%START_URL%"

echo The site server stays up after this window closes.
echo Opening this script again reuses the same 8765 listener; it will not stack another.
echo Close the minimized edit-API window to stop edit mode.
echo.
echo Opened: %START_URL%
echo Tip: use the Dev story edit panel (bottom-right), turn Edit on, then Save.
pause

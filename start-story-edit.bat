@echo off
setlocal EnableExtensions
cd /d "%~dp0"

set "HOST=127.0.0.1"
set "PYTHONIOENCODING=utf-8"
set "SITE_PORT=8765"
set "EDIT_PORT=8768"

where python >nul 2>&1
if errorlevel 1 (
  echo Python was not found on PATH.
  echo Install Python and try again.
  pause
  exit /b 1
)

echo Starting BirInci story edit mode...
echo   Preferred: http://%HOST%:%SITE_PORT%/
echo   Edit:      http://%HOST%:%EDIT_PORT%/api/dev/ping
echo   If port %SITE_PORT% is another site, BirInci uses 8775+ instead.
echo.

python tools\serve_site.py --host %HOST% --port %SITE_PORT% --auto-port
if errorlevel 1 (
  echo Could not start the BirInci site server.
  pause
  exit /b 1
)

set "SITE_URL="
if exist "tools\.serve_site.url" (
  set /p SITE_URL=<tools\.serve_site.url
)
if not defined SITE_URL set "SITE_URL=http://%HOST%:%SITE_PORT%/"
set "START_URL=%SITE_URL%en/categories/iman-ve-meneviyyat.html?edit=1"

echo.
echo BirInci URL: %SITE_URL%
echo Edit page:   %START_URL%
echo.

start "BirInci story edit API" /min cmd /c "cd /d ""%~dp0"" && python tools\dev_story_edit_server.py"

set /a _n=0
:wait_site
python -c "import sys; from pathlib import Path; sys.path.insert(0,'tools'); import serve_site; p=Path('tools/.serve_site.url'); u=p.read_text(encoding='utf-8').strip().rstrip('/') if p.exists() else ''; sys.exit(1) if not u else None; host,port=u.split('://',1)[-1].rsplit(':',1); sys.exit(0 if serve_site.is_healthy(host,int(port)) else 1)" >nul 2>&1
if not errorlevel 1 goto site_ok
set /a _n+=1
if %_n% geq 20 goto site_fail
timeout /t 1 /nobreak >nul
goto wait_site

:site_fail
echo Timed out waiting for %SITE_URL%
pause
exit /b 1

:site_ok
echo Opening %START_URL%
start "" "%START_URL%"

echo The site server stays up after this window closes.
echo Opening this script again reuses the same BirInci listener; it will not stack another.
echo Close the minimized edit-API window to stop edit mode.
echo.
echo Opened: %START_URL%
echo Tip: use the Dev story edit panel (bottom-right), turn Edit on, then Save.
pause

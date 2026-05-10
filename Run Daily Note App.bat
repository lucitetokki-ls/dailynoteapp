@echo off
setlocal EnableExtensions

cd /d "%~dp0"

set "APP_NAME=Lucitetokki Daily Action Log"
set "APP_PORT=3000"
set "APP_URL=http://localhost:%APP_PORT%"

echo %APP_NAME%
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js was not found. Install Node.js first.
  echo https://nodejs.org/
  pause
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo npm was not found. Install Node.js first.
  echo https://nodejs.org/
  pause
  exit /b 1
)

node -e "const major = Number(process.versions.node.split('.')[0]); if (major < 20) { console.error('Node.js 20 or newer is required. Current: ' + process.version); process.exit(1); }"
if errorlevel 1 (
  echo.
  pause
  exit /b 1
)

if not exist "package.json" (
  echo package.json was not found. Check the app folder path.
  pause
  exit /b 1
)

call :ensure_dependencies
if errorlevel 1 exit /b 1

call :is_app_running
if "%APP_RUNNING%"=="1" (
  echo App is already running at %APP_URL%.
  echo Opening the existing server in your browser.
  start "" "%APP_URL%"
  exit /b 0
)

call :is_port_listening
if "%PORT_IN_USE%"=="1" (
  echo Port %APP_PORT% is already in use, but it does not look like this app.
  echo Stop the process using port %APP_PORT%, then run this file again.
  pause
  exit /b 1
)

if not exist ".env.local" (
  echo.
  echo .env.local was not found. The app will still run with localStorage only.
)

echo.
echo Opening %APP_URL% in your browser.
start "" powershell -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -Command "Start-Sleep -Seconds 2; Start-Process '%APP_URL%'"

echo.
echo Starting the dev server. Press Ctrl+C in this window to stop it.
call npm run dev:local

pause
exit /b 0

:ensure_dependencies
set "NEED_INSTALL=0"

if not exist "node_modules" set "NEED_INSTALL=1"
if not exist "node_modules\@tiptap\react" set "NEED_INSTALL=1"
if not exist "node_modules\@tiptap\markdown" set "NEED_INSTALL=1"
if not exist "node_modules\@supabase\supabase-js" set "NEED_INSTALL=1"
if not exist "node_modules\react-markdown" set "NEED_INSTALL=1"

if "%NEED_INSTALL%"=="1" (
  echo Installing npm dependencies for the current app state.
  call npm install
  if errorlevel 1 (
    echo.
    echo npm install failed.
    pause
    exit /b 1
  )
)

exit /b 0

:is_app_running
set "APP_RUNNING=0"
for /f %%A in ('powershell -NoProfile -ExecutionPolicy Bypass -Command "try { $r = Invoke-WebRequest -Uri '%APP_URL%/writing' -UseBasicParsing -TimeoutSec 2; if ($r.StatusCode -eq 200 -and $r.Content -match 'Lucitetokki') { '1' } else { '0' } } catch { '0' }"') do set "APP_RUNNING=%%A"
exit /b 0

:is_port_listening
set "PORT_IN_USE=0"
for /f %%A in ('powershell -NoProfile -ExecutionPolicy Bypass -Command "if (Get-NetTCPConnection -LocalPort %APP_PORT% -State Listen -ErrorAction SilentlyContinue) { '1' } else { '0' }"') do set "PORT_IN_USE=%%A"
exit /b 0

@echo off
setlocal

cd /d "%~dp0"

echo Daily Note App
echo.

where npm >nul 2>nul
if errorlevel 1 (
  echo npm was not found. Install Node.js first.
  echo https://nodejs.org/
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo node_modules was not found. Running npm install.
  npm install
  if errorlevel 1 (
    echo.
    echo npm install failed.
    pause
    exit /b 1
  )
)

echo.
echo Opening http://localhost:3000 in your browser.
start "" "http://localhost:3000"

echo.
echo Starting the dev server. Press Ctrl+C in this window to stop it.
npm run dev -- --port 3000

pause

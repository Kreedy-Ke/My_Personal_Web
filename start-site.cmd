@echo off
setlocal
cd /d "%~dp0"

where pnpm >nul 2>nul
if errorlevel 1 (
    echo pnpm was not found. Install Node.js and enable pnpm first.
    pause
    exit /b 1
)

start "Kreedy Wiki dev server" cmd /k "pnpm dev --host 127.0.0.1 --port 4321"
timeout /t 3 /nobreak >nul
start "" "http://127.0.0.1:4321/"

endlocal

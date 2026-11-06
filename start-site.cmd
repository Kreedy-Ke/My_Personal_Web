@echo off
setlocal
cd /d "%~dp0"

where pnpm >nul 2>nul
if errorlevel 1 (
    echo pnpm was not found. Install Node.js and enable pnpm first.
    pause
    exit /b 1
)

call pnpm astro dev stop >nul 2>nul
start "Kreedy Wiki dev server" cmd /k "pnpm dev --host 127.0.0.1 --port 4321"

powershell.exe -NoProfile -Command "$deadline = (Get-Date).AddSeconds(30); $page = $null; while ((Get-Date) -lt $deadline) { if (Test-Path '.astro\dev.json') { try { $dev = Get-Content '.astro\dev.json' -Raw | ConvertFrom-Json; if ($dev.url) { $candidate = ([string]$dev.url).TrimEnd('/') + '/articles/'; try { $response = Invoke-WebRequest -UseBasicParsing $candidate -TimeoutSec 2; if ($response.StatusCode -eq 200) { $page = $candidate; break } } catch {} } } catch {} }; Start-Sleep -Milliseconds 500 }; if ($page) { Start-Process $page; exit 0 } else { Write-Host 'The development server did not start. Check the server window for details.' -ForegroundColor Red; exit 1 }"

if errorlevel 1 pause

endlocal

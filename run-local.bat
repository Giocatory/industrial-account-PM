@echo off
setlocal

set ROOT=%~dp0

echo.
echo [LK] Checking setup...

if not exist "%ROOT%backend\node_modules\" (
    echo [ERROR] Run setup first: .\setup-local.bat
    pause
    exit /b 1
)
if not exist "%ROOT%frontend\node_modules\" (
    echo [ERROR] Run setup first: .\setup-local.bat
    pause
    exit /b 1
)
if not exist "%ROOT%backend\.env" (
    echo [ERROR] backend\.env missing. Run: .\setup-local.bat
    pause
    exit /b 1
)

echo [OK] Ready

echo.
echo [LK] Starting Backend on port 3001...
start "LK Backend :3001" cmd /k "cd /d %ROOT%backend && npm run start:dev"

echo [LK] Waiting 4 seconds...
timeout /t 4 /nobreak >nul

echo [LK] Starting Frontend on port 3000...
start "LK Frontend :3000" cmd /k "cd /d %ROOT%frontend && npm run dev"

echo.
echo ============================================================
echo  Two terminal windows opened!
echo ============================================================
echo  Frontend : http://localhost:3000  (ready in ~15-20 sec)
echo  Backend  : http://localhost:3001
echo  Swagger  : http://localhost:3001/api/docs
echo.
echo  PostgreSQL and Redis must be running!
echo  Close the terminal windows to stop.
echo ============================================================
echo.
echo Opening browser in 18 seconds...
timeout /t 18 /nobreak >nul
start "" "http://localhost:3000"

endlocal

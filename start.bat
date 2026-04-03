@echo off
setlocal

title LK Project

echo.
echo ============================================================
echo  LK - Personal Cabinet - Project Management System
echo ============================================================
echo.

if not "%1"=="" goto run_%1

:menu
echo  Choose launch mode:
echo.
echo   1 - Docker  (all in containers, recommended)
echo   2 - Local   (no Docker, needs Node.js + PostgreSQL + Redis)
echo   3 - Stop Docker services
echo   4 - Show Docker logs
echo   5 - Load test users (seed)
echo   6 - Exit
echo.
set CHOICE=
set /p CHOICE=Enter number: 

if "%CHOICE%"=="1" goto run_docker
if "%CHOICE%"=="2" goto run_local
if "%CHOICE%"=="3" goto run_stop
if "%CHOICE%"=="4" goto run_logs
if "%CHOICE%"=="5" goto run_seed
if "%CHOICE%"=="6" exit /b 0
echo Invalid choice.
goto menu

:run_docker
:run_start
docker --version >nul 2>&1
if errorlevel 1 (
    echo.
    echo [ERROR] Docker Desktop not found.
    echo         Download: https://www.docker.com/products/docker-desktop
    echo         Or use local mode: .\start.bat 2
    pause
    goto end
)
if not exist ".env" (
    if exist ".env.example" copy ".env.example" ".env" >nul
)
echo [LK] Starting all services in Docker...
echo      First run takes 2-5 min to download images.
echo.
docker compose up -d --build
if errorlevel 1 (
    echo.
    echo [ERROR] Docker failed. Make sure Docker Desktop is running.
    pause
    goto end
)
timeout /t 10 /nobreak >nul
echo.
echo ============================================================
echo  Started! Open: http://localhost:3000
echo  Backend API:   http://localhost:3001
echo  Swagger docs:  http://localhost:3001/api/docs
echo.
echo  Commands:
echo    .\start.bat 3  - stop
echo    .\start.bat 4  - logs
echo    .\start.bat 5  - load test users
echo ============================================================
echo.
timeout /t 4 /nobreak >nul
start "" "http://localhost:3000"
pause
goto end

:run_local
call "%~dp0setup-local.bat"
if errorlevel 1 goto end
call "%~dp0run-local.bat"
goto end

:run_stop
echo [LK] Stopping Docker services...
docker compose down
echo [OK] Stopped.
pause
goto end

:run_restart
docker compose down
docker compose up -d --build
echo [OK] Restarted.
pause
goto end

:run_logs
if not "%2"=="" (
    docker compose logs -f %2
) else (
    docker compose logs -f
)
goto end

:run_status
docker compose ps
pause
goto end

:run_seed
docker compose exec backend npm run seed
echo.
echo  Test accounts (password: Password123!)
echo    admin@lk.local
echo    manager@lk.local
echo    client@lk.local
pause
goto end

:run_clean
set CONFIRM=
set /p CONFIRM=Type YES to delete all Docker data: 
if not "%CONFIRM%"=="YES" goto end
docker compose down -v --rmi local
echo [OK] Done.
pause
goto end

:end
endlocal

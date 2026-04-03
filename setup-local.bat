@echo off
setlocal

title LK Setup

echo.
echo ============================================================
echo  LK Project - Local Setup (No Docker)
echo ============================================================
echo.

node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js not found. Download: https://nodejs.org
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('node -v') do echo [OK] Node.js %%v

echo.

if exist "backend\node_modules" (
    echo [SKIP] Backend already installed
    goto frontend_check
)

:write_backend_env
if not exist "backend\.env" (
    echo [INFO] Writing backend\.env ...
    (
        echo NODE_ENV=development
        echo PORT=3001
        echo DATABASE_HOST=localhost
        echo DATABASE_PORT=5432
        echo DATABASE_NAME=lk_db
        echo DATABASE_USER=lk_user
        echo DATABASE_PASSWORD=lk_pass
        echo REDIS_HOST=localhost
        echo REDIS_PORT=6379
        echo JWT_ACCESS_SECRET=dev_access_secret
        echo JWT_REFRESH_SECRET=dev_refresh_secret
        echo JWT_ACCESS_EXPIRES=15m
        echo JWT_REFRESH_EXPIRES=7d
        echo SMTP_HOST=smtp.yandex.ru
        echo SMTP_PORT=465
        echo SMTP_USER=
        echo SMTP_PASS=
        echo SMTP_FROM=noreply@localhost
        echo S3_BUCKET=dev-bucket
        echo S3_ACCESS_KEY=
        echo S3_SECRET_KEY=
        echo S3_REGION=ru-central1
        echo FRONTEND_URL=http://localhost:3000
    ) > "backend\.env"
    node -e "var f=require('fs'),c=f.readFileSync('backend/.env','utf8');c=c.replace('SMTP_PORT=465','SMTP_PORT=465').replace('SMTP_HOST=smtp.yandex.ru','SMTP_HOST=smtp.yandex.ru');f.writeFileSync('backend/.env',c+'S3_ENDPOINT=https://storage.yandexcloud.net\n');"
    echo [OK] backend\.env created
)

echo [LK] Installing backend deps...
cd backend
call npm install
if errorlevel 1 (
    echo [ERROR] Backend install failed
    cd ..
    pause
    exit /b 1
)
cd ..
echo [OK] Backend installed

:frontend_check
if exist "frontend\node_modules" (
    echo [SKIP] Frontend already installed
    goto write_fe_env
)

:write_fe_env
if not exist "frontend\.env.local" (
    (
        echo NEXT_PUBLIC_API_URL=http://localhost:3001
        echo NEXT_PUBLIC_WS_URL=ws://localhost:3001
    ) > "frontend\.env.local"
    echo [OK] frontend\.env.local created
)

echo [LK] Installing frontend deps...
cd frontend
call npm install
if errorlevel 1 (
    echo [ERROR] Frontend install failed
    cd ..
    pause
    exit /b 1
)
cd ..
echo [OK] Frontend installed

echo.
echo ============================================================
echo  Setup done!
echo ============================================================
echo.
echo  Make sure PostgreSQL is running, then create DB once:
echo.
echo    psql -U postgres -c "CREATE USER lk_user WITH PASSWORD 'lk_pass';"
echo    psql -U postgres -c "CREATE DATABASE lk_db OWNER lk_user;"
echo.
echo  Redis for Windows: winget install Redis.Redis
echo.
echo  Then run: .\run-local.bat
echo ============================================================
echo.
endlocal

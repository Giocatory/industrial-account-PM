#!/bin/bash

# ─────────────────────────────────────────────────────────────
# Local Dev Script — запуск backend + frontend без Docker
# (PostgreSQL и Redis должны быть запущены отдельно)
# ─────────────────────────────────────────────────────────────

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${BLUE}[DEV]${NC} $1"; }
ok()  { echo -e "${GREEN}[✓]${NC} $1"; }
err() { echo -e "${RED}[✗]${NC} $1"; exit 1; }

echo -e "${YELLOW}────────────────────────────────────────${NC}"
echo "  LK — Режим локальной разработки"
echo -e "${YELLOW}────────────────────────────────────────${NC}"
echo ""

# Check Node.js
command -v node &>/dev/null || err "Node.js не установлен. Нужен Node.js 20+"
NODE_VER=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
[ "$NODE_VER" -ge 18 ] || err "Нужен Node.js 18+. Текущая версия: $(node -v)"
ok "Node.js: $(node -v)"

# Setup backend .env
if [ ! -f "backend/.env" ]; then
  log "Создание backend/.env..."
  cat > backend/.env << 'ENVEOF'
NODE_ENV=development
PORT=3001
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=lk_db
DATABASE_USER=lk_user
DATABASE_PASSWORD=lk_pass
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_ACCESS_SECRET=dev_access_secret_change_in_prod
JWT_REFRESH_SECRET=dev_refresh_secret_change_in_prod
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d
SMTP_HOST=smtp.yandex.ru
SMTP_PORT=465
SMTP_USER=
SMTP_PASS=
SMTP_FROM=noreply@localhost
S3_ENDPOINT=https://storage.yandexcloud.net
S3_BUCKET=dev-bucket
S3_ACCESS_KEY=
S3_SECRET_KEY=
S3_REGION=ru-central1
FRONTEND_URL=http://localhost:3000
ENVEOF
  ok "backend/.env создан"
fi

# Setup frontend .env.local
if [ ! -f "frontend/.env.local" ]; then
  log "Создание frontend/.env.local..."
  cat > frontend/.env.local << 'ENVEOF'
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3001
ENVEOF
  ok "frontend/.env.local создан"
fi

# Install dependencies
log "Установка зависимостей backend..."
cd backend && npm install --silent && cd ..
ok "Backend зависимости установлены"

log "Установка зависимостей frontend..."
cd frontend && npm install --silent && cd ..
ok "Frontend зависимости установлены"

echo ""
log "Запуск сервисов..."

# Start backend
cd backend
npm run start:dev &
BACKEND_PID=$!
cd ..

sleep 3

# Start frontend
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════╗"
echo "║  Сервисы запущены!                          ║"
echo "╠══════════════════════════════════════════════╣"
echo "║  Frontend: http://localhost:3000             ║"
echo "║  Backend:  http://localhost:3001             ║"
echo "║  Swagger:  http://localhost:3001/api/docs    ║"
echo "╚══════════════════════════════════════════════╝${NC}"
echo ""
echo "Нажмите Ctrl+C для остановки"

# Cleanup on exit
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo 'Сервисы остановлены'; exit" INT TERM

wait

#!/bin/bash

# ─────────────────────────────────────────────────────────────
# setup-local.sh — Установка и запуск без Docker
# Поддержка: Linux, macOS
# Требования: Node.js 20+, PostgreSQL 16, Redis 7
# ─────────────────────────────────────────────────────────────

set -e
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
ok()  { echo -e "${GREEN}[✓]${NC} $1"; }
err() { echo -e "${RED}[✗]${NC} $1"; exit 1; }
log() { echo -e "${BLUE}[→]${NC} $1"; }
warn(){ echo -e "${YELLOW}[!]${NC} $1"; }

echo ""
echo "  ┌─────────────────────────────────────────────────┐"
echo "  │  LK Project — Локальная установка (без Docker)  │"
echo "  └─────────────────────────────────────────────────┘"
echo ""

# ── Node.js ────────────────────────────────────────────────────
command -v node &>/dev/null || err "Node.js не найден. Установите: https://nodejs.org (v20 LTS)"
NODE_VER=$(node -v | sed 's/v//' | cut -d. -f1)
[ "$NODE_VER" -ge 18 ] || err "Нужен Node.js 18+. Текущая: $(node -v)"
ok "Node.js $(node -v)"

# ── PostgreSQL ─────────────────────────────────────────────────
if command -v psql &>/dev/null; then
  ok "PostgreSQL: $(psql --version | head -1)"
else
  warn "psql не найден. Установите PostgreSQL 16:"
  echo "  macOS:  brew install postgresql@16"
  echo "  Ubuntu: sudo apt install postgresql-16"
  echo ""
fi

# ── Redis ──────────────────────────────────────────────────────
if command -v redis-cli &>/dev/null; then
  ok "Redis: $(redis-cli --version)"
else
  warn "redis-cli не найден. Установите Redis 7:"
  echo "  macOS:  brew install redis"
  echo "  Ubuntu: sudo apt install redis-server"
  echo ""
fi

# ── backend/.env ───────────────────────────────────────────────
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
JWT_ACCESS_SECRET=dev_access_secret_change_in_production
JWT_REFRESH_SECRET=dev_refresh_secret_change_in_production
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

# ── frontend/.env.local ────────────────────────────────────────
if [ ! -f "frontend/.env.local" ]; then
  cat > frontend/.env.local << 'ENVEOF'
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3001
ENVEOF
  ok "frontend/.env.local создан"
fi

# ── Install deps ───────────────────────────────────────────────
log "Установка зависимостей backend..."
cd backend && npm install && cd ..
ok "Backend зависимости установлены"

log "Установка зависимостей frontend..."
cd frontend && npm install && cd ..
ok "Frontend зависимости установлены"

echo ""
echo -e "${GREEN}Установка завершена!${NC}"
echo ""
echo "  Настройка PostgreSQL (выполнить в psql от суперпользователя):"
echo ""
echo "    CREATE USER lk_user WITH PASSWORD 'lk_pass';"
echo "    CREATE DATABASE lk_db OWNER lk_user;"
echo ""
echo "  Запуск (macOS/Linux):"
echo "    chmod +x dev.sh && ./dev.sh"
echo ""

#!/bin/bash

set -e

# ─────────────────────────────────────────────────────────────
# LK Project — Startup Script
# ─────────────────────────────────────────────────────────────

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

log() { echo -e "${BLUE}[LK]${NC} $1"; }
ok()  { echo -e "${GREEN}[✓]${NC} $1"; }
warn(){ echo -e "${YELLOW}[!]${NC} $1"; }
err() { echo -e "${RED}[✗]${NC} $1"; exit 1; }

echo -e "${CYAN}"
echo "╔══════════════════════════════════════════════════╗"
echo "║     ЛК Управление Проектами — Запуск системы    ║"
echo "╚══════════════════════════════════════════════════╝"
echo -e "${NC}"

# ── Check dependencies ─────────────────────────────────────
log "Проверка зависимостей..."

command -v docker &>/dev/null || err "Docker не установлен. Установите: https://docs.docker.com/get-docker/"
command -v docker-compose &>/dev/null || command -v docker compose &>/dev/null || err "docker-compose не найден"

ok "Docker: $(docker --version | cut -d' ' -f3 | tr -d ',')"

# ── Setup .env ─────────────────────────────────────────────
if [ ! -f ".env" ]; then
  warn ".env файл не найден — копируем из .env.example"
  cp .env.example .env
  warn "ВАЖНО: Отредактируйте .env перед запуском в production!"
  echo ""
  read -p "  Продолжить с настройками по умолчанию? (y/n) " -n 1 -r
  echo ""
  [[ $REPLY =~ ^[Yy]$ ]] || exit 0
fi
ok ".env конфигурация загружена"

# ── Docker Compose command ─────────────────────────────────
DC="docker-compose"
docker compose version &>/dev/null 2>&1 && DC="docker compose"

# ── Mode selection ─────────────────────────────────────────
MODE=${1:-"start"}

case "$MODE" in
  start)
    log "Запуск всех сервисов..."
    $DC up -d --build
    echo ""
    log "Ожидание инициализации БД..."
    sleep 5
    echo ""
    ok "Система запущена!"
    echo ""
    echo -e "${CYAN}┌─ Доступные сервисы ──────────────────────────────┐"
    echo "│  🌐 Frontend (Next.js):   http://localhost:3000   │"
    echo "│  ⚙️  Backend (NestJS):    http://localhost:3001   │"
    echo "│  📖 Swagger API Docs:     http://localhost:3001/api/docs │"
    echo "│  🗄️  PostgreSQL:          localhost:5432          │"
    echo "│  📦 Redis:                localhost:6379          │"
    echo "└───────────────────────────────────────────────────┘${NC}"
    echo ""
    log "Логи: ./start.sh logs"
    log "Остановка: ./start.sh stop"
    ;;

  stop)
    log "Остановка сервисов..."
    $DC down
    ok "Сервисы остановлены"
    ;;

  restart)
    log "Перезапуск сервисов..."
    $DC down
    $DC up -d --build
    ok "Сервисы перезапущены"
    ;;

  logs)
    SERVICE=${2:-""}
    if [ -n "$SERVICE" ]; then
      $DC logs -f "$SERVICE"
    else
      $DC logs -f
    fi
    ;;

  status)
    $DC ps
    ;;

  seed)
    log "Запуск seed (начальные данные)..."
    $DC exec backend npm run seed
    ok "Данные загружены"
    ;;

  migrate)
    log "Запуск миграций БД..."
    $DC exec backend npm run migration:run
    ok "Миграции выполнены"
    ;;

  clean)
    warn "Удаление всех контейнеров и данных..."
    read -p "  Вы уверены? Все данные будут удалены! (y/n) " -n 1 -r
    echo ""
    [[ $REPLY =~ ^[Yy]$ ]] || exit 0
    $DC down -v --rmi local
    ok "Очистка выполнена"
    ;;

  dev)
    log "Запуск в режиме разработки (только инфраструктура)..."
    $DC up -d postgres redis
    ok "PostgreSQL и Redis запущены"
    echo ""
    echo -e "${YELLOW}Теперь запустите вручную:${NC}"
    echo "  Backend:  cd backend && npm install && npm run start:dev"
    echo "  Frontend: cd frontend && npm install && npm run dev"
    ;;

  *)
    echo "Использование: $0 {start|stop|restart|logs|status|seed|migrate|clean|dev}"
    echo ""
    echo "  start    — запустить все сервисы (Docker)"
    echo "  stop     — остановить все сервисы"
    echo "  restart  — перезапустить"
    echo "  logs     — показать логи [сервис: backend|frontend|postgres|redis]"
    echo "  status   — статус контейнеров"
    echo "  seed     — загрузить начальные данные"
    echo "  migrate  — запустить миграции БД"
    echo "  clean    — удалить всё (данные будут потеряны)"
    echo "  dev      — запустить только инфраструктуру (для разработки)"
    exit 1
    ;;
esac

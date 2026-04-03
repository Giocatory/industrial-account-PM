# Личный кабинет управления проектами промышленного оборудования

Веб-платформа для управления проектами промышленного оборудования. Реализована по техническому заданию.

---

## 🚀 Быстрый старт

### Вариант 1 — Docker (рекомендуется)

```bash
# 1. Клонировать / распаковать проект
cd project

# 2. Дать права на запуск скрипта (Linux/Mac)
chmod +x start.sh dev.sh

# 3. Запустить все сервисы
./start.sh start          # Linux/Mac
start.bat start           # Windows
```

После запуска откройте:

| Сервис | URL |
|--------|-----|
| 🌐 Фронтенд | http://localhost:3000 |
| ⚙️ Бэкенд API | http://localhost:3001 |
| 📖 Swagger Docs | http://localhost:3001/api/docs |

---

### Вариант 2 — Локальная разработка (без Docker)

**Требования:** Node.js 20+, PostgreSQL 16, Redis 7

```bash
# Запустить PostgreSQL и Redis самостоятельно, затем:
chmod +x dev.sh
./dev.sh
```

---

## 🔐 Тестовые аккаунты

Загрузите начальные данные:
```bash
./start.sh seed
# или: docker compose exec backend npm run seed
```

| Роль | Email | Пароль |
|------|-------|--------|
| Техадмин | techadmin@lk.local | Password123! |
| Администратор | admin@lk.local | Password123! |
| Старший менеджер | seniormanager@lk.local | Password123! |
| Менеджер | manager@lk.local | Password123! |
| Клиент | client@lk.local | Password123! |

---

## 🏗️ Архитектура

```
project/
├── backend/               # NestJS 10 + TypeScript 5 (strict)
│   └── src/
│       ├── modules/
│       │   ├── auth/          # JWT (15m access + 7d refresh httpOnly)
│       │   ├── users/         # RBAC, 5 ролей
│       │   ├── clients/       # Управление клиентами
│       │   ├── projects/      # 6 статусов, прогресс
│       │   ├── chat/          # WebSocket (Socket.IO)
│       │   ├── notifications/ # Real-time уведомления
│       │   ├── documents/     # S3 (Yandex Cloud)
│       │   ├── maintenance/   # Заявки ТОиР
│       │   ├── dashboard/     # Метрики по роли
│       │   ├── monitoring/    # CPU/RAM/сервисы/логи
│       │   ├── contacts/      # Команда и контакты
│       │   └── installation/  # Схемы установки
│       └── common/
│           └── guards/        # JwtAuthGuard, RolesGuard
│
├── frontend/              # Next.js 14 + TypeScript + Tailwind
│   └── src/
│       ├── app/
│       │   ├── (auth)/        # login, register, verify-email, forgot-password
│       │   └── (dashboard)/   # dashboard, projects, users, clients, documents,
│       │                      # maintenance, chat, monitoring, contacts,
│       │                      # installation, profile
│       ├── lib/
│       │   ├── api.ts         # Axios + auto-refresh токена
│       │   └── socket.ts      # Socket.IO хуки (chat + notifications)
│       └── store/
│           └── auth.store.ts  # Zustand (persist)
│
├── docker-compose.yml     # postgres + redis + backend + frontend
├── .env.example           # Шаблон переменных окружения
├── start.sh               # Скрипт запуска (Linux/Mac)
├── start.bat              # Скрипт запуска (Windows)
└── dev.sh                 # Локальная разработка без Docker
```

---

## ⚙️ Переменные окружения

Скопируйте `.env.example` в `.env` и заполните:

```env
# База данных
POSTGRES_DB=lk_db
POSTGRES_USER=lk_user
POSTGRES_PASSWORD=сложный_пароль

# JWT (обязательно сменить в prod!)
JWT_ACCESS_SECRET=ваш_секретный_ключ_access
JWT_REFRESH_SECRET=ваш_секретный_ключ_refresh

# Email (для OTP и уведомлений)
SMTP_HOST=smtp.yandex.ru
SMTP_PORT=465
SMTP_USER=ваш_email@yandex.ru
SMTP_PASS=пароль_приложения

# Yandex S3 (для документов)
S3_ENDPOINT=https://storage.yandexcloud.net
S3_BUCKET=название-бакета
S3_ACCESS_KEY=ключ_доступа
S3_SECRET_KEY=секретный_ключ
S3_REGION=ru-central1
```

---

## 🛠️ Команды управления

```bash
./start.sh start          # Запустить все сервисы
./start.sh stop           # Остановить
./start.sh restart        # Перезапустить
./start.sh logs           # Все логи
./start.sh logs backend   # Логи конкретного сервиса
./start.sh status         # Статус контейнеров
./start.sh seed           # Загрузить тестовые данные
./start.sh migrate        # Запустить миграции БД
./start.sh dev            # Только инфраструктура (PostgreSQL + Redis)
./start.sh clean          # Удалить всё (данные потеряются!)
```

---

## 📋 Функциональные модули

| # | Модуль | Описание |
|---|--------|----------|
| 3.1 | Авторизация | Email/пароль, OTP, JWT, блокировка после 3 попыток |
| 3.2 | Пользователи | RBAC, подтверждение, роли, пагинация |
| 3.3 | Клиенты | Список клиентов, карточка, проекты |
| 3.4 | Уведомления | Real-time WebSocket/SSE, группировка |
| 3.5 | Чат | WebSocket, диалоги по проектам |
| 3.6 | Проекты | 6 статусов, прогресс-бар, документы, ТОиР |
| 3.7 | Дашборд | Метрики по роли |
| 3.8 | Профиль | Редактирование, смена пароля, аватар |
| 3.9 | Навигация | Боковое меню, хлебные крошки, RBAC маршруты |
| 3.10 | Контакты | Карточки команды, контакты компании |
| 3.11 | Документы | Таблица, фильтры, S3 загрузка/скачивание |
| 3.12 | Заявки ТО | Форма, история, статусы |
| 3.13 | Схема установки | react-zoom-pan-pinch, интерактивные метки |
| 3.14 | Мониторинг | CPU/RAM/диск, сервисы, логи (только техадмин) |

---

## 🔧 Технологический стек

**Backend:** Node.js 20 LTS · NestJS 10 · TypeScript 5 (strict) · PostgreSQL 16 · TypeORM 0.3 · Redis 7 · Socket.IO · JWT · Yandex S3 · Swagger · Docker

**Frontend:** Next.js 14 · TypeScript · shadcn/ui · Tailwind CSS · TanStack React Table · react-zoom-pan-pinch · Zustand · TanStack Query · Zod · react-hook-form

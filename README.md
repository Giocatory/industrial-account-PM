# Личный кабинет управления проектами промышленного оборудования

<div align="center">

![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white)
![NestJS](https://img.shields.io/badge/NestJS-10.x-E0234E?style=flat-square&logo=nestjs&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-14.x-000000?style=flat-square&logo=next.js&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=flat-square&logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-7-DC382D?style=flat-square&logo=redis&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-4.x-010101?style=flat-square&logo=socket.io&logoColor=white)

Веб-платформа полного цикла для управления проектами промышленного оборудования.
Реализует взаимодействие заказчик–исполнитель: отслеживание статусов, обмен документами, чат в реальном времени, заявки на ТОиР и системный мониторинг.

</div>

---

## Содержание

- [Обзор](#обзор)
- [Демо-аккаунты](#демо-аккаунты)
- [Функциональность](#функциональность)
- [Архитектура](#архитектура)
- [Технологический стек](#технологический-стек)
- [Структура проекта](#структура-проекта)
- [Быстрый старт](#быстрый-старт)
  - [Вариант 1 — Локально (без Docker)](#вариант-1--локально-без-docker)
  - [Вариант 2 — Docker Compose](#вариант-2--docker-compose)
- [Переменные окружения](#переменные-окружения)
- [API Reference](#api-reference)
- [Роли и права доступа (RBAC)](#роли-и-права-доступа-rbac)
- [Модули системы](#модули-системы)
- [База данных](#база-данных)
- [WebSocket события](#websocket-события)
- [Скрипты управления](#скрипты-управления)
- [Решение проблем](#решение-проблем)

---

## Обзор

Платформа обеспечивает полный цикл взаимодействия между заказчиком и исполнителем в сфере промышленного оборудования:

- **Дашборд** с метриками, адаптированными под каждую из 5 ролей
- **Управление проектами** с 6 статусами, прогресс-баром и историей изменений
- **Чат в реальном времени** (WebSocket/Socket.IO), привязанный к проектам
- **Push-уведомления** в реальном времени с группировкой по датам
- **Документооборот** с загрузкой в Yandex S3 и скачиванием по presigned URL
- **Заявки на ТОиР** с отслеживанием статусов
- **Схемы установки** с зумом, панорамированием и интерактивными метками узлов
- **Панель мониторинга** (CPU, RAM, диск, сервисы, логи) — только для техадмина
- **RBAC** — 5 ролей с гранулярным контролем доступа

---

## Демо-аккаунты

Тестовые пользователи создаются **автоматически при первом запуске** бэкенда (через `SeedService`).

| Роль | Email | Пароль |
|------|-------|--------|
| Техадмин | `techadmin@lk.local` | `Password123!` |
| Администратор | `admin@lk.local` | `Password123!` |
| Старший менеджер | `seniormanager@lk.local` | `Password123!` |
| Менеджер | `manager@lk.local` | `Password123!` |
| Клиент | `client@lk.local` | `Password123!` |

> При регистрации через форму новый аккаунт получает статус `pending` и требует подтверждения администратора. Демо-аккаунты уже активны.

---

## Функциональность

### 3.1 Авторизация и регистрация
- Вход по email + пароль с серверной валидацией (class-validator + bcrypt)
- Регистрация: организация, ФИО, должность, телефон, email
- Подтверждение email через одноразовый 6-значный OTP-код (действует 15 минут)
- Восстановление пароля через email: запрос OTP → ввод кода → новый пароль
- **Блокировка после 3 неудачных попыток** входа на 15 минут
- Жизненный цикл аккаунта: `pending → active` / `pending → rejected`
- JWT: access-токен (15 мин) + refresh-токен (7 дней, httpOnly cookie)
- Автообновление access-токена через Axios interceptor без перелогина

### 3.2 Управление пользователями *(admin, senior_manager)*
- Таблица с сортировкой по имени/дате (кликабельные заголовки ↑↓)
- Фильтрация по статусу (`pending`, `active`, `rejected`, `blocked`) и роли
- Пагинация (20 записей на страницу)
- Подтверждение / отклонение / блокировка аккаунтов
- Детальная карточка с режимом редактирования
- Изменение роли с обязательным шагом подтверждения

### 3.3 Управление клиентами *(admin, senior_manager, manager)*
- Отдельный раздел для пользователей с ролью `client`
- Сортировка по фамилии, организации, дате регистрации
- Детальная карточка: личные данные + список всех проектов клиента с прогресс-барами
- Прямые ссылки на каждый проект клиента

### 3.4 Система уведомлений
- Индикатор непрочитанных в шапке и боковом меню (с автообновлением)
- 5 типов: `registration`, `request`, `status_change`, `document_upload`, `system`
- Доставка в реальном времени через WebSocket (namespace `/notifications`)
- Отдельная страница уведомлений с **группировкой по датам**
- Отметка отдельных и всех уведомлений как прочитанных

### 3.5 Чат
- Боковая панель со списком всех проектов пользователя (как комнаты чата)
- Обмен сообщениями в реальном времени (Socket.IO)
- Встроенный чат на странице детали проекта (вкладка «Чат»)
- История сообщений с **автоскроллом** вниз
- Индикаторы непрочитанных по каждому диалогу
- Оптимистичное обновление UI (сообщение появляется немедленно)
- Поддержка нескольких открытых вкладок у одного пользователя

### 3.6 Проекты
- Карточки с бейджем статуса и прогресс-баром
- **6 статусов:** Новый → В работе → На проверке → Тестирование → Сдача → Завершён
- Детальная страница с вкладками: **Обзор, Документы, ТОиР, Чат, История**
- Привязка оборудования (название + модель)
- Загрузка документов прямо из вкладки «Документы» проекта
- Назначение менеджера — только для senior_manager / admin
- Фильтрация по статусу + поиск по названию

### 3.7 Дашборд
- Карточки метрик, адаптированные под роль текущего пользователя:
  - **Клиент:** число проектов, завершённые, заявки ТО, ссылка на активный проект
  - **Менеджер:** мои проекты, в работе, новые заявки ТО, завершённые
  - **Admin/Senior manager:** все пользователи, ожидающие, все проекты, активные, новые ТО
  - **Техадмин:** перенаправление на мониторинг

### 3.8 Профиль пользователя
- Редактирование: ФИО, организация, должность, телефон
- Загрузка аватара: наведение на фото → иконка камеры → выбор файла → загрузка в S3
- Смена пароля с проверкой текущего (bcrypt)

### 3.9 Навигация и интерфейс
- Боковое меню с возможностью сворачивания (иконочный режим)
- Хлебные крошки с динамическими заголовками
- Полная защита маршрутов по роли (`JwtAuthGuard` + `RolesGuard`)
- Адаптивный дизайн: мобильное меню (бургер), desktop sidebar
- Тёмная / светлая тема (next-themes)

### 3.10 Контакты
- Карточки команды: фото (или инициалы), имя, должность, email, телефон
- Блок общих контактов: телефон, email, адрес, режим работы, Telegram

### 3.11 Документы
- Таблица с категориями: паспорт, инструкция, чертёж, договор, прочее
- Поиск по названию + каскадные фильтры (категория → оборудование)
- Загрузка файлов в Yandex Cloud S3 (multipart/form-data через Multer)
- Скачивание по presigned URL (время жизни 1 час)
- Удаление файла из S3 и БД

### 3.12 Заявки на ТО и Р
- Форма: выбор оборудования + описание проблемы (только для клиентов)
- 4 статуса: `new` → `in_progress` → `completed` / `rejected`
- История заявок для всех ролей (с комментариями менеджера)
- Менеджер добавляет комментарий при изменении статуса

### 3.13 Схема установки
- Интерактивный вьюер на базе `react-zoom-pan-pinch`
- Переключение между несколькими схемами (боковое меню)
- Интерактивные метки на узлах: клик → всплывающее описание
- Визуальные соединительные линии между узлами (SVG)
- Кнопки зума +/−, сброс масштаба, пан-перемещение

### 3.14 Панель мониторинга *(только tech_admin)*
- **CPU:** нагрузка %, число ядер, load average (1/5/15 мин)
- **RAM:** занято / всего, %
- **Диск:** занято / всего, %
- **Сервисы:** PostgreSQL, Redis, S3, API — статус + задержка в ms
- **Метрики:** активные сессии, запросов/мин, среднее время ответа, ошибок/час
- **Логи:** фильтрация по уровню (info/warn/error/debug) и компоненту
- Автообновление: метрики каждые 10с, логи каждые 5с

---

## Архитектура

```
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND                            │
│                    Next.js 14 (Port 3000)                   │
│    App Router · SSR/CSR · Tailwind CSS · Zustand · Axios    │
└──────────────────────┬──────────────────┬───────────────────┘
                       │ HTTP REST         │ Socket.IO
                       │ Bearer JWT        │ (ws upgrade over HTTP)
┌──────────────────────▼──────────────────▼───────────────────┐
│                         BACKEND                             │
│                   NestJS 10 (Port 3001)                     │
│      TypeScript strict · RBAC Guards · Swagger UI           │
│                                                             │
│  ┌──────────┐ ┌──────────┐ ┌───────────┐ ┌─────────────┐   │
│  │   Auth   │ │ Projects │ │   Chat    │ │ Notification│   │
│  │  Module  │ │  Module  │ │  Gateway  │ │  Gateway    │   │
│  └──────────┘ └──────────┘ └───────────┘ └─────────────┘   │
│  ┌──────────┐ ┌──────────┐ ┌───────────┐ ┌─────────────┐   │
│  │  Users   │ │  Docs    │ │Maintenance│ │  Monitoring │   │
│  │  Module  │ │  + S3    │ │  Module   │ │  Module     │   │
│  └──────────┘ └──────────┘ └───────────┘ └─────────────┘   │
└──────────┬─────────────────────────┬────────────────────────┘
           │ TypeORM                  │ ioredis
┌──────────▼──────────┐   ┌──────────▼──────────┐
│    PostgreSQL 16     │   │       Redis 7        │
│   (все сущности)     │   │   (сессии, кэш)     │
└─────────────────────┘   └─────────────────────┘
                                      │
                           ┌──────────▼──────────┐
                           │  Yandex Cloud S3     │
                           │  (документы, аватары)│
                           └─────────────────────┘
```

---

## Технологический стек

### Backend

| Технология | Версия | Назначение |
|-----------|--------|-----------|
| Node.js | 20 LTS | Серверная платформа |
| NestJS | 10.x | Основной фреймворк (DI, модули, guards) |
| TypeScript | 5.x strict | Полная типизация |
| PostgreSQL | 16 | Основная реляционная БД |
| TypeORM | 0.3.x | ORM с auto-synchronize (dev) |
| Redis | 7 | Кэширование, сессии |
| Socket.IO | 4.x | WebSocket: чат + уведомления |
| JWT | — | Access 15m + Refresh 7d (httpOnly) |
| bcryptjs | — | Хеширование паролей (cost=12) |
| Yandex S3 | AWS SDK v3 | Файловое хранилище |
| Nodemailer | 6.x | SMTP: OTP + уведомления |
| Swagger/OpenAPI | 7.x | Интерактивная документация API |
| Multer | 1.x | Загрузка файлов (memory storage) |
| class-validator | 0.14 | Валидация входящих DTO |
| class-transformer | 0.5 | @Exclude(), @Transform() |
| Passport | 0.6 | JWT + Local стратегии |

### Frontend

| Технология | Версия | Назначение |
|-----------|--------|-----------|
| Next.js | 14.2.x | App Router, SSR/CSR, маршрутизация |
| TypeScript | 5.x | Строгая типизация |
| Tailwind CSS | 3.x | Утилитарные стили |
| Radix UI / shadcn | — | Доступные UI-примитивы |
| TanStack Query | 5.x | Серверное состояние, кэш, auto-refetch |
| TanStack Table | 8.x | Таблицы с сортировкой и фильтрацией |
| Zustand | 4.x | Клиентское состояние (auth + persist) |
| Socket.IO client | 4.x | WebSocket-клиент |
| Axios | 1.x | HTTP + auto-refresh interceptor |
| react-zoom-pan-pinch | 3.x | Интерактивные схемы |
| react-hook-form | 7.x | Управление формами |
| Zod | 3.x | Схемы валидации |
| date-fns | 3.x | Форматирование дат (ru locale) |
| Recharts | 2.x | Графики (мониторинг) |
| Sonner | — | Toast уведомления |
| next-themes | — | Тёмная / светлая тема |
| lucide-react | 0.4x | Иконки |

---

## Структура проекта

```
project/
├── backend/                            # NestJS приложение
│   ├── src/
│   │   ├── app.module.ts               # Корневой модуль (все импорты)
│   │   ├── main.ts                     # Bootstrap: Swagger, CORS, cookie-parser, ValidationPipe
│   │   ├── common/
│   │   │   └── guards/
│   │   │       └── auth.guard.ts       # JwtAuthGuard, RolesGuard, @Roles(), @CurrentUser()
│   │   ├── database/
│   │   │   ├── seed.service.ts         # OnApplicationBootstrap → создаёт тестовых пользователей
│   │   │   ├── seed.module.ts
│   │   │   └── seed.ts                 # Standalone seed script (npm run seed)
│   │   └── modules/
│   │       ├── auth/
│   │       │   ├── auth.controller.ts  # POST /register /login /refresh /logout /forgot /reset
│   │       │   ├── auth.service.ts     # Логика: OTP, bcrypt, JWT, lockout
│   │       │   ├── auth.module.ts
│   │       │   ├── mail.service.ts     # Nodemailer (OTP + reset password emails)
│   │       │   ├── strategies/
│   │       │   │   ├── jwt.strategy.ts
│   │       │   │   └── local.strategy.ts
│   │       │   └── dto/
│   │       │       ├── login.dto.ts    # LoginDto + VerifyEmailDto + ForgotPasswordDto + ResetPasswordDto
│   │       │       └── register.dto.ts
│   │       ├── users/
│   │       │   ├── user.entity.ts      # UserRole enum, UserStatus enum, все поля с типами
│   │       │   ├── users.service.ts    # CRUD + approve/reject/block/changeRole/changePassword
│   │       │   ├── users.controller.ts # GET/PATCH/POST с RBAC
│   │       │   ├── users.module.ts
│   │       │   └── dto/
│   │       │       └── update-user.dto.ts  # UpdateUserDto, ChangeRoleDto, ChangePasswordDto
│   │       ├── clients/
│   │       │   ├── clients.service.ts  # Запросы только role=client, сортировка
│   │       │   └── clients.controller.ts
│   │       ├── projects/
│   │       │   ├── project.entity.ts   # ProjectStatus (6 значений), relations: manager, client
│   │       │   ├── projects.service.ts # RBAC-скоупинг, фильтрация, сортировка
│   │       │   └── projects.controller.ts
│   │       ├── chat/
│   │       │   ├── chat.entity.ts      # ChatMessage entity (projectId, senderId, recipientId)
│   │       │   ├── chat.gateway.ts     # Socket.IO namespace=/chat: joinProject, sendMessage, markRead
│   │       │   ├── chat.service.ts     # saveMessage, getMessages, getDialogs, markRead
│   │       │   └── chat.controller.ts  # REST: dialogs, messages history, unread, markProjectRead
│   │       ├── notifications/
│   │       │   ├── notification.entity.ts  # NotificationType enum (5 типов)
│   │       │   ├── notifications.gateway.ts # Socket.IO namespace=/notifications
│   │       │   ├── notifications.service.ts # create (+ push WS), getForUser, markRead, unreadCount
│   │       │   └── notifications.controller.ts
│   │       ├── documents/
│   │       │   ├── document.entity.ts  # DocumentCategory enum, s3Key, s3Url, fileSize
│   │       │   ├── documents.service.ts # upload (S3), findAll (cascade filters), getDownloadUrl, delete
│   │       │   ├── documents.controller.ts
│   │       │   └── s3.service.ts       # PutObjectCommand, GetObjectCommand (presigned), DeleteObjectCommand
│   │       ├── maintenance/
│   │       │   ├── maintenance.entity.ts   # MaintenanceStatus (4 статуса)
│   │       │   ├── maintenance.service.ts  # create (client), updateStatus (manager)
│   │       │   └── maintenance.controller.ts
│   │       ├── dashboard/
│   │       │   └── dashboard.service.ts    # Метрики по роли: client/manager/admin/tech_admin
│   │       ├── monitoring/
│   │       │   └── monitoring.service.ts   # os.cpus(), os.freemem(), disk simulation, logs ring buffer
│   │       ├── contacts/
│   │       │   └── contacts.service.ts     # Статические данные команды и компании
│   │       └── installation/
│   │           └── installation.service.ts  # Схемы с узлами (хранятся в памяти/БД)
│   ├── package.json
│   ├── tsconfig.json
│   ├── nest-cli.json
│   └── Dockerfile
│
├── frontend/                           # Next.js приложение
│   ├── src/
│   │   ├── app/
│   │   │   ├── globals.css             # CSS переменные (light/dark), Tailwind, scrollbar
│   │   │   ├── layout.tsx              # Root layout: Inter font, Providers, Toaster
│   │   │   ├── page.tsx                # redirect → /dashboard
│   │   │   ├── (auth)/                 # Публичные страницы (без dashboard layout)
│   │   │   │   ├── layout.tsx          # Центрированная форма с градиентным фоном
│   │   │   │   ├── login/page.tsx      # Форма входа + link to register + forgot-password
│   │   │   │   ├── register/page.tsx   # Расширенная форма регистрации
│   │   │   │   ├── verify-email/page.tsx # Ввод OTP-кода (6 цифр)
│   │   │   │   └── forgot-password/page.tsx # Двухшаговый сброс пароля
│   │   │   └── (dashboard)/            # Защищённые маршруты
│   │   │       ├── layout.tsx          # Sidebar + Header + breadcrumbs + RBAC guard
│   │   │       ├── dashboard/page.tsx  # Метрики по роли
│   │   │       ├── projects/
│   │   │       │   ├── page.tsx        # Сетка карточек + фильтры + пагинация
│   │   │       │   └── [id]/page.tsx   # Tabs: Обзор / Документы / ТОиР / Чат / История
│   │   │       ├── users/
│   │   │       │   ├── page.tsx        # Таблица с сортировкой, фильтрами, actions
│   │   │       │   └── [id]/page.tsx   # Карточка с edit mode + role change + approve/reject/block
│   │   │       ├── clients/
│   │   │       │   ├── page.tsx        # Сетка карточек с сортировкой
│   │   │       │   └── [id]/page.tsx   # Профиль клиента + его проекты
│   │   │       ├── documents/page.tsx  # Таблица + cascade filters + upload + download
│   │   │       ├── maintenance/page.tsx # Список заявок + форма создания (client)
│   │   │       ├── chat/page.tsx       # Sidebar (проекты) + область чата + real-time
│   │   │       ├── notifications/page.tsx # Сгруппированные по датам уведомления
│   │   │       ├── installation/page.tsx  # react-zoom-pan-pinch + SVG метки
│   │   │       ├── monitoring/page.tsx    # CPU/RAM/Disk + Services + AppMetrics + Logs
│   │   │       ├── contacts/page.tsx      # Команда + контакты компании
│   │   │       └── profile/page.tsx       # Редактирование + аватар + смена пароля
│   │   ├── components/
│   │   │   └── providers.tsx           # QueryClientProvider + ThemeProvider
│   │   ├── lib/
│   │   │   ├── api.ts                  # Axios instance + все API-методы + auto-refresh interceptor
│   │   │   ├── socket.ts               # useChatSocket() + useNotificationsSocket() (stable refs)
│   │   │   └── utils.ts               # cn(), formatDate(), formatBytes(), статусные маппинги
│   │   ├── store/
│   │   │   └── auth.store.ts           # Zustand persist: user, accessToken, ROLE_LABELS
│   │   └── types/
│   │       └── notification.ts         # NotificationType enum
│   ├── package.json
│   ├── tailwind.config.js
│   ├── next.config.js
│   ├── postcss.config.js
│   └── Dockerfile
│
├── start.sh                # Linux/macOS: Docker или local запуск
├── start.bat               # Windows: интерактивное меню
├── setup-local.bat         # Windows: установка зависимостей
├── run-local.bat           # Windows: запуск без Docker
├── dev.sh                  # Linux/macOS: локальная разработка
├── setup-local.sh          # Linux/macOS: установка без Docker
├── docker-compose.yml      # 4 сервиса: postgres, redis, backend, frontend
├── .env.example            # Шаблон всех переменных окружения
└── README.md
```

---

## Быстрый старт

### Требования

| Компонент | Версия | Для Docker | Для Local |
|-----------|--------|:----------:|:---------:|
| Node.js | 20 LTS+ | — | ✅ |
| PostgreSQL | 16 | — | ✅ |
| Redis | 7 | — | ✅ |
| Docker Desktop | Any | ✅ | — |

---

### Вариант 1 — Локально (без Docker)

#### Шаг 1. Клонирование репозитория

```bash
git clone https://github.com/your-org/lk-project.git
cd lk-project
```

#### Шаг 2. Настройка PostgreSQL

```bash
# Создать пользователя и базу данных
psql -U postgres -c "CREATE USER lk_user WITH PASSWORD 'lk_pass';"
psql -U postgres -c "CREATE DATABASE lk_db OWNER lk_user;"
```

Или внутри `psql`:
```sql
CREATE USER lk_user WITH PASSWORD 'lk_pass';
CREATE DATABASE lk_db OWNER lk_user;
GRANT ALL PRIVILEGES ON DATABASE lk_db TO lk_user;
```

#### Шаг 3. Запуск Redis

```bash
# macOS
brew install redis && brew services start redis

# Ubuntu/Debian
sudo apt install redis-server && sudo systemctl start redis-server

# Windows
winget install Redis.Redis
```

#### Шаг 4. Установка и запуск

**Linux / macOS:**
```bash
chmod +x setup-local.sh dev.sh
./setup-local.sh   # Устанавливает зависимости, создаёт .env файлы
./dev.sh           # Запускает backend + frontend одновременно
```

**Windows (PowerShell):**
```powershell
# Первый раз — установка
.\setup-local.bat

# Каждый раз — запуск
.\run-local.bat
```

Или через интерактивное меню:
```powershell
.\start.bat   # → выбрать "2 - Local"
```

#### Шаг 5. Открыть браузер

| Сервис | URL |
|--------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:3001 |
| Swagger UI | http://localhost:3001/api/docs |

> Тестовые аккаунты создаются **автоматически** при первом запуске бэкенда.

---

### Вариант 2 — Docker Compose

```bash
git clone https://github.com/your-org/lk-project.git
cd lk-project

# Скопировать и при необходимости отредактировать .env
cp .env.example .env

# Linux/macOS
chmod +x start.sh && ./start.sh start

# Windows
.\start.bat   # → выбрать "1 - Docker"
```

Docker Compose поднимает 4 контейнера:
- `lk_postgres` — PostgreSQL 16
- `lk_redis` — Redis 7
- `lk_backend` — NestJS (порт 3001)
- `lk_frontend` — Next.js (порт 3000)

---

### Ручной запуск (два терминала)

```bash
# Терминал 1 — Backend
cd backend
cp .env.example .env          # Отредактировать если нужно
npm install
npm run start:dev             # Перезапускается при изменениях файлов

# Терминал 2 — Frontend
cd frontend
echo "NEXT_PUBLIC_API_URL=http://localhost:3001" > .env.local
echo "NEXT_PUBLIC_WS_URL=http://localhost:3001" >> .env.local
npm install
npm run dev
```

---

## Переменные окружения

### Backend (`backend/.env`)

```env
# ── Приложение ──────────────────────────────────────────────────
NODE_ENV=development          # development | production
PORT=3001

# ── PostgreSQL ──────────────────────────────────────────────────
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=lk_db
DATABASE_USER=lk_user
DATABASE_PASSWORD=lk_pass

# ── Redis ────────────────────────────────────────────────────────
REDIS_HOST=localhost
REDIS_PORT=6379

# ── JWT ──────────────────────────────────────────────────────────
# ОБЯЗАТЕЛЬНО сменить в production!
JWT_ACCESS_SECRET=your_access_secret_at_least_32_chars
JWT_REFRESH_SECRET=your_refresh_secret_at_least_32_chars
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

# ── SMTP (для OTP и сброса пароля) ──────────────────────────────
SMTP_HOST=smtp.yandex.ru
SMTP_PORT=465                 # 465 (SSL) или 587 (STARTTLS)
SMTP_USER=your@yandex.ru
SMTP_PASS=your_app_password   # Пароль приложения, НЕ основной
SMTP_FROM=noreply@example.ru

# ── Yandex Cloud S3 ─────────────────────────────────────────────
S3_ENDPOINT=https://storage.yandexcloud.net
S3_BUCKET=your-bucket-name
S3_ACCESS_KEY=your_access_key_id
S3_SECRET_KEY=your_secret_access_key
S3_REGION=ru-central1

# ── CORS ────────────────────────────────────────────────────────
FRONTEND_URL=http://localhost:3000
```

### Frontend (`frontend/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
# ВАЖНО: используйте http:// или https://, НЕ ws:// или wss://
# Socket.IO сам устанавливает WebSocket поверх HTTP
NEXT_PUBLIC_WS_URL=http://localhost:3001
```

---

## API Reference

Полная интерактивная документация: **http://localhost:3001/api/docs** (Swagger UI)

### Аутентификация

Все защищённые эндпоинты требуют заголовок:
```
Authorization: Bearer <access_token>
```

Refresh-токен передаётся автоматически через httpOnly cookie `refreshToken`.

---

### Auth — `/api/auth`

| Метод | Путь | Доступ | Описание |
|-------|------|--------|----------|
| `POST` | `/register` | Публичный | Регистрация (создаёт pending аккаунт) |
| `POST` | `/verify-email` | Публичный | Подтверждение email по OTP |
| `POST` | `/login` | Публичный | Вход → access_token + refresh cookie |
| `POST` | `/refresh` | httpOnly cookie | Обновление access-токена |
| `POST` | `/logout` | Авторизован | Очищает refresh cookie |
| `POST` | `/forgot-password` | Публичный | Отправить OTP на email |
| `POST` | `/reset-password` | Публичный | Сменить пароль по OTP |

**Пример: Вход**
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@lk.local",
  "password": "Password123!"
}
```

**Ответ:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "admin@lk.local",
    "firstName": "Главный",
    "lastName": "Администраторов",
    "role": "admin",
    "status": "active",
    "emailVerified": true
  }
}
```

---

### Users — `/api/users`

| Метод | Путь | Роли | Описание |
|-------|------|------|----------|
| `GET` | `/` | admin, senior_manager | Список (фильтры: status, role, search, sortBy, sortDir) |
| `GET` | `/me` | Все | Текущий пользователь |
| `GET` | `/:id` | admin, senior_manager | Карточка пользователя |
| `PATCH` | `/:id` | admin | Редактировать данные |
| `POST` | `/:id/approve` | admin | Подтвердить аккаунт |
| `POST` | `/:id/reject` | admin | Отклонить аккаунт |
| `POST` | `/:id/block` | admin | Заблокировать |
| `PATCH` | `/:id/role` | admin | Изменить роль |
| `PATCH` | `/me/password` | Все | Сменить пароль |

**Query параметры для GET /:**
```
?search=Иван&status=pending&role=client&sortBy=lastName&sortDir=ASC&page=1&limit=20
```

---

### Projects — `/api/projects`

| Метод | Путь | Роли | Описание |
|-------|------|------|----------|
| `GET` | `/` | Все | Список (фильтруется по роли автоматически) |
| `GET` | `/:id` | Все | Детали проекта |
| `POST` | `/` | admin, senior_manager | Создать проект |
| `PATCH` | `/:id` | admin, senior_manager, manager | Обновить |
| `PATCH` | `/:id/status` | admin, senior_manager, manager | Статус + прогресс |
| `PATCH` | `/:id/assign-manager` | admin, senior_manager | Назначить менеджера |
| `DELETE` | `/:id` | admin, senior_manager | Удалить |

**Статусы проекта:**
```
new → in_progress → review → testing → delivery → completed
```

**Пример изменения статуса:**
```http
PATCH /api/projects/:id/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "in_progress",
  "progress": 25
}
```

---

### Documents — `/api/documents`

| Метод | Путь | Роли | Описание |
|-------|------|------|----------|
| `GET` | `/` | Все | Список (фильтры: category, equipmentName, search) |
| `POST` | `/upload` | admin, senior_manager, manager | Загрузить файл (multipart/form-data) |
| `GET` | `/:id/download` | Все | Presigned URL для скачивания |
| `DELETE` | `/:id` | admin, senior_manager, manager | Удалить файл |

**Категории:** `passport` | `instruction` | `drawing` | `contract` | `other`

**Пример загрузки:**
```http
POST /api/documents/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <binary>
name: "Паспорт компрессора А1"
category: "passport"
equipmentName: "Компрессор А1"
projectId: "uuid"
```

---

### Chat — `/api/chat`

| Метод | Путь | Описание |
|-------|------|----------|
| `GET` | `/dialogs` | Диалоги текущего пользователя (по проектам) |
| `GET` | `/messages/:projectId` | История сообщений (параметры: page, limit) |
| `GET` | `/unread` | Количество непрочитанных |
| `POST` | `/messages/:projectId/read` | Пометить все сообщения проекта прочитанными |

---

### Notifications — `/api/notifications`

| Метод | Путь | Описание |
|-------|------|----------|
| `GET` | `/` | Уведомления пользователя (page, limit) |
| `GET` | `/unread-count` | `{ count: number }` |
| `PATCH` | `/:id/read` | Отметить одно прочитанным |
| `PATCH` | `/read-all` | Отметить все прочитанными |

---

### Maintenance — `/api/maintenance`

| Метод | Путь | Роли | Описание |
|-------|------|------|----------|
| `GET` | `/` | Все | Список заявок (по роли) |
| `POST` | `/` | client | Создать заявку |
| `PATCH` | `/:id/status` | admin, senior_manager, manager | Изменить статус + комментарий |

**Статусы заявок:** `new` → `in_progress` → `completed` / `rejected`

---

### Monitoring — `/api/monitoring` *(только tech_admin)*

| Метод | Путь | Описание |
|-------|------|----------|
| `GET` | `/system` | CPU (%, cores, load avg), RAM (%, total/free), Disk (%, total/free), uptime |
| `GET` | `/services` | Статус PostgreSQL, Redis, S3, API + latencyMs |
| `GET` | `/app` | activeSessions, requestsLastMinute, avgResponseMs, errorsLastHour |
| `GET` | `/logs` | Логи (фильтры: level=info/warn/error/debug, component=app/db/api, limit=100) |

---

### Прочие эндпоинты

```
GET  /api/dashboard                    — метрики по роли
GET  /api/clients                      — список клиентов (?search&page&limit&sortBy&sortDir)
GET  /api/clients/:id                  — клиент + его проекты
GET  /api/contacts/team                — команда
GET  /api/contacts/company             — контакты компании
GET  /api/installation                 — схемы установки (?projectId)
GET  /api/installation/:id             — схема с узлами
```

---

## Роли и права доступа (RBAC)

Роли определены в `UserRole` enum. Каждый эндпоинт защищён комбинацией `JwtAuthGuard` + `RolesGuard` + декоратора `@Roles()`.

| Действие | tech_admin | admin | senior_manager | manager | client |
|----------|:---------:|:-----:|:--------------:|:-------:|:------:|
| Дашборд | ✅ | ✅ | ✅ | ✅ | ✅ |
| Свои проекты | — | ✅ | ✅ | ✅ | ✅ |
| Все проекты | — | ✅ | ✅ | — | — |
| Создать проект | — | ✅ | ✅ | — | — |
| Ред. проект | — | ✅ | ✅ | ✅* | — |
| Назначить менеджера | — | ✅ | ✅ | — | — |
| Список пользователей | — | ✅ | 👁️ | — | — |
| Подтверждение/блокировка | — | ✅ | — | — | — |
| Изменение ролей | — | ✅ | — | — | — |
| Раздел клиентов | — | ✅ | ✅ | ✅ | — |
| Загрузка документов | — | ✅ | ✅ | ✅ | — |
| Создание заявок ТО | — | — | — | — | ✅ |
| Обработка заявок ТО | — | ✅ | ✅ | ✅ | — |
| Панель мониторинга | ✅ | — | — | — | — |
| Чат | ✅ | ✅ | ✅ | ✅ | ✅ |
| Уведомления | ✅ | ✅ | ✅ | ✅ | ✅ |
| Контакты | ✅ | ✅ | ✅ | ✅ | ✅ |
| Схемы установки | — | ✅ | ✅ | ✅ | ✅ |

> \* Менеджер редактирует только **свои** проекты

**Пример использования в коде:**
```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SENIOR_MANAGER)
@Post(':id/approve')
approve(@Param('id') id: string) {
  return this.usersService.approve(id);
}
```

---

## База данных

### Таблицы

| Таблица | Описание |
|---------|----------|
| `users` | Пользователи, роли, статусы, OTP, счётчик попыток входа |
| `projects` | Проекты со статусами и прогрессом |
| `chat_messages` | Сообщения чата, привязанные к проекту |
| `notifications` | Уведомления по типам |
| `documents` | Метаданные файлов (сами файлы в S3) |
| `maintenance_requests` | Заявки на техническое обслуживание |

### Схема `users`

```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
email           VARCHAR UNIQUE NOT NULL
password        VARCHAR NOT NULL          -- bcrypt hash, cost=12
firstName       VARCHAR NOT NULL
lastName        VARCHAR NOT NULL
middleName      VARCHAR
organization    VARCHAR
position        VARCHAR
phone           VARCHAR
role            ENUM('tech_admin','admin','senior_manager','manager','client') DEFAULT 'client'
status          ENUM('pending','active','rejected','blocked') DEFAULT 'pending'
emailVerified   BOOLEAN DEFAULT false
avatar          VARCHAR                   -- URL в S3
otpCode         VARCHAR                   -- 6 цифр, expires в 15 мин
otpExpiresAt    TIMESTAMP
loginAttempts   INT DEFAULT 0
lockedUntil     TIMESTAMP                 -- заблокирован до этого времени
createdAt       TIMESTAMP DEFAULT now()
updatedAt       TIMESTAMP DEFAULT now()
```

### Схема `projects`

```sql
id              UUID PRIMARY KEY
title           VARCHAR NOT NULL
description     TEXT
equipmentName   VARCHAR
equipmentModel  VARCHAR
status          ENUM('new','in_progress','review','testing','delivery','completed') DEFAULT 'new'
progress        INT DEFAULT 0             -- 0–100
managerId       UUID REFERENCES users(id)
clientId        UUID REFERENCES users(id) NOT NULL
startDate       TIMESTAMP
endDate         TIMESTAMP
createdAt       TIMESTAMP
updatedAt       TIMESTAMP
```

### Схема `chat_messages`

```sql
id              UUID PRIMARY KEY
content         TEXT NOT NULL
projectId       VARCHAR                   -- комната чата
senderId        VARCHAR NOT NULL          -- FK → users.id
recipientId     VARCHAR                   -- для личных сообщений
isRead          BOOLEAN DEFAULT false
createdAt       TIMESTAMP
```

> **TypeORM `synchronize: true`** в development-режиме создаёт и синхронизирует таблицы автоматически. В production переключитесь на миграции:
> ```bash
> npm run migration:generate -- -n MigrationName
> npm run migration:run
> ```

---

## WebSocket события

### Namespace `/chat`

```javascript
const socket = io('http://localhost:3001/chat', {
  query: { userId: 'your-user-uuid' },
  withCredentials: true,
  transports: ['websocket', 'polling'],
});
```

| Направление | Событие | Payload | Описание |
|-------------|---------|---------|----------|
| C → S | `joinProject` | `{ projectId: string }` | Войти в комнату проекта |
| C → S | `leaveProject` | `{ projectId: string }` | Покинуть комнату |
| C → S | `sendMessage` | `{ projectId, senderId, content, recipientId? }` | Отправить сообщение |
| C → S | `markRead` | `{ messageIds: string[] }` | Пометить прочитанными |
| S → C | `newMessage` | `ChatMessage` | Новое входящее сообщение |

### Namespace `/notifications`

```javascript
const socket = io('http://localhost:3001/notifications', {
  query: { userId: 'your-user-uuid' },
  withCredentials: true,
});
```

| Направление | Событие | Payload | Описание |
|-------------|---------|---------|----------|
| S → C | `notification` | `Notification` | Новое уведомление в реальном времени |

**Структура `Notification`:**
```json
{
  "id": "uuid",
  "type": "status_change",
  "title": "Статус проекта изменён",
  "message": "Проект перешёл в статус 'В работе'",
  "isRead": false,
  "linkUrl": "/projects/uuid",
  "createdAt": "2026-04-03T10:00:00Z"
}
```

---

## Скрипты управления

### Linux / macOS

```bash
# Docker
./start.sh start          # Запустить все сервисы
./start.sh stop           # Остановить
./start.sh restart        # Перезапустить
./start.sh logs           # Все логи (follow)
./start.sh logs backend   # Логи конкретного сервиса
./start.sh status         # docker compose ps
./start.sh seed           # Тестовые данные
./start.sh migrate        # Запустить миграции
./start.sh dev            # Только PostgreSQL + Redis
./start.sh clean          # Удалить всё (необратимо!)

# Локально (без Docker)
./setup-local.sh          # Установка зависимостей + .env файлы
./dev.sh                  # Backend + Frontend в фоне
```

### Windows

```powershell
.\start.bat               # Интерактивное меню (рекомендуется)
.\start.bat docker        # Docker режим
.\start.bat local         # Локальный режим (без Docker)
.\start.bat stop          # Остановить Docker
.\start.bat logs          # Логи Docker
.\start.bat seed          # Тестовые данные

.\setup-local.bat         # Первичная установка
.\run-local.bat           # Запуск (после setup-local.bat)
```

### NPM скрипты

```bash
# Backend
cd backend
npm run start:dev         # Разработка с hot-reload
npm run build             # Production сборка
npm run start:prod        # Production запуск
npm run seed              # Создать тестовых пользователей

# Frontend
cd frontend
npm run dev               # Разработка (порт 3000)
npm run build             # Production сборка
npm run start             # Production запуск
npm run lint              # ESLint
```

---

## Решение проблем

### TypeORM: `DataTypeNotSupportedError: Data type "Object"`

**Причина:** TypeScript union-тип `string | null` при reflection возвращает `Object`. TypeORM не знает, какой SQL-тип выбрать.

**Решение:** Добавить явный `type` в `@Column`:
```typescript
// ❌ TypeORM не знает тип
@Column({ nullable: true })
otpCode: string | null;

// ✅ Явное указание типа
@Column({ type: 'varchar', nullable: true })
otpCode: string | null;
```

---

### Frontend: `Cannot convert undefined or null to object`

**Причина:** `ROLE_LABELS` определён в `@/store/auth.store`, но импортируется из `@/lib/utils`.

**Решение:**
```typescript
// ❌ ROLE_LABELS нет в utils
import { ROLE_LABELS } from '@/lib/utils';

// ✅ Правильный путь
import { ROLE_LABELS } from '@/store/auth.store';
```

---

### Socket.IO не подключается (`xhr poll error`)

**Проверьте:**

1. Схема URL — должна быть `http://`, не `ws://`:
   ```env
   # ✅
   NEXT_PUBLIC_WS_URL=http://localhost:3001
   # ❌
   NEXT_PUBLIC_WS_URL=ws://localhost:3001
   ```

2. Бэкенд запущен: `curl http://localhost:3001/api/docs`

3. CORS настроен:
   ```env
   FRONTEND_URL=http://localhost:3000
   ```

4. Socket.IO namespace указан верно:
   ```javascript
   // chat
   io('http://localhost:3001/chat', { query: { userId } })
   // notifications
   io('http://localhost:3001/notifications', { query: { userId } })
   ```

---

### PostgreSQL: ошибка подключения

```bash
# Проверить статус
pg_isready -h localhost -p 5432

# Проверить базу и пользователя
psql -U lk_user -d lk_db -c "SELECT current_user, current_database();"

# Пересоздать (если нужно)
psql -U postgres << 'SQL'
  DROP DATABASE IF EXISTS lk_db;
  DROP USER IF EXISTS lk_user;
  CREATE USER lk_user WITH PASSWORD 'lk_pass';
  CREATE DATABASE lk_db OWNER lk_user;
SQL
```

---

### Тестовые пользователи не создались автоматически

Это значит, что `SeedService` не запустился (например, бэкенд не смог подключиться к БД при старте).

После решения проблемы с БД запустите seed вручную:
```bash
# Docker
docker compose exec backend npm run seed

# Локально
cd backend && npm run seed
```

---

### npm install падает с ошибкой `404 @radix-ui/react-badge`

Этот пакет не существует в npm. Убедитесь, что в `frontend/package.json` нет такой строки. Используйте актуальный архив проекта.

---

### `.bat` файлы не работают (команды игнорируются)

**В PowerShell** всегда используйте `.\`:
```powershell
.\start.bat    # ✅
start.bat      # ❌ может не найти файл
```

Либо запустите через `cmd.exe`:
```cmd
cd C:\path\to\project
start.bat
```

---

### Ошибка компиляции TypeScript в watch mode

При ошибке `error TS2322: Type 'null' is not assignable` — это решается добавлением `| null` к типу поля в entity и explicit type в `@Column()`.

При ошибке `error TS18047: '...' is possibly 'null'` — добавьте null-check перед сравнением:
```typescript
// ❌
if (user.otpExpiresAt < new Date())

// ✅
if (!user.otpExpiresAt || user.otpExpiresAt < new Date())
```

---

## Лицензия

MIT License — свободное использование, модификация и распространение с сохранением копирайта.

---

<div align="center">

**Backend:** NestJS 10 · TypeScript 5 · PostgreSQL 16 · Redis 7 · Socket.IO · Yandex S3  
**Frontend:** Next.js 14 · Tailwind CSS · TanStack Query · Zustand · Socket.IO Client

91 TypeScript/TSX файлов · 14 функциональных модулей · 5 ролей RBAC

</div>

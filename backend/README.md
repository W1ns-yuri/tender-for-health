# Backend — Tender Ulgamy

## Первый запуск

```bash
cp .env.example .env          # поправь DATABASE_URL и JWT_SECRET
npm ci
npm run db:migrate            # создаёт все таблицы через миграции
npm run seed:demo             # демо-данные (admin / admin123)
npm run dev
```

## Миграции базы данных

Схема меняется **только через миграции**, `prisma db push` больше не используем:
он меняет базу, не оставляя следа, и на проде такую базу потом не воспроизвести.

```bash
# 1. поменял schema.prisma
npm run db:migrate:dev -- --name short_description   # создаст prisma/migrations/<дата>_short_description
# 2. закоммить schema.prisma вместе с новой папкой миграции
```

На сервере: `npm run db:migrate` (применяет только новые миграции, ничего не сбрасывает).

### Если у тебя уже есть локальная база, созданная через `db push`

Старые 5 миграций (август 2026) заменены одной базовой `0_init`, которая описывает всю текущую схему.
Чтобы Prisma не пыталась создать таблицы повторно, один раз пометь её как применённую:

```bash
npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma   # должно быть "No difference detected"
npx prisma migrate resolve --applied 0_init
npm run db:status                                  # должно быть "Database schema is up to date!"
```

Если `migrate diff` показывает расхождения, сначала выполни `npx prisma db push` (последний раз), потом `resolve`.

## Переменные окружения для продакшена

| Переменная | Зачем |
|---|---|
| `NODE_ENV=production` | Включает secure-cookie и строгую проверку `JWT_SECRET` |
| `JWT_SECRET` | Не короче 32 символов и не из `.env.example`, иначе сервер не стартует. Сгенерировать: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `CORS_ORIGIN` | Адрес фронтенда, например `https://tender.example.tm` |
| `TRUST_PROXY=1` | Если сервер стоит за nginx/Render/Railway: тогда лимит попыток входа считается по IP клиента, а не прокси |

## Деплой в прод (чек-лист)

1. **База**: PostgreSQL 16, отдельный пользователь с паролем. `npm run db:migrate` при каждом деплое (только `migrate deploy`, никогда `migrate dev` / `db push` на проде).
2. **Демо-данные в прод не заливать**: `seed:demo` создаёт учётки с известными паролями (`admin123`, `supplier123`). Первого админа создать вручную и сменить пароль.
3. **Переменные** (см. таблицу выше): `NODE_ENV=production`, длинный `JWT_SECRET`, `CORS_ORIGIN`, `TRUST_PROXY=1` за прокси.
4. **Фронт**: `cd frontend && npm ci && npm run build`. Два варианта:
   - один сервис: `SERVE_FRONTEND=true` — бэкенд сам отдаёт `frontend/dist` (путь можно сменить `FRONTEND_DIST`);
   - отдельно: `dist/` на nginx/статический хостинг, `/api` и `/uploads` проксировать на бэкенд.
   В `frontend/.env` задать `VITE_SUPPORT_PHONE`, `VITE_SUPPORT_EMAIL`; `VITE_SHOW_DEMO` не включать.
5. **Файлы** лежат в `backend/uploads/` на диске сервера. На хостингах с временным диском (Render free, Heroku) они пропадут при перезапуске — нужен постоянный диск (volume) и его бэкап.
6. **Бэкапы БД**: `scripts/backup.sh` по cron раз в сутки + копия вне сервера. Раз в месяц проверять восстановление на отдельной базе.
7. **Мониторинг**: `GET /api/health` отвечает 200 только если доступна БД — повесить на него проверку хостинга/uptime-монитор.
8. **Один экземпляр или несколько**: планировщик дедлайнов безопасен при нескольких экземплярах (атомарное закрытие), но лимит попыток входа хранится в памяти процесса — при нескольких экземплярах нужен общий store (Redis).

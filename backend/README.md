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

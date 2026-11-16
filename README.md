# Tender Ulgamy

Платформа закупок для здравоохранения: организатор создаёт тендер, поставщики подают запечатанные предложения, после вскрытия организатор выбирает победителей, и по итогам сами создаются договоры.

## Структура

```
backend/            Express 5 + Prisma + PostgreSQL (API, файлы, планировщик)
  src/routes/       адреса API и кто их может вызывать (authMiddleware, checkRole)
  src/controllers/  что делает каждый адрес
  src/services/     общая бизнес-логика (публикация, планировщик, требования к позициям)
  src/utils/        мелкие правила и помощники (доступ к тендеру, конверты, деньги, токены)
  prisma/           схема и миграции
  tests/            интеграционные тесты против запущенного сервера
frontend/           React 19 + Vite + Tailwind
  src/pages/        страницы (один файл = один адрес)
  src/components/   части страниц, сгруппированы по разделам; ui/ — общие кирпичики, layout/ — меню и шапка
  src/hooks/        общие хуки (useT — переводы)
  src/locales/      словари tm / ru / en
  src/utils/        чистые функции без React
docs/               ТЗ, дорожная карта, бизнес-документы, референсы
```

## Быстрый старт

```bash
cd backend && cp .env.example .env && npm ci && npm run db:migrate && npm run seed:demo && npm run dev
cd frontend && npm ci && npm run dev        # http://localhost:5173, вход admin / admin123
```

Подробнее про базу, миграции, переменные окружения и деплой: [backend/README.md](backend/README.md).

## Проверки (то же самое гоняет CI)

```bash
cd backend && npm test               # нужен запущенный сервер на :5000
cd frontend && npm run lint && npm run i18n:check && npm run build
```

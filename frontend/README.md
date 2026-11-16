# Frontend — Tender Ulgamy

```bash
npm ci
npm run dev          # http://localhost:5173, /api проксируется на localhost:5000
npm run lint         # oxlint
npm run i18n:check   # каждый ключ перевода есть в tm, ru и en
npm run build        # сборка в dist/
```

Переменные окружения: [.env.example](.env.example). Лучше держать фронт и API на одном домене
(бэкенд умеет сам отдавать `dist`, `SERVE_FRONTEND=true`): тогда скачивание файлов по cookie работает без настройки CORS.

## Где что лежит

- `src/pages/` — страницы. Логику большой страницы выносим в хук рядом с компонентами (`components/<раздел>/use<Раздел>State.js`).
- `src/components/<раздел>/` — части страниц раздела. `ui/` — общие кнопки, таблицы, модалки; `layout/` — меню, шапка, обработчик ошибок.
- `src/hooks/useT.js` — переводы: `t('ключ', 'запасной текст', { параметры })`. Новый ключ добавляй во все три файла `src/locales/`.
- `src/services/api.js` — единственный axios-клиент, сам подставляет токен.
- `src/utils/` — функции без React (форматирование, разбор сметы, статусы).

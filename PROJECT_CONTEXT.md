# PROJECT_CONTEXT.md — Технический паспорт системы «Tender Ulgamy»

Сгенерировано: 2026-09-14. Версия: 1.0.0. Источник: реальный код репозитория.

---

## 1. ОПИСАНИЕ И МИССИЯ СИСТЕМЫ

### 1.1 Предметная область

**Tender Ulgamy** («Тендерная система» на туркменском) — закрытая веб-платформа для автоматизации государственных и B2B-закупок в сфере здравоохранения Туркменистана.

Полный цикл: создание тендера → регистрация/верификация поставщиков → подача предложений → вскрытие конвертов → оценка → объявление победителя → архивирование.

Приоритетный язык интерфейса — **русский (RU)**, с поддержкой туркменского (TM) и английского (EN). Туркменская терминология используется в enum-значениях БД и навигации (Täze tender döretmek, Tenderler, Üpjün ediji).

### 1.2 Ролевая модель (enum RoleType)

| Роль                   | Код                   | Туркменский          | Описание                                                                           |
| ---------------------- | --------------------- | -------------------- | ---------------------------------------------------------------------------------- |
| Администратор          | ADMIN                 | Admin                | Полный доступ. Организует тендеры, модерирует поставщиков, управляет справочниками |
| Поставщик              | SUPPLIER              | Üpjün ediji          | Подаёт заявки на тендеры, ведёт профиль компании                                   |
| Заказчик               | CLIENT                | Sargyt ediji         | Участвует в оценке, может вскрывать конверты                                       |
| Специалист по закупкам | PURCHASING_SPECIALIST | Satyn alyş hünärmeni | Управляет каталогами и оценкой                                                     |
| Член комиссии          | COMMISSION_MEMBER     | Komissiýa topary     | Проводит оценку тендерных заявок                                                   |

В UI реализованы два основных пути: **ADMIN** (организатор) и **SUPPLIER** (участник). Остальные роли применяются на уровне RBAC-middleware для API.

! В этой системе только две роли должны быть, админ и поставщик!

### 1.3 Жизненный путь пользователя (User Journey)

**SUPPLIER:**
Регистрация → Вход → Заполнение профиля компании → Подача на верификацию (PENDING_REVIEW) → [VERIFIED / REJECTED] → Просмотр тендеров (ACYK) → Создание черновика предложения (TASLAMA) → Заполнение позиций, загрузка документов → Подача (TABSARYLDY) → [YENIJI / RET_EDILDI]

**ADMIN:**
Вход → Dashboard → Создание тендера → Публикация (TASLAMA→ACYK) → Мониторинг предложений → Вскрытие конвертов (POST /evaluation/open/:tenderId) → Оценка по позициям, выбор победителя (award-lot) → Завершение (BAHALANDYRYLDY→YENIJI_YGLAN_EDILDI) → Модерация поставщиков → Управление справочниками

**Статусные воронки:**

Тендер (TenderStatus): TASLAMA → ACYK → YAPYK → BAHALANDYRYLDY → YENIJI_YGLAN_EDILDI / GOYBOLSUN_EDILDI / ARHIWLENDI

Предложение (OfferStatus): TASLAMA → TABSARYLDY → KABUL_EDILDI → YENIJI / RET_EDILDI / GOYBOLSUN_EDILDI

Верификация (VerificationStatus): PENDING → PENDING_REVIEW → VERIFIED / REJECTED → PENDING_REVIEW (повторная подача)

---

## 2. ТЕХНОЛОГИЧЕСКИЙ СТЕК

### 2.1 Фронтенд

| Параметр         | Значение                                                                |
| ---------------- | ----------------------------------------------------------------------- |
| Фреймворк        | React 19 (react@^19.2.8)                                                |
| Сборщик          | Vite 8 (vite@^8.2.0) + @vitejs/plugin-react@^6.0.4                      |
| CSS-фреймворк    | Tailwind CSS v4 (tailwindcss@^4.3.3, подключён через @tailwindcss/vite) |
| Иконки           | Lucide React (lucide-react@^1.31.0)                                     |
| HTTP-клиент      | Axios (axios@^1.19.0)                                                   |
| Роутинг          | React Router DOM v7 (react-router-dom@^7.18.2)                          |
| Линтер           | OXLint (oxlint@^1.75.0)                                                 |
| Стейт-менеджмент | React useState (без Zustand/Redux)                                      |
| Валидация форм   | Ручная встроенная JSX-валидация (нет react-hook-form/Zod)               |
| Языки интерфейса | RU / TM / EN (словарь translations.js, ~51 КБ)                          |
| Dev-порт         | 5173                                                                    |

Прокси Vite (vite.config.js): /api/_ и /uploads/_ → http://127.0.0.1:5000

### 2.2 Бэкенд

| Параметр              | Значение                                                         |
| --------------------- | ---------------------------------------------------------------- |
| Язык                  | Node.js (CommonJS, require/module.exports)                       |
| Фреймворк             | Express 5 (express@^5.2.1)                                       |
| Архитектурный паттерн | REST API: Router → Middleware chain → Controller → Prisma Client |
| ORM                   | Prisma Client 7 (@prisma/client@^7.9.1)                          |
| СУБД-адаптер          | @prisma/adapter-pg@^7.9.1 + pg@^8.23.0 (PostgreSQL)              |
| Авторизация           | JWT (jsonwebtoken@^9.0.3), срок действия 7d                      |
| Хеш паролей           | bcryptjs (bcryptjs@^3.0.3), 10 раундов соли                      |
| Загрузка файлов       | Multer (multer@^2.2.0)                                           |
| Переменные окружения  | dotenv@^17.4.2                                                   |
| Dev-режим             | node --watch index.js                                            |
| Порт                  | 5000 (из .env)                                                   |

### 2.3 База данных

| Параметр         | Значение                                    |
| ---------------- | ------------------------------------------- |
| СУБД             | PostgreSQL                                  |
| БД               | health_tender_db                            |
| ORM              | Prisma ORM 7                                |
| Схема            | backend/prisma/schema.prisma (697 строк)    |
| Миграции         | backend/prisma/migrations/ (Prisma Migrate) |
| Singleton-клиент | backend/src/lib/prisma.js                   |

### 2.4 Аутентификация и безопасность

- **Тип токена**: Bearer JWT, заголовок Authorization: Bearer <token>
- **Хранение на клиенте**: localStorage (ключи tender_token, tender_user)
- **Срок жизни токена**: 7 дней. Payload: { userId, roleType }
- **Защита от брутфорса**: счётчик failedCount в users, блокировка на 15 мин после 5 ошибок (lockoutExpireDate)
- **Middleware цепочка**: authMiddleware (JWT + живость в БД) → checkRole([...]) (RBAC) → Controller
- **RBAC-правило**: ADMIN имеет доступ ко всем эндпоинтам по умолчанию, независимо от allowedRoles
- **Аудит**: auditMiddleware логирует POST/PUT/PATCH/DELETE с statusCode<400 в таблицу logs
- **CORS**: разрешён только http://localhost:5173 (или CORS_ORIGIN из .env)
- **Статические файлы**: /uploads через express.static
- **Разрешённые типы файлов**: PDF, JPG, JPEG, PNG (проверка MIME + расширения в Multer)
- **Лимит размера файла**: 10 МБ

---

## 3. ДИЗАЙН-СИСТЕМА И РОЛЕВЫЕ ЦВЕТОВЫЕ ТОКЕНЫ

Вся тема генерируется функцией getRoleTheme(role, isDarkMode) из frontend/src/utils/themeUtils.js.

### 3.1 SUPPLIER — основной цвет: синий (blue-600)

| Токен                  | Light                                                      | Dark                                               |
| ---------------------- | ---------------------------------------------------------- | -------------------------------------------------- |
| primaryBg (CTA-кнопки) | bg-blue-600 hover:bg-blue-700 text-white                   | то же                                              |
| primaryText            | text-blue-600                                              | то же                                              |
| primaryBorder          | border-blue-600                                            | то же                                              |
| primaryBadge           | bg-blue-50 text-blue-700 border-blue-200                   | то же                                              |
| tableCardBorderTop     | border-t-4 border-t-blue-500                               | то же                                              |
| tableHeaderBg          | bg-blue-50/70 text-slate-700                               | bg-blue-950/40 text-slate-300                      |
| tableRowHover          | even:bg-slate-50/40 hover:bg-blue-50/40                    | even:bg-slate-800/20 hover:bg-blue-950/30          |
| actionBtn hover        | hover:text-blue-600 hover:bg-blue-50 hover:border-blue-300 | dark:hover:bg-blue-950/50 dark:hover:text-blue-400 |

### 3.2 ADMIN — основной цвет: изумрудно-зелёный (emerald-600)

| Токен                  | Light                                                               | Dark                                                     |
| ---------------------- | ------------------------------------------------------------------- | -------------------------------------------------------- |
| primaryBg (CTA-кнопки) | bg-emerald-600 hover:bg-emerald-700 text-white                      | то же                                                    |
| primaryText            | text-emerald-600                                                    | то же                                                    |
| primaryBorder          | border-emerald-600                                                  | то же                                                    |
| primaryBadge           | bg-emerald-50 text-emerald-700 border-emerald-200                   | то же                                                    |
| tableCardBorderTop     | border-t-4 border-t-emerald-500                                     | то же                                                    |
| tableHeaderBg          | bg-emerald-50/70 text-slate-700                                     | bg-emerald-950/40 text-slate-300                         |
| tableRowHover          | even:bg-slate-50/40 hover:bg-emerald-50/40                          | even:bg-slate-800/20 hover:bg-emerald-950/30             |
| actionBtn hover        | hover:text-emerald-600 hover:bg-emerald-50 hover:border-emerald-300 | dark:hover:bg-emerald-950/50 dark:hover:text-emerald-400 |

### 3.3 Общие базовые токены

| Токен          | Light                                                                         | Dark                                                                           |
| -------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| cardBg         | bg-white border-slate-200/80 text-slate-800                                   | bg-[#111827] border-slate-800 text-slate-100                                   |
| cardHeaderBg   | bg-slate-50 border-slate-100                                                  | bg-[#1f2937] border-slate-800                                                  |
| inputBg        | bg-slate-50 border border-slate-200 text-slate-800 placeholder:text-slate-400 | bg-[#1f2937] border border-slate-700 text-slate-100 placeholder:text-slate-500 |
| subText        | text-slate-500                                                                | text-slate-400                                                                 |
| Фон приложения | bg-slate-50                                                                   | bg-[#0b0f17]                                                                   |
| Сайдбар        | bg-white border-slate-200                                                     | bg-[#0f172a] border-slate-800                                                  |

### 3.4 Цвета статусных бейджей (statusUtils.jsx)

| Статус / Enum                | Light                                             | Dark                                         | Смысл        |
| ---------------------------- | ------------------------------------------------- | -------------------------------------------- | ------------ |
| TASLAMA                      | bg-zinc-100 text-zinc-600 border-zinc-200         | bg-zinc-800 text-zinc-300 border-zinc-700    | Черновик     |
| ACYK / OPEN                  | bg-emerald-50 text-emerald-700 border-emerald-200 | bg-emerald-950/60 text-emerald-300           | Открыт       |
| YAPYK / CLOSED               | bg-slate-100 text-slate-600 border-slate-200      | bg-slate-800 text-slate-400 border-slate-700 | Закрыт       |
| BAHALANDYRYLDY               | bg-amber-50 text-amber-700 border-amber-200       | bg-amber-950/60 text-amber-300               | На оценке    |
| YENIJI_YGLAN_EDILDI / YENIJI | bg-purple-50 text-purple-700 border-purple-200    | bg-purple-950/60 text-purple-300             | Победитель   |
| TABSARYLDY                   | bg-blue-50 text-blue-700 border-blue-200          | bg-blue-950/60 text-blue-300                 | Подано       |
| KABUL_EDILDI                 | bg-emerald-50 text-emerald-700 border-emerald-200 | bg-emerald-950/60 text-emerald-300           | Принято      |
| GOYBOLSUN_EDILDI             | bg-orange-50 text-orange-700 border-orange-200    | bg-orange-950/60 text-orange-300             | Отменено     |
| RET_EDILDI / REJECTED        | bg-rose-50 text-rose-700 border-rose-200          | bg-rose-950/60 text-rose-300                 | Отклонено    |
| ARHIWLENDI                   | bg-slate-100 text-slate-600 border-slate-200      | bg-slate-800 text-slate-300 border-slate-700 | Архивировано |

### 3.5 Тип тендера (getTypeBadge)

| Тип                     | Light                                        | Dark                                         |
| ----------------------- | -------------------------------------------- | -------------------------------------------- |
| YERLI (Местный)         | bg-slate-100 text-slate-700 border-slate-200 | bg-slate-800 text-slate-300 border-slate-700 |
| HALKARA (Международный) | bg-sky-50 text-sky-700 border-sky-200        | bg-sky-950/60 text-sky-300 border-sky-800/60 |

### 3.6 Кастомная система модальных окон (AlertContext.jsx)

Все стандартные браузерные диалоги `window.alert()` и `window.confirm()` заменены на единую асинхронную систему кастомных модальных окон `AlertContext` (`showAlert` и `showConfirm`):

| Тип диалога | Иконка Lucide    | Бейдж и акцент (Light / Dark)                                              | Назначение                                                 |
| ----------- | ---------------- | -------------------------------------------------------------------------- | ---------------------------------------------------------- |
| success     | `CheckCircle2`   | `bg-emerald-50 text-emerald-600` / `bg-emerald-950/50 text-emerald-400`    | Успешное создание, сохранение, одобрение верификации       |
| danger      | `AlertOctagon`   | `bg-rose-50 text-rose-600` / `bg-rose-950/50 text-rose-400`                | Деструктивные действия (удаление тендера, отказ, сброс)    |
| error       | `XCircle`        | `bg-rose-50 text-rose-600` / `bg-rose-950/50 text-rose-400`                | Ошибки запросов, сетевые сбои, критические исключения      |
| warning     | `AlertTriangle`  | `bg-amber-50 text-amber-600` / `bg-amber-950/50 text-amber-400`           | Предупреждения (неоцененные лоты, изменение реквизитов)    |
| info        | `Info`           | `bg-sky-50 text-sky-600` / `bg-sky-950/50 text-sky-400`                   | Информационные уведомления, подсказки                      |

**Ключевые возможности `AlertContext`:**
- **Promise-based API:** `const ok = await showConfirm({ title, message, isDanger: true });`
- **Клавиатурная доступность:** Закрытие/отмена по клавише `Escape`, подтверждение по `Enter`.
- **Блокировка прокрутки:** Автоматический scroll-lock на `document.body` при открытом диалоге.
- **Поддержка i18n и Dark Mode:** Автоматическое определение языка (RU/TM) для кнопок по умолчанию и адаптация под темную тему.
- **Защитные fallback-методы:** Глобальные `window.$alert` и `window.$confirm` на случай вызовов вне React-контекста.

### 3.7 Единая система полей ввода и кастомный календарь (CustomDatePicker.jsx)

Все поля ввода (`<input>`, `<select>`, `<textarea>`, `CustomSelect`, `CustomDatePicker`) приведены к строго единой визуальной логике:
- **Обычное состояние:** видимая аккуратная рамка `border border-slate-200 dark:border-slate-700` с фоном `bg-slate-50 dark:bg-[#1f2937]`.
- **При наведении (hover):** мягкая смена цвета обводки на акцентный цвет роли (`hover:border-emerald-400 dark:hover:border-emerald-500/70` для Admin; `hover:border-blue-400` для Supplier).
- **При фокусе / открытии (focus / active / open):** полное отключение черной системной обводки браузера (`outline-none focus:outline-none`), подсветка ярким изумрудным цветом с мягким ореолом (`focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20` / `!border-emerald-500 !ring-2 !ring-emerald-500/25`).
- **Кастомный компонент календаря (`CustomDatePicker.jsx`):**
  - Полностью заменяет системный HTML5 `<input type="date">`.
  - Портальное всплывающее окно (`createPortal`), не обрезаемое родительскими контейнерами, с синхронным вычислением координат (`useLayoutEffect` / trigger) без скачков из (0,0).
  - Навигация по месяцам, режим быстрого выбора месяца/года (12 плашек месяцев + шаги по годам).
  - Сетка дней недели (Пн-Вс / Du-Ýe) с выделением выходных, текущей даты (ring) и выбранного числа (emerald-600).
  - Кнопки быстрого выбора «Сегодня» и «Очистить».
  - Поддержка ограничений `min`/`max` (например, срок подачи не ранее даты объявления).
  - Применен в `CreateTenderPage.jsx` и фильтрах `Tenders.jsx`.

### 3.8 Модуль оценки заявок: Двухэкранная архитектура Drill-down (Evaluation.jsx & EvaluationDetailsPage.jsx)

Модуль оценки спроектирован по отраслевому стандарту закупочных систем (ЕИС, B2B-Center, SAP Ariba) на 100% ширины экрана, исключая тесный Master-Detail split-view:
1. **Экран 1: Реестр тендеров на оценку (`Evaluation.jsx` / `/evaluation`):**
   - Полноразмерная таблица (100% ширины) всех закупочных процедур с индикаторами (всего тендеров, на рассмотрении, подано заявок, итоги оглашены).
   - Фильтрация: поиск по номеру/названию/заказчику, селект заказчика, фильтр статусов (Все / На рассмотрении / Итоги подведены) и сортировка (по дедлайну, заявкам, дате).
   - Колонки: Номер тендера, Наименование закупки, Заказчик, Количество лотов, Подано предложений (бейдж), Крайний срок (дата и таймер обратного отсчета без дублирования статуса), Статус закупки, Действие.
   - Динамические кнопки действий:
     - Для процедур на рассмотрении — яркая изумрудная кнопка `Оценить заявки →`.
     - Для завершенных процедур (`YENIJI_YGLAN_EDILDI`) — контурная вторичная кнопка `Итоги / Протокол` с иконкой `FileText`.
     - Для процедур с 0 заявок и истекшим сроком — статус `Не состоялся` и кнопка `Подробнее`.
2. **Экран 2: Полноэкранный рабочий стол оценки (`EvaluationDetailsPage.jsx` / `/evaluation/:id` и `/admin/evaluations/:id`):**
   - **Навигация:** кнопка «← Назад к списку тендеров на оценку», хлебные крошки (`Оценка заявок / {номер}`), лаконичный заголовок «Оценка предложений по закупке» (без тройного дублирования номера), кнопки «Печать протокола» (`window.print()`) и «Открыть тендер».
   - **Шапка закупки:** номер, наименование, заказчик, категория, дедлайн, статус и сводный счетчик лотов (`Итоги по лотам: X / Y`).
   - **Полноразмерная рабочая зона лотов (100% ширины):**
     - Условия поставки Incoterms: трехбуквенный международный код с расшифровкой в аккуратном теге: `DAP (Delivered At Place)` / `CIP (Carriage and Insurance Paid To)` (с автоматическим маппингом из справочника `delivery_terms`).
     - Сравнительная таблица предложений поставщиков бок о бок с выявлением минимальной цены (бейдж «Лучшая цена» и % отклонения), полноты покрытия позиций (`X / Y поз. (100%)`).
     - Интерактивная кнопка победителя лота с поддержкой отмены выбора: в обычном состоянии `✔ Победитель`, при наведении трансформируется в `hover:bg-rose-50 hover:text-rose-600 hover:border-rose-300` с иконкой `X` и текстом «Снять выбор».
     - Раскрывающаяся вложенная спецификация лота на всю ширину в легком корпоративном стиле (`bg-emerald-50/70 border-b border-slate-200 text-slate-600 font-semibold`) с четким указанием автора предложения (`КП: {supplierName}`).
     - Обязательное указание кода валюты (`TMT`, `USD`, `EUR`) во всех ценах и суммах.
     - Нейтральные пустые состояния (`bg-slate-50 border border-slate-200 text-slate-500` с иконкой `FileText`) при отсутствии заявок.
     - Достаточный нижний отступ контейнера (`pb-32`), предотвращающий наложение нижней панели на карточки лотов.
   - **Закрепленная нижняя панель действий (sticky):** полоса с индикатором прогресса утверждения лотов, кнопкой «Экспорт / Печать» и главной кнопкой «Утвердить протокол и объявить победителей» (с предупреждением при наличии нераспределенных лотов).

---

### 3.9 Подача коммерческого предложения (CreateOfferPage.jsx) и типизация лотов

1. **Нижняя фиксированная панель действий (Sticky Action Bar):**
   - Контейнер: `sticky bottom-0 z-30 -mx-6 -mb-6 px-6 sm:px-8 py-4 bg-white/95 dark:bg-[#111827]/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 shadow-[0_-4px_12px_rgba(0,0,0,0.06)]`.
   - Итоговая сумма заявки: крупный шрифт `text-2xl font-black text-blue-600 dark:text-blue-400` с кодом валюты.
   - Сводная статистика: количество активных лотов и оцененных позиций.
   - Безопасный отступ страницы `pb-32`, предотвращающий перекрытие контента при прокрутке.
   - Защита от пустой отправки: при итоговой сумме 0 TMT кнопка заблокирована (`disabled`, `bg-blue-300 dark:bg-blue-900/40 opacity-60`) с поясняющей подсказкой «Укажите цену хотя бы по одной позиции выбранного лота».
2. **Динамическая типизация лотов (Товары, Работы, Услуги):**
   - Уровень тендера: направление закупки (`procurementType`: `GOODS`, `SERVICES_WORKS`, `MIXED`).
   - Уровень лота (`lotType`):
     - `GOODS` (Товары): условия поставки Incoterms (заказчик ➔ поставщик) + адрес склада доставки.
     - `WORKS` (Работы): Incoterms скрыт; отображаются адрес объекта, график/срок выполнения и требование строительной лицензии (`licenseRequired`).
     - `SERVICES` (Услуги): Incoterms скрыт; отображаются формат оказания (`serviceFormat`: `ON_SITE` / `REMOTE` / `HYBRID`) и регламент SLA (`slaPeriod`).
3. **Процедура аналогов и эквивалентов:**
   - Объем закупки зафиксирован: поставщик не может изменить запрашиваемое количество (отображается бейджем в режиме read-only).
   - Чекбокс «Предложить эквивалент / аналог» раскрывает поле ввода торгового наименования аналога и текстовое поле для обоснования эквивалентности (МНН, характеристики, форма выпуска, дозировка).
   - Информационная полоса с уведомлением о проверке эквивалента экспертной комиссией.
4. **Интерактивная дропзона документов (Dropzone & File Manager):**
   - Пустое состояние: область drag & drop с пунктирной рамкой `border-dashed`, иконкой `UploadCloud` и списком допустимых форматов.
   - Множественная загрузка файлов (клиентская валидация до 25 МБ на файл, разрешенные форматы PDF, DOC, DOCX, XLS, XLSX, JPG, PNG).
   - Список файлов: карточки с иконкой типа, именем файла, форматированным размером (`formatFileSize`), статусом готовности («Прикреплен») и кнопкой удаления.
   - Компактный режим: при наличии файлов появляется аккуратная кнопка `+ Прикрепить еще документ`.
5. **Токены и UI-полировка:**
   - Полное искоренение устаревших темно-синих оттенков `#1e3a8a` в пользу дизайн-токенов поставщика (`text-blue-600`, `bg-blue-50`, `border-blue-200`).
   - Замена нестабильных Windows-флагов на текстовые метки валют (`getCurrencyLabel`).
   - Двухбуквенные заглавные инициалы для аватарок (`getAvatarInitials`).

---

### 3.10 Унификация таблиц: Главная (Dashboard.jsx) и Все тендеры (Tenders.jsx)

Таблица «Последние открытые тендеры» на главной странице (`Dashboard.jsx`) полностью синхронизирована по структуре колонок, паддингам и типографике со страницей «Все тендеры» (`Tenders.jsx`):
- Убраны жесткие ограничения максимальной ширины (`max-w-xs`, `max-w-[180px]`) и обрезка строк (`line-clamp-2`), вызывавшие усечение названий, описаний и технических условий троеточием (`...`).
- Текст ячеек наименования, описания (`min-w-55 whitespace-normal text-wrap`) и технических условий (`min-w-45 whitespace-normal text-wrap`) переносится естественным образом без усечения.
- Заголовки колонок (`th`) и данные ячеек (`td`) приведены к единым отступам (`py-3.5 px-4`) и центрированию (`text-center`), обеспечивая идентичный визуальный ритм таблиц на обеих страницах.
- В колонке «Действие» на главной странице сохранен единый просмотр (`Eye`), в то время как на странице всех тендеров доступны расширенные действия по ролям.

---

## 4. СХЕМА БАЗЫ ДАННЫХ И СУЩНОСТИ

Источник: backend/prisma/schema.prisma (PostgreSQL, Prisma ORM 7).

### 4.1 Перечисления (Enums)

| Enum               | Значения                                                                                                                                                              |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RoleType           | ADMIN, SUPPLIER, CLIENT, PURCHASING_SPECIALIST, COMMISSION_MEMBER                                                                                                     |
| VerificationStatus | PENDING, PENDING_REVIEW, VERIFIED, REJECTED                                                                                                                           |
| TenderStatus       | TASLAMA (черновик), ACYK (открыт), YAPYK (закрыт), BAHALANDYRYLDY (оценён), YENIJI_YGLAN_EDILDI (победитель объявлен), GOYBOLSUN_EDILDI (отменён), ARHIWLENDI (архив) |
| OfferStatus        | TASLAMA, TABSARYLDY (подано), KABUL_EDILDI (принято), YENIJI (победитель), GOYBOLSUN_EDILDI, RET_EDILDI (отклонено)                                                   |
| TenderType         | YERLI (местный), HALKARA (международный)                                                                                                                              |
| TenderVisibility   | ACYK (публичный), YAPYK (закрытый)                                                                                                                                    |
| SupplierType       | ENTREPRENEUR, BUSINESS_SOCIETY, BUSINESS_COMPANY, GOVERNMENT, FARMER_ASSOCIATION                                                                                      |
| PaymentStatus      | PENDING, NOT_PAID, PAID                                                                                                                                               |
| DocumentScope      | SUPPLIER_DOC, TENDER_DOC, OFFER_DOC                                                                                                                                   |
| ProductType        | HARYT (товар), HYZMAT (услуга)                                                                                                                                        |
| EventType          | HARYT, TENDER                                                                                                                                                         |
| OperationType      | OKAMAK (чтение), YAZMAK (запись)                                                                                                                                      |
| BidStatus          | PENDING, ACCEPTED, REJECTED                                                                                                                                           |

### 4.2 Таблица: roles

| Поле                  | Тип            | Описание                 |
| --------------------- | -------------- | ------------------------ |
| id                    | String UUID PK | —                        |
| name                  | String         | Отображаемое название    |
| code                  | String UNIQUE  | Уникальный код роли      |
| allowed_modules       | Json?          | Список доступных модулей |
| permissions           | Json?          | Права CRUD               |
| createdAt / updatedAt | DateTime       | —                        |

### 4.3 Таблица: users

| Поле                  | Тип                       | Описание                  |
| --------------------- | ------------------------- | ------------------------- |
| id                    | String UUID PK            | —                         |
| username              | String UNIQUE             | Логин (email как логин)   |
| password              | String                    | Bcrypt-хеш (10 rounds)    |
| first_name            | String                    | Имя                       |
| last_name             | String                    | Фамилия                   |
| middle_name           | String?                   | Отчество                  |
| role_type             | RoleType default SUPPLIER | —                         |
| position              | String?                   | Должность                 |
| phone                 | String?                   | Телефон                   |
| role_id               | String? FK → roles.id     | SetNull при удалении роли |
| last_login            | DateTime?                 | Последний успешный вход   |
| failed_count          | Int default 0             | Счётчик неудачных попыток |
| lockout_expire_date   | DateTime?                 | Дата снятия блокировки    |
| is_active             | Boolean default true      | Активен ли аккаунт        |
| createdAt / updatedAt | DateTime                  | —                         |

### 4.4 Таблица: logs

| Поле           | Тип                   | Описание                             |
| -------------- | --------------------- | ------------------------------------ |
| id             | String UUID PK        | —                                    |
| user_id        | String? FK → users.id | SetNull                              |
| event_type     | EventType             | HARYT или TENDER                     |
| operation_type | OperationType         | OKAMAK / YAZMAK                      |
| ip             | String?               | IP-адрес клиента                     |
| data           | Json?                 | { method, url, params, query, body } |
| createdAt      | DateTime              | —                                    |

### 4.5 Таблица: backups

id (UUID PK), name, file (путь к файлу резервной копии), createdAt

### 4.6 Справочники (Каталоги)

**categories:** id (PK), name, code (UNIQUE?), description, is_active

**general_products (МНН):** id (PK), category_id (FK→categories SetNull), name (МНН), trade_name?, code?, type (ProductType), description, is_active

**units:** id (PK), name, short_name, order (Int), is_active

**currencies:** id (PK), name, code (UNIQUE ISO: TMT/USD/RUB/EUR...), flag?, symbol?, order, is_active

**exchange_rates:** id (PK), from_currency_id (FK→currencies), to_currency_id (FK→currencies), value (Float), updatedAt. UNIQUE: [from_currency_id, to_currency_id]

**countries:** id (PK), name, alpha_2, alpha_3, order, is_active

**brands:** id (PK), name, code?

**manufacturers:** id (PK), country_id (FK SetNull), brand_id (FK SetNull), name, code, is_active

**delivery_terms:** id (PK), name (DAP/DDP/CIP...), short_name, is_active

**document_types:** id (PK), name, order, is_active, description, is_mandatory (bool), scope (DocumentScope)

**variation_groups / variation_values:** Справочник вариаций (Цвет, Материал) с вложенными значениями.

### 4.7 Таблица: clients

id (UUID PK), name (название организации-заказчика), is_active, createdAt, updatedAt

### 4.8 Таблица: tenders

| Поле                  | Тип                           | Описание                                       |
| --------------------- | ----------------------------- | ---------------------------------------------- |
| id                    | String UUID PK                | —                                              |
| tender_number         | String UNIQUE                 | Формат TNDR-YYYY-MM-NNN, генерируется сервером |
| title                 | String                        | Наименование тендера                           |
| description           | String?                       | —                                              |
| technical_specs       | String?                       | Техническое задание (текст)                    |
| price                 | Float default 0               | Ориентировочная сумма                          |
| type                  | TenderType default YERLI      | —                                              |
| status                | TenderStatus default TASLAMA  | —                                              |
| visibility            | TenderVisibility default ACYK | —                                              |
| announcement_date     | DateTime?                     | Дата объявления                                |
| deadline              | DateTime                      | Дедлайн подачи предложений                     |
| client_id             | String? FK → clients.id       | SetNull                                        |
| category_id           | String? FK → categories.id    | SetNull                                        |
| procurement_type      | String? default "GOODS"       | GOODS / SERVICES_WORKS / MIXED                 |
| created_by_id         | String FK → users.id          | Cascade                                        |
| createdAt / updatedAt | DateTime                      | —                                              |

### 4.9 Таблица: tender_lots

id (UUID PK), tender_id (FK→tenders Cascade), name, lot_type (GOODS / WORKS / SERVICES), delivery_term_id (FK→delivery_terms SetNull), delivery_address?, work_address?, work_period?, license_required (Boolean default false), service_format? (REMOTE / ON_SITE / HYBRID), sla_period?, createdAt, updatedAt

### 4.10 Таблица: tender_specifications

| Поле                  | Тип                              | Описание                          |
| --------------------- | -------------------------------- | --------------------------------- |
| id                    | String UUID PK                   | —                                 |
| tender_id             | String FK → tenders.id           | Cascade                           |
| lot_id                | String? FK → tender_lots.id      | Cascade при удалении лота         |
| general_product_id    | String? FK → general_products.id | SetNull                           |
| unit_id               | String? FK → units.id            | SetNull                           |
| manufacturer_id       | String? FK → manufacturers.id    | SetNull                           |
| name                  | String?                          | Произвольное наименование позиции |
| quantity              | Float default 1                  | Количество                        |
| position_number       | Int default 1                    | Номер позиции                     |
| description           | String?                          | —                                 |
| createdAt / updatedAt | DateTime                         | —                                 |

### 4.11 Таблица: tender_items (УСТАРЕВШАЯ, MVP)

id (PK), name, quantity (Int), unit (String), description?, tender_id (FK→tenders Cascade). Связана с bids через bid_items.

### 4.12 Таблица: suppliers

| Поле                  | Тип                                | Описание                                                                             |
| --------------------- | ---------------------------------- | ------------------------------------------------------------------------------------ |
| id                    | String UUID PK                     | —                                                                                    |
| user_id               | String FK → users.id               | Cascade                                                                              |
| country_id            | String? FK → countries.id          | SetNull                                                                              |
| name                  | String                             | Наименование компании (без аббревиатуры формы ЮЛ)                                    |
| type                  | SupplierType?                      | ENTREPRENEUR / BUSINESS_SOCIETY / BUSINESS_COMPANY / GOVERNMENT / FARMER_ASSOCIATION |
| reg_number            | String?                            | Регистрационный номер                                                                |
| license_number        | String?                            | Номер лицензии                                                                       |
| tax_id                | String?                            | STŞK — туркменский налоговый идентификатор (аналог ИНН)                              |
| email                 | String?                            | Email компании                                                                       |
| phone                 | String?                            | Рабочий телефон                                                                      |
| fax                   | String?                            | Факс                                                                                 |
| address               | String?                            | Юридический адрес                                                                    |
| region                | String?                            | Велаят (административный регион Туркменистана)                                       |
| notes                 | String?                            | Примечания                                                                           |
| is_active             | Boolean default true               | —                                                                                    |
| verification_status   | VerificationStatus default PENDING | Статус верификации                                                                   |
| rejection_reason      | String?                            | Причина отказа (при REJECTED)                                                        |
| bank_name             | String?                            | Название банка                                                                       |
| bank_account          | String?                            | Расчётный счёт (туркменский)                                                         |
| bank_mfo              | String?                            | МФО банка                                                                            |
| passport_info         | String?                            | Объединённые паспортные данные                                                       |
| passport_series       | String?                            | Серия паспорта                                                                       |
| passport_issued_by    | String?                            | Орган выдачи паспорта                                                                |
| createdAt / updatedAt | DateTime                           | —                                                                                    |

**Специфика Туркменистана:**

- tax_id = STŞK (Salgyt töleýjiniň şahsy kody — аналог ИНН)
- type ENTREPRENEUR = HJ (Hususy telekeçi / ИП), BUSINESS_SOCIETY = HO (Hojalyk jemgyýeti), BUSINESS_COMPANY = HK (Hojalyk kärhana / ДП)
- region = велаят (Aşgabat, Ahal, Mary, Lebap, Daşoguz, Balkan)
- bank_account = туркменский расчётный счёт, bank_mfo = МФО банка

### 4.13 Таблица: offers

| Поле                  | Тип                            | Описание                                  |
| --------------------- | ------------------------------ | ----------------------------------------- |
| id                    | String UUID PK                 | —                                         |
| tender_id             | String FK → tenders.id         | Cascade                                   |
| supplier_id           | String FK → suppliers.id       | Cascade                                   |
| delivery_term_id      | String? FK → delivery_terms.id | SetNull                                   |
| base_currency_id      | String? FK → currencies.id     | Базовая валюта предложения (SetNull)      |
| number                | String?                        | Исходящий номер коммерческого предложения |
| bidder_code           | String?                        | Анонимный код участника (закрытые торги)  |
| payment_status        | PaymentStatus default PENDING  | Статус оплаты взноса                      |
| is_archived           | Boolean default false          | —                                         |
| payment_terms         | String?                        | Условия оплаты                            |
| version               | Int default 1                  | Версия предложения                        |
| is_default            | Boolean default true           | Основное предложение                      |
| status                | OfferStatus default TASLAMA    | —                                         |
| offered_price         | Float default 0                | Итоговая цена предложения                 |
| comment               | String?                        | Комментарий                               |
| createdAt / updatedAt | DateTime                       | —                                         |

### 4.14 Таблица: offer_specifications

| Поле               | Тип                                  | Описание                      |
| ------------------ | ------------------------------------ | ----------------------------- |
| id                 | String UUID PK                       | —                             |
| offer_id           | String FK → offers.id                | Cascade                       |
| tender_spec_id     | String FK → tender_specifications.id | Позиция ТЗ (Cascade)          |
| general_product_id | String? FK → general_products.id     | SetNull                       |
| unit_id            | String? FK → units.id                | SetNull                       |
| manufacturer_id    | String? FK → manufacturers.id        | SetNull                       |
| name               | String?                              | —                             |
| position_number    | Int?                                 | —                             |
| quantity                 | Float default 1                      | —                             |
| unit_price               | Float default 0                      | Цена за единицу               |
| description              | String?                              | —                             |
| is_awarded               | Boolean default false                | Признак победителя по позиции |
| is_equivalent            | Boolean default false                | Предложен аналог/эквивалент   |
| equivalent_name          | String?                              | Торговое название аналога     |
| equivalent_justification | String?                              | Обоснование эквивалентности   |

### 4.15 Таблица: offer_exchange_rates

id (PK), offer_id (FK→offers Cascade), currency_id (FK→currencies Cascade), value (Float). Фиксирует курсы валют на момент подачи предложения.

### 4.16 Таблица: supplier_moderation_logs

| Поле            | Тип                      | Описание                                      |
| --------------- | ------------------------ | --------------------------------------------- |
| id              | String UUID PK           | —                                             |
| supplier_id     | String FK → suppliers.id | Cascade                                       |
| admin_id        | String? FK → users.id    | SetNull                                       |
| action          | String                   | APPROVED / REJECTED / SUBMITTED / RESUBMITTED |
| previous_status | String?                  | Предыдущий статус                             |
| new_status      | String                   | Новый статус                                  |
| reason          | String?                  | Причина решения                               |
| created_at      | DateTime                 | —                                             |

### 4.17 Устаревшие (MVP) таблицы

**companies:** id, name, inn (UNIQUE), phone, address, email, license, userId (FK→users Cascade)
**bids:** id, offeredPrice, comment, status (BidStatus), tenderId (FK), companyId (FK)
**bid_items:** id, pricePerUnit, totalPrice, isAlternative, alternativeDesc, bidId (FK), tenderItemId (FK)

### 4.18 Таблицы документов

**documents:** id, name?, description?, fileName, filePath, fileType (MIME), file_size (Int?), document_type_id (FK SetNull), tenderId (FK Cascade — устар.), bidId (FK Cascade — устар.), createdAt

**Связующие таблицы (M2M):**

- tender_files: tenderId (FK) + documentId (FK)
- supplier_files: supplierId (FK) + documentId (FK)
- offer_files: offerId (FK) + documentId (FK)

### 4.19 ER-диаграмма ключевых связей

    User -1:N-> Supplier -1:N-> Offer -N:1-> Tender
    User -1:N-> Tender (created_by)
    Tender -1:N-> TenderLot -1:N-> TenderSpecification
    TenderSpecification -1:N-> OfferSpecification -N:1-> Offer
    Offer -N:1-> Supplier
    Offer -N:1-> DeliveryTerm
    Offer -1:N-> OfferExchangeRate -N:1-> Currency
    Supplier -M:N-> Document (via supplier_files)
    Tender -M:N-> Document (via tender_files)
    Offer -M:N-> Document (via offer_files)
    Supplier -1:N-> SupplierModerationLog -N:1-> User (admin)

---

## 5. АРХИТЕКТУРА И КЛЮЧЕВЫЕ СВЯЗИ

### 5.1 Поток данных (Data Flow)

FRONTEND (Vite :5173):

- localStorage: tender_token, tender_user
- src/services/api.js (Axios instance):
  - baseURL=/api (проксируется Vite на :5000)
  - request interceptor: добавляет Authorization: Bearer <token> из localStorage
  - response interceptor: 401/404 → clearStorage → redirect /login
- src/App.jsx:
  - Глобальный стейт: token, user, role, lang, isDarkMode
  - useEffect → GET /auth/me (синхронизация сессии при монтировании)
  - handleLoginSuccess: setToken + setUser + navigate('/dashboard')
  - handleLogout: clearStorage + setToken('')
- React Router → Pages → API.get/post/put/delete → setState → Re-render

BACKEND (Express :5000):

- cors() → разрешает только :5173
- express.json()
- express.static('/uploads')
- auditMiddleware() → глобально логирует POST/PUT/PATCH/DELETE
- /api/auth → authRoutes:
  - POST /login: bcrypt.compare + jwt.sign → { user, token }
  - POST /register: bcrypt.hash + prisma.user.create + prisma.supplier.create → JWT
  - GET /me: authMiddleware → prisma.user.findUnique
- /api/\* → authMiddleware → checkRole([...]) → Controller → Prisma → PostgreSQL
- Global Error Handler → 500 JSON

### 5.2 Middleware-цепочка (защищённые маршруты)

    Request
      → authMiddleware:
          (1) Читает Authorization: Bearer <token>
          (2) jwt.verify(token, process.env.JWT_SECRET)
          (3) prisma.user.findUnique({ id, isActive }) → req.user = { id, userId, roleType }
      → checkRole(['ADMIN', ...]):
          (4) req.user.roleType IN allowedRoles OR roleType === 'ADMIN'
      → Controller (бизнес-логика + Prisma ORM)
      → Response JSON

### 5.3 Карта API-эндпоинтов

#### /api/auth — Аутентификация

| Метод | URL                | Доступ | Описание                                         |
| ----- | ------------------ | ------ | ------------------------------------------------ |
| POST  | /api/auth/login    | Public | Вход, возвращает JWT                             |
| POST  | /api/auth/register | Public | Регистрация поставщика (создаёт User + Supplier) |
| GET   | /api/auth/me       | Auth   | Получить текущего пользователя                   |

#### /api/tenders — Тендеры

| Метод  | URL                      | Доступ       | Описание                            |
| ------ | ------------------------ | ------------ | ----------------------------------- |
| GET    | /api/tenders             | Public       | Список всех тендеров                |
| GET    | /api/tenders/next-number | Auth         | Следующий номер TNDR-YYYY-MM-NNN    |
| GET    | /api/tenders/:id         | Auth         | Тендер по ID (спецификации, заявки) |
| POST   | /api/tenders             | Auth         | Создать тендер                      |
| DELETE | /api/tenders/:id         | Auth + ADMIN | Удалить тендер                      |

#### /api/offers — Предложения

| Метод  | URL                          | Доступ                | Описание               |
| ------ | ---------------------------- | --------------------- | ---------------------- |
| GET    | /api/offers                  | Auth + ADMIN          | Все предложения        |
| POST   | /api/offers                  | Auth + SUPPLIER/ADMIN | Создать предложение    |
| GET    | /api/offers/tender/:tenderId | Auth                  | Предложения по тендеру |
| GET    | /api/offers/my-wins          | Auth + SUPPLIER/ADMIN | Победы                 |
| GET    | /api/offers/my               | Auth + SUPPLIER/ADMIN | Мои предложения        |
| GET    | /api/offers/:id              | Auth + SUPPLIER/ADMIN | Предложение по ID      |
| DELETE | /api/offers/:id              | Auth + SUPPLIER/ADMIN | Удалить                |

#### /api/suppliers — Поставщики

| Метод | URL                               | Доступ                | Описание                                   |
| ----- | --------------------------------- | --------------------- | ------------------------------------------ |
| PUT   | /api/suppliers/profile            | Auth + SUPPLIER/ADMIN | Обновить профиль + статус → PENDING_REVIEW |
| GET   | /api/suppliers/pending            | Auth + ADMIN          | Список на модерации                        |
| GET   | /api/suppliers/moderation/archive | Auth + ADMIN          | Архив решений модерации + статистика       |
| POST  | /api/suppliers/:id/approve        | Auth + ADMIN          | Одобрить → VERIFIED                        |
| POST  | /api/suppliers/:id/reject         | Auth + ADMIN          | Отклонить → REJECTED (с причиной)          |
| GET   | /api/suppliers/:id                | Auth                  | Профиль по ID                              |

#### /api/evaluation — Оценка заявок

PS = PURCHASING_SPECIALIST, CM = COMMISSION_MEMBER

| Метод | URL                                 | Доступ                    | Описание              |
| ----- | ----------------------------------- | ------------------------- | --------------------- |
| POST  | /api/evaluation/open/:tenderId      | Auth + CLIENT/PS/ADMIN    | Вскрыть конверты      |
| GET   | /api/evaluation/evaluate/:tenderId  | Auth + CM/ADMIN/PS        | Оценка (устар.)       |
| GET   | /api/evaluation/tenders             | Auth + CM/ADMIN/CLIENT/PS | Тендеры для оценки    |
| GET   | /api/evaluation/tenders/:id/details | Auth + CM/ADMIN/CLIENT/PS | Детали по позициям    |
| POST  | /api/evaluation/award-lot           | Auth + CM/ADMIN/CLIENT/PS | Победитель по позиции |
| POST  | /api/evaluation/award-item          | Auth + CM/ADMIN/CLIENT/PS | Алиас award-lot       |
| POST  | /api/evaluation/complete/:tenderId  | Auth + CM/ADMIN/CLIENT/PS | Завершить оценку      |

#### /api/catalogs — Справочники

| Метод               | URL                                | Доступ             | Описание           |
| ------------------- | ---------------------------------- | ------------------ | ------------------ |
| GET                 | /api/catalogs/categories           | Public             | Категории          |
| POST/PUT/DELETE     | /api/catalogs/categories(/:id)     | Auth + ADMIN/PS    | CRUD               |
| GET                 | /api/catalogs/products             | Public             | МНН (общие товары) |
| POST/PUT/DELETE     | /api/catalogs/products(/:id)       | Auth + ADMIN/PS    | CRUD               |
| GET                 | /api/catalogs/units                | Public             | Единицы измерения  |
| POST/PUT/DELETE     | /api/catalogs/units(/:id)          | Auth + ADMIN       | CRUD               |
| GET                 | /api/catalogs/currencies           | Public             | Валюты             |
| POST/PUT/DELETE     | /api/catalogs/currencies(/:id)     | Auth + ADMIN       | CRUD               |
| POST                | /api/catalogs/currencies/rates     | Auth + ADMIN       | Установить курс    |
| GET                 | /api/catalogs/countries            | Public             | Страны             |
| POST/PUT/DELETE     | /api/catalogs/countries(/:id)      | Auth + ADMIN       | CRUD               |
| GET                 | /api/catalogs/delivery-terms       | Public             | Условия поставки   |
| POST/PUT/DELETE     | /api/catalogs/delivery-terms(/:id) | Auth + ADMIN       | CRUD               |
| GET                 | /api/catalogs/manufacturers        | Public             | Производители      |
| POST/PUT/DELETE     | /api/catalogs/manufacturers(/:id)  | Auth + ADMIN/PS    | CRUD               |
| GET/POST/PUT/DELETE | /api/catalogs/clients(/:id)        | Public (без auth!) | Заказчики          |

#### /api/documents — Документы

| Метод  | URL                   | Доступ        | Описание                                     |
| ------ | --------------------- | ------------- | -------------------------------------------- |
| GET    | /api/documents        | Auth          | Список (фильтр: tenderId/supplierId/offerId) |
| POST   | /api/documents/upload | Auth + Multer | Загрузка (PDF/JPG/PNG, до 10 МБ)             |
| DELETE | /api/documents/:id    | Auth          | Удалить                                      |

#### /api/dashboard — Дашборд

| Метод | URL                  | Доступ | Описание           |
| ----- | -------------------- | ------ | ------------------ |
| GET   | /api/dashboard/stats | Auth   | Статистика системы |
| GET   | /api/dashboard/logs  | Auth   | Логи аудита        |

#### Прочие

| Метод    | URL            | Доступ | Описание              |
| -------- | -------------- | ------ | --------------------- |
| GET/POST | /api/users     | Auth   | Пользователи          |
| GET/POST | /api/companies | Auth   | MVP-компании (устар.) |
| GET/POST | /api/bids      | Auth   | MVP-заявки (устар.)   |
| GET      | /api/health    | Public | Health check          |

---

## 6. ФАЙЛОВАЯ СТРУКТУРА ПРОЕКТА

    Tender for Helth/
    ├── PROJECT_CONTEXT.md              — технический паспорт системы
    ├── Roadmap.docx / Roadmap_extracted.txt  — дорожная карта
    ├── flow_ru_extracted.txt           — описание процессов
    ├── quation.txt / temp.txt          — рабочие заметки
    │
    ├── backend/                        — Node.js + Express сервер
    │   ├── .env                        — реальные переменные (не в git)
    │   ├── .env.example                — шаблон: DATABASE_URL, JWT_SECRET, PORT
    │   ├── index.js                    — точка входа: Express app, routes, CORS, middleware, error handler
    │   ├── package.json                — express 5, prisma 7, jsonwebtoken, bcryptjs, multer, pg
    │   ├── seed.js                     — заполнение БД тестовыми данными
    │   ├── clearDb.js                  — очистка БД
    │   ├── simulate_flow.js            — имитация полного цикла тендера
    │   ├── test_flow.js                — интеграционные тесты через HTTP
    │   ├── uploads/                    — загруженные файлы (PDF, JPG, PNG)
    │   │
    │   ├── prisma/
    │   │   ├── schema.prisma           — схема БД: 13 enum, 30+ models, 697 строк
    │   │   └── migrations/             — история миграций Prisma Migrate
    │   │
    │   └── src/
    │       ├── lib/
    │       │   └── prisma.js           — singleton PrismaClient
    │       │
    │       ├── middleware/
    │       │   ├── authMiddleware.js   — JWT-проверка, установка req.user = { id, userId, roleType }
    │       │   ├── rbacMiddleware.js   — checkRole([roles]) → 403 если нет прав; ADMIN всегда пропускается
    │       │   ├── auditMiddleware.js  — логирует POST/PUT/PATCH/DELETE с statusCode<400 в таблицу logs
    │       │   └── uploadMiddleware.js — Multer: diskStorage, лимит 10 МБ, PDF/JPG/JPEG/PNG
    │       │
    │       ├── routes/
    │       │   ├── authRoutes.js          — POST /login, /register; GET /me
    │       │   ├── tenderRoutes.js        — CRUD тендеров
    │       │   ├── offerRoutes.js         — CRUD предложений
    │       │   ├── supplierRoutes.js      — профиль + модерация (approve/reject)
    │       │   ├── evaluationRoutes.js    — вскрытие, оценка, award-lot, complete
    │       │   ├── catalogRoutes.js       — 8 справочников
    │       │   ├── dashboardRoutes.js     — stats + logs
    │       │   ├── documentRoutes.js      — upload, list, delete
    │       │   ├── userRoutes.js          — пользователи
    │       │   ├── companyRoutes.js       — MVP (устар.)
    │       │   └── bidRoutes.js           — MVP (устар.)
    │       │
    │       └── controllers/
    │           ├── authController.js      — register (User+Supplier), login (bcrypt+JWT), getMe
    │           ├── tenderController.js    — createTender, getTenders, getTenderById, deleteTender, getNextNumber
    │           ├── offerController.js     — createOffer, getMyOffers, getMyWins, getAllOffers, getOfferById, deleteOffer
    │           ├── supplierController.js  — updateProfile, getPendingSuppliers, approveSupplier, rejectSupplier, getModerationArchive, getSupplierById
    │           ├── evaluationController.js— openTenderBids, getEvaluationTenders, getTenderEvaluationDetails, awardLot, completeEvaluation
    │           ├── catalogController.js   — CRUD для 8 справочников + setExchangeRate
    │           ├── dashboardController.js — getDashboardStats, getLogs
    │           ├── documentController.js  — uploadDocument, getDocuments, deleteDocument
    │           ├── companyController.js   — MVP (устар.)
    │           ├── bidController.js       — MVP (устар.)
    │           └── userController.js      — getUsers
    │
    └── frontend/                       — React SPA (Vite)
        ├── index.html                  — точка монтирования (div#root)
        ├── vite.config.js              — плагины react+tailwindcss + proxy /api и /uploads → :5000
        ├── package.json                — react 19, react-router-dom 7, axios, tailwindcss 4, lucide-react
        │
        └── src/
            ├── main.jsx                — ReactDOM.createRoot + <BrowserRouter>
            ├── index.css               — Tailwind директивы
            ├── App.css                 — вспомогательные CSS (наследие шаблона Vite)
            │
            ├── App.jsx                 — корневой компонент:
            │                             стейт: token, user, role, lang, isDarkMode
            │                             синхронизация сессии при старте: GET /auth/me
            │                             все маршруты React Router
            │                             ролевая охрана: role === 'ADMIN' ? X : <Navigate to='/dashboard'/>
            │
            ├── assets/                 — статические изображения
            │
            ├── context/
            │   └── AlertContext.jsx    — глобальная система кастомных модальных окон (AlertProvider, useAlert):
            │                             заменяет браузерные window.alert() и window.confirm()
            │                             Promise-based showAlert() и showConfirm() с поддержкой dark mode, i18n, Lucide-иконок
            │
            ├── services/
            │   └── api.js              — Axios instance: baseURL=/api, JWT interceptors, auto-logout on 401
            │
            ├── utils/
            │   ├── themeUtils.js       — getRoleTheme(role, isDarkMode) → объект Tailwind-классов по роли
            │   │                         safeString(val, fallback) — безопасное строковое извлечение
            │   ├── statusUtils.jsx     — getStatusBadge(status, lang, isDarkMode) → JSX бейдж
            │   │                         getTypeBadge(type, lang, isDarkMode) → JSX бейдж типа
            │   └── translations.js     — getTranslation(lang, key, fallback), словарь RU/TM/EN (~51 КБ)
            │
            ├── components/
            │   ├── Sidebar.jsx         — боковое меню: ADMIN vs SUPPLIER ветки, коллапс (w-64/w-20), dark mode toggle
            │   ├── Header.jsx          — шапка: имя пользователя, роль, иконки действий
            │   ├── ErrorBoundary.jsx   — React Error Boundary с кнопкой navigate('/dashboard')
            │   ├── CustomDatePicker.jsx— кастомный портальный календарь выбора дат (i18n RU/TM/EN, dark mode, выбор месяца/года, ограничения min/max)
            │   ├── OfferModal.jsx      — модальное окно предложения (просмотр/редактирование)
            │   ├── AddSupplierModal.jsx— добавление поставщика
            │   ├── EditSupplierModal.jsx — редактирование профиля поставщика
            │   ├── RejectSupplierModal.jsx — форма отказа: textarea причины
            │   └── CatalogFormModal.jsx— универсальная форма записи каталога (create/edit)
            │
            └── pages/
                ├── LoginPage.jsx       — вход + регистрация (2 шага): Шаг1: ФИО/email/пароль/телефон; Шаг2: компания/тип/STŞK
                ├── Dashboard.jsx       — главная: статистика, последние тендеры и предложения
                ├── Tenders.jsx         — список тендеров с фильтрами (статус, тип, поиск)
                ├── TenderDetails.jsx   — детали: лоты, спецификации, файлы
                ├── CreateTenderPage.jsx— форма создания тендера: портальные CustomSelect (категория, заказчик, вид, валюта, статус, доступность, условия поставки, ед. изм., производитель), CustomDateInput, лоты/позиции, файлы [ADMIN]
                ├── CreateOfferPage.jsx — форма предложения: позиции по ТЗ/цены/валюта/курсы/файлы [SUPPLIER]
                ├── MyOffers.jsx        — список предложений поставщика
                ├── OfferDetailsPage.jsx— детали предложения со спецификациями
                ├── Evaluation.jsx      — реестр тендеров на оценку на 100% ширины (поиск, фильтры, сортировка, метрики) [ADMIN/COMMISSION]
                ├── EvaluationDetailsPage.jsx — полноэкранный рабочий стол оценки лотов (/evaluation/:id, Incoterms DAP/CIP, бок о бок сравнение, sticky-бар) [ADMIN/COMMISSION]
                ├── SupplierWins.jsx    — победы текущего поставщика [SUPPLIER, вместо Evaluation]
                ├── SuppliersList.jsx   — реестр поставщиков + модерация (approve/reject) [ADMIN]
                ├── SupplierProfilePage.jsx — профиль: данные компании, банк, документы, история верификации
                ├── AdminCatalogs.jsx   — справочники (3 секции: umumy/haryt/administrasiya) [ADMIN]
                └── AdminLogs.jsx       — журнал аудита (таблица logs) [ADMIN]

---

## 7. ДОПОЛНИТЕЛЬНЫЕ СВЕДЕНИЯ

### 7.1 Переменные окружения (.env)

| Переменная   | Пример                                                                       | Описание                                               |
| ------------ | ---------------------------------------------------------------------------- | ------------------------------------------------------ |
| DATABASE_URL | postgresql://postgres:password@localhost:5432/health_tender_db?schema=public | Строка подключения Prisma                              |
| JWT_SECRET   | super_secret_key_tender_health_2026                                          | Секрет JWT; если не задан — process.exit(1) при старте |
| PORT         | 5000                                                                         | Порт Express                                           |
| CORS_ORIGIN  | http://localhost:5173                                                        | Разрешённый origin                                     |

### 7.2 Очистка наименований поставщиков

При регистрации (authController.js) и обновлении профиля (supplierController.js) система автоматически срезает аббревиатуры правовых форм из названия компании:

    /^(ип|хо|ооо|чп|hj|dh|hk|telekeçi|hojalyk\s+jemgyýeti|hususy\s+telekeçi|hususy\s+kärhana)\s*["«'"]?\s*/i

Соответствие туркменским формам:

- HJ = Hususy telekeçi (ИП)
- HO = Hojalyk jemgyýeti (ОДО/ХО)
- HK = Hojalyk kärhana (ДП/ХК)

### 7.3 Навигационная карта React Router

| URL                 | Компонент                                    | Условие доступа                 |
| ------------------- | -------------------------------------------- | ------------------------------- |
| /login              | LoginPage                                    | Только без токена               |
| /dashboard          | Dashboard                                    | Авторизован                     |
| /create-tender      | CreateTenderPage                             | Авторизован (на практике ADMIN) |
| /suppliers          | SuppliersList                                | Авторизован                     |
| /suppliers/:id      | SupplierProfilePage                          | Авторизован                     |
| /tenders            | Tenders                                      | Авторизован                     |
| /tenders/:id        | TenderDetails                                | Авторизован                     |
| /tender-details/:id | TenderDetails                                | Авторизован (алиас)             |
| /create-offer/:id   | CreateOfferPage                              | Авторизован                     |
| /offers             | MyOffers                                     | Авторизован                     |
| /offers/:id         | OfferDetailsPage                             | Авторизован                     |
| /evaluation         | Evaluation (ADMIN) / SupplierWins (SUPPLIER) | Авторизован                     |
| /umumy              | AdminCatalogs section=umumy                  | role === 'ADMIN'                |
| /haryt              | AdminCatalogs section=haryt                  | role === 'ADMIN'                |
| /administrasiya     | AdminCatalogs section=administrasiya         | role === 'ADMIN'                |
| /logs / /admin-logs | AdminLogs                                    | role === 'ADMIN'                |
| /profile            | SupplierProfilePage isOwner=true             | Авторизован                     |
| /settings           | Inline (выбор языка)                         | Авторизован                     |
| /\*                 | Navigate to /dashboard                       | —                               |

### 7.4 Мультиязычная поддержка (i18n)

| Код | Язык                 | Статус                       |
| --- | -------------------- | ---------------------------- |
| RU  | Русский              | По умолчанию, полный словарь |
| TM  | Türkmençe (латиница) | Полный словарь               |
| EN  | English              | Частичный словарь            |

Словарь: src/utils/translations.js (~51 КБ).
Функция: getTranslation(lang, key, fallback).
Переключение: /settings страница, CustomSelect элемент. Значение хранится в React state App.jsx (lang, setLang).

### 7.5 Компоненты интерфейса и дизайн-система

- **CustomSelect (`src/components/CustomSelect.jsx`)**: Универсальный выпадающий список (Portal-based, не обрезается карточками и `overflow-hidden`), с поддержкой роли (`ADMIN` — изумрудные акценты, `SUPPLIER` — синие акценты), поиска, темной темы и плавной анимации. Применен во всех фильтрах, формах и модальных окнах системы (Evaluation, MyOffers, Tenders, CreateOfferPage, Settings, SupplierProfilePage, CreateTenderPage, OfferModal, CatalogFormModal, AddSupplierModal, EditSupplierModal, LoginPage).
- **Поддержка предметов закупки (Товары, Работы, Услуги)**:
  - `GOODS` (Товары): выбор из справочника МНН с поиском, производитель, Incoterms, фасовка и количество.
  - `WORKS` (Работы / Ремонт): этап/вид работ со свободным текстовым вводом, скрыт производитель, объем, состав работ, адрес объекта, график, требование строительной лицензии, валидация отсутствия пустых лотов.
  - `SERVICES` (Услуги / Сервис): наименование услуги со свободным текстовым вводом, скрыт производитель, объем/период, регламент SLA, формат оказания (на объекте/удаленно/гибрид).
- **Оценка заявок (`EvaluationDetailsPage.jsx`)**:
  - Отображение предложенных поставщиком условий поставки (Incoterms) под названием компании с цветовым индикатором расхождения с условием заказчика.
  - Нижняя панель действий (Sticky Action Bar) адаптирована под рабочий контейнер (`sticky bottom-0 -mx-6 -mb-6`) и не перекрывает боковое меню (Sidebar).
- **Алерты (`AlertContext.jsx`)**: Адаптивное цветовое оформление всплывающих окон подтверждения и уведомлений с учетом роли пользователя (`SUPPLIER` — синий брендинг, `ADMIN` — изумрудный).
- **Предотвращение дубликатов файлов**: Устранено дублирование записей прикрепленных документов оффера в `offerController.js`.


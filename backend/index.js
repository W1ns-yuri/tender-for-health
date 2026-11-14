const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Строгая валидация секретного ключа для JWT
if (!process.env.JWT_SECRET) {
    console.error("FATAL ERROR: JWT_SECRET is not defined in .env file.");
    process.exit(1);
}

// В проде запрещаем ключ из .env.example и короткие ключи: с известным ключом любой подделает токен админа
const KNOWN_DEMO_SECRETS = ['super_secret_key_tender_health_2026', 'change_me'];
if (process.env.NODE_ENV === 'production'
    && (KNOWN_DEMO_SECRETS.includes(process.env.JWT_SECRET) || process.env.JWT_SECRET.length < 32)) {
    console.error('FATAL ERROR: JWT_SECRET is a demo value or shorter than 32 chars. Generate one: node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"');
    process.exit(1);
}

const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');
const companyRoutes = require('./src/routes/companyRoutes');
const tenderRoutes = require('./src/routes/tenderRoutes');
const documentRoutes = require('./src/routes/documentRoutes');

// Новые маршруты по ТЗ
const catalogRoutes = require('./src/routes/catalogRoutes');
const offerRoutes = require('./src/routes/offerRoutes');
const evaluationRoutes = require('./src/routes/evaluationRoutes');
const contractRoutes = require('./src/routes/contractRoutes');
const dashboardRoutes = require('./src/routes/dashboardRoutes');
const supplierRoutes = require('./src/routes/supplierRoutes');
const notificationRoutes = require('./src/routes/notificationRoutes');

const auditLog = require('./src/middleware/auditMiddleware');
const prisma = require('./src/lib/prisma');

const app = express();

// За прокси (nginx, Render, Railway) req.ip должен быть IP клиента, иначе лимитер посчитает всех за одного
if (process.env.TRUST_PROXY) app.set('trust proxy', Number(process.env.TRUST_PROXY) || 1);
app.disable('x-powered-by');

// Стандартные защитные заголовки. CORP = cross-origin, чтобы фронт на другом домене мог показывать файлы
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
}));
app.use(express.json({ limit: '1mb' }));

// В проде не отдаём наружу текст внутренних ошибок (Prisma, SQL, пути файлов): контроллеры
// пишут его в поле details при 500. Сама ошибка остаётся в логе сервера.
if (process.env.NODE_ENV === 'production') {
    app.use((req, res, next) => {
        const json = res.json.bind(res);
        res.json = (body) => {
            if (res.statusCode >= 500 && body && typeof body === 'object' && 'details' in body) {
                console.error(`[${req.method} ${req.originalUrl}]`, body.details);
                const { details: _details, ...rest } = body;
                return json(rest);
            }
            return json(body);
        };
        next();
    });
}

// Защита от перебора паролей: не больше 20 НЕУДАЧНЫХ попыток входа за 15 минут с одного IP.
// Успешные входы не считаем: в больнице вся бухгалтерия может сидеть за одним IP, и после
// 20 нормальных входов за утро остальных бы не пускало.
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: Number(process.env.LOGIN_RATE_LIMIT) || 20,
    skipSuccessfulRequests: true,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'Слишком много попыток. Попробуйте через 15 минут.' },
});
app.use('/api/auth/login', authLimiter);

// Регистрация: успешные тоже считаем, иначе можно наплодить тысячи фейковых поставщиков
const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    // В CI автотесты регистрируют десятки поставщиков: там лимит поднимают через REGISTER_RATE_LIMIT
    limit: Number(process.env.REGISTER_RATE_LIMIT) || 10,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'Слишком много регистраций с этого адреса. Попробуйте позже.' },
});
app.use('/api/auth/register', registerLimiter);

// Скачивание загруженных документов: только для вошедших и с проверкой прав (см. fileRoutes.js).
// Раньше здесь был express.static, и любой документ мог скачать кто угодно по имени файла.
app.use('/uploads', require('./src/routes/fileRoutes'));

// Подключаем автоматическое журналирование (Log)
app.use(auditLog('TENDER', 'OKAMAK'));

// Маршруты API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/tenders', tenderRoutes);
// /api/bids (старый MVP) отключён: фронт его не использует, а GET отдавал цены всех заявок любому вошедшему.
app.use('/api/documents', documentRoutes);

// Новые эндпоинты ядра ТЗ
app.use('/api/catalogs', catalogRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/evaluation', evaluationRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/notifications', notificationRoutes);

// Проверка для хостинга/мониторинга: 200 только если жива и база
app.get('/api/health', async (req, res) => {
    try {
        await prisma.$queryRaw`SELECT 1`;
        res.json({ status: 'ok', db: 'ok' });
    } catch (error) {
        console.error('Health check DB error:', error.message);
        res.status(503).json({ status: 'error', db: 'unavailable' });
    }
});

// Один сервис на всё: если собранный фронт лежит рядом, отдаём его отсюда же (SERVE_FRONTEND=true).
// Иначе фронт раздаётся отдельно (nginx / статический хостинг), а сюда идёт только /api.
if (process.env.SERVE_FRONTEND === 'true') {
    const path = require('path');
    const distDir = path.resolve(__dirname, process.env.FRONTEND_DIST || '../frontend/dist');
    app.use(express.static(distDir, { index: false, maxAge: '1h' }));
    // SPA: все не-API адреса отдают index.html, роутинг делает React
    app.get(/^\/(?!api\/|uploads\/).*/, (req, res) => res.sendFile(path.join(distDir, 'index.html')));
}

// Неизвестный адрес API: JSON, а не HTML-страница Express
app.use('/api', (req, res) => res.status(404).json({ error: 'Маршрут не найден' }));

// Глобальный обработчик ошибок (Global Error Handler)
app.use((err, req, res, next) => {
    console.error('Unhandled Error:', err.stack || err.message || err);
    res.status(err.status || 500).json({
        error: 'Внутренняя ошибка сервера (Internal Server Error)',
        details: process.env.NODE_ENV === 'production' ? 'Произошла непредвиденная ошибка на сервере' : (err.message || 'Ошибка обработки запроса')
    });
});

const { initTenderScheduler } = require('./src/services/tenderScheduler');

const PORT = process.env.PORT || 5000;
let schedulerTimer = null;
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Сервер тендерной системы успешно запущен на порту ${PORT}`);
    // Запуск фонового планировщика дедлайнов тендеров
    schedulerTimer = initTenderScheduler(60000);
});

// Корректная остановка при деплое/перезапуске: дожидаемся текущих запросов и закрываем пул БД
const shutdown = (signal) => {
    console.log(`${signal}: останавливаем сервер...`);
    if (schedulerTimer) clearInterval(schedulerTimer);
    server.close(async () => {
        await prisma.$disconnect().catch(() => {});
        process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
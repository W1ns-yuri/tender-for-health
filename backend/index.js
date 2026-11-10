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
const dashboardRoutes = require('./src/routes/dashboardRoutes');
const supplierRoutes = require('./src/routes/supplierRoutes');
const notificationRoutes = require('./src/routes/notificationRoutes');

const auditLog = require('./src/middleware/auditMiddleware');

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

// Защита от перебора паролей и массовой регистрации: не больше 20 попыток входа за 15 минут с одного IP
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'Слишком много попыток. Попробуйте через 15 минут.' },
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

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
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Сервер тендерной системы (Tender System Backend) работает!' });
});

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
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Сервер тендерной системы успешно запущен на порту ${PORT}`);
    // Запуск фонового планировщика дедлайнов тендеров
    initTenderScheduler(60000);
});
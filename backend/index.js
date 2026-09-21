const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Строгая валидация секретного ключа для JWT
if (!process.env.JWT_SECRET) {
    console.error("FATAL ERROR: JWT_SECRET is not defined in .env file.");
    process.exit(1);
}

const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');
const companyRoutes = require('./src/routes/companyRoutes');
const tenderRoutes = require('./src/routes/tenderRoutes');
const bidRoutes = require('./src/routes/bidRoutes');
const documentRoutes = require('./src/routes/documentRoutes');

// Новые маршруты по ТЗ
const catalogRoutes = require('./src/routes/catalogRoutes');
const offerRoutes = require('./src/routes/offerRoutes');
const evaluationRoutes = require('./src/routes/evaluationRoutes');
const dashboardRoutes = require('./src/routes/dashboardRoutes');
const supplierRoutes = require('./src/routes/supplierRoutes');

const auditLog = require('./src/middleware/auditMiddleware');

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
}));
app.use(express.json());

// Отдача статических файлов (чтобы скачивать загруженные документы)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Подключаем автоматическое журналирование (Log)
app.use(auditLog('TENDER', 'OKAMAK'));

// Маршруты API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/tenders', tenderRoutes);
app.use('/api/bids', bidRoutes);
app.use('/api/documents', documentRoutes);

// Новые эндпоинты ядра ТЗ
app.use('/api/catalogs', catalogRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/evaluation', evaluationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/suppliers', supplierRoutes);

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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Сервер тендерной системы успешно запущен на порту ${PORT}`);
});
const prisma = require('../lib/prisma');

/**
 * Middleware для логирования (аудита) операций записи в системе.
 * Фиксирует ID пользователя, IP-адрес, тип события, тип операции и JSON-данные.
 * Логирует только мутирующие операции (POST, PUT, PATCH, DELETE), а не GET-запросы.
 */
const auditLog = (eventType = 'TENDER', operationType = 'OKAMAK') => {
    return async (req, res, next) => {
        const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;

        res.on('finish', async () => {
            // Логируем только мутирующие операции (не GET) и только успешные
            const isWriteOperation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);
            if (!isWriteOperation || res.statusCode >= 400) {
                return;
            }

            // Пропускаем служебные эндпоинты
            const skipPaths = ['/api/health', '/uploads'];
            if (skipPaths.some(p => req.originalUrl.startsWith(p))) {
                return;
            }

            try {
                await prisma.log.create({
                    data: {
                        userId: req.user?.id || null,
                        eventType: eventType === 'HARYT' ? 'HARYT' : 'TENDER',
                        operationType: 'YAZMAK',
                        ip: String(clientIp),
                        data: {
                            method: req.method,
                            url: req.originalUrl,
                            params: req.params,
                            query: req.query,
                            body: req.body ? sanitizeBody(req.body) : null,
                        },
                    },
                });
            } catch (error) {
                console.error('Ошибка записи журнала аудита (Log):', error.message);
            }
        });

        next();
    };
};

// Функция скрывает пароли в журналах
function sanitizeBody(body) {
    if (typeof body !== 'object' || body === null) return body;
    const sanitized = { ...body };
    if (sanitized.password) sanitized.password = '***HIDDEN***';
    return sanitized;
}

module.exports = auditLog;

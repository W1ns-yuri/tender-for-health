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

// Поля, которые нельзя писать в журнал: пароли и содержимое "конверта" предложения.
// Журнал читают админы (и раньше видели поставщики на дашборде), а цены до вскрытия не должен видеть никто.
const SECRET_KEYS = new Set(['password', 'newPassword', 'oldPassword', 'token']);
const SEALED_KEYS = new Set(['specs', 'offeredPrice', 'unitPrice', 'exchangeRates', 'paymentTerms', 'deliveryTerm', 'comment']);

function sanitizeBody(body, depth = 0) {
    if (typeof body !== 'object' || body === null || depth > 5) return body;
    if (Array.isArray(body)) return body.map((v) => sanitizeBody(v, depth + 1));
    const sanitized = {};
    for (const [key, value] of Object.entries(body)) {
        if (SECRET_KEYS.has(key)) sanitized[key] = '***HIDDEN***';
        else if (SEALED_KEYS.has(key)) sanitized[key] = '***SEALED***';
        else sanitized[key] = sanitizeBody(value, depth + 1);
    }
    return sanitized;
}

module.exports = auditLog;

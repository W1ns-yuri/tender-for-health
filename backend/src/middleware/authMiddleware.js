const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');

const authMiddleware = async (req, res, next) => {
    // Получаем заголовок Authorization: Bearer <TOKEN>
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Доступ запрещен. Токен не предоставлен' });
    }

    const token = authHeader.split(' ')[1];

    try {
        // Проверяем валидность токена
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId || decoded.id;

        if (!userId) {
            return res.status(401).json({ error: 'Неверный токен' });
        }

        // Проверяем существование пользователя в базе данных
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, roleType: true, isActive: true }
        });

        if (!user || !user.isActive) {
            return res.status(401).json({ error: 'Пользователь не найден или заблокирован. Пожалуйста, войдите снова.' });
        }

        // Записываем данные авторизованного пользователя в req.user
        req.user = {
            id: user.id,
            userId: user.id,
            roleType: user.roleType,
        };

        next(); // Передаем управление дальше контроллеру
    } catch (error) {
        return res.status(401).json({ error: 'Недействительный или истекший токен' });
    }
};

const optionalAuthMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next();
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId || decoded.id;
        if (userId) {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { id: true, roleType: true, isActive: true }
            });
            if (user && user.isActive) {
                req.user = {
                    id: user.id,
                    userId: user.id,
                    roleType: user.roleType,
                };
            }
        }
    } catch (_) {
        // Ошибки токена игнорируются для опциональной авторизации
    }
    next();
};

authMiddleware.optional = optionalAuthMiddleware;

module.exports = authMiddleware;
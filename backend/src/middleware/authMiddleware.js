const prisma = require('../lib/prisma');
const { readAuthCookie } = require('../utils/authCookie');
const { verifyToken, issuedBeforePasswordChange } = require('../utils/authToken');

const bearerToken = (req) => {
    const header = req.headers.authorization;
    return header && header.startsWith('Bearer ') ? header.slice(7) : null;
};

/**
 * Пользователь по токену или { error }. Проверяем не только подпись, но и базу:
 * заблокированный пользователь или токен до смены пароля не проходят.
 */
async function resolveUser(token) {
    const payload = verifyToken(token);
    const userId = payload?.userId || payload?.id;
    if (!userId) return { error: 'Недействительный или истекший токен' };

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, roleType: true, isActive: true, passwordChangedAt: true },
    });
    if (!user || !user.isActive) return { error: 'Пользователь не найден или заблокирован. Пожалуйста, войдите снова.' };
    if (issuedBeforePasswordChange(payload, user)) return { error: 'Пароль был изменён. Войдите снова.' };
    return { user: { id: user.id, userId: user.id, roleType: user.roleType } };
}

const authMiddleware = async (req, res, next) => {
    const token = bearerToken(req);
    if (!token) return res.status(401).json({ error: 'Доступ запрещен. Токен не предоставлен' });
    try {
        const { user, error } = await resolveUser(token);
        if (error) return res.status(401).json({ error });
        req.user = user;
        next();
    } catch (error) {
        next(error);
    }
};

/** Вошёл — заполняем req.user, не вошёл или токен плохой — идём дальше как гость */
const optionalAuthMiddleware = async (req, res, next) => {
    const token = bearerToken(req);
    if (!token) return next();
    try {
        const { user } = await resolveUser(token);
        if (user) req.user = user;
        next();
    } catch (error) {
        next(error);
    }
};

/**
 * То же, что authMiddleware, но токен можно передать и через httpOnly-cookie.
 * Используется ТОЛЬКО для скачивания файлов (см. utils/authCookie.js).
 * Для API оставляем только заголовок: так cookie нельзя использовать для CSRF на изменяющие запросы.
 */
const fileAuthMiddleware = (req, res, next) => {
    if (!req.headers.authorization) {
        const cookieToken = readAuthCookie(req);
        if (cookieToken) req.headers.authorization = `Bearer ${cookieToken}`;
    }
    return authMiddleware(req, res, next);
};

authMiddleware.optional = optionalAuthMiddleware;
authMiddleware.file = fileAuthMiddleware;

module.exports = authMiddleware;

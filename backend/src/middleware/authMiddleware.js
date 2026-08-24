const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    // Получаем заголовок Authorization: Bearer <TOKEN>
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Доступ запрещен. Токен не предоставлен' });
    }

    const token = authHeader.split(' ')[1];

    try {
        // Проверяем валидность токена
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Записываем данные авторизованного пользователя в req.user
        req.user = {
            id: decoded.userId,
            roleType: decoded.roleType,
        };

        next(); // Передаем управление дальше контроллеру
    } catch (error) {
        return res.status(403).json({ error: 'Недействительный или истекший токен' });
    }
};

module.exports = authMiddleware;
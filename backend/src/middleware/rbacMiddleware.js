/**
 * Middleware для разграничения ролевого доступа (RBAC).
 * Принимает массив допустимых ролей (например: ['ADMIN', 'CLIENT', 'PURCHASING_SPECIALIST']).
 */
const checkRole = (allowedRoles = []) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Пользователь не авторизован' });
        }

        // Если разрешено админу или у пользователя одна из разрешенных ролей
        if (allowedRoles.includes(req.user.roleType) || req.user.roleType === 'ADMIN') {
            return next();
        }

        return res.status(403).json({
            error: 'Доступ запрещен. Недостаточно прав для выполнения операции.',
            requiredRoles: allowedRoles,
            userRole: req.user.roleType,
        });
    };
};

module.exports = { checkRole };

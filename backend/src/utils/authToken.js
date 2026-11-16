/**
 * Выпуск и проверка JWT. Всё в одном месте, чтобы вход, регистрация и смена пароля
 * выдавали одинаковые токены, а middleware одинаково их проверял.
 */
const jwt = require('jsonwebtoken');

const TOKEN_TTL = '7d';
const ALGORITHMS = ['HS256'];

const signToken = (user) =>
    jwt.sign({ userId: user.id, roleType: user.roleType }, process.env.JWT_SECRET, { expiresIn: TOKEN_TTL, algorithm: 'HS256' });

/** Payload или null, если токен поддельный или истёк */
const verifyToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_SECRET, { algorithms: ALGORITHMS });
    } catch {
        return null;
    }
};

/**
 * Токен выпущен до смены пароля → недействителен (украденный токен перестаёт работать).
 * iat в секундах, поэтому сравниваем с точностью до секунды.
 */
const issuedBeforePasswordChange = (payload, user) =>
    Boolean(user.passwordChangedAt) && payload.iat < Math.floor(user.passwordChangedAt.getTime() / 1000);

module.exports = { signToken, verifyToken, issuedBeforePasswordChange };

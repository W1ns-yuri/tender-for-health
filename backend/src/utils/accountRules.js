/**
 * Общие правила для учётных записей.
 */

// В продукте реально две роли. CLIENT / PURCHASING_SPECIALIST / COMMISSION_MEMBER есть в enum,
// но ни один экран под них не сделан, поэтому создавать таких пользователей запрещаем.
const ASSIGNABLE_ROLES = ['ADMIN', 'SUPPLIER'];

const MIN_PASSWORD_LENGTH = 8;

/** Текст ошибки, если пароль слабый, иначе null. */
function passwordError(password) {
    if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
        return `Пароль должен быть не короче ${MIN_PASSWORD_LENGTH} символов`;
    }
    return null;
}

module.exports = { ASSIGNABLE_ROLES, MIN_PASSWORD_LENGTH, passwordError };

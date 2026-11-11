/**
 * Проверки входных данных, которые фронт делает «для удобства», а сервер обязан делать всегда:
 * запрос можно отправить в обход формы.
 */

const MAX_TITLE = 500;
const MAX_TEXT = 300;
const MAX_QUANTITY = 1e9;
const MAX_UNIT_PRICE = 1e12; // столбец Decimal(18,4): больше просто не поместится
const MAX_DEADLINE_YEARS = 2;

const tooLong = (value, max) => typeof value === 'string' && value.trim().length > max;

/** Количество позиции: пусто → 1 (как было), иначе конечное число > 0. Возвращает число или null. */
function parseQuantity(raw) {
    if (raw === undefined || raw === null || raw === '') return 1;
    const n = typeof raw === 'number' ? raw : Number(String(raw).replace(',', '.'));
    if (!Number.isFinite(n) || n <= 0 || n > MAX_QUANTITY) return null;
    return n;
}

/** Ошибка в списке позиций лота или null. Позиции без названия по-прежнему просто пропускаются. */
function specsError(specs) {
    if (specs === undefined) return null;
    if (!Array.isArray(specs)) return 'Позиции лота должны быть списком';
    for (let i = 0; i < specs.length; i++) {
        const s = specs[i] || {};
        const name = s.name || s.haryt;
        if (!name || !String(name).trim()) continue;
        if (tooLong(String(name), MAX_TITLE)) return `Позиция ${i + 1}: слишком длинное название`;
        if (parseQuantity(s.quantity ?? s.mukdar) === null) {
            return `Позиция ${i + 1} («${String(name).trim().slice(0, 40)}»): количество должно быть числом больше 0`;
        }
    }
    return null;
}

/** Номер лота: если передан, то целое число от 1 */
function lotNumberError(lotNumber) {
    if (lotNumber === undefined || lotNumber === null || lotNumber === '') return null;
    const n = Number(lotNumber);
    return Number.isInteger(n) && n >= 1 && n <= 10000 ? null : 'Номер лота должен быть целым числом от 1';
}

/** Дедлайн не дальше чем через MAX_DEADLINE_YEARS лет (опечатка «9999» в годе) */
function deadlineTooFar(date) {
    const limit = new Date();
    limit.setFullYear(limit.getFullYear() + MAX_DEADLINE_YEARS);
    return date > limit;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[\d\s()-]{6,25}$/;

/** Ошибка в данных регистрации поставщика или null */
function registrationError({ username, phone, taxId, companyName, firstName, lastName, countryCode }) {
    if (typeof username !== 'string' || !EMAIL_RE.test(username.trim()) || username.length > 200) {
        return 'Логин должен быть адресом электронной почты, например name@company.tm';
    }
    if (typeof phone !== 'string' || !PHONE_RE.test(phone.trim()) || phone.replace(/\D/g, '').length < 6) {
        return 'Укажите телефон цифрами, например +993 65 12-34-56';
    }
    for (const [v, label] of [[firstName, 'Имя'], [lastName, 'Фамилия']]) {
        if (typeof v !== 'string' || tooLong(v, 100)) return `${label}: не длиннее 100 символов`;
    }
    if (companyName !== undefined && (typeof companyName !== 'string' || tooLong(companyName, MAX_TEXT))) {
        return `Название компании: не длиннее ${MAX_TEXT} символов`;
    }
    if (taxId) {
        const clean = String(taxId).trim();
        if ((countryCode || 'TM').toUpperCase() === 'TM') {
            if (!/^\d{8}$/.test(clean.replace(/\s/g, ''))) return 'ИНН в Туркменистане состоит из 8 цифр';
        } else if (!/^[A-Za-z0-9-]{4,30}$/.test(clean)) {
            return 'Налоговый номер: от 4 до 30 латинских букв и цифр';
        }
    }
    return null;
}

module.exports = {
    MAX_TITLE, MAX_UNIT_PRICE, tooLong, parseQuantity, specsError, lotNumberError, deadlineTooFar, registrationError,
};

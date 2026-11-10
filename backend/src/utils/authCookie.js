/**
 * Cookie с JWT нужна только для скачивания файлов.
 *
 * Почему: ссылки на документы — это обычные <a href="/uploads/..."> и window.open(),
 * браузер не добавляет к ним заголовок Authorization. Поэтому при входе сервер кладёт
 * тот же токен в httpOnly-cookie, и браузер сам отправляет её при переходе по ссылке.
 * JS эту cookie прочитать не может (httpOnly), так что XSS её не украдёт.
 */
const COOKIE_NAME = 'tender_token';
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // как expiresIn: '7d' у JWT

const cookieOptions = () => ({
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
});

const setAuthCookie = (res, token) => {
    res.cookie(COOKIE_NAME, token, { ...cookieOptions(), maxAge: MAX_AGE_MS });
};

const clearAuthCookie = (res) => {
    res.clearCookie(COOKIE_NAME, cookieOptions());
};

// Без зависимости cookie-parser: достаём одну cookie из заголовка
const readAuthCookie = (req) => {
    const header = req.headers.cookie;
    if (!header) return null;
    for (const part of header.split(';')) {
        const [name, ...rest] = part.trim().split('=');
        if (name === COOKIE_NAME) return decodeURIComponent(rest.join('='));
    }
    return null;
};

module.exports = { setAuthCookie, clearAuthCookie, readAuthCookie, COOKIE_NAME };

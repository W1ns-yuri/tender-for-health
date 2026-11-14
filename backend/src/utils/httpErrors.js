/**
 * Единый ответ на ошибку из catch.
 * - Ошибки Prisma, вызванные плохими входными данными, превращаем в 400/404 вместо 500.
 * - Внутренний текст ошибки (пути, SQL, куски запроса Prisma) отдаём только вне продакшена.
 */
const PRISMA_CLIENT_ERRORS = {
    P2003: [400, 'Указана несуществующая запись справочника (категория, заказчик, единица и т.п.)'],
    P2002: [400, 'Такая запись уже существует'],
    P2025: [404, 'Запись не найдена'],
    P2000: [400, 'Слишком длинное значение в одном из полей'],
    P2023: [400, 'Некорректный идентификатор'],
};

function sendError(res, error, message) {
    if (error?.isClientError) return res.status(400).json({ error: error.message });
    const mapped = PRISMA_CLIENT_ERRORS[error?.code];
    if (mapped) return res.status(mapped[0]).json({ error: mapped[1] });
    // Неверные типы во входных данных (строка вместо числа и т.п.)
    if (error?.name === 'PrismaClientValidationError') {
        return res.status(400).json({ error: 'Некорректные данные в запросе' });
    }
    console.error(message, error);
    const body = { error: message };
    if (process.env.NODE_ENV !== 'production') body.details = error?.message;
    return res.status(500).json(body);
}

module.exports = { sendError };

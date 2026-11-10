/**
 * Принцип запечатанных конвертов.
 *
 * Пока конверты не вскрыты (POST /evaluation/open/:tenderId переводит тендер в BAHALANDYRYLDY),
 * цены, позиции и файлы предложений не видит НИКТО, кроме самого поставщика. Включая админа.
 * До вскрытия админу доступны только метаданные: сколько заявок, от кого, когда поданы.
 *
 * Отменённый тендер (GOYBOLSUN_EDILDI) тоже остаётся запечатанным: иначе можно отменить
 * тендер ради того, чтобы подсмотреть цены.
 */
const OPENED_STATUSES = ['BAHALANDYRYLDY', 'YENIJI_YGLAN_EDILDI', 'ARHIWLENDI'];

const SEALED_ERROR =
    'Предложение запечатано. Цены и документы будут доступны после вскрытия конвертов.';

const isTenderOpened = (tender) => Boolean(tender) && OPENED_STATUSES.includes(tender.status);

/**
 * Убирает из предложения всё коммерческое. Оставляет: кто подал, когда, статус.
 * Работает с любым набором include: чего нет в объекте, того и не будет.
 */
const sealOffer = (offer) => {
    if (!offer) return offer;
    const {
        offeredPrice, specs, exchangeRates, files, comment, paymentTerms, deliveryTerm, deliveryTermId,
        ...meta
    } = offer;
    return {
        ...meta,
        offeredPrice: null,
        specs: [],
        exchangeRates: [],
        files: [],
        isSealed: true,
    };
};

/**
 * Запечатать предложение для пользователя, если нужно.
 * ownerUserId: userId поставщика, подавшего предложение (свою заявку поставщик видит всегда).
 */
const sealOfferFor = (user, offer, tender, ownerUserId) => {
    if (isTenderOpened(tender)) return offer;
    if (user && ownerUserId && ownerUserId === user.id) return offer;
    return sealOffer(offer);
};

module.exports = { OPENED_STATUSES, SEALED_ERROR, isTenderOpened, sealOffer, sealOfferFor };

const prisma = require('../lib/prisma');

/**
 * Видит ли пользователь тендер (те же правила, что в GET /tenders/:id):
 *  - админ видит всё;
 *  - черновик (TASLAMA) видит только админ;
 *  - закрытый (YAPYK) видит только приглашённый поставщик;
 *  - открытый (ACYK) видят все авторизованные.
 * Возвращает { ok, status, error }.
 */
const checkTenderVisible = async (user, tenderId) => {
    const tender = await prisma.tender.findUnique({
        where: { id: tenderId },
        select: { status: true, visibility: true },
    });
    if (!tender) return { ok: false, status: 404, error: 'Тендер не найден' };
    if (user?.roleType === 'ADMIN') return { ok: true };
    if (tender.status === 'TASLAMA') return { ok: false, status: 404, error: 'Тендер не найден' };
    if (tender.visibility === 'YAPYK') {
        const invited = await prisma.tenderInvitedSupplier.findFirst({
            where: { tenderId, supplier: { userId: user?.id } },
            select: { id: true },
        });
        if (!invited) return { ok: false, status: 403, error: 'Тендер закрытый: доступ только по приглашению' };
    }
    return { ok: true };
};

module.exports = { checkTenderVisible };

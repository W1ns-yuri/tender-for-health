/**
 * Договоры по итогам тендера.
 *
 * Как это работает:
 * 1. Комиссия объявляет итоги → с каждым победителем создаётся черновик договора
 *    (сумма = выигранные позиции × цена из его предложения).
 * 2. Организатор отправляет договор поставщику (DRAFT → SENT).
 * 3. Поставщик скачивает, подписывает и загружает скан (SENT → SUPPLIER_SIGNED).
 * 4. Организатор загружает свой подписанный экземпляр (→ SIGNED) или возвращает с замечанием (→ SENT).
 * Отменить можно любой неподписанный договор.
 */
const prisma = require('../lib/prisma');
const { sendNotification, notifyAdmins } = require('./notificationController');
const { sumLineTotals } = require('../utils/money');
const { sendError } = require('../utils/httpErrors');

const SIGNED_FILE_TYPES = /^(application\/pdf|image\/(jpeg|png|webp))$/;

const LIST_INCLUDE = {
    tender: { select: { id: true, tenderNumber: true, title: true } },
    supplier: { select: { id: true, name: true, userId: true } },
};

const DETAIL_INCLUDE = {
    ...LIST_INCLUDE,
    supplier: {
        select: {
            id: true, name: true, userId: true, taxId: true, address: true, legalAddress: true, phone: true, email: true,
            directorName: true, bankName: true, bankAccount: true, bankMfo: true, bankIban: true, bankSwift: true,
        },
    },
    tender: { select: { id: true, tenderNumber: true, title: true, client: { select: { name: true } } } },
    offer: {
        select: {
            id: true, number: true,
            specs: {
                where: { isAwarded: true },
                include: { unit: true, tenderSpec: { include: { unit: true, lot: { select: { lotNumber: true, name: true } } } } },
            },
        },
    },
};

/**
 * Создать недостающие договоры по объявленным итогам. Повторный вызов ничего не дублирует.
 * Возвращает число созданных договоров.
 */
async function ensureContracts(tenderId, db = prisma) {
    const tender = await db.tender.findUnique({
        where: { id: tenderId },
        select: {
            tenderNumber: true,
            contracts: { select: { offerId: true, number: true } },
            offers: {
                where: { specs: { some: { isAwarded: true } } },
                select: {
                    id: true, supplierId: true,
                    baseCurrency: { select: { code: true } },
                    specs: { where: { isAwarded: true }, select: { quantity: true, unitPrice: true } },
                },
            },
        },
    });
    if (!tender) return 0;
    const have = new Set(tender.contracts.map((c) => c.offerId));
    let n = tender.contracts.length;
    let created = 0;
    for (const offer of tender.offers) {
        if (have.has(offer.id)) continue;
        n += 1;
        await db.contract.create({
            data: {
                number: `Д-${tender.tenderNumber}-${n}`,
                tenderId,
                offerId: offer.id,
                supplierId: offer.supplierId,
                amount: sumLineTotals(offer.specs),
                currencyCode: offer.baseCurrency?.code || null,
            },
        });
        created += 1;
    }
    return created;
}

const isAdmin = (user) => user.roleType === 'ADMIN';

/** Договор, если пользователь — его сторона; иначе null (не выдаём сам факт существования) */
async function findForUser(id, user, include = LIST_INCLUDE) {
    const contract = await prisma.contract.findUnique({ where: { id }, include });
    if (!contract) return null;
    if (isAdmin(user) || contract.supplier?.userId === user.id) return contract;
    return null;
}

/** Скан подписанного договора: свой загруженный PDF или картинка */
async function signedFileError(user, fileName) {
    if (!fileName) return 'Загрузите скан подписанного договора';
    const doc = await prisma.document.findFirst({ where: { fileName: String(fileName) }, select: { uploadedById: true, fileType: true } });
    if (!doc) return 'Файл не найден: загрузите его ещё раз';
    if (doc.uploadedById !== user.id) return 'Можно приложить только файл, который вы загрузили сами';
    if (!SIGNED_FILE_TYPES.test(doc.fileType || '')) return 'Скан договора должен быть PDF или картинкой (JPG, PNG, WEBP)';
    return null;
}

const notifySupplier = (contract, title, message) => {
    if (!contract.supplier?.userId) return;
    sendNotification({ userId: contract.supplier.userId, title, message, type: 'contract', link: `/contracts/${contract.id}` })
        .catch((e) => console.error('Contract notify error:', e));
};

// GET /contracts?tenderId=
const listContracts = async (req, res) => {
    try {
        const where = {};
        if (req.query.tenderId) where.tenderId = String(req.query.tenderId);
        if (!isAdmin(req.user)) where.supplier = { userId: req.user.id };
        const contracts = await prisma.contract.findMany({ where, include: LIST_INCLUDE, orderBy: { createdAt: 'desc' } });
        res.json(contracts);
    } catch (error) {
        sendError(res, error, 'Ошибка при получении договоров');
    }
};

// GET /contracts/:id
const getContract = async (req, res) => {
    try {
        const contract = await findForUser(req.params.id, req.user, DETAIL_INCLUDE);
        if (!contract) return res.status(404).json({ error: 'Договор не найден' });
        res.json(contract);
    } catch (error) {
        sendError(res, error, 'Ошибка при получении договора');
    }
};

// POST /contracts/generate/:tenderId — для итогов, объявленных до появления договоров
const generateContracts = async (req, res) => {
    try {
        const tender = await prisma.tender.findUnique({ where: { id: req.params.tenderId }, select: { status: true } });
        if (!tender) return res.status(404).json({ error: 'Тендер не найден' });
        if (tender.status !== 'YENIJI_YGLAN_EDILDI') return res.status(400).json({ error: 'Договоры создаются после объявления итогов' });
        const created = await ensureContracts(req.params.tenderId);
        res.json({ created });
    } catch (error) {
        sendError(res, error, 'Ошибка при создании договоров');
    }
};

/**
 * Общий шаг смены статуса: проверить сторону и текущий статус, записать, оповестить.
 * from: из каких статусов можно; who: 'admin' | 'supplier'.
 */
const transition = ({ from, who, build, after }) => async (req, res) => {
    try {
        const contract = await findForUser(req.params.id, req.user);
        if (!contract) return res.status(404).json({ error: 'Договор не найден' });
        if (who === 'admin' && !isAdmin(req.user)) return res.status(403).json({ error: 'Это действие выполняет организатор' });
        if (who === 'supplier' && contract.supplier?.userId !== req.user.id) return res.status(403).json({ error: 'Это действие выполняет поставщик' });
        if (!from.includes(contract.status)) return res.status(400).json({ error: `Сейчас это сделать нельзя: договор в статусе «${STATUS_LABELS[contract.status]}»` });

        const data = await build(req, contract);
        if (data.error) return res.status(400).json({ error: data.error });

        // Статус меняем, только если его не успели поменять параллельно
        const { count } = await prisma.contract.updateMany({ where: { id: contract.id, status: contract.status }, data });
        if (!count) return res.status(409).json({ error: 'Договор уже изменили. Обновите страницу.' });
        const updated = await prisma.contract.findUnique({ where: { id: contract.id }, include: LIST_INCLUDE });
        after(updated, req);
        res.json(updated);
    } catch (error) {
        sendError(res, error, 'Ошибка при изменении договора');
    }
};

const STATUS_LABELS = {
    DRAFT: 'Черновик', SENT: 'На подписи у поставщика', SUPPLIER_SIGNED: 'Подписан поставщиком', SIGNED: 'Подписан', CANCELLED: 'Отменён',
};

const sendContract = transition({
    from: ['DRAFT'], who: 'admin',
    build: () => ({ status: 'SENT', sentAt: new Date(), note: null }),
    after: (c) => notifySupplier(c, 'Договор на подпись', `Договор ${c.number} по тендеру №${c.tender.tenderNumber} ждёт вашей подписи.`),
});

const supplierSign = transition({
    from: ['SENT'], who: 'supplier',
    build: async (req) => {
        const err = await signedFileError(req.user, req.body?.fileName);
        return err ? { error: err } : { status: 'SUPPLIER_SIGNED', supplierSignedFile: String(req.body.fileName), supplierSignedAt: new Date(), note: null };
    },
    after: (c) => notifyAdmins({
        title: 'Поставщик подписал договор',
        message: `${c.supplier.name} подписал договор ${c.number}. Проверьте скан и подпишите со своей стороны.`,
        type: 'contract', link: `/contracts/${c.id}`,
    }).catch((e) => console.error('Contract notify error:', e)),
});

const adminSign = transition({
    from: ['SUPPLIER_SIGNED'], who: 'admin',
    build: async (req) => {
        const err = await signedFileError(req.user, req.body?.fileName);
        return err ? { error: err } : { status: 'SIGNED', adminSignedFile: String(req.body.fileName), signedAt: new Date() };
    },
    after: (c) => notifySupplier(c, 'Договор подписан', `Договор ${c.number} подписан обеими сторонами.`),
});

const returnContract = transition({
    from: ['SUPPLIER_SIGNED'], who: 'admin',
    build: (req) => {
        const note = String(req.body?.note ?? '').trim();
        if (!note) return { error: 'Напишите, что нужно исправить' };
        if (note.length > 1000) return { error: 'Замечание не длиннее 1000 символов' };
        return { status: 'SENT', note, supplierSignedFile: null, supplierSignedAt: null };
    },
    after: (c) => notifySupplier(c, 'Договор возвращён', `Договор ${c.number}: ${c.note}`),
});

const cancelContract = transition({
    from: ['DRAFT', 'SENT', 'SUPPLIER_SIGNED'], who: 'admin',
    build: (req) => {
        const reason = String(req.body?.reason ?? '').trim();
        if (!reason) return { error: 'Укажите причину отмены' };
        if (reason.length > 1000) return { error: 'Причина не длиннее 1000 символов' };
        return { status: 'CANCELLED', cancelReason: reason };
    },
    after: (c) => { if (c.sentAt) notifySupplier(c, 'Договор отменён', `Договор ${c.number} отменён: ${c.cancelReason}`); },
});

module.exports = {
    ensureContracts, listContracts, getContract, generateContracts,
    sendContract, supplierSign, adminSign, returnContract, cancelContract, STATUS_LABELS,
};

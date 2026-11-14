const express = require('express');
const path = require('path');
const fs = require('fs');
const prisma = require('../lib/prisma');
const authMiddleware = require('../middleware/authMiddleware');
const { isTenderOpened } = require('../utils/sealedEnvelope');

const router = express.Router();
const uploadDir = path.join(__dirname, '../../uploads');

/**
 * Может ли пользователь скачать документ.
 *
 * - ADMIN: всё, кроме документов предложений до вскрытия конвертов.
 * - Документ тендера/лота: опубликованный (не TASLAMA) открытый тендер,
 *   либо закрытый, если поставщик в списке приглашённых.
 * - Документ поставщика: только сам поставщик.
 * - Документ предложения: только поставщик, подавший предложение
 *   (конкуренты не должны видеть "конверт").
 * - Ещё не привязанный ни к чему документ (загружен в форме, форма не сохранена, логотип):
 *   тот, кто загрузил, и админ.
 * - Фото товара справочника: все вошедшие, если товар проверен (до проверки — автор и админ).
 * - Файл без записи в documents: только админ.
 */
async function canAccessFile(user, fileName) {
    const isAdmin = user.roleType === 'ADMIN';

    // Фото товара справочника: видно всем, если товар проверен; до проверки — автору и админу
    const product = await prisma.generalProduct.findFirst({
        where: { imageFileName: fileName },
        select: { moderationStatus: true, createdById: true },
    });
    if (product && (isAdmin || product.moderationStatus === 'APPROVED' || product.createdById === user.id)) return true;

    const doc = await prisma.document.findFirst({
        where: { fileName },
        select: {
            uploadedById: true,
            tenderId: true,
            tenderFiles: { select: { tenderId: true } },
            lotFiles: { select: { lot: { select: { tenderId: true } } } },
            supplierFiles: { select: { supplier: { select: { userId: true } } } },
            offerFiles: { select: { offer: { select: { supplier: { select: { userId: true } }, tender: { select: { status: true } } } } } },
        },
    });

    if (!doc) return isAdmin;

    // Документ предложения = содержимое конверта: владелец видит всегда, админ только после вскрытия
    if (doc.offerFiles.length > 0) {
        if (doc.offerFiles.some((f) => f.offer?.supplier?.userId === user.id)) return true;
        return isAdmin && doc.offerFiles.every((f) => isTenderOpened(f.offer?.tender));
    }

    if (isAdmin) return true;

    const tenderIds = [
        doc.tenderId,
        ...doc.tenderFiles.map((f) => f.tenderId),
        ...doc.lotFiles.map((f) => f.lot?.tenderId),
    ].filter(Boolean);

    const isLinked = tenderIds.length > 0 || doc.supplierFiles.length > 0;
    if (!isLinked) return Boolean(doc.uploadedById) && doc.uploadedById === user.id;

    if (doc.supplierFiles.some((f) => f.supplier?.userId === user.id)) return true;

    if (tenderIds.length > 0) {
        const visibleTender = await prisma.tender.findFirst({
            where: {
                id: { in: tenderIds },
                status: { not: 'TASLAMA' },
                OR: [
                    { visibility: 'ACYK' },
                    { invitedSuppliers: { some: { supplier: { userId: user.id } } } },
                ],
            },
            select: { id: true },
        });
        if (visibleTender) return true;
    }

    return false;
}

router.get('/:fileName', authMiddleware.file, async (req, res, next) => {
    try {
        // basename отрезает любые "../" — за пределы uploads не выйти
        const fileName = path.basename(req.params.fileName);
        const filePath = path.join(uploadDir, fileName);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'Файл не найден' });
        }

        if (!(await canAccessFile(req.user, fileName))) {
            return res.status(403).json({ error: 'Нет доступа к этому файлу' });
        }

        // nosniff: браузер не будет "угадывать" тип и исполнять файл как HTML/JS
        res.set('X-Content-Type-Options', 'nosniff');
        res.set('Cache-Control', 'private, no-store');
        return res.sendFile(filePath);
    } catch (error) {
        return next(error);
    }
});

module.exports = router;

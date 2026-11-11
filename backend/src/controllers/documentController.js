const path = require('path');
const fs = require('fs');
const prisma = require('../lib/prisma');
const { isTenderOpened } = require('../utils/sealedEnvelope');
const { checkTenderVisible } = require('../utils/tenderAccess');

const uploadDir = path.join(__dirname, '../../uploads');

// Предложение можно менять (файлы тоже), только пока приём открыт: тендер ACYK и дедлайн не прошёл.
// После дедлайна файл в "конверте" нельзя ни добавить, ни удалить — даже админу.
const isOfferEditable = (offer) =>
    Boolean(offer?.tender) && offer.tender.status === 'ACYK' && new Date(offer.tender.deadline) > new Date();

const OFFER_LOCKED_ERROR = 'Приём предложений закрыт: файлы предложения больше нельзя менять';

const docWithLinks = {
    supplierFiles: { include: { supplier: { select: { userId: true } } } },
    offerFiles: { include: { offer: { select: { supplier: { select: { userId: true } }, tender: { select: { status: true, deadline: true } } } } } },
    tenderFiles: { select: { tenderId: true } },
    lotFiles: { select: { lotId: true } },
};

/**
 * Может ли пользователь изменить/удалить документ. Возвращает текст ошибки или null.
 */
function checkCanModifyDocument(user, doc) {
    const isAdmin = user.roleType === 'ADMIN';

    if (doc.offerFiles.length > 0) {
        const isOwner = doc.offerFiles.every((f) => f.offer?.supplier?.userId === user.id);
        if (!isOwner) return 'Доступ запрещен. Вы не являетесь владельцем этого документа.';
        if (!doc.offerFiles.every((f) => isOfferEditable(f.offer))) return OFFER_LOCKED_ERROR;
        return null;
    }

    if (isAdmin) return null;

    if (doc.tenderFiles.length > 0 || doc.lotFiles.length > 0 || doc.tenderId) {
        return 'У вас нет прав на изменение документов тендера или лота';
    }

    if (doc.supplierFiles.length > 0) {
        return doc.supplierFiles.some((f) => f.supplier?.userId === user.id)
            ? null
            : 'Доступ запрещен. Вы не являетесь владельцем этого документа.';
    }

    // Непривязанный документ: только тот, кто загрузил
    return doc.uploadedById && doc.uploadedById === user.id
        ? null
        : 'Доступ запрещен. Вы не являетесь владельцем этого документа.';
}

/**
 * Проверка, к чему пользователь может привязать новый файл при загрузке.
 */
async function checkUploadTargets(user, { tenderId, lotId, supplierId, offerId }) {
    const isAdmin = user.roleType === 'ADMIN';

    if ((tenderId || lotId) && !isAdmin) {
        return { status: 403, error: 'Документы тендера и лотов загружает только организатор' };
    }
    if (tenderId && !(await prisma.tender.findUnique({ where: { id: tenderId }, select: { id: true } }))) {
        return { status: 404, error: 'Тендер не найден' };
    }
    if (lotId && !(await prisma.tenderLot.findUnique({ where: { id: lotId }, select: { id: true } }))) {
        return { status: 404, error: 'Лот не найден' };
    }

    if (supplierId) {
        const supplier = await prisma.supplier.findUnique({ where: { id: supplierId }, select: { userId: true } });
        if (!supplier) return { status: 404, error: 'Поставщик не найден' };
        if (!isAdmin && supplier.userId !== user.id) {
            return { status: 403, error: 'Нельзя загружать документы в чужой профиль' };
        }
    }

    if (offerId) {
        const offer = await prisma.offer.findUnique({
            where: { id: offerId },
            select: { supplier: { select: { userId: true } }, tender: { select: { status: true, deadline: true } } },
        });
        if (!offer) return { status: 404, error: 'Предложение не найдено' };
        if (offer.supplier?.userId !== user.id) {
            return { status: 403, error: 'Нельзя загружать файлы в чужое предложение' };
        }
        if (!isOfferEditable(offer)) return { status: 400, error: OFFER_LOCKED_ERROR };
    }

    return null;
}

const removeUploadedFile = (file) => {
    if (file?.path) fs.unlink(file.path, () => {});
};

// Загрузка документа и привязка его к Тендеру, Поставщику или Предложению
const uploadDocument = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Файл не был загружен' });
        }

        const { name, description, documentTypeId, tenderId, lotId, supplierId, offerId } = req.body;

        const targetError = await checkUploadTargets(req.user, { tenderId, lotId, supplierId, offerId });
        if (targetError) {
            removeUploadedFile(req.file);
            return res.status(targetError.status).json({ error: targetError.error });
        }

        const publicPath = `/uploads/${req.file.filename}`;

        // Создаем запись базового документа с веб-доступным путем
        const document = await prisma.document.create({
            data: {
                name: name || Buffer.from(req.file.originalname, 'latin1').toString('utf8'),
                description: description || null,
                fileName: req.file.filename,
                filePath: publicPath,
                fileType: req.file.mimetype,
                fileSize: req.file.size || null,
                documentTypeId: documentTypeId || null,
                uploadedById: req.user.id,
            },
        });

        // Привязываем документ к соответствующим модулям (если переданы ID)
        if (tenderId) {
            await prisma.tenderFile.create({
                data: { tenderId, documentId: document.id },
            });
        }

        if (lotId) {
            await prisma.lotFile.create({
                data: { lotId, documentId: document.id },
            });
        }

        if (supplierId) {
            await prisma.supplierFile.create({
                data: { supplierId, documentId: document.id },
            });
        }

        if (offerId) {
            await prisma.offerFile.create({
                data: { offerId, documentId: document.id },
            });
        }

        res.status(201).json({ ...document, url: publicPath });
    } catch (error) {
        res.status(500).json({ error: 'Ошибка при сохранении документа', details: error.message });
    }
};

// Получение списка документов по объектам
const getDocuments = async (req, res) => {
    try {
        const { tenderId, lotId, supplierId, offerId } = req.query;
        const isAdmin = req.user.roleType === 'ADMIN';

        // Ровно один фильтр за запрос: раньше комбинация (например, supplierId + lotId)
        // обходила проверки, потому что where строился по первому найденному фильтру.
        const filters = [lotId, tenderId, supplierId, offerId].filter(Boolean);
        if (filters.length > 1) {
            return res.status(400).json({ error: 'Укажите только один фильтр: lotId, tenderId, supplierId или offerId' });
        }

        // Без фильтра это список ВСЕХ документов системы: только для админа
        if (filters.length === 0 && !isAdmin) {
            return res.status(403).json({ error: 'Нет доступа' });
        }

        // Документы тендера/лота: только если сам тендер виден пользователю (не черновик, не чужой закрытый)
        if ((tenderId || lotId) && !isAdmin) {
            let targetTenderId = tenderId;
            if (lotId) {
                const lot = await prisma.tenderLot.findUnique({ where: { id: lotId }, select: { tenderId: true } });
                if (!lot) return res.status(404).json({ error: 'Лот не найден' });
                targetTenderId = lot.tenderId;
            }
            const access = await checkTenderVisible(req.user, targetTenderId);
            if (!access.ok) return res.status(access.status).json({ error: access.error });
        }

        // Документы поставщика: только сам поставщик или админ
        if (supplierId && !isAdmin) {
            const own = await prisma.supplier.findFirst({ where: { id: supplierId, userId: req.user.id }, select: { id: true } });
            if (!own) return res.status(403).json({ error: 'Нет доступа' });
        }

        // Документы предложения (содержимое конверта): владелец всегда, админ только после вскрытия
        if (offerId) {
            const offer = await prisma.offer.findUnique({
                where: { id: offerId },
                select: { supplier: { select: { userId: true } }, tender: { select: { status: true } } },
            });
            if (!offer) return res.status(404).json({ error: 'Предложение не найдено' });
            const isOwner = offer.supplier?.userId === req.user.id;
            if (!isOwner && !(isAdmin && isTenderOpened(offer.tender))) {
                return res.status(403).json({ error: 'Предложение запечатано или нет доступа' });
            }
        }

        let where = {};
        if (lotId) {
            where.lotFiles = { some: { lotId } };
        } else if (tenderId) {
            where.tenderFiles = { some: { tenderId } };
        } else if (supplierId) {
            where.supplierFiles = { some: { supplierId } };
        } else if (offerId) {
            where.offerFiles = { some: { offerId } };
        }

        const documents = await prisma.document.findMany({
            where,
            include: { documentType: true },
            orderBy: { createdAt: 'desc' },
        });

        res.json(documents);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка при получении документов', details: error.message });
    }
};

const deleteDocument = async (req, res) => {
    try {
        const { id } = req.params;

        const doc = await prisma.document.findUnique({ where: { id }, include: docWithLinks });

        if (!doc) {
            return res.status(404).json({ error: 'Документ не найден' });
        }

        // Защита от IDOR и от подмены файлов в "конверте" после дедлайна
        const accessError = checkCanModifyDocument(req.user, doc);
        if (accessError) {
            return res.status(403).json({ error: accessError });
        }

        const filePath = doc.filePath;

        await prisma.$transaction([
            prisma.supplierFile.deleteMany({ where: { documentId: id } }),
            prisma.tenderFile.deleteMany({ where: { documentId: id } }),
            prisma.lotFile.deleteMany({ where: { documentId: id } }),
            prisma.offerFile.deleteMany({ where: { documentId: id } }),
            prisma.document.delete({ where: { id } })
        ]);

        // Физическое удаление файла с сервера для предотвращения утечки диска (с защитой от directory traversal)
        if (filePath) {
            const diskPath = path.isAbsolute(filePath) && fs.existsSync(filePath)
                ? filePath
                : path.join(uploadDir, path.basename(filePath));
            if (fs.existsSync(diskPath)) {
                fs.unlink(diskPath, (err) => {
                    if (err) console.error('Ошибка удаления физического файла:', err.message);
                });
            }
        }

        res.json({ success: true, message: 'Документ успешно удален' });
    } catch (error) {
        res.status(500).json({ error: 'Ошибка при удалении документа', details: error.message });
    }
};

// Обновление метаданных документа (название, категория/тип, признак обязательности в описании)
const updateDocument = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, documentTypeId } = req.body;

        const doc = await prisma.document.findUnique({ where: { id }, include: docWithLinks });
        if (!doc) {
            return res.status(404).json({ error: 'Документ не найден' });
        }

        const accessError = checkCanModifyDocument(req.user, doc);
        if (accessError) {
            return res.status(403).json({ error: accessError });
        }

        const updated = await prisma.document.update({
            where: { id },
            data: {
                ...(name !== undefined && { name: String(name).trim() }),
                ...(description !== undefined && { description: typeof description === 'object' ? JSON.stringify(description) : String(description) }),
                ...(documentTypeId !== undefined && { documentTypeId: documentTypeId || null }),
            }
        });

        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка при обновлении документа', details: error.message });
    }
};

module.exports = { uploadDocument, getDocuments, deleteDocument, updateDocument };
const prisma = require('../lib/prisma');

// Генерация последовательного номера тендера вида TNDR-YYYY-MM-001
const generateNextTenderNumber = async (txOrPrisma = prisma) => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const prefix = `TNDR-${year}-${month}-`;

    const count = await txOrPrisma.tender.count({
        where: {
            tenderNumber: {
                startsWith: prefix
            }
        }
    });

    const nextSeq = String(count + 1).padStart(3, '0');
    return `${prefix}${nextSeq}`;
};

const getNextNumber = async (req, res) => {
    try {
        const nextNumber = await generateNextTenderNumber();
        res.json({ nextTenderNumber: nextNumber });
    } catch (error) {
        console.error('Error generating next tender number:', error);
        res.status(500).json({ error: 'Ошибка генерации номера тендера' });
    }
};

// Создание тендера заказчиком / специалистом по закупкам / админом
const createTender = async (req, res) => {
    try {
        const {
            tenderNumber,
            title,
            deadline,
            categoryId,
            clientId,
            status,
            lots,
            technicalSpecs,
            additionalRequirements,
            paymentTerms,
        } = req.body;

        const createdById = req.user?.id || req.user?.userId;
        if (!createdById) {
            return res.status(401).json({ error: 'Пользователь не авторизован' });
        }

        const tender = await prisma.$transaction(async (tx) => {
            // 1. Создаем тендер с пользовательским или автоматически сгенерированным номером
            const finalTenderNumber = (tenderNumber && tenderNumber.trim() !== '')
                ? tenderNumber.trim()
                : await generateNextTenderNumber(tx);

            const newTender = await tx.tender.create({
                data: {
                    tenderNumber: finalTenderNumber,
                    title: title || 'Без названия',
                    description: req.body.description || null,
                    technicalSpecs: technicalSpecs || null,
                    type: req.body.type || 'YERLI',
                    visibility: req.body.visibility || 'ACYK',
                    status: status || 'ACYK',
                    announcementDate: req.body.announcementDate ? new Date(req.body.announcementDate) : new Date(),
                    deadline: new Date(deadline),
                    categoryId: (categoryId && categoryId !== '') ? categoryId : null,
                    clientId: (clientId && clientId !== '') ? clientId : null,
                    createdById
                }
            });

            // 2. Создаем лоты и спецификации
            let parsedLots = lots;
            if (!parsedLots || !Array.isArray(parsedLots)) {
                if (req.body.specs && Array.isArray(req.body.specs)) {
                    parsedLots = [{ name: 'Основной лот', specs: req.body.specs }];
                } else {
                    parsedLots = [];
                }
            }

            for (const lot of parsedLots) {
                const newLot = await tx.tenderLot.create({
                    data: {
                        name: lot.name || 'Без названия',
                        tenderId: newTender.id,
                        deliveryTermId: (lot.deliveryTermId && lot.deliveryTermId !== '') ? lot.deliveryTermId : null
                    }
                });

                if (lot.specs && Array.isArray(lot.specs)) {
                    const validSpecs = lot.specs.filter(s => (s.name || s.haryt) && (s.name || s.haryt).trim() !== '');
                    if (validSpecs.length > 0) {
                        await tx.tenderSpecification.createMany({
                            data: validSpecs.map(spec => ({
                                tenderId: newTender.id,
                                lotId: newLot.id,
                                positionNumber: parseInt(spec.positionNumber, 10) || 1,
                                generalProductId: (spec.generalProductId && spec.generalProductId !== '') ? spec.generalProductId : null,
                                name: (spec.name || spec.haryt || '').trim(),
                                quantity: parseFloat(spec.quantity || spec.mukdar) || 1,
                                unitId: (spec.unitId && spec.unitId !== '') ? spec.unitId : ((spec.unit && spec.unit !== '') ? spec.unit : null),
                                manufacturerId: (spec.manufacturerId && spec.manufacturerId !== '') ? spec.manufacturerId : ((spec.brand && spec.brand !== '') ? spec.brand : null),
                                description: (spec.description || spec.desc || '').trim() || null
                            }))
                        });
                    }
                }
            }

            // 3. Привязываем загруженные документы к тендеру
            const documents = req.body.documents;
            if (documents && Array.isArray(documents) && documents.length > 0) {
                for (const docId of documents) {
                    if (docId && typeof docId === 'string' && docId.length > 10) {
                        const existingDoc = await tx.document.findUnique({ where: { id: docId } });
                        if (existingDoc) {
                            await tx.tenderFile.create({
                                data: {
                                    tenderId: newTender.id,
                                    documentId: docId
                                }
                            });
                            await tx.document.update({
                                where: { id: docId },
                                data: { tenderId: newTender.id }
                            });
                        }
                    }
                }
            }

            return await tx.tender.findUnique({
                where: { id: newTender.id },
                include: {
                    lots: {
                        include: {
                            deliveryTerm: true,
                            specs: {
                                include: {
                                    generalProduct: true,
                                    unit: true,
                                    manufacturer: true,
                                }
                            }
                        }
                    },
                    files: {
                        include: {
                            document: true
                        }
                    },
                    createdBy: {
                        select: { id: true, username: true, firstName: true, lastName: true, roleType: true },
                    },
                    category: true,
                    client: true,
                }
            });
        });

        res.status(201).json(tender);
    } catch (error) {
        console.error('CreateTender Error:', error);
        res.status(500).json({ error: 'Ошибка при создании тендера', details: error.message });
    }
};

const getTenders = async (req, res) => {
    try {
        const { tenderNumber, lotNumber, status, type, visibility, categoryId, search } = req.query;

        const where = {};
        const numberQuery = tenderNumber || lotNumber;
        if (numberQuery) where.tenderNumber = { contains: numberQuery, mode: 'insensitive' };
        if (status) where.status = status;
        if (type) where.type = type;
        if (visibility) where.visibility = visibility;
        if (categoryId) where.categoryId = categoryId;

        if (search) {
            where.OR = [
                { tenderNumber: { contains: search, mode: 'insensitive' } },
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }

        const tenders = await prisma.tender.findMany({
            where,
            include: {
                lots: {
                    include: {
                        deliveryTerm: true,
                        specs: {
                            include: { generalProduct: true, unit: true, manufacturer: true }
                        }
                    }
                },
                specs: {
                    include: { generalProduct: true, unit: true, manufacturer: true },
                },
                createdBy: {
                    select: { id: true, username: true, firstName: true, lastName: true },
                },
                category: true,
                client: true,
                _count: { select: { offers: true } },
            },
            orderBy: { createdAt: 'desc' },
        });

        res.json(tenders);
    } catch (error) {
        console.error('GetTenders Error:', error);
        res.status(500).json({ error: 'Ошибка при получении списка тендеров', details: error.message });
    }
};

// Получение одного тендера по ID со всеми деталями
const getTenderById = async (req, res) => {
    try {
        const { id } = req.params;

        const includeOffers = req.user && req.user.roleType !== 'ADMIN'
            ? {
                where: { supplier: { userId: req.user.id } },
                include: { supplier: true, specs: true, exchangeRates: { include: { currency: true } } }
            }
            : {
                include: { supplier: true, specs: true, exchangeRates: { include: { currency: true } } }
            };

        const tender = await prisma.tender.findUnique({
            where: { id },
            include: {
                lots: {
                    include: {
                        deliveryTerm: true,
                        specs: {
                            include: {
                                generalProduct: true,
                                unit: true,
                                manufacturer: true,
                            }
                        }
                    }
                },
                client: true,
                category: true,
                createdBy: {
                    select: { id: true, username: true, firstName: true, lastName: true },
                },
                offers: includeOffers,
                files: {
                    include: {
                        document: true
                    }
                }
            },
        });

        if (!tender) {
            return res.status(404).json({ error: 'Тендер не найден' });
        }

        res.json(tender);
    } catch (error) {
        console.error(error); res.status(500).json({ error: 'Ошибка при получении тендера' });
    }
};

const deleteTender = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.tender.delete({
            where: { id }
        });
        res.json({ message: 'Тендер успешно удален' });
    } catch (error) {
        console.error(error); res.status(500).json({});
    }
};

module.exports = { createTender, getTenders, getTenderById, deleteTender, getNextNumber };
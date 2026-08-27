const prisma = require('../lib/prisma');

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

        const createdById = req.user.id;

        const tender = await prisma.$transaction(async (tx) => {
            // 1. Создаем тендер
            const newTender = await tx.tender.create({
                data: {
                    tenderNumber,
                    title,
                    deadline: new Date(deadline),
                    categoryId,
                    clientId,
                    status: status || 'YAPYK',
                    technicalSpecs,
                    additionalRequirements,
                    paymentTerms,
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
                        deliveryTermId: lot.deliveryTermId || null
                    }
                });

                if (lot.specs && Array.isArray(lot.specs)) {
                    await tx.tenderSpecification.createMany({
                        data: lot.specs.map(spec => ({
                            tenderId: newTender.id,
                            lotId: newLot.id,
                            positionNumber: parseInt(spec.positionNumber, 10) || 1,
                            name: spec.name,
                            quantity: parseFloat(spec.quantity) || 1,
                            unitId: spec.unitId || null,
                            manufacturerId: spec.manufacturerId || null,
                            description: spec.description
                        }))
                    });
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
        const { lotNumber, status, type, visibility, categoryId, search } = req.query;

        const where = {};
        if (lotNumber) where.lotNumber = { contains: lotNumber, mode: 'insensitive' };
        if (status) where.status = status;
        if (type) where.type = type;
        if (visibility) where.visibility = visibility;
        if (categoryId) where.categoryId = categoryId;

        if (search) {
            where.OR = [
                { lotNumber: { contains: search, mode: 'insensitive' } },
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }

        const tenders = await prisma.tender.findMany({
            where,
            include: {
                specs: {
                    include: { generalProduct: true, unit: true },
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
        console.error(error); res.status(500).json({});
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

module.exports = { createTender, getTenders, getTenderById, deleteTender };
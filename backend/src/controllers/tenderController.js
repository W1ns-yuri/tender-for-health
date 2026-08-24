const prisma = require('../lib/prisma');

// Создание тендера заказчиком / специалистом по закупкам / админом
const createTender = async (req, res) => {
    try {
        const {
            title,
            description,
            technicalSpecs,
            price,
            deadline,
            type,
            visibility,
            status,
            categoryId,
            lotNumber,
            specs,
            documents,
        } = req.body;

        const userId = req.user.id; // Из authMiddleware

        if (!specs || !Array.isArray(specs) || specs.length === 0) {
            return res.status(400).json({ error: 'Укажите хотя бы одну позицию спецификации (товар МНН / услугу) для тендера' });
        }

        let generatedLotNumber = lotNumber;
        if (!generatedLotNumber || generatedLotNumber.includes('Lot №') || generatedLotNumber.includes('undefined')) {
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            
            const startOfMonth = new Date(year, today.getMonth(), 1);
            const count = await prisma.tender.count({
                where: {
                    createdAt: {
                        gte: startOfMonth
                    }
                }
            });
            generatedLotNumber = `LOT-${year}-${month}-${String(count + 1).padStart(3, '0')}`;
        }

        const tender = await prisma.tender.create({
            data: {
                title,
                description,
                technicalSpecs,
                price: parseFloat(price || 0),
                deadline: new Date(deadline),
                type: type || 'YERLI',
                visibility: visibility || 'ACYK',
                status: status || 'ACYK', // По умолчанию 'открыт' (açyk)
                lotNumber: generatedLotNumber,
                announcementDate: new Date(),
                categoryId: categoryId || null,
                createdById: userId,
                // Создаем позиции спецификации в tender_specifications
                specs: {
                    create: specs.map((item, index) => ({
                        positionNumber: item.positionNumber || index + 1,
                        generalProductId: item.generalProductId || null,
                        unitId: item.unitId || null,
                        manufacturerId: item.manufacturerId || null,
                        name: item.name || null,
                        quantity: parseFloat(item.quantity || 1),
                        description: item.description || '',
                    })),
                },
                // Если переданы документы (массив ID), создаем записи в tender_files
                ...(documents && documents.length > 0 && {
                    files: {
                        create: documents.map(docId => ({
                            documentId: docId
                        }))
                    }
                }),
            },
            include: {
                specs: {
                    include: {
                        generalProduct: true,
                        unit: true,
                        manufacturer: true,
                    },
                },
                createdBy: {
                    select: { id: true, username: true, firstName: true, lastName: true, roleType: true },
                },
                category: true,
            },
        });

        res.status(201).json(tender);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка при создании тендера', details: error.message });
    }
};

// Получение списка всех тендеров с поиском и фильтрацией (по Lot No, статусу, типу, категории)
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
                _count: { select: { offers: true } },
            },
            orderBy: { createdAt: 'desc' },
        });

        res.json(tenders);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка при получении тендеров', details: error.message });
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
                specs: {
                    include: {
                        generalProduct: true,
                        unit: true,
                        manufacturer: true,
                    },
                },
                createdBy: {
                    select: { id: true, username: true, firstName: true, lastName: true },
                },
                category: true,
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
        res.status(500).json({ error: 'Ошибка при получении тендера', details: error.message });
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
        res.status(500).json({ error: 'Ошибка при удалении тендера', details: error.message });
    }
};

module.exports = { createTender, getTenders, getTenderById, deleteTender };
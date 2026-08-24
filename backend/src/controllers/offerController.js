const prisma = require('../lib/prisma');

// 1. Создание профиля Поставщика (Supplier)
const createSupplier = async (req, res) => {
    try {
        const { name, regNumber, licenseNumber, taxId, email, phone, fax, address, countryId } = req.body;
        const userId = req.user.id;

        const supplier = await prisma.supplier.create({
            data: {
                userId,
                name,
                regNumber,
                licenseNumber,
                taxId,
                email,
                phone,
                fax,
                address,
                countryId: countryId || null,
            },
        });

        res.status(201).json(supplier);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка при создании профиля поставщика', details: error.message });
    }
};

// 2. Получение списка поставщиков
const getSuppliers = async (req, res) => {
    try {
        const suppliers = await prisma.supplier.findMany({
            include: { user: { select: { id: true, username: true } }, country: true },
        });
        res.json(suppliers);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка при получении поставщиков', details: error.message });
    }
};

// 3. Подача коммерческого предложения (Offer / Заявка) с фиксацией курсов валют
const createOffer = async (req, res) => {
    try {
        const {
            tenderId,
            supplierId,
            deliveryTermId,
            baseCurrencyId,
            number,
            paymentTerms,
            specs,
            status,
            attachedDocumentIds,
        } = req.body;

        const userId = req.user.id;
        let finalSupplierId = supplierId;

        // Проверяем, принадлежит ли профиль поставщика текущему пользователю (если не админ)
        if (req.user.roleType !== 'ADMIN') {
            const supplier = await prisma.supplier.findFirst({
                where: supplierId ? { id: supplierId, userId: userId } : { userId: userId },
            });
            if (!supplier) {
                return res.status(403).json({ error: 'Профиль поставщика не найден' });
            }
            finalSupplierId = supplier.id;
        }

        // Проверяем статус тендера
        const tender = await prisma.tender.findUnique({ where: { id: tenderId } });
        if (!tender) {
            return res.status(404).json({ error: 'Тендер не найден' });
        }

        if (tender.status !== 'ACYK') {
            return res.status(400).json({ error: 'Тендер закрыт или не принимает заявки' });
        }

        // Запрещаем подавать несколько заявок на один тендер от одного поставщика
        const existingOffer = await prisma.offer.findFirst({
            where: {
                tenderId: tenderId,
                supplierId: finalSupplierId,
            }
        });

        if (existingOffer) {
            return res.status(400).json({ error: 'Вы уже подали заявку на этот тендер. От одного поставщика принимается только одна заявка.' });
        }

        if (!specs || !Array.isArray(specs) || specs.length === 0) {
            return res.status(400).json({ error: 'Укажите предложенную цену хотя бы для одной позиции спецификации' });
        }

        // Автоматический подсчёт общей цены коммерческого предложения
        let totalPrice = 0;
        const offerSpecsData = specs.map((item) => {
            const itemTotal = parseFloat(item.unitPrice) * parseFloat(item.quantity);
            totalPrice += itemTotal;

            return {
                tenderSpecId: item.tenderSpecId,
                generalProductId: item.generalProductId || null,
                unitId: item.unitId || null,
                manufacturerId: item.manufacturerId || null,
                quantity: parseFloat(item.quantity),
                unitPrice: parseFloat(item.unitPrice),
                description: item.description || null,
            };
        });

        // 🟢 КРИТИЧЕСКАЯ ФИНАНСОВАЯ ЛОГИКА ТЗ: Фиксация курсов валют на момент подачи заявки!
        // Получаем все действующие курсы валют из базы
        const activeExchangeRates = await prisma.exchangeRate.findMany();

        // Формируем записи для OfferExchangeRate
        const offerRatesData = activeExchangeRates.map((rate) => ({
            currencyId: rate.fromCurrencyId,
            value: rate.value,
        }));

        // Проверяем версионность: сколько версий предложений уже есть от этого поставщика
        const previousOffersCount = await prisma.offer.count({
            where: { tenderId, supplierId: finalSupplierId },
        });

        const newVersion = previousOffersCount + 1;

        // Сохраняем коммерческое предложение в транзакции
        const offer = await prisma.offer.create({
            data: {
                tenderId,
                supplierId: finalSupplierId,
                deliveryTermId: deliveryTermId || null,
                baseCurrencyId: baseCurrencyId || null,
                number: number || `OFFER-${Date.now()}`,
                paymentTerms,
                version: newVersion,
                isDefault: true,
                status: status || 'TABSARYLDY', // По умолчанию 'отправлено' (tabşyryldy)
                offeredPrice: totalPrice,
                comment: req.body.comment || null,
                specs: {
                    create: offerSpecsData,
                },
                exchangeRates: {
                    create: offerRatesData, // Зафиксированные курсы валют!
                },
            },
            include: {
                specs: true,
                exchangeRates: { include: { currency: true } },
                supplier: true,
            },
        });

        // Привязываем загруженные документы к предложению
        if (attachedDocumentIds && Array.isArray(attachedDocumentIds) && attachedDocumentIds.length > 0) {
            const offerFilesData = attachedDocumentIds.map(docId => ({
                offerId: offer.id,
                documentId: docId
            }));
            await prisma.offerFile.createMany({ data: offerFilesData });
        }

        res.status(201).json(offer);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка при сохранении коммерческого предложения', details: error.message });
    }
};

// 4. Получение списка предложений по тендеру
const getOffersByTender = async (req, res) => {
    try {
        const { tenderId } = req.params;
        const offers = await prisma.offer.findMany({
            where: { tenderId },
            include: {
                supplier: true,
                deliveryTerm: true,
                baseCurrency: true,
                specs: {
                    include: { tenderSpec: { include: { generalProduct: true, unit: true } } },
                },
                exchangeRates: { include: { currency: true } },
            },
            orderBy: { createdAt: 'desc' },
        });

        res.json(offers);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка при получении предложений', details: error.message });
    }
};

// 5. Получение списка предложений текущего поставщика
const getMyOffers = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const suppliers = await prisma.supplier.findMany({
            where: { userId }
        });
        
        const supplierIds = suppliers.map(s => s.id);
        
        if (supplierIds.length === 0) {
            return res.json([]);
        }

        const offers = await prisma.offer.findMany({
            where: { supplierId: { in: supplierIds } },
            include: {
                tender: true,
                supplier: true,
                baseCurrency: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        res.json(offers);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка при получении предложений', details: error.message });
    }
};

const getAllOffers = async (req, res) => {
    try {
        const offers = await prisma.offer.findMany({
            include: {
                tender: true,
                supplier: true,
                baseCurrency: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        res.json(offers);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка при получении всех предложений', details: error.message });
    }
};

const getOfferById = async (req, res) => {
    try {
        const { id } = req.params;
        const offer = await prisma.offer.findUnique({
            where: { id },
            include: {
                tender: true,
                supplier: true,
                baseCurrency: true,
                specs: { include: { tenderSpec: { include: { generalProduct: true } } } }, // OfferSpecification с оригинальными данными
                files: {     // OfferFile (документы)
                    include: { document: true }
                }
            }
        });

        if (!offer) {
            return res.status(404).json({ error: 'Предложение не найдено' });
        }

        // Если это не админ, проверяем права доступа к этому предложению
        if (req.user.roleType !== 'ADMIN') {
            const suppliers = await prisma.supplier.findMany({ where: { userId: req.user.id } });
            const supplierIds = suppliers.map(s => s.id);
            if (!supplierIds.includes(offer.supplierId)) {
                return res.status(403).json({ error: 'Нет доступа к этому предложению' });
            }
        }

        res.json(offer);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка при получении деталей предложения', details: error.message });
    }
};

module.exports = {
    createSupplier,
    getSuppliers,
    createOffer,
    getOffersByTender,
    getMyOffers,
    getAllOffers,
    getOfferById
};

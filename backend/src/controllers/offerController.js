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
            if (supplier.verificationStatus !== 'VERIFIED') {
                return res.status(403).json({ error: 'Ваш профиль еще не прошел верификацию. Вы не можете подавать предложения.' });
            }
            finalSupplierId = supplier.id;
        }

        // Проверяем статус тендера и права доступа к закрытым процедурам
        const tender = await prisma.tender.findUnique({
            where: { id: tenderId },
            include: { invitedSuppliers: true }
        });
        if (!tender) {
            return res.status(404).json({ error: 'Тендер не найден' });
        }

        // Защита закрытого тендера (YAPYK): только приглашенные поставщики могут подавать заявки
        if (tender.visibility === 'YAPYK' && req.user.roleType !== 'ADMIN') {
            const isInvited = (tender.invitedSuppliers || []).some(inv => inv.supplierId === finalSupplierId);
            if (!isInvited) {
                return res.status(403).json({ error: 'Вы не приглашены к участию в этом закрытом тендере' });
            }
        }

        if (tender.status !== 'ACYK') {
            return res.status(400).json({ error: 'Тендер закрыт или не принимает заявки' });
        }

        // Проверка дедлайна: прием заявок строго до окончания установленного срока
        if (new Date() > new Date(tender.deadline)) {
            return res.status(400).json({ error: 'Срок подачи заявок по данному тендеру истек (дедлайн прошел)' });
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

        // Проверяем принадлежность каждой позиции спецификации именно к этому тендеру и валидируем категории лотов
        const tenderSpecs = await prisma.tenderSpecification.findMany({
            where: { tenderId: tenderId },
            select: { 
                id: true, 
                quantity: true,
                lotId: true,
                lot: {
                    select: { id: true, categoryId: true, name: true }
                }
            }
        });
        const validSpecMap = new Map(tenderSpecs.map(s => [s.id, s.quantity]));

        // Проверяем аккредитацию поставщика по категориям
        const supplierCategories = await prisma.supplierCategory.findMany({
            where: { supplierId: finalSupplierId },
            select: { categoryId: true }
        });
        if (supplierCategories.length > 0) {
            const allowedCatIds = new Set(supplierCategories.map(c => c.categoryId));
            for (const item of specs) {
                const tSpec = tenderSpecs.find(s => s.id === item.tenderSpecId);
                if (tSpec && tSpec.lot && tSpec.lot.categoryId) {
                    if (!allowedCatIds.has(tSpec.lot.categoryId)) {
                        return res.status(400).json({
                            error: `Позиция относится к лоту "${tSpec.lot.name || tSpec.lot.id}", категория которого не входит в вашу аккредитацию.`
                        });
                    }
                }
            }
        }

        for (const item of specs) {
            if (!item.tenderSpecId || !validSpecMap.has(item.tenderSpecId)) {
                return res.status(400).json({ error: `Спецификация с ID "${item.tenderSpecId}" не принадлежит данному тендеру` });
            }
            const unitPrice = parseFloat(item.unitPrice);
            const quantity = parseFloat(item.quantity);
            if (isNaN(unitPrice) || unitPrice < 0) {
                return res.status(400).json({ error: 'Цена за единицу товара не может быть отрицательной или пустой' });
            }
            if (isNaN(quantity) || quantity <= 0) {
                return res.status(400).json({ error: 'Количество товара должно быть больше 0' });
            }
        }

        // Автоматический подсчёт общей цены коммерческого предложения
        let totalPrice = 0;
        const offerSpecsData = specs.map((item) => {
            const unitPrice = parseFloat(item.unitPrice);
            const quantity = parseFloat(item.quantity);
            const itemTotal = unitPrice * quantity;
            totalPrice += itemTotal;

            return {
                tenderSpecId: item.tenderSpecId,
                generalProductId: item.generalProductId || null,
                unitId: item.unitId || null,
                manufacturerId: item.manufacturerId || null,
                name: item.name || null,
                quantity: quantity,
                unitPrice: unitPrice,
                description: item.description || null,
                isEquivalent: Boolean(item.isEquivalent),
                equivalentName: item.equivalentName || null,
                equivalentJustification: item.equivalentJustification || null,
            };
        });

        // 🟢 КРИТИЧЕСКАЯ ФИНАНСОВАЯ ЛОГИКА ТЗ: Фиксация курсов валют на момент подачи заявки!
        // Получаем все действующие курсы валют из базы
        const activeExchangeRates = await prisma.exchangeRate.findMany();

        // Формируем записи для OfferExchangeRate (дедупликация по валютам)
        const seenCurrencyIds = new Set();
        const offerRatesData = [];
        for (const rate of activeExchangeRates) {
            if (!seenCurrencyIds.has(rate.fromCurrencyId)) {
                seenCurrencyIds.add(rate.fromCurrencyId);
                offerRatesData.push({
                    currencyId: rate.fromCurrencyId,
                    value: rate.value,
                });
            }
        }

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
                files: attachedDocumentIds && attachedDocumentIds.length > 0 ? {
                    create: attachedDocumentIds.map(docId => ({
                        documentId: docId
                    }))
                } : undefined,
            },
            include: {
                specs: true,
                exchangeRates: { include: { currency: true } },
                supplier: true,
                files: { include: { document: true } },
            },
        });

        res.status(201).json(offer);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка при сохранении коммерческого предложения', details: error.message });
    }
};

// 4. Получение списка предложений по тендеру
const getOffersByTender = async (req, res) => {
    try {
        const { tenderId } = req.params;

        const tender = await prisma.tender.findUnique({
            where: { id: tenderId },
            select: { status: true }
        });

        if (!tender) {
            return res.status(404).json({ error: 'Тендер не найден' });
        }

        const whereClause = { tenderId };

        // Защита коммерческой тайны: поставщики не видят заявки и цены конкурентов до объявления победителей
        if (req.user && req.user.roleType !== 'ADMIN' && tender.status !== 'YENIJI_YGLAN_EDILDI') {
            const userSuppliers = await prisma.supplier.findMany({
                where: { userId: req.user.id },
                select: { id: true }
            });
            const supplierIds = userSuppliers.map(s => s.id);
            whereClause.supplierId = { in: supplierIds };
        }

        const offers = await prisma.offer.findMany({
            where: whereClause,
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

const getMyWins = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const suppliers = await prisma.supplier.findMany({
            where: { userId }
        });
        
        const supplierIds = suppliers.map(s => s.id);
        
        if (supplierIds.length === 0) {
            return res.json([]);
        }

        const winningOffers = await prisma.offer.findMany({
            where: { 
                supplierId: { in: supplierIds },
                tender: {
                    status: 'YENIJI_YGLAN_EDILDI'
                },
                specs: {
                    some: {
                        isAwarded: true
                    }
                }
            },
            include: {
                tender: {
                    include: {
                        client: true,
                        category: true,
                    }
                },
                specs: {
                    where: {
                        isAwarded: true
                    },
                    include: {
                        tenderSpec: {
                            include: {
                                generalProduct: true,
                                unit: true,
                                lot: {
                                    include: {
                                        deliveryTerm: true
                                    }
                                }
                            }
                        },
                        unit: true,
                        generalProduct: true,
                    }
                },
                baseCurrency: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        res.json(winningOffers);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка при получении выигранных тендеров', details: error.message });
    }
};

const getAllOffers = async (req, res) => {
    try {
        const offers = await prisma.offer.findMany({
            include: {
                tender: {
                    include: {
                        client: true,
                    }
                },
                supplier: true,
                baseCurrency: true,
                deliveryTerm: true,
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
                tender: {
                    include: {
                        client: true,
                        category: true,
                        lots: {
                            include: {
                                deliveryTerm: true,
                            }
                        }
                    }
                },
                supplier: {
                    include: {
                        country: true,
                    }
                },
                deliveryTerm: true,
                baseCurrency: true,
                exchangeRates: {
                    include: { currency: true }
                },
                specs: {
                    include: {
                        tenderSpec: {
                            include: {
                                generalProduct: true,
                                unit: true,
                                manufacturer: true,
                                lot: {
                                    include: {
                                        deliveryTerm: true,
                                    }
                                }
                            }
                        },
                        generalProduct: true,
                        unit: true,
                        manufacturer: true,
                    }
                },
                files: {
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
                // Если победители уже объявлены, просмотр открыт для прозрачности
                if (offer.tender?.status !== 'YENIJI_YGLAN_EDILDI') {
                    return res.status(403).json({ error: 'Нет доступа к этому предложению' });
                }
            }
        } else {
            // Для администратора: если тендер еще открыт (до дедлайна и вскрытия заявок), коммерческие цены запечатаны
            if (offer.tender?.status === 'ACYK' && new Date() < new Date(offer.tender?.deadline)) {
                return res.status(403).json({ 
                    error: 'Заявка запечатана в закрытый конверт. Просмотр коммерческих позиций доступен только после наступления дедлайна и процедуры вскрытия предложений.' 
                });
            }
        }

        res.json(offer);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка при получении деталей предложения', details: error.message });
    }
};

const deleteOffer = async (req, res) => {
    try {
        const { id } = req.params;
        const offer = await prisma.offer.findUnique({
            where: { id },
            include: { supplier: true, tender: true }
        });
        if (!offer) {
            return res.status(404).json({ error: 'Предложение не найдено' });
        }

        // Защита от IDOR: удалить может только админ или автор предложения
        if (req.user.roleType !== 'ADMIN' && offer.supplier.userId !== req.user.id) {
            return res.status(403).json({ error: 'У вас нет прав на удаление этого коммерческого предложения' });
        }

        // Поставщик может отозвать/удалить заявку только пока тендер открыт для приема заявок и дедлайн не истек
        if (req.user.roleType !== 'ADMIN') {
            if (offer.tender.status !== 'ACYK' || (offer.tender.deadline && new Date() > new Date(offer.tender.deadline))) {
                return res.status(400).json({ error: 'Нельзя отозвать заявку после окончания установленного срока подачи заявок (дедлайна) или закрытия тендера' });
            }
        }

        await prisma.$transaction([
            prisma.offerFile.deleteMany({ where: { offerId: id } }),
            prisma.offerSpecification.deleteMany({ where: { offerId: id } }),
            prisma.offerExchangeRate.deleteMany({ where: { offerId: id } }),
            prisma.offer.delete({ where: { id } })
        ]);
        res.json({ message: 'Предложение успешно удалено' });
    } catch (error) {
        res.status(500).json({ error: 'Ошибка при удалении предложения', details: error.message });
    }
};

module.exports = {
    createSupplier,
    getSuppliers,
    createOffer,
    getOffersByTender,
    getMyOffers,
    getMyWins,
    getAllOffers,
    getOfferById,
    deleteOffer
};

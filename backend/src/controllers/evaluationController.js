const prisma = require('../lib/prisma');

/**
 * 1. Вскрытие предложений (Teklipleri açmak)
 * Запускается Заказчиком (Sargyt ediji) и Специалистом по закупкам (Satyn alyş hünärmeni).
 * Переводит статус тендера из "Закрыт" (YAPYK) в "Оценен/На рассмотрении" (BAHALANDYRYLDY).
 */
const openTenderBids = async (req, res) => {
    try {
        const { tenderId } = req.params;

        const tender = await prisma.tender.findUnique({
            where: { id: tenderId },
            include: { offers: true },
        });

        if (!tender) {
            return res.status(404).json({ error: 'Тендер не найден' });
        }

        if (tender.status === 'TASLAMA') {
            return res.status(400).json({ error: 'Нельзя производить вскрытие предложений по черновику тендера' });
        }

        if (tender.status === 'BAHALANDYRYLDY' || tender.status === 'YENIJI_YGLAN_EDILDI') {
            return res.status(400).json({ error: 'Предложения по этому тендеру уже вскрыты и находятся на оценке' });
        }

        // Проверка регламента закупок: вскрытие предложений запрещено до наступления дедлайна
        if (tender.status === 'ACYK' && new Date() < new Date(tender.deadline)) {
            return res.status(400).json({ 
                error: 'Срок приема заявок еще не окончен (дедлайн не наступил). Вскрытие предложений до дедлайна нарушает правила коммерческой тайны.' 
            });
        }

        // Обновляем статус тендера на "BAHALANDYRYLDY" (Оценен / На рассмотрении комиссии)
        const updatedTender = await prisma.tender.update({
            where: { id: tenderId },
            data: {
                status: 'BAHALANDYRYLDY',
            },
            include: {
                offers: {
                    include: {
                        supplier: true,
                        specs: { include: { tenderSpec: true } },
                        exchangeRates: { include: { currency: true } },
                    },
                },
            },
        });

        res.json({
            message: '🔔 Вскрытие предложений (Teklipleri açmak) успешно проведено!',
            tender: updatedTender,
            openedOffersCount: updatedTender.offers.length,
        });
    } catch (error) {
        res.status(500).json({ error: 'Ошибка при вскрытии предложений', details: error.message });
    }
};

/**
 * 2. Оценка предложений комиссии (Bahalandyrmak)
 * Проводит финансовую и техническую оценку: пересчитывает цены по зафиксированным курсам OfferExchangeRate
 * и сортирует заявки от наименьшей цены к наибольшей.
 */
const evaluateTenderBids = async (req, res) => {
    try {
        const { tenderId } = req.params;

        const tender = await prisma.tender.findUnique({
            where: { id: tenderId },
            include: {
                specs: { include: { generalProduct: true, unit: true } },
                offers: {
                    include: {
                        supplier: true,
                        specs: true,
                        exchangeRates: { include: { currency: true } },
                    },
                },
            },
        });

        if (!tender) {
            return res.status(404).json({ error: 'Тендер не найден' });
        }

        // Финансовый пересчет всех заявок с использованием зафиксированных курсов OfferExchangeRate
        const evaluatedOffers = tender.offers.map((offer) => {
            let calculatedTotalInBase = 0;

            offer.specs.forEach((spec) => {
                // Ищем фиксированный курс для этой заявки или используем 1 (если базовая)
                const rateObj = offer.exchangeRates.find((r) => r.currencyId === offer.baseCurrencyId);
                const rate = rateObj ? rateObj.value : 1;

                calculatedTotalInBase += spec.unitPrice * spec.quantity * rate;
            });

            return {
                offerId: offer.id,
                supplierName: offer.supplier.name,
                version: offer.version,
                status: offer.status,
                rawOfferedPrice: offer.offeredPrice,
                calculatedTotalInBaseCurrency: calculatedTotalInBase,
                specsMatchCount: offer.specs.length,
                totalTenderSpecsCount: tender.specs.length,
                isFullCompliance: offer.specs.length >= tender.specs.length,
            };
        });

        // Сортируем: сначала полное соответствие спецификациям, затем по возрастанию цены
        evaluatedOffers.sort((a, b) => {
            if (a.isFullCompliance !== b.isFullCompliance) {
                return a.isFullCompliance ? -1 : 1;
            }
            return a.calculatedTotalInBaseCurrency - b.calculatedTotalInBaseCurrency;
        });

        res.json({
            tenderId: tender.id,
            tenderNumber: tender.tenderNumber,
            title: tender.title,
            status: tender.status,
            ranking: evaluatedOffers,
        });
    } catch (error) {
        res.status(500).json({ error: 'Ошибка при проведении оценки предложений', details: error.message });
    }
};

/**
 * 3. Выбор победителя (ýeňiji yglan edildi)
 * Тендерная комиссия (Komissiýa topary) или Админ объявляет победителя.
 */
const selectWinnerOffer = async (req, res) => {
    try {
        const { tenderId, winningOfferId } = req.body;

        // Проверяем существование тендера и заявки
        const tender = await prisma.tender.findUnique({ where: { id: tenderId } });
        if (!tender) return res.status(404).json({ error: 'Тендер не найден' });

        const winningOffer = await prisma.offer.findUnique({ where: { id: winningOfferId } });
        if (!winningOffer || winningOffer.tenderId !== tenderId) {
            return res.status(400).json({ error: 'Указанная заявка не принадлежит данному тендеру' });
        }

        // Выполняем объявление победителя в транзакции
        await prisma.$transaction([
            // 1. Отклоняем остальные заявки по этому тендеру
            prisma.offer.updateMany({
                where: { tenderId, id: { not: winningOfferId } },
                data: { status: 'RET_EDILDI' }, // ret edildi
            }),
            // 2. Устанавливаем статус "Победитель" для выбранного предложения
            prisma.offer.update({
                where: { id: winningOfferId },
                data: { status: 'YENIJI' }, // ýeňiji
            }),
            // 3. Переводим статус тендера в "Победитель объявлен"
            prisma.tender.update({
                where: { id: tenderId },
                data: { status: 'YENIJI_YGLAN_EDILDI' }, // ýeňiji yglan edildi
            }),
        ]);

        res.json({
            message: '🏆 Победитель тендера успешно объявлен!',
            tenderId,
            winningOfferId,
            status: 'YENIJI_YGLAN_EDILDI',
        });
    } catch (error) {
        res.status(500).json({ error: 'Ошибка при объявлении победителя', details: error.message });
    }
};


// --- NEW EVALUATION LOGIC ---

// Получение списка тендеров для оценки
const getEvaluationTenders = async (req, res) => {
    try {
        const whereClause = {
            status: { in: ['TASLAMA', 'ACYK', 'YAPYK', 'BAHALANDYRYLDY', 'YENIJI_YGLAN_EDILDI'] }
        };

        // Если пользователь обычный Заказчик (CLIENT) или Специалист, показываем только его тендеры
        if (req.user && (req.user.roleType === 'CLIENT' || req.user.roleType === 'PURCHASING_SPECIALIST')) {
            whereClause.createdById = req.user.id;
        }

        const tenders = await prisma.tender.findMany({
            where: whereClause,
            include: {
                client: true,
                category: true,
                _count: { select: { offers: true, lots: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(tenders);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка при получении списка тендеров', details: error.message });
    }
};

// Получение деталей тендера для по-позиционной оценки
const getTenderEvaluationDetails = async (req, res) => {
    try {
        const { tenderId } = req.params;
        const tender = await prisma.tender.findUnique({
            where: { id: tenderId },
            include: {
                client: true,
                category: true,
                lots: {
                    include: {
                        deliveryTerm: true,
                        specs: {
                            include: {
                                generalProduct: true,
                                unit: true
                            }
                        }
                    }
                },
                specs: {
                    include: {
                        generalProduct: true,
                        unit: true
                    }
                },
                offers: {
                    include: {
                        supplier: true,
                        baseCurrency: true,
                        specs: {
                            include: {
                                generalProduct: true,
                                unit: true,
                                manufacturer: true,
                                tenderSpec: true
                            }
                        }
                    }
                }
            }
        });

        if (!tender) return res.status(404).json({ error: 'Тендер не найден' });

        res.json(tender);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка при получении деталей оценки', details: error.message });
    }
};

// Назначение победителя по целому Лоту
const awardLot = async (req, res) => {
    try {
        const { tenderId, lotId, offerId } = req.body;

        // Находим все спецификации этого лота
        const lot = await prisma.tenderLot.findUnique({
            where: { id: lotId },
            include: { specs: true }
        });
        if (!lot) return res.status(404).json({ error: 'Лот не найден' });
        if (lot.tenderId !== tenderId) {
            return res.status(400).json({ error: 'Указанный лот не принадлежит данному тендеру' });
        }

        if (offerId) {
            const offer = await prisma.offer.findUnique({ where: { id: offerId } });
            if (!offer || offer.tenderId !== tenderId) {
                return res.status(400).json({ error: 'Указанное предложение не принадлежит данному тендеру' });
            }
        }

        const specIds = lot.specs.map(s => s.id);

        await prisma.$transaction(async (prisma) => {
            // 1. Снимаем флаг isAwarded со всех предложений на спецификации ЭТОГО лота
            await prisma.offerSpecification.updateMany({
                where: {
                    tenderSpecId: { in: specIds },
                    offer: { tenderId: tenderId }
                },
                data: { isAwarded: false }
            });

            // 2. Если передан offerId, то устанавливаем isAwarded = true для всех спецификаций ЭТОГО лота в ЭТОМ предложении
            if (offerId) {
                await prisma.offerSpecification.updateMany({
                    where: { 
                        tenderSpecId: { in: specIds },
                        offerId: offerId 
                    },
                    data: { isAwarded: true }
                });
            }

            // 3. Если статус тендера был YENIJI_YGLAN_EDILDI, но выбор лотов меняется, переводим обратно в статус оценки
            const tender = await prisma.tender.findUnique({ where: { id: tenderId } });
            if (tender && tender.status === 'YENIJI_YGLAN_EDILDI') {
                await prisma.tender.update({
                    where: { id: tenderId },
                    data: { status: 'BAHALANDYRYLDY' }
                });
            }
        });

        res.json({ message: 'Победитель по лоту обновлен' });
    } catch (error) {
        res.status(500).json({ error: 'Ошибка при выборе победителя лота', details: error.message });
    }
};

// Завершение оценки тендера
const completeEvaluation = async (req, res) => {
    try {
        const { tenderId } = req.params;

        const tender = await prisma.tender.findUnique({
            where: { id: tenderId },
            include: { offers: { include: { specs: true } } }
        });

        if (!tender) return res.status(404).json({ error: 'Тендер не найден' });

        // Нельзя завершить оценку не вскрытого тендера
        if (tender.status === 'TASLAMA' || tender.status === 'ACYK') {
            return res.status(400).json({ 
                error: 'Нельзя завершить оценку тендера, пока он находится в статусе черновика или открыт для приема заявок. Сначала вскройте предложения.' 
            });
        }

        if (tender.offers.length === 0) {
            return res.status(400).json({ 
                error: 'Нельзя объявить результаты: на данный тендер не было подано ни одного предложения.' 
            });
        }

        const anyAwarded = tender.offers.some(offer => offer.specs.some(s => s.isAwarded));
        if (!anyAwarded) {
            return res.status(400).json({ 
                error: 'Нельзя утвердить протокол: не выбран ни один победитель ни по одному лоту тендера.' 
            });
        }

        await prisma.$transaction(async (prisma) => {
            for (const offer of tender.offers) {
                const hasWonSomething = offer.specs.some(s => s.isAwarded);
                await prisma.offer.update({
                    where: { id: offer.id },
                    data: { status: hasWonSomething ? 'YENIJI' : 'RET_EDILDI' }
                });
            }

            await prisma.tender.update({
                where: { id: tenderId },
                data: { status: 'YENIJI_YGLAN_EDILDI' }
            });
        });

        res.json({ message: 'Оценка завершена, результаты оглашены' });
    } catch (error) {
        res.status(500).json({ error: 'Ошибка при завершении оценки', details: error.message });
    }
};

module.exports = {
    getEvaluationTenders,
    getTenderEvaluationDetails,
    awardLot,
    completeEvaluation,

    openTenderBids,
    evaluateTenderBids,
    selectWinnerOffer,
};

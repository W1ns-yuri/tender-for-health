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

        if (tender.status === 'BAHALANDYRYLDY' || tender.status === 'YENIJI_YGLAN_EDILDI') {
            return res.status(400).json({ error: 'Предложения по этому тендеру уже вскрыты и находятся на оценке' });
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
            lotNumber: tender.lotNumber,
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

module.exports = {
    openTenderBids,
    evaluateTenderBids,
    selectWinnerOffer,
};

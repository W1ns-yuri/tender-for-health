const prisma = require('../lib/prisma');

const createBid = async (req, res) => {
    try {
        const { comment, tenderId, companyId, items } = req.body;
        const userId = req.user.id;

        // 1. ТВОЯ ПРОВЕРКА БЕЗОПАСНОСТИ (Сохранена полностью!)
        // Проверяем, принадлежит ли компания текущему авторизованному пользователю
        const company = await prisma.company.findFirst({
            where: {
                id: companyId,
                userId: userId,
            },
        });

        if (!company) {
            return res.status(403).json({ error: 'Вы не можете подавать заявку от лица этой компании' });
        }

        // 2. Проверяем, что переданы цены по позициям
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'Укажите цены хотя бы для одной позиции' });
        }

        // 3. Автоматически считаем итоговую сумму и формируем массив для BidItem
        let totalOfferedPrice = 0;
        const bidItemsData = items.map((item) => {
            const itemTotal = parseFloat(item.pricePerUnit) * parseInt(item.quantity);
            totalOfferedPrice += itemTotal;

            return {
                tenderItemId: item.tenderItemId,
                pricePerUnit: parseFloat(item.pricePerUnit),
                totalPrice: itemTotal,
                isAlternative: Boolean(item.isAlternative),
                alternativeDesc: item.alternativeDesc || null,
            };
        });

        // 4. Сохраняем заявку вместе с её позициями
        const bid = await prisma.bid.create({
            data: {
                offeredPrice: totalOfferedPrice, // Сумма посчитана автоматически!
                comment,
                tenderId,
                companyId,
                items: {
                    create: bidItemsData, // Создаем записи в таблице bid_items
                },
            },
            include: {
                items: true,
                company: true,
            },
        });

        res.status(201).json(bid);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка при создании заявки', details: error.message });
    }
};

const getBidsByTender = async (req, res) => {
    try {
        const { tenderId } = req.params;
        const bids = await prisma.bid.findMany({
            where: { tenderId },
            include: {
                company: true,
                items: {
                    include: {
                        tenderItem: true, // Показываем, к какому товару относится каждая цена
                    },
                },
            },
        });

        res.json(bids);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка при получении заявок', details: error.message });
    }
};

module.exports = { createBid, getBidsByTender };
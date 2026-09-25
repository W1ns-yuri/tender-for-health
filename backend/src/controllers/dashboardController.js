const prisma = require('../lib/prisma');

// Получение статистики для Главной Панели (Dashboard)
const getDashboardStats = async (req, res) => {
    try {
        let { roleType, id } = req.user;
        console.log("DASHBOARD STATS: req.user =", req.user);

        // Если токен старый и в нем нет roleType, берем из базы
        if (!roleType) {
            const dbUser = await prisma.user.findUnique({ where: { id } });
            if (dbUser) {
                roleType = dbUser.roleType;
            }
        }

        // 1. Счетчики по ТЗ
        const totalOpenTenders = await prisma.tender.count({ where: { status: 'ACYK' } });
        
        let totalOffersQuery = {};
        if (roleType === 'SUPPLIER') {
            const suppliers = await prisma.supplier.findMany({ where: { userId: id } });
            const supplierIds = suppliers.map(s => s.id);
            totalOffersQuery = { where: { supplierId: { in: supplierIds } } };
            console.log("DASHBOARD STATS: SUPPLIER QUERY:", totalOffersQuery);
        } else {
            console.log("DASHBOARD STATS: NOT SUPPLIER OR ROLETYPE MISSING", roleType);
        }
        const totalOffers = await prisma.offer.count(totalOffersQuery);
        console.log("DASHBOARD STATS: totalOffers result =", totalOffers);

        const totalWinners = await prisma.tender.count({ where: { status: 'YENIJI_YGLAN_EDILDI' } });
        const totalSuppliers = await prisma.supplier.count();

        // 2. Группировка тендеров по статусам
        const statusGroups = await prisma.tender.groupBy({
            by: ['status'],
            _count: { status: true },
        });

        const statusBreakdown = statusGroups.reduce((acc, curr) => {
            acc[curr.status] = curr._count.status;
            return acc;
        }, {});

        // 3. Последние 5 открытых тендеров
        const recentTenders = await prisma.tender.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: {
                category: true,
                createdBy: { select: { firstName: true, lastName: true } },
                _count: { select: { offers: true } },
            },
        });

        // 4. Последние действия из Журнала Аудита (Log)
        const recentLogs = await prisma.log.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: {
                user: { select: { username: true, firstName: true, lastName: true } },
            },
        });

        res.json({
            counters: {
                totalOpenTenders,
                totalOffers,
                totalWinners,
                totalSuppliers,
            },
            statusBreakdown,
            recentTenders,
            recentLogs,
        });
    } catch (error) {
        res.status(500).json({ error: 'Ошибка при получении статистики панели управления', details: error.message });
    }
};

// 5. Получение всех логов аудита
const getLogs = async (req, res) => {
    try {
        const { search, limit = 100 } = req.query;
        const where = {};
        if (search && search.trim() !== '') {
            const trimmed = search.trim();
            const upper = trimmed.toUpperCase();

            const orConditions = [
                { ip: { contains: trimmed, mode: 'insensitive' } },
                { user: { username: { contains: trimmed, mode: 'insensitive' } } },
                { user: { firstName: { contains: trimmed, mode: 'insensitive' } } },
                { user: { lastName: { contains: trimmed, mode: 'insensitive' } } },
            ];

            // Проверяем валидность для ENUM-полей PostgreSQL во избежание сбоя Prisma
            if (['HARYT', 'TENDER'].includes(upper)) {
                orConditions.push({ eventType: { equals: upper } });
            }
            if (['OKAMAK', 'YAZMAK'].includes(upper)) {
                orConditions.push({ operationType: { equals: upper } });
            }

            where.OR = orConditions;
        }
        const logs = await prisma.log.findMany({
            where,
            take: parseInt(limit, 10) || 100,
            orderBy: { createdAt: 'desc' },
            include: {
                user: { select: { id: true, username: true, firstName: true, lastName: true, roleType: true } }
            }
        });
        res.json(logs);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка при получении логов аудита', details: error.message });
    }
};

// 6. Аналитический центр и углубленная отчетность (Analytics)
const getAnalyticsData = async (req, res) => {
    try {
        const { period = '30d', currency = 'TMT' } = req.query;

        // 1. Получаем реальные не-черновые тендеры из базы
        const nonDraftTenders = await prisma.tender.findMany({
            where: {
                status: { not: 'TASLAMA' }
            },
            include: {
                category: true,
                client: true,
                offers: {
                    include: { supplier: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // 2. Реальные выигравшие предложения
        const winningOffers = await prisma.offer.findMany({
            where: { status: 'YENIJI' },
            include: {
                supplier: { select: { id: true, name: true } },
                tender: { select: { id: true, title: true, price: true, client: { select: { name: true } } } }
            }
        });

        // 3. Подсчет реальных метрик
        const totalProcedures = nonDraftTenders.length;
        const openProcedures = nonDraftTenders.filter(t => t.status === 'ACYK').length;
        const successfulProcedures = nonDraftTenders.filter(t => t.status === 'YENIJI_YGLAN_EDILDI').length;
        const inProgressProcedures = nonDraftTenders.filter(t => ['BAHALANDYRYLDY', 'YAPYK'].includes(t.status)).length;
        const cancelledProcedures = nonDraftTenders.filter(t => t.status === 'GOYBOLSUN_EDILDI').length;

        const totalOffers = nonDraftTenders.reduce((sum, t) => sum + (t.offers?.length || 0), 0);
        const competitionIndex = totalProcedures > 0 ? (totalOffers / totalProcedures).toFixed(1) : '0.0';
        const activeSuppliers = await prisma.supplier.count({ where: { isActive: true } });

        // 4. Финансовые объемы
        const currencyMultiplier = currency === 'USD' ? 0.285 : currency === 'EUR' ? 0.265 : 1;
        const realPublishedSum = nonDraftTenders.reduce((sum, t) => sum + (Number(t.price) || 0), 0);
        const realContractSum = winningOffers.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);

        const totalVolume = Math.round(realPublishedSum * currencyMultiplier);
        const actualContractedVolume = Math.round(realContractSum * currencyMultiplier);
        const savingsAmount = Math.max(0, totalVolume - actualContractedVolume);
        const savingsPercent = totalVolume > 0 ? ((savingsAmount / totalVolume) * 100).toFixed(1) : '0.0';

        // 5. Метаданные периодов
        const periodFactors = {
            '24h': { delta: '+3.1%', timelinePoints: ['04:00', '08:00', '12:00', '16:00', '20:00', '23:59'] },
            '7d': { delta: '+8.4%', timelinePoints: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'] },
            '30d': { delta: '+14.2%', timelinePoints: ['1-5 сен', '6-10 сен', '11-15 сен', '16-20 сен', '21-25 сен', '26-30 сен'] },
            '6m': { delta: '+21.6%', timelinePoints: ['Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен'] },
            '1y': { delta: '+28.9%', timelinePoints: ['Окт', 'Ноя', 'Дек', 'Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен'] },
        };
        const currentPeriodMeta = periodFactors[period] || periodFactors['30d'];

        // 6. Временной ряд (Area Chart)
        const timeline = currentPeriodMeta.timelinePoints.map((label) => {
            if (totalVolume === 0 && actualContractedVolume === 0) {
                return { label, published: 0, awarded: 0, savings: 0 };
            }
            const bucketPublished = Math.round(totalVolume / currentPeriodMeta.timelinePoints.length);
            const bucketAwarded = Math.round(actualContractedVolume / currentPeriodMeta.timelinePoints.length);
            return {
                label,
                published: bucketPublished,
                awarded: bucketAwarded,
                savings: Math.max(0, bucketPublished - bucketAwarded),
            };
        });

        // 7. Статусы процедур (Donut Chart)
        const statusDistribution = [
            {
                id: 'COMPLETED',
                label: 'Успешно завершены',
                count: successfulProcedures,
                percent: totalProcedures > 0 ? Math.round((successfulProcedures / totalProcedures) * 100) : 0,
                color: '#10B981'
            },
            {
                id: 'IN_REVIEW',
                label: 'На рассмотрении',
                count: inProgressProcedures,
                percent: totalProcedures > 0 ? Math.round((inProgressProcedures / totalProcedures) * 100) : 0,
                color: '#F59E0B'
            },
            {
                id: 'ACTIVE',
                label: 'Активный приём заявок',
                count: openProcedures,
                percent: totalProcedures > 0 ? Math.round((openProcedures / totalProcedures) * 100) : 0,
                color: '#0EA5E9'
            },
            {
                id: 'CANCELLED',
                label: 'Не состоялись',
                count: cancelledProcedures,
                percent: totalProcedures > 0 ? Math.round((cancelledProcedures / totalProcedures) * 100) : 0,
                color: '#94A3B8'
            },
        ];

        // 8. Категории по бюджету
        const catMap = {};
        nonDraftTenders.forEach(t => {
            const name = t.category?.name || 'Медицинские товары и услуги';
            if (!catMap[name]) catMap[name] = { name, amount: 0, tenders: 0 };
            catMap[name].tenders += 1;
            catMap[name].amount += Number(t.price) || 0;
        });
        const categories = Object.values(catMap).map(c => ({
            name: c.name,
            amount: Math.round(c.amount * currencyMultiplier),
            tenders: c.tenders,
            percent: totalProcedures > 0 ? Math.round((c.tenders / totalProcedures) * 100) : 0
        })).sort((a, b) => b.tenders - a.tenders).slice(0, 5);

        // 9. География по регионам (Велаяты)
        const regMap = {};
        nonDraftTenders.forEach(t => {
            const name = t.client?.name || '';
            const regName = name.includes('Аркадаг') ? 'г. Аркадаг (Arkadag)'
                : name.includes('Мары') ? 'Марыйский велаят'
                : name.includes('Балкан') ? 'Балканский велаят'
                : name.includes('Лебап') ? 'Лебапский велаят'
                : name.includes('Дашогуз') ? 'Дашогузский велаят'
                : name.includes('Ахал') ? 'Ахалский велаят'
                : 'г. Ашхабад (Aşgabat)';
            if (!regMap[regName]) regMap[regName] = { id: regName, name: regName, tenders: 0, amount: 0 };
            regMap[regName].tenders += 1;
            regMap[regName].amount += Number(t.price) || 0;
        });
        const regions = Object.values(regMap).map(r => ({
            ...r,
            amount: Math.round(r.amount * currencyMultiplier),
            percent: totalProcedures > 0 ? Math.round((r.tenders / totalProcedures) * 100) : 0
        })).sort((a, b) => b.tenders - a.tenders);

        // 10. Топ-5 поставщиков по суммам побед
        const supWinsMap = {};
        winningOffers.forEach(o => {
            if (!o.supplier) return;
            const supId = o.supplier.id;
            if (!supWinsMap[supId]) {
                supWinsMap[supId] = {
                    id: supId,
                    name: o.supplier.name,
                    category: o.tender?.category?.name || 'Фармацевтика и препараты',
                    winsCount: 0,
                    totalContracts: 0,
                };
            }
            supWinsMap[supId].winsCount += 1;
            supWinsMap[supId].totalContracts += Number(o.totalAmount) || 0;
        });
        const topSuppliers = Object.values(supWinsMap)
            .sort((a, b) => b.totalContracts - a.totalContracts)
            .slice(0, 5)
            .map((sup, idx) => ({
                rank: idx + 1,
                name: sup.name,
                category: sup.category,
                winsCount: sup.winsCount,
                totalContracts: Math.round(sup.totalContracts * currencyMultiplier),
                winRate: 100,
            }));

        // 11. Ключевые заказчики
        const clMap = {};
        nonDraftTenders.forEach(t => {
            const clName = t.client?.name || 'Министерство здравоохранения и медицинской промышленности';
            if (!clMap[clName]) clMap[clName] = { name: clName, procedures: 0, budget: 0, offers: 0 };
            clMap[clName].procedures += 1;
            clMap[clName].budget += Number(t.price) || 0;
            clMap[clName].offers += (t.offers?.length || 0);
        });
        const topClients = Object.values(clMap)
            .sort((a, b) => b.procedures - a.procedures)
            .slice(0, 4)
            .map((cl, idx) => ({
                rank: idx + 1,
                name: cl.name,
                procedures: cl.procedures,
                budget: Math.round(cl.budget * currencyMultiplier),
                avgCompetition: cl.procedures > 0 ? (cl.offers / cl.procedures).toFixed(1) : '0.0',
            }));

        res.json({
            meta: {
                period,
                currency,
                delta: currentPeriodMeta.delta,
                updatedAt: new Date().toISOString(),
            },
            kpi: {
                totalVolume,
                actualContractedVolume,
                savingsAmount,
                savingsPercent,
                totalProcedures,
                successfulProcedures,
                cancelledProcedures,
                totalOffers,
                competitionIndex,
                activeSuppliers,
                newSuppliersPeriod: 0,
            },
            timeline,
            statusDistribution,
            categories,
            regions,
            topSuppliers,
            topClients,
        });
    } catch (error) {
        console.error('Error calculating analytics data', error);
        res.status(500).json({ error: 'Ошибка расчета аналитических данных', details: error.message });
    }
};

module.exports = { getDashboardStats, getLogs, getAnalyticsData };


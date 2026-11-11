const prisma = require('../lib/prisma');

// Получение статистики для Главной Панели (Dashboard)
const getDashboardStats = async (req, res) => {
    try {
        let { roleType, id } = req.user;

        // Если токен старый и в нем нет roleType, берем из базы
        if (!roleType) {
            const dbUser = await prisma.user.findUnique({ where: { id } });
            if (dbUser) {
                roleType = dbUser.roleType;
            }
        }

        // 1. Счетчики по ТЗ. Поставщику — его собственные цифры: открытые тендеры, которые он
        // может видеть, его заявки и его победы (раньше «Победители» показывал все итоги по системе).
        const isSupplier = roleType === 'SUPPLIER';
        let supplierIds = [];
        if (isSupplier) {
            const suppliers = await prisma.supplier.findMany({ where: { userId: id }, select: { id: true } });
            supplierIds = suppliers.map(s => s.id);
        }

        const totalOpenTenders = await prisma.tender.count({
            where: isSupplier
                ? { status: 'ACYK', OR: [{ visibility: 'ACYK' }, { invitedSuppliers: { some: { supplierId: { in: supplierIds } } } }] }
                : { status: 'ACYK' },
        });

        const totalOffers = await prisma.offer.count(isSupplier ? { where: { supplierId: { in: supplierIds } } } : {});

        const totalWinners = await prisma.tender.count({
            where: isSupplier
                ? { status: 'YENIJI_YGLAN_EDILDI', offers: { some: { supplierId: { in: supplierIds }, specs: { some: { isAwarded: true } } } } }
                : { status: 'YENIJI_YGLAN_EDILDI' },
        });
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
        // Поставщику — только то, что он и так видит в списке тендеров:
        // без черновиков и без чужих закрытых (YAPYK) тендеров.
        const isAdmin = roleType === 'ADMIN';
        const recentTenders = await prisma.tender.findMany({
            take: 5,
            where: isAdmin ? undefined : {
                status: { not: 'TASLAMA' },
                OR: [
                    { visibility: 'ACYK' },
                    { invitedSuppliers: { some: { supplier: { userId: id } } } },
                ],
            },
            orderBy: { createdAt: 'desc' },
            include: {
                category: true,
                createdBy: { select: { firstName: true, lastName: true } },
                _count: { select: { offers: true } },
            },
        });

        // 4. Последние действия из Журнала Аудита (Log)
        // Журнал аудита — только администратору (раньше его видел любой поставщик)
        const recentLogs = !isAdmin ? [] : await prisma.log.findMany({
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
// Длина периода в миллисекундах и число точек на графике
const ANALYTICS_PERIODS = {
    '24h': { ms: 24 * 3600e3, buckets: 6 },
    '7d': { ms: 7 * 24 * 3600e3, buckets: 7 },
    '30d': { ms: 30 * 24 * 3600e3, buckets: 6 },
    '6m': { ms: 182 * 24 * 3600e3, buckets: 6 },
    '1y': { ms: 365 * 24 * 3600e3, buckets: 12 },
};
const FINISHED_STATUSES = ['YENIJI_YGLAN_EDILDI', 'ARHIWLENDI'];

// Сумма выигранных позиций: unitPrice × quantity по isAwarded (победа присуждается по лотам, а не всей заявке)
const awardedSum = (offers) => offers.reduce((sum, o) =>
    sum + o.specs.reduce((s, sp) => s + (sp.isAwarded ? Number(sp.unitPrice) * Number(sp.quantity) : 0), 0), 0);

const bucketLabel = (date, period) => {
    const d = new Date(date);
    if (period === '24h') return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Ashgabat' });
    if (period === '6m' || period === '1y') return d.toLocaleDateString('ru-RU', { month: 'short', year: '2-digit', timeZone: 'Asia/Ashgabat' });
    return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', timeZone: 'Asia/Ashgabat' });
};

/**
 * Аналитика только по реальным данным БД.
 * Раньше период игнорировался, «+14.2% к прошлому периоду», курсы валют, экономия 8.5%,
 * win rate 100% и регионы были захардкожены, а график делил итог поровну между точками.
 */
const getAnalyticsData = async (req, res) => {
    try {
        const period = ANALYTICS_PERIODS[req.query.period] ? req.query.period : '30d';
        const { ms, buckets } = ANALYTICS_PERIODS[period];
        const now = Date.now();
        const since = new Date(now - ms);
        const prevSince = new Date(now - 2 * ms);

        // Валюта: пересчёт по курсу из справочника. Нет курса — показываем в TMT и честно говорим об этом.
        let currency = String(req.query.currency || 'TMT').toUpperCase();
        let rate = 1;
        if (currency !== 'TMT') {
            const pair = await prisma.exchangeRate.findFirst({
                where: { fromCurrency: { code: currency }, toCurrency: { code: 'TMT' } },
            });
            if (pair && Number(pair.value) > 0) rate = 1 / Number(pair.value);
            else currency = 'TMT';
        }
        const conv = (v) => Math.round(v * rate);

        const tenderInclude = {
            category: { select: { name: true } },
            client: { select: { name: true } },
            offers: {
                where: { status: { not: 'TASLAMA' } },
                select: {
                    supplierId: true,
                    supplier: { select: { id: true, name: true } },
                    specs: { select: { isAwarded: true, unitPrice: true, quantity: true } },
                },
            },
        };
        const dateField = (from, to) => ({ createdAt: { gte: from, ...(to ? { lt: to } : {}) } });

        const [tenders, prevTenders, activeSuppliers, newSuppliersPeriod] = await Promise.all([
            prisma.tender.findMany({ where: { status: { not: 'TASLAMA' }, ...dateField(since) }, include: tenderInclude }),
            prisma.tender.findMany({ where: { status: { not: 'TASLAMA' }, ...dateField(prevSince, since) }, select: { price: true } }),
            prisma.supplier.count({ where: { isActive: true, verificationStatus: 'VERIFIED' } }),
            prisma.supplier.count({ where: { createdAt: { gte: since } } }),
        ]);

        const byStatus = (list) => tenders.filter((t) => list.includes(t.status)).length;
        const totalProcedures = tenders.length;
        const successfulProcedures = byStatus(FINISHED_STATUSES);
        const inProgressProcedures = byStatus(['YAPYK', 'BAHALANDYRYLDY']);
        const openProcedures = byStatus(['ACYK']);
        const cancelledProcedures = byStatus(['GOYBOLSUN_EDILDI']);
        const totalOffers = tenders.reduce((s, t) => s + t.offers.length, 0);

        const publishedSum = tenders.reduce((s, t) => s + Number(t.price || 0), 0);
        const prevPublishedSum = prevTenders.reduce((s, t) => s + Number(t.price || 0), 0);
        const finished = tenders.filter((t) => FINISHED_STATUSES.includes(t.status));
        const contractedSum = finished.reduce((s, t) => s + awardedSum(t.offers), 0);
        // Экономия = НМЦК завершённых тендеров с победителями − сумма выигранных позиций
        const finishedWithAwards = finished.filter((t) => awardedSum(t.offers) > 0);
        const finishedBudget = finishedWithAwards.reduce((s, t) => s + Number(t.price || 0), 0);
        const savingsAmount = finishedBudget > 0 ? Math.max(0, finishedBudget - contractedSum) : 0;

        // Динамика: реальные корзины по дате создания тендера
        const step = ms / buckets;
        const timeline = Array.from({ length: buckets }, (_, i) => {
            const from = now - ms + i * step;
            const to = from + step;
            const inBucket = tenders.filter((t) => { const c = new Date(t.createdAt).getTime(); return c >= from && c < to; });
            const published = inBucket.reduce((s, t) => s + Number(t.price || 0), 0);
            const awarded = inBucket.filter((t) => FINISHED_STATUSES.includes(t.status)).reduce((s, t) => s + awardedSum(t.offers), 0);
            return { label: bucketLabel(to, period), published: conv(published), awarded: conv(awarded), savings: conv(Math.max(0, published - awarded)) };
        });

        const pct = (n) => (totalProcedures > 0 ? Math.round((n / totalProcedures) * 100) : 0);
        const statusDistribution = [
            { id: 'COMPLETED', label: 'Успешно завершены', count: successfulProcedures, percent: pct(successfulProcedures), color: '#10B981' },
            { id: 'IN_REVIEW', label: 'На рассмотрении', count: inProgressProcedures, percent: pct(inProgressProcedures), color: '#F59E0B' },
            { id: 'ACTIVE', label: 'Активный приём заявок', count: openProcedures, percent: pct(openProcedures), color: '#0EA5E9' },
            { id: 'CANCELLED', label: 'Не состоялись', count: cancelledProcedures, percent: pct(cancelledProcedures), color: '#94A3B8' },
        ];

        const group = (keyFn) => {
            const map = new Map();
            for (const t of tenders) {
                const key = keyFn(t);
                const g = map.get(key) || { name: key, tenders: 0, amount: 0, offers: 0 };
                g.tenders += 1; g.amount += Number(t.price || 0); g.offers += t.offers.length;
                map.set(key, g);
            }
            return [...map.values()].sort((a, b) => b.tenders - a.tenders);
        };
        const categories = group((t) => t.category?.name || 'Без категории').slice(0, 5)
            .map((c) => ({ name: c.name, amount: conv(c.amount), tenders: c.tenders, percent: pct(c.tenders) }));
        const topClients = group((t) => t.client?.name || 'Заказчик не указан').slice(0, 4)
            .map((c, idx) => ({ rank: idx + 1, name: c.name, procedures: c.tenders, budget: conv(c.amount), avgCompetition: (c.offers / c.tenders).toFixed(1) }));

        // Поставщики: участия и победы (победа = хотя бы одна выигранная позиция в тендере)
        const sup = new Map();
        for (const t of tenders) {
            for (const o of t.offers) {
                const s = sup.get(o.supplierId) || { name: o.supplier?.name || '—', participations: 0, wins: 0, total: 0, category: t.category?.name || 'Без категории' };
                s.participations += 1;
                const won = awardedSum([o]);
                if (won > 0) { s.wins += 1; s.total += won; }
                sup.set(o.supplierId, s);
            }
        }
        const topSuppliers = [...sup.values()].filter((s) => s.wins > 0)
            .sort((a, b) => b.total - a.total).slice(0, 5)
            .map((s, idx) => ({ rank: idx + 1, name: s.name, category: s.category, winsCount: s.wins, totalContracts: conv(s.total), winRate: Math.round((s.wins / s.participations) * 100) }));

        res.json({
            meta: {
                period,
                currency,
                // null, когда сравнивать не с чем: фронт не должен рисовать выдуманный рост
                delta: prevPublishedSum > 0 ? `${publishedSum >= prevPublishedSum ? '+' : ''}${(((publishedSum - prevPublishedSum) / prevPublishedSum) * 100).toFixed(1)}%` : null,
                updatedAt: new Date().toISOString(),
            },
            kpi: {
                totalVolume: conv(publishedSum),
                actualContractedVolume: conv(contractedSum),
                savingsAmount: conv(savingsAmount),
                savingsPercent: finishedBudget > 0 ? ((savingsAmount / finishedBudget) * 100).toFixed(1) : null,
                totalProcedures,
                successfulProcedures,
                cancelledProcedures,
                totalOffers,
                competitionIndex: totalProcedures > 0 ? (totalOffers / totalProcedures).toFixed(1) : '0.0',
                activeSuppliers,
                newSuppliersPeriod,
            },
            timeline,
            statusDistribution,
            categories,
            // У заказчика нет поля региона: раньше регион угадывался по названию, а всё прочее записывалось в Ашхабад
            regions: [],
            topSuppliers,
            topClients,
        });
    } catch (error) {
        console.error('Error calculating analytics data', error);
        res.status(500).json({ error: 'Ошибка расчета аналитических данных' });
    }
};

module.exports = { getDashboardStats, getLogs, getAnalyticsData };


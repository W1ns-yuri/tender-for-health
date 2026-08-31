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
        if (search) {
            where.OR = [
                { eventType: { contains: search, mode: 'insensitive' } },
                { operationType: { contains: search, mode: 'insensitive' } },
                { ip: { contains: search, mode: 'insensitive' } },
                { user: { username: { contains: search, mode: 'insensitive' } } }
            ];
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

module.exports = { getDashboardStats, getLogs };

const prisma = require('../lib/prisma');

// Обычный пользователь (Поставщик) обновляет свой профиль (Шаг 2 верификации)
const updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, type, address, region, bankName, bankAccount, bankMfo, passportInfo, passportSeries, passportIssuedBy, email, phone } = req.body;

        // Ищем поставщика
        const supplier = await prisma.supplier.findFirst({
            where: { userId }
        });

        if (!supplier) {
            return res.status(404).json({ error: 'Профиль поставщика не найден' });
        }

        // Очищаем наименование от случайных приставок формы
        let cleanName = supplier.name;
        if (name && typeof name === 'string' && name.trim()) {
            cleanName = name.trim().replace(/^(ип|хо|ооо|чп|hj|dh|hk|telekeçi|hojalyk\s+jemgyýeti|hususy\s+telekeçi|hususy\s+kärhana)\s*["«'”]?\s*/i, '').replace(/["»'”]$/, '').trim() || name.trim();
        }

        const combinedPassport = passportInfo || [passportSeries, passportIssuedBy].filter(Boolean).join(', ');
        const previousStatus = supplier.verificationStatus;

        // Обновляем Supplier (включая рабочий телефон и email)
        const updatedSupplier = await prisma.supplier.update({
            where: { id: supplier.id },
            data: {
                name: cleanName,
                type: type || supplier.type,
                address,
                region,
                bankName,
                bankAccount,
                bankMfo,
                passportInfo: combinedPassport,
                passportSeries,
                passportIssuedBy,
                email,
                phone, // Сохраняем рабочий телефон в профиле компании
                verificationStatus: 'PENDING_REVIEW', // Переводим на проверку
            },
            include: {
                files: {
                    include: { document: true }
                }
            }
        });

        // Обновляем User (телефон и email пользователя, если переданы)
        await prisma.user.update({
            where: { id: userId },
            data: { 
                ...(phone ? { phone } : {}),
                ...(email ? { username: email } : {})
            }
        });

        // Записываем событие в архив / лог модерации
        try {
            await prisma.supplierModerationLog.create({
                data: {
                    supplierId: supplier.id,
                    action: previousStatus === 'REJECTED' ? 'RESUBMITTED' : 'SUBMITTED',
                    previousStatus,
                    newStatus: 'PENDING_REVIEW',
                    reason: previousStatus === 'REJECTED' 
                        ? 'Повторная подача профиля на проверку после исправления замечаний' 
                        : 'Подача профиля на верификацию'
                }
            });
        } catch (logErr) {
            console.error('Ошибка записи лога модерации:', logErr);
        }

        res.json(updatedSupplier);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка обновления профиля', details: error.message });
    }
};

// Администратор получает список всех поставщиков, требующих проверки
const getPendingSuppliers = async (req, res) => {
    try {
        const pending = await prisma.supplier.findMany({
            where: { verificationStatus: { in: ['PENDING', 'PENDING_REVIEW'] } },
            include: { user: true, files: { include: { document: true } } },
            orderBy: { updatedAt: 'desc' }
        });
        res.json(pending);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка при получении списка на модерацию', details: error.message });
    }
};

// Получение полной информации о поставщике по id (для профиля и модерации)
const getSupplierById = async (req, res) => {
    try {
        const { id } = req.params;
        const supplier = await prisma.supplier.findUnique({
            where: { id },
            include: {
                user: { select: { id: true, username: true, email: true, phone: true } },
                country: true,
                files: {
                    include: { document: true }
                }
            }
        });
        if (!supplier) {
            return res.status(404).json({ error: 'Поставщик не найден' });
        }
        res.json(supplier);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка при получении данных поставщика', details: error.message });
    }
};

// Администратор одобряет
const approveSupplier = async (req, res) => {
    try {
        const { id } = req.params;
        const previousSupplier = await prisma.supplier.findUnique({
            where: { id },
            select: { verificationStatus: true, name: true }
        });

        const updated = await prisma.supplier.update({
            where: { id },
            data: {
                verificationStatus: 'VERIFIED',
                rejectionReason: null
            }
        });

        // Записываем одобрение в архив / историю модерации
        try {
            await prisma.supplierModerationLog.create({
                data: {
                    supplierId: id,
                    adminId: req.user?.id || null,
                    action: 'APPROVED',
                    previousStatus: previousSupplier?.verificationStatus || 'PENDING_REVIEW',
                    newStatus: 'VERIFIED',
                    reason: null
                }
            });
        } catch (logErr) {
            console.error('Ошибка записи лога одобрения:', logErr);
        }

        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка при одобрении', details: error.message });
    }
};

// Администратор отклоняет
const rejectSupplier = async (req, res) => {
    try {
        const { id } = req.params;
        const { rejectionReason } = req.body;

        const previousSupplier = await prisma.supplier.findUnique({
            where: { id },
            select: { verificationStatus: true, name: true }
        });

        const updated = await prisma.supplier.update({
            where: { id },
            data: {
                verificationStatus: 'REJECTED',
                rejectionReason
            }
        });

        // Записываем отклонение в архив / историю модерации
        try {
            await prisma.supplierModerationLog.create({
                data: {
                    supplierId: id,
                    adminId: req.user?.id || null,
                    action: 'REJECTED',
                    previousStatus: previousSupplier?.verificationStatus || 'PENDING_REVIEW',
                    newStatus: 'REJECTED',
                    reason: rejectionReason
                }
            });
        } catch (logErr) {
            console.error('Ошибка записи лога отклонения:', logErr);
        }

        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка при отклонении', details: error.message });
    }
};

// Администратор получает архив и статистику всех решений по модерации
const getModerationArchive = async (req, res) => {
    try {
        const logs = await prisma.supplierModerationLog.findMany({
            include: {
                supplier: {
                    select: {
                        id: true,
                        name: true,
                        type: true,
                        taxId: true,
                        email: true,
                        phone: true
                    }
                },
                admin: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        username: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 200
        });

        const [totalApproved, totalRejected, pendingCount] = await Promise.all([
            prisma.supplierModerationLog.count({ where: { action: 'APPROVED' } }),
            prisma.supplierModerationLog.count({ where: { action: 'REJECTED' } }),
            prisma.supplier.count({ where: { verificationStatus: { in: ['PENDING', 'PENDING_REVIEW'] } } })
        ]);

        res.json({
            logs,
            stats: {
                totalDecisions: totalApproved + totalRejected,
                totalApproved,
                totalRejected,
                pendingCount
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Ошибка при получении архива модерации', details: error.message });
    }
};

module.exports = {
    updateProfile,
    getPendingSuppliers,
    getSupplierById,
    approveSupplier,
    rejectSupplier,
    getModerationArchive
};

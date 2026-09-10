const prisma = require('../lib/prisma');

// Обычный пользователь (Поставщик) обновляет свой профиль (Шаг 2 верификации)
const updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { address, region, bankName, bankAccount, bankMfo, passportInfo, passportSeries, passportIssuedBy, email, phone } = req.body;

        // Ищем поставщика
        const supplier = await prisma.supplier.findFirst({
            where: { userId }
        });

        if (!supplier) {
            return res.status(404).json({ error: 'Профиль поставщика не найден' });
        }

        const combinedPassport = passportInfo || [passportSeries, passportIssuedBy].filter(Boolean).join(', ');

        // Обновляем Supplier
        const updatedSupplier = await prisma.supplier.update({
            where: { id: supplier.id },
            data: {
                address,
                region,
                bankName,
                bankAccount,
                bankMfo,
                passportInfo: combinedPassport,
                passportSeries,
                passportIssuedBy,
                email,
                verificationStatus: 'PENDING_REVIEW', // Переводим на проверку
            }
        });

        // Обновляем User (телефон, если передан)
        if (phone) {
            await prisma.user.update({
                where: { id: userId },
                data: { phone }
            });
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
            where: { verificationStatus: 'PENDING_REVIEW' },
            include: { user: true, files: { include: { document: true } } }
        });
        res.json(pending);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка при получении списка на модерацию', details: error.message });
    }
};

// Администратор одобряет
const approveSupplier = async (req, res) => {
    try {
        const { id } = req.params;
        const updated = await prisma.supplier.update({
            where: { id },
            data: {
                verificationStatus: 'VERIFIED',
                rejectionReason: null
            }
        });
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
        const updated = await prisma.supplier.update({
            where: { id },
            data: {
                verificationStatus: 'REJECTED',
                rejectionReason
            }
        });
        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка при отклонении', details: error.message });
    }
};

module.exports = {
    updateProfile,
    getPendingSuppliers,
    approveSupplier,
    rejectSupplier
};

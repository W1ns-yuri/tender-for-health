const prisma = require('../lib/prisma');

/**
 * 1. Получить уведомления текущего пользователя
 */
const getUserNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 30));
        const skip = (page - 1) * limit;

        const [notifications, total, unreadCount] = await Promise.all([
            prisma.notification.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma.notification.count({ where: { userId } }),
            prisma.notification.count({ where: { userId, isRead: false } }),
        ]);

        res.json({
            notifications,
            total,
            unreadCount,
            page,
            totalPages: Math.ceil(total / limit) || 1,
        });
    } catch (error) {
        console.error('getUserNotifications error:', error);
        res.status(500).json({ error: 'Ошибка при получении уведомлений', details: error.message });
    }
};

/**
 * 2. Отметить одно уведомление как прочитанное
 */
const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const notification = await prisma.notification.findUnique({
            where: { id }
        });

        if (!notification) {
            return res.status(404).json({ error: 'Уведомление не найдено' });
        }

        if (notification.userId !== userId) {
            return res.status(403).json({ error: 'Нет доступа к этому уведомлению' });
        }

        const updated = await prisma.notification.update({
            where: { id },
            data: { isRead: true }
        });

        const unreadCount = await prisma.notification.count({ where: { userId, isRead: false } });

        res.json({ notification: updated, unreadCount });
    } catch (error) {
        console.error('markAsRead error:', error);
        res.status(500).json({ error: 'Ошибка обновления статуса уведомления', details: error.message });
    }
};

/**
 * 3. Отметить все уведомления пользователя как прочитанные
 */
const markAllAsRead = async (req, res) => {
    try {
        const userId = req.user.id;

        const result = await prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true }
        });

        res.json({ success: true, count: result.count, unreadCount: 0 });
    } catch (error) {
        console.error('markAllAsRead error:', error);
        res.status(500).json({ error: 'Ошибка отметки уведомлений', details: error.message });
    }
};

/**
 * 4. Удалить уведомление
 */
const deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const notification = await prisma.notification.findUnique({ where: { id } });
        if (!notification) {
            return res.status(404).json({ error: 'Уведомление не найдено' });
        }

        if (notification.userId !== userId) {
            return res.status(403).json({ error: 'Нет доступа к этому уведомлению' });
        }

        await prisma.notification.delete({ where: { id } });
        const unreadCount = await prisma.notification.count({ where: { userId, isRead: false } });

        res.json({ success: true, unreadCount });
    } catch (error) {
        console.error('deleteNotification error:', error);
        res.status(500).json({ error: 'Ошибка удаления уведомления', details: error.message });
    }
};

/**
 * 5. Сервисный хелпер: создать уведомление для пользователя или группы пользователей
 * Использование:
 * await sendNotification({ userId: '...', title: '...', message: '...', type: 'tender', link: '/tenders/123' });
 */
const sendNotification = async ({ userId, userIds, title, message, type = 'INFO', link = null }) => {
    try {
        const targets = userIds || (userId ? [userId] : []);
        if (targets.length === 0) return [];

        const created = await Promise.all(
            targets.map(uid =>
                prisma.notification.create({
                    data: {
                        userId: uid,
                        title,
                        message,
                        type,
                        link,
                        isRead: false,
                    }
                })
            )
        );
        return created;
    } catch (error) {
        console.error('sendNotification helper error:', error);
        return [];
    }
};

/**
 * 6. Сервисный хелпер: отправить уведомление всем администраторам
 */
const notifyAdmins = async ({ title, message, type = 'INFO', link = null }) => {
    try {
        const adminUsers = await prisma.user.findMany({
            where: { roleType: 'ADMIN' },
            select: { id: true }
        });
        if (adminUsers.length === 0) return [];
        return await sendNotification({
            userIds: adminUsers.map(a => a.id),
            title,
            message,
            type,
            link
        });
    } catch (error) {
        console.error('notifyAdmins error:', error);
        return [];
    }
};

module.exports = {
    getUserNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    sendNotification,
    notifyAdmins,
};

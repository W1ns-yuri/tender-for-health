const express = require('express');
const {
    getUserNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
} = require('../controllers/notificationController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// 1. Получить список уведомлений текущего пользователя
router.get('/', authMiddleware, getUserNotifications);

// 2. Отметить ВСЕ уведомления как прочитанные
router.put('/read-all', authMiddleware, markAllAsRead);

// 3. Отметить конкретное уведомление как прочитанное
router.put('/:id/read', authMiddleware, markAsRead);

// 4. Удалить уведомление
router.delete('/:id', authMiddleware, deleteNotification);

module.exports = router;

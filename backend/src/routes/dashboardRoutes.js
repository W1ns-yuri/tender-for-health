const express = require('express');
const { getDashboardStats, getLogs } = require('../controllers/dashboardController');
const authMiddleware = require('../middleware/authMiddleware');

const { checkRole } = require('../middleware/rbacMiddleware');

const router = express.Router();

// 1. Статистика панели управления (Дашборд)
router.get('/stats', authMiddleware, getDashboardStats);

// 2. Логи аудита (только администратор)
router.get('/logs', authMiddleware, checkRole(['ADMIN']), getLogs);

module.exports = router;

const express = require('express');
const { getDashboardStats, getLogs } = require('../controllers/dashboardController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// 1. Статистика панели управления (Дашборд)
router.get('/stats', authMiddleware, getDashboardStats);

// 2. Логи аудита
router.get('/logs', authMiddleware, getLogs);

module.exports = router;

const express = require('express');
const { getDashboardStats } = require('../controllers/dashboardController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// 1. Статистика панели управления (Дашборд)
router.get('/stats', authMiddleware, getDashboardStats);

module.exports = router;

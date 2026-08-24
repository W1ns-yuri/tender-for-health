const express = require('express');
const { createBid, getBidsByTender } = require('../controllers/bidController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Получить все заявки конкретного тендера
router.get('/tender/:tenderId', authMiddleware, getBidsByTender);

// Подать новую заявку
router.post('/', authMiddleware, createBid);

module.exports = router;
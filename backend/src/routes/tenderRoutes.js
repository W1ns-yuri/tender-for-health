const express = require('express');
const { createTender, getTenders, getTenderById, deleteTender, getNextNumber } = require('../controllers/tenderController');
const authMiddleware = require('../middleware/authMiddleware');
const { checkRole } = require('../middleware/rbacMiddleware');

const router = express.Router();

// 1. Посмотреть все тендеры (публичный)
router.get('/', getTenders);

// 2. Получить следующий порядковый номер тендера (TNDR-YYYY-MM-001)
router.get('/next-number', authMiddleware, getNextNumber);

// 3. Посмотреть ОДИН тендер по ID со всеми позициями и заявками
router.get('/:id', authMiddleware, getTenderById);

// 3. Создать тендер (только для организатора / администратора)
router.post('/', authMiddleware, checkRole(['ADMIN']), createTender);

// 4. Удалить тендер (только для админа)
router.delete('/:id', authMiddleware, checkRole(['ADMIN']), deleteTender);

module.exports = router;
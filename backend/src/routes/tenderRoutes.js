const express = require('express');
const { createTender, getTenders, getTenderById, deleteTender } = require('../controllers/tenderController');
const authMiddleware = require('../middleware/authMiddleware');
const { checkRole } = require('../middleware/rbacMiddleware');

const router = express.Router();

// 1. Посмотреть все тендеры (публичный)
router.get('/', getTenders);

// 2. Посмотреть ОДИН тендер по ID со всеми позициями и заявками
router.get('/:id', authMiddleware, getTenderById);

// 3. Создать тендер (только для авторизованных)
router.post('/', authMiddleware, createTender);

// 4. Удалить тендер (только для админа)
router.delete('/:id', authMiddleware, checkRole(['ADMIN']), deleteTender);

module.exports = router;
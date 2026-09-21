const express = require('express');
const {
    createTender,
    getTenders,
    getTenderById,
    updateTender,
    publishTender,
    deleteTender,
    getNextNumber,
    createLot,
    updateLot,
    deleteLot
} = require('../controllers/tenderController');
const authMiddleware = require('../middleware/authMiddleware');
const { checkRole } = require('../middleware/rbacMiddleware');

const router = express.Router();

// 1. Посмотреть все тендеры (публичный)
router.get('/', getTenders);

// 2. Получить следующий порядковый номер тендера (TNDR-YYYY-MM-001)
router.get('/next-number', authMiddleware, getNextNumber);

// 3. Посмотреть ОДИН тендер по ID со всеми позициями и заявками
router.get('/:id', authMiddleware, getTenderById);

// 4. Создать тендер (черновик или открытый)
router.post('/', authMiddleware, checkRole(['ADMIN']), createTender);

// 5. Обновить основные реквизиты тендера
router.put('/:id', authMiddleware, checkRole(['ADMIN']), updateTender);

// 6. Опубликовать тендер (перевод из черновика в открытый)
router.post('/:id/publish', authMiddleware, checkRole(['ADMIN']), publishTender);

// 7. Добавить отдельный лот к тендеру (атомарно)
router.post('/:id/lots', authMiddleware, checkRole(['ADMIN']), createLot);

// 8. Обновить отдельный лот и его спецификации (атомарно)
router.put('/:id/lots/:lotId', authMiddleware, checkRole(['ADMIN']), updateLot);

// 9. Удалить отдельный лот из тендера
router.delete('/:id/lots/:lotId', authMiddleware, checkRole(['ADMIN']), deleteLot);

// 10. Удалить весь тендер (только для админа)
router.delete('/:id', authMiddleware, checkRole(['ADMIN']), deleteTender);

module.exports = router;
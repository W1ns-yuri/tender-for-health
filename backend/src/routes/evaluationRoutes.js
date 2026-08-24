const express = require('express');
const {
    openTenderBids,
    evaluateTenderBids,
    selectWinnerOffer,
} = require('../controllers/evaluationController');
const authMiddleware = require('../middleware/authMiddleware');
const { checkRole } = require('../middleware/rbacMiddleware');

const router = express.Router();

// 1. Вскрытие предложений (Teklipleri açmak) — Заказчик / Спец. по закупкам / Админ
router.post('/open/:tenderId', authMiddleware, checkRole(['CLIENT', 'PURCHASING_SPECIALIST', 'ADMIN']), openTenderBids);

// 2. Оценка предложений (Bahalandyrmak) — Тендерная комиссия / Админ
router.get('/evaluate/:tenderId', authMiddleware, checkRole(['COMMISSION_MEMBER', 'ADMIN', 'PURCHASING_SPECIALIST']), evaluateTenderBids);

// 3. Выбор и объявление победителя (ýeňiji yglan edildi) — Тендерная комиссия / Админ
router.post('/select-winner', authMiddleware, checkRole(['COMMISSION_MEMBER', 'ADMIN']), selectWinnerOffer);

module.exports = router;

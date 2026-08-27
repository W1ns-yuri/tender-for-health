const express = require('express');
const {
    openTenderBids,
    evaluateTenderBids,
    getEvaluationTenders,
    getTenderEvaluationDetails,
    awardLot,
    completeEvaluation
} = require('../controllers/evaluationController');
const authMiddleware = require('../middleware/authMiddleware');
const { checkRole } = require('../middleware/rbacMiddleware');

const router = express.Router();

// 1. Вскрытие предложений (Teklipleri açmak)
router.post('/open/:tenderId', authMiddleware, checkRole(['CLIENT', 'PURCHASING_SPECIALIST', 'ADMIN']), openTenderBids);

// 2. Старая оценка (пока оставляем для совместимости, если где-то юзается)
router.get('/evaluate/:tenderId', authMiddleware, checkRole(['COMMISSION_MEMBER', 'ADMIN', 'PURCHASING_SPECIALIST']), evaluateTenderBids);

// 3. Список тендеров для оценки
router.get('/tenders', authMiddleware, checkRole(['COMMISSION_MEMBER', 'ADMIN']), getEvaluationTenders);

// 4. Детали тендера для оценки по позициям
router.get('/tenders/:tenderId/details', authMiddleware, checkRole(['COMMISSION_MEMBER', 'ADMIN']), getTenderEvaluationDetails);

// 5. Выбор победителя по конкретной позиции (лоту/товару)
router.post('/award-item', authMiddleware, checkRole(['COMMISSION_MEMBER', 'ADMIN']), awardLot);

// 6. Завершение оценки тендера
router.post('/complete/:tenderId', authMiddleware, checkRole(['COMMISSION_MEMBER', 'ADMIN']), completeEvaluation);

module.exports = router;

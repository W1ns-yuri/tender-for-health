const express = require('express');
const {
    openTenderBids,
    evaluateTenderBids,
    getEvaluationTenders,
    getTenderEvaluationDetails,
    awardLot,
    completeEvaluation,
    selectWinnerOffer
} = require('../controllers/evaluationController');
const authMiddleware = require('../middleware/authMiddleware');
const { checkRole } = require('../middleware/rbacMiddleware');

const router = express.Router();

// 1. Вскрытие предложений (Teklipleri açmak)
router.post('/open/:tenderId', authMiddleware, checkRole(['CLIENT', 'PURCHASING_SPECIALIST', 'ADMIN']), openTenderBids);

// 2. Старая оценка (пока оставляем для совместимости, если где-то юзается)
router.get('/evaluate/:tenderId', authMiddleware, checkRole(['COMMISSION_MEMBER', 'ADMIN', 'PURCHASING_SPECIALIST']), evaluateTenderBids);

// 3. Список тендеров для оценки
router.get('/tenders', authMiddleware, checkRole(['COMMISSION_MEMBER', 'ADMIN', 'CLIENT', 'PURCHASING_SPECIALIST']), getEvaluationTenders);

// 4. Детали тендера для оценки по позициям
router.get('/tenders/:tenderId/details', authMiddleware, checkRole(['COMMISSION_MEMBER', 'ADMIN', 'CLIENT', 'PURCHASING_SPECIALIST']), getTenderEvaluationDetails);

// 5. Выбор победителя по конкретной позиции (лоту/товару)
router.post('/award-lot', authMiddleware, checkRole(['COMMISSION_MEMBER', 'ADMIN', 'CLIENT', 'PURCHASING_SPECIALIST']), awardLot);
router.post('/award-item', authMiddleware, checkRole(['COMMISSION_MEMBER', 'ADMIN', 'CLIENT', 'PURCHASING_SPECIALIST']), awardLot);

// 6. Завершение оценки тендера
router.post('/complete/:tenderId', authMiddleware, checkRole(['COMMISSION_MEMBER', 'ADMIN', 'CLIENT', 'PURCHASING_SPECIALIST']), completeEvaluation);

// 7. Прямой выбор победителя тендера (общий)
router.post('/select-winner', authMiddleware, checkRole(['COMMISSION_MEMBER', 'ADMIN', 'PURCHASING_SPECIALIST']), selectWinnerOffer);

module.exports = router;

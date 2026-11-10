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
router.post('/open/:tenderId', authMiddleware, checkRole(['ADMIN']), openTenderBids);

// 2. Старая оценка (пока оставляем для совместимости, если где-то юзается)
router.get('/evaluate/:tenderId', authMiddleware, checkRole(['ADMIN']), evaluateTenderBids);

// 3. Список тендеров для оценки
router.get('/tenders', authMiddleware, checkRole(['ADMIN']), getEvaluationTenders);

// 4. Детали тендера для оценки по позициям
router.get('/tenders/:tenderId/details', authMiddleware, checkRole(['ADMIN']), getTenderEvaluationDetails);

// 5. Выбор победителя по конкретной позиции (лоту/товару)
router.post('/award-lot', authMiddleware, checkRole(['ADMIN']), awardLot);
router.post('/award-item', authMiddleware, checkRole(['ADMIN']), awardLot);

// 6. Завершение оценки тендера
router.post('/complete/:tenderId', authMiddleware, checkRole(['ADMIN']), completeEvaluation);

// 7. Прямой выбор победителя тендера (общий)
router.post('/select-winner', authMiddleware, checkRole(['ADMIN']), selectWinnerOffer);

module.exports = router;

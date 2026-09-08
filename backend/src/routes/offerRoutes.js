const express = require('express');
const {
    createSupplier,
    getSuppliers,
    createOffer,
    getOffersByTender,
    getMyOffers,
    getMyWins,
    getAllOffers,
    getOfferById,
    deleteOffer
} = require('../controllers/offerController');
const authMiddleware = require('../middleware/authMiddleware');
const { checkRole } = require('../middleware/rbacMiddleware');

const router = express.Router();

// Поставщики (Suppliers)
router.get('/suppliers', getSuppliers);
router.post('/suppliers', authMiddleware, createSupplier);

// Коммерческие предложения (Offers)
router.get('/', authMiddleware, checkRole(['ADMIN']), getAllOffers);
router.post('/', authMiddleware, checkRole(['SUPPLIER', 'ADMIN']), createOffer);
router.get('/tender/:tenderId', authMiddleware, getOffersByTender);
router.get('/my-wins', authMiddleware, checkRole(['SUPPLIER', 'ADMIN']), getMyWins);
router.get('/my', authMiddleware, checkRole(['SUPPLIER', 'ADMIN']), getMyOffers);
router.get('/:id', authMiddleware, checkRole(['SUPPLIER', 'ADMIN']), getOfferById);
router.delete('/:id', authMiddleware, checkRole(['SUPPLIER', 'ADMIN']), deleteOffer);

module.exports = router;

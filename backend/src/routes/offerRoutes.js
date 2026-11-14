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
// Полный список поставщиков (ИНН, e-mail, телефоны) — только админу (раньше был публичным)
router.get('/suppliers', authMiddleware, checkRole(['ADMIN']), getSuppliers);
router.post('/suppliers', authMiddleware, checkRole(['ADMIN']), createSupplier);

// Коммерческие предложения (Offers)
router.get('/', authMiddleware, checkRole(['ADMIN']), getAllOffers);
router.post('/', authMiddleware, checkRole(['SUPPLIER', 'ADMIN']), createOffer);
router.get('/tender/:tenderId', authMiddleware, getOffersByTender);
router.get('/my-wins', authMiddleware, checkRole(['SUPPLIER', 'ADMIN']), getMyWins);
router.get('/my', authMiddleware, checkRole(['SUPPLIER', 'ADMIN']), getMyOffers);
router.get('/:id', authMiddleware, checkRole(['SUPPLIER', 'ADMIN']), getOfferById);
// Отозвать заявку может только сам поставщик: организатор не должен убирать чужие заявки
router.delete('/:id', authMiddleware, checkRole(['SUPPLIER']), deleteOffer);

module.exports = router;

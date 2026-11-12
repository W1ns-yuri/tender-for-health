const express = require('express');
const {
    listContracts, getContract, generateContracts,
    sendContract, supplierSign, adminSign, returnContract, cancelContract,
} = require('../controllers/contractController');
const authMiddleware = require('../middleware/authMiddleware');
const { checkRole } = require('../middleware/rbacMiddleware');

const router = express.Router();

// Видны только сторонам договора: админу все, поставщику свои
router.get('/', authMiddleware, listContracts);
router.get('/:id', authMiddleware, getContract);

router.post('/generate/:tenderId', authMiddleware, checkRole(['ADMIN']), generateContracts);
router.post('/:id/send', authMiddleware, checkRole(['ADMIN']), sendContract);
router.post('/:id/supplier-sign', authMiddleware, supplierSign);
router.post('/:id/admin-sign', authMiddleware, checkRole(['ADMIN']), adminSign);
router.post('/:id/return', authMiddleware, checkRole(['ADMIN']), returnContract);
router.post('/:id/cancel', authMiddleware, checkRole(['ADMIN']), cancelContract);

module.exports = router;

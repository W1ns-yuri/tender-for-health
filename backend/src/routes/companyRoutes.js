const express = require('express');
const { createCompany, getCompanies, updateCompany, deleteCompany, getCompanyStats } = require('../controllers/companyController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', getCompanies);
router.get('/:id/stats', getCompanyStats);
router.post('/', authMiddleware, createCompany);
router.put('/:id', authMiddleware, updateCompany);
router.delete('/:id', authMiddleware, deleteCompany);

module.exports = router;
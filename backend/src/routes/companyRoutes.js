const express = require('express');
const { createCompany, getCompanies, updateCompany, deleteCompany, getCompanyStats } = require('../controllers/companyController');
const authMiddleware = require('../middleware/authMiddleware');
const { checkRole } = require('../middleware/rbacMiddleware');

const router = express.Router();

router.get('/', getCompanies);
router.get('/:id/stats', getCompanyStats);
router.post('/', authMiddleware, checkRole(['ADMIN']), createCompany);
router.put('/:id', authMiddleware, checkRole(['ADMIN']), updateCompany);
router.delete('/:id', authMiddleware, checkRole(['ADMIN']), deleteCompany);

module.exports = router;
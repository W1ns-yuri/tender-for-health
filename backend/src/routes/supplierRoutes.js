const express = require('express');
const router = express.Router();
const { 
    getAllSuppliers,
    deleteSupplier,
    adminUpdateSupplier,
    updateProfile, 
    getPendingSuppliers, 
    getSupplierById, 
    getSupplierStats,
    approveSupplier, 
    rejectSupplier,
    getModerationArchive 
} = require('../controllers/supplierController');
const authMiddleware = require('../middleware/authMiddleware');
const { checkRole } = require('../middleware/rbacMiddleware');

// Получить реестр всех поставщиков (только администратор)
router.get('/', authMiddleware, checkRole(['ADMIN']), getAllSuppliers);

// Поставщик обновляет свой профиль
router.put('/profile', authMiddleware, checkRole(['SUPPLIER', 'ADMIN']), updateProfile);

// Роуты для администратора
router.get('/pending', authMiddleware, checkRole(['ADMIN']), getPendingSuppliers);
router.get('/moderation/archive', authMiddleware, checkRole(['ADMIN']), getModerationArchive);
router.post('/:id/approve', authMiddleware, checkRole(['ADMIN']), approveSupplier);
router.post('/:id/reject', authMiddleware, checkRole(['ADMIN']), rejectSupplier);
router.put('/:id', authMiddleware, checkRole(['ADMIN']), adminUpdateSupplier);
router.delete('/:id', authMiddleware, checkRole(['ADMIN']), deleteSupplier);

// Статистика предложений поставщика
router.get('/:id/stats', authMiddleware, getSupplierStats);

// Получить данные поставщика по ID (доступно авторизованным пользователям)
router.get('/:id', authMiddleware, getSupplierById);

module.exports = router;

const express = require('express');
const { getUsers, createUser, updateUser, toggleUserStatus, resetUserPassword } = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const { checkRole } = require('../middleware/rbacMiddleware');

const router = express.Router();

router.get('/', authMiddleware, checkRole(['ADMIN']), getUsers);
router.post('/', authMiddleware, checkRole(['ADMIN']), createUser);
router.put('/:id', authMiddleware, checkRole(['ADMIN']), updateUser);
router.put('/:id/status', authMiddleware, checkRole(['ADMIN']), toggleUserStatus);
router.post('/:id/reset-password', authMiddleware, checkRole(['ADMIN']), resetUserPassword);

module.exports = router;
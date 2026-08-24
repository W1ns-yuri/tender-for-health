const express = require('express');
const { getUsers, createUser } = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const { checkRole } = require('../middleware/rbacMiddleware');

const router = express.Router();

router.get('/', authMiddleware, checkRole(['ADMIN']), getUsers);
router.post('/', authMiddleware, checkRole(['ADMIN']), createUser);

module.exports = router;
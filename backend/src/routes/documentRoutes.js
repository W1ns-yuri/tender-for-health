const express = require('express');
const { uploadDocument, getDocuments } = require('../controllers/documentController');
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

// Получить список документов (по tenderId, supplierId, offerId)
router.get('/', authMiddleware, getDocuments);

// Принимаем один файл из поля "file"
router.post('/upload', authMiddleware, upload.single('file'), uploadDocument);

module.exports = router;
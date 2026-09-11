const express = require('express');
const { uploadDocument, getDocuments, deleteDocument } = require('../controllers/documentController');
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

// Получить список документов (по tenderId, supplierId, offerId)
router.get('/', authMiddleware, getDocuments);

// Принимаем один файл из поля "file" с обработкой ошибок формата
router.post('/upload', authMiddleware, (req, res, next) => {
    upload.single('file')(req, res, (err) => {
        if (err) {
            return res.status(400).json({ error: err.message || 'Ошибка при загрузке файла' });
        }
        next();
    });
}, uploadDocument);

// Удалить документ по id
router.delete('/:id', authMiddleware, deleteDocument);

module.exports = router;
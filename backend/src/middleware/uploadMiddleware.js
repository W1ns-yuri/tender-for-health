const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Создаем папку uploads, если ее еще нет
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Настройка хранилища
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Уникальное имя файла: timestamp + рандомное число + оригинальное расширение
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
    },
});

// Фильтр типов файлов (разрешаем PDF, JPG, PNG, а также документы Word и Excel для спецификаций)
const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/octet-stream', // некоторые клиенты отправляют xlsx как octet-stream
    ];
    const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx', '.xls', '.xlsx'];
    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedExtensions.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error('Недопустимый формат файла. Разрешены PDF, JPG, PNG, Word (.doc, .docx) и Excel (.xls, .xlsx)'), false);
    }
};

const upload = multer({
    storage,
    limits: { fileSize: 25 * 1024 * 1024 }, // Лимит: 25 МБ на файл по ТЗ
    fileFilter,
});

module.exports = upload;
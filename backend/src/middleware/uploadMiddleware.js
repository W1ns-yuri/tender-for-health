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

// Фильтр типов файлов (разрешаем безопасные форматы: PDF, JPG, PNG, WEBP, Word и Excel; строгий запрет SVG/HTML/скриптов для предотвращения XSS)
const DANGEROUS_EXTENSIONS = ['.svg', '.html', '.htm', '.js', '.mjs', '.php', '.phtml', '.exe', '.sh', '.bat', '.cmd'];

const ALLOWED_MIME_TYPES = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/octet-stream',
];

const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.webp', '.doc', '.docx', '.xls', '.xlsx'];

const fileFilter = (req, file, cb) => {
    // 1. Проверка на Null-байты и опасные символы в имени
    if (file.originalname.includes('\0') || file.originalname.includes('..')) {
        return cb(new Error('Недопустимое имя файла (обнаружены спецсимволы)'), false);
    }

    const ext = path.extname(file.originalname).toLowerCase();

    // 2. Строгая блокировка исполняемых и векторных файлов (SVG несет XSS-векторы)
    if (DANGEROUS_EXTENSIONS.includes(ext)) {
        return cb(new Error('Данный тип файла заблокирован политикой безопасности платформы (SVG, HTML и исполняемые файлы запрещены)'), false);
    }

    // 3. Проверка соответствия разрешенным расширениям и типам
    if (ALLOWED_EXTENSIONS.includes(ext) && ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Недопустимый формат файла. Разрешены PDF, JPG, PNG, WEBP, Word (.doc, .docx) и Excel (.xls, .xlsx)'), false);
    }
};

const upload = multer({
    storage,
    limits: { fileSize: 25 * 1024 * 1024 }, // Лимит: 25 МБ на файл по ТЗ
    fileFilter,
});

/**
 * Проверка «по содержимому»: расширение и MIME присылает браузер, их легко подделать
 * (exe или html, переименованный в .pdf/.png). Сверяем первые байты файла с форматом.
 * Возвращает текст ошибки или null.
 */
const SIGNATURES = {
    '.pdf': [[0x25, 0x50, 0x44, 0x46]],                 // %PDF
    '.png': [[0x89, 0x50, 0x4e, 0x47]],
    '.jpg': [[0xff, 0xd8, 0xff]],
    '.jpeg': [[0xff, 0xd8, 0xff]],
    '.webp': [[0x52, 0x49, 0x46, 0x46]],                // RIFF....WEBP
    '.docx': [[0x50, 0x4b, 0x03, 0x04]],                // zip
    '.xlsx': [[0x50, 0x4b, 0x03, 0x04]],
    '.doc': [[0xd0, 0xcf, 0x11, 0xe0]],                 // старый Office
    '.xls': [[0xd0, 0xcf, 0x11, 0xe0]],
};

function fileContentError(file) {
    if (!file?.path) return 'Файл не был загружен';
    if (!file.size) return 'Файл пустой';
    const ext = path.extname(file.originalname).toLowerCase();
    const expected = SIGNATURES[ext];
    if (!expected) return 'Недопустимый формат файла';
    const head = Buffer.alloc(12);
    const fd = fs.openSync(file.path, 'r');
    try { fs.readSync(fd, head, 0, 12, 0); } finally { fs.closeSync(fd); }
    const ok = expected.some((sig) => sig.every((b, i) => head[i] === b))
        && (ext !== '.webp' || head.subarray(8, 12).toString('latin1') === 'WEBP');
    return ok ? null : `Содержимое файла не похоже на ${ext.slice(1).toUpperCase()}. Файл повреждён или это другой формат с изменённым расширением.`;
}

module.exports = upload;
module.exports.fileContentError = fileContentError;
const path = require('path');
const fs = require('fs');
const prisma = require('../lib/prisma');

const uploadDir = path.join(__dirname, '../../uploads');

// Загрузка документа и привязка его к Тендеру, Поставщику или Предложению
const uploadDocument = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Файл не был загружен' });
        }

        const { name, description, documentTypeId, tenderId, lotId, supplierId, offerId } = req.body;
        const publicPath = `/uploads/${req.file.filename}`;

        // Создаем запись базового документа с веб-доступным путем
        const document = await prisma.document.create({
            data: {
                name: name || Buffer.from(req.file.originalname, 'latin1').toString('utf8'),
                description: description || null,
                fileName: req.file.filename,
                filePath: publicPath,
                fileType: req.file.mimetype,
                fileSize: req.file.size || null,
                documentTypeId: documentTypeId || null,
            },
        });

        // Привязываем документ к соответствующим модулям (если переданы ID)
        if (tenderId) {
            await prisma.tenderFile.create({
                data: { tenderId, documentId: document.id },
            });
        }

        if (lotId) {
            await prisma.lotFile.create({
                data: { lotId, documentId: document.id },
            });
        }

        if (supplierId) {
            await prisma.supplierFile.create({
                data: { supplierId, documentId: document.id },
            });
        }

        if (offerId) {
            await prisma.offerFile.create({
                data: { offerId, documentId: document.id },
            });
        }

        res.status(201).json({ ...document, url: publicPath });
    } catch (error) {
        res.status(500).json({ error: 'Ошибка при сохранении документа', details: error.message });
    }
};

// Получение списка документов по объектам
const getDocuments = async (req, res) => {
    try {
        const { tenderId, lotId, supplierId, offerId } = req.query;

        let where = {};
        if (lotId) {
            where.lotFiles = { some: { lotId } };
        } else if (tenderId) {
            where.tenderFiles = { some: { tenderId } };
        } else if (supplierId) {
            where.supplierFiles = { some: { supplierId } };
        } else if (offerId) {
            where.offerFiles = { some: { offerId } };
        }

        const documents = await prisma.document.findMany({
            where,
            include: { documentType: true },
            orderBy: { createdAt: 'desc' },
        });

        res.json(documents);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка при получении документов', details: error.message });
    }
};

const deleteDocument = async (req, res) => {
    try {
        const { id } = req.params;

        const doc = await prisma.document.findUnique({
            where: { id },
            include: {
                supplierFiles: { include: { supplier: true } },
                offerFiles: { include: { offer: { include: { supplier: true } } } },
                tenderFiles: { include: { tender: true } },
                lotFiles: { include: { lot: true } }
            }
        });

        if (!doc) {
            return res.status(404).json({ error: 'Документ не найден' });
        }

        // Защита от IDOR: проверка прав доступа
        if (req.user.roleType !== 'ADMIN') {
            // Документы тендера и лотов может удалять только организатор/администратор
            if ((doc.tenderFiles && doc.tenderFiles.length > 0) || (doc.lotFiles && doc.lotFiles.length > 0)) {
                return res.status(403).json({ error: 'У вас нет прав на удаление документов тендера или лота' });
            }

            // Проверяем принадлежность документа поставщику
            const isOwnerOfSupplierDoc = doc.supplierFiles.some(sf => sf.supplier?.userId === req.user.id);
            const isOwnerOfOfferDoc = doc.offerFiles.some(of => of.offer?.supplier?.userId === req.user.id);

            if (!isOwnerOfSupplierDoc && !isOwnerOfOfferDoc) {
                return res.status(403).json({ error: 'Доступ запрещен. Вы не являетесь владельцем этого документа.' });
            }
        }

        const filePath = doc.filePath;

        await prisma.$transaction([
            prisma.supplierFile.deleteMany({ where: { documentId: id } }),
            prisma.tenderFile.deleteMany({ where: { documentId: id } }),
            prisma.lotFile.deleteMany({ where: { documentId: id } }),
            prisma.offerFile.deleteMany({ where: { documentId: id } }),
            prisma.document.delete({ where: { id } })
        ]);

        // Физическое удаление файла с сервера для предотвращения утечки диска (с защитой от directory traversal)
        if (filePath) {
            const diskPath = path.isAbsolute(filePath) && fs.existsSync(filePath)
                ? filePath
                : path.join(uploadDir, path.basename(filePath));
            if (fs.existsSync(diskPath)) {
                fs.unlink(diskPath, (err) => {
                    if (err) console.error('Ошибка удаления физического файла:', err.message);
                });
            }
        }

        res.json({ success: true, message: 'Документ успешно удален' });
    } catch (error) {
        res.status(500).json({ error: 'Ошибка при удалении документа', details: error.message });
    }
};

module.exports = { uploadDocument, getDocuments, deleteDocument };
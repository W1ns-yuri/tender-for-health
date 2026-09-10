const prisma = require('../lib/prisma');

// Загрузка документа и привязка его к Тендеру, Поставщику или Предложению
const uploadDocument = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Файл не был загружен' });
        }

        const { name, documentTypeId, tenderId, supplierId, offerId } = req.body;

        // Создаем запись базового документа
        const document = await prisma.document.create({
            data: {
                name: name || Buffer.from(req.file.originalname, 'latin1').toString('utf8'),
                fileName: Buffer.from(req.file.originalname, 'latin1').toString('utf8'),
                filePath: req.file.path,
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

        res.status(201).json(document);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка при сохранении документа', details: error.message });
    }
};

// Получение списка документов по объектам
const getDocuments = async (req, res) => {
    try {
        const { tenderId, supplierId, offerId } = req.query;

        let where = {};
        if (tenderId) {
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
        await prisma.supplierFile.deleteMany({ where: { documentId: id } });
        await prisma.tenderFile.deleteMany({ where: { documentId: id } });
        await prisma.offerFile.deleteMany({ where: { documentId: id } });
        await prisma.document.delete({ where: { id } });
        res.json({ success: true, message: 'Документ успешно удален' });
    } catch (error) {
        res.status(500).json({ error: 'Ошибка при удалении документа', details: error.message });
    }
};

module.exports = { uploadDocument, getDocuments, deleteDocument };
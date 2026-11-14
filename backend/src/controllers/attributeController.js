/**
 * Справочник характеристик, характеристики категорий и проверка товаров от поставщиков.
 */
const prisma = require('../lib/prisma');
const { sendError } = require('../utils/httpErrors');
const { getCategoryAttributes, PRODUCT_INCLUDE } = require('../services/productAttributes');
const { sendNotification } = require('./notificationController');

const TYPES = ['NUMBER', 'LIST', 'BOOLEAN', 'TEXT'];

function readAttributeInput(body, partial = false) {
    const data = {};
    if (!partial || body.name !== undefined) {
        const name = typeof body.name === 'string' ? body.name.trim() : '';
        if (!name) return { error: 'Укажите название характеристики' };
        if (name.length > 100) return { error: 'Название: не длиннее 100 символов' };
        data.name = name;
    }
    if (!partial || body.type !== undefined) {
        const type = body.type || 'TEXT';
        if (!TYPES.includes(type)) return { error: 'Тип характеристики: число, список, да/нет или текст' };
        data.type = type;
    }
    if (!partial || body.unit !== undefined) data.unit = body.unit ? String(body.unit).trim().slice(0, 30) || null : null;
    if (!partial || body.options !== undefined) {
        const list = Array.isArray(body.options) ? body.options : String(body.options || '').split(',');
        const options = [...new Set(list.map((o) => String(o).trim()).filter(Boolean))];
        if (options.some((o) => o.length > 100)) return { error: 'Вариант списка: не длиннее 100 символов' };
        data.options = options;
    }
    if (body.isActive !== undefined) data.isActive = Boolean(body.isActive);
    const type = data.type;
    if (type === 'LIST' && (!data.options || data.options.length < 2)) {
        return { error: 'Для списка укажите хотя бы 2 варианта через запятую' };
    }
    return { data };
}

const getAttributes = async (req, res) => {
    try {
        const attributes = await prisma.attribute.findMany({
            where: req.query.all === 'true' && req.user?.roleType === 'ADMIN' ? {} : { isActive: true },
            orderBy: { name: 'asc' },
            include: { _count: { select: { categories: true, values: true } } },
        });
        res.json(attributes);
    } catch (error) {
        sendError(res, error, 'Ошибка при получении характеристик');
    }
};

const createAttribute = async (req, res) => {
    try {
        const input = readAttributeInput(req.body);
        if (input.error) return res.status(400).json({ error: input.error });
        res.status(201).json(await prisma.attribute.create({ data: input.data }));
    } catch (error) {
        sendError(res, error, 'Ошибка при создании характеристики');
    }
};

const updateAttribute = async (req, res) => {
    try {
        const existing = await prisma.attribute.findUnique({ where: { id: req.params.id } });
        if (!existing) return res.status(404).json({ error: 'Характеристика не найдена' });
        const input = readAttributeInput({ ...req.body, type: req.body.type ?? existing.type, options: req.body.options ?? existing.options }, true);
        if (input.error) return res.status(400).json({ error: input.error });
        // Тип нельзя менять, если у товаров уже есть значения: «23» как текст и как число — разные вещи
        if (input.data.type && input.data.type !== existing.type) {
            const used = await prisma.productAttributeValue.count({ where: { attributeId: existing.id } });
            if (used) return res.status(400).json({ error: `Тип нельзя сменить: характеристика уже заполнена у ${used} товаров` });
        }
        res.json(await prisma.attribute.update({ where: { id: existing.id }, data: input.data }));
    } catch (error) {
        sendError(res, error, 'Ошибка при обновлении характеристики');
    }
};

const deleteAttribute = async (req, res) => {
    try {
        const used = await prisma.productAttributeValue.count({ where: { attributeId: req.params.id } });
        if (used) {
            // Значения у товаров не стираем: просто скрываем характеристику из новых форм
            await prisma.attribute.update({ where: { id: req.params.id }, data: { isActive: false } });
            return res.json({ archived: true, message: `Характеристика заполнена у ${used} товаров, поэтому она скрыта, а не удалена` });
        }
        await prisma.attribute.delete({ where: { id: req.params.id } });
        res.status(204).send();
    } catch (error) {
        sendError(res, error, 'Ошибка при удалении характеристики');
    }
};

/** Характеристики категории, включая унаследованные от родителей */
const getCategoryAttributesHandler = async (req, res) => {
    try {
        const category = await prisma.category.findUnique({
            where: { id: req.params.id },
            select: { id: true, name: true, photoEnabled: true, attributes: { select: { attributeId: true, isRequired: true, order: true } } },
        });
        if (!category) return res.status(404).json({ error: 'Категория не найдена' });
        res.json({
            categoryId: category.id,
            photoEnabled: category.photoEnabled,
            own: category.attributes,
            attributes: await getCategoryAttributes(category.id),
        });
    } catch (error) {
        sendError(res, error, 'Ошибка при получении характеристик категории');
    }
};

/** Задать собственный набор характеристик категории: [{ attributeId, isRequired }] */
const setCategoryAttributes = async (req, res) => {
    try {
        const list = Array.isArray(req.body?.attributes) ? req.body.attributes : null;
        if (!list) return res.status(400).json({ error: 'Передайте список характеристик' });
        const ids = list.map((a) => a?.attributeId).filter(Boolean);
        if (new Set(ids).size !== ids.length) return res.status(400).json({ error: 'Характеристика указана дважды' });
        const found = await prisma.attribute.count({ where: { id: { in: ids } } });
        if (found !== ids.length) return res.status(400).json({ error: 'Указана несуществующая характеристика' });

        await prisma.$transaction([
            prisma.categoryAttribute.deleteMany({ where: { categoryId: req.params.id } }),
            prisma.categoryAttribute.createMany({
                data: list.map((a, i) => ({ categoryId: req.params.id, attributeId: a.attributeId, isRequired: Boolean(a.isRequired), order: i })),
            }),
        ]);
        res.json({ attributes: await getCategoryAttributes(req.params.id) });
    } catch (error) {
        sendError(res, error, 'Ошибка при сохранении характеристик категории');
    }
};

/** Решение по товару, который добавил поставщик */
const moderateProduct = (status) => async (req, res) => {
    try {
        const product = await prisma.generalProduct.findUnique({ where: { id: req.params.id } });
        if (!product) return res.status(404).json({ error: 'Позиция не найдена' });
        const note = req.body?.note ? String(req.body.note).trim().slice(0, 1000) : null;
        if (status === 'REJECTED' && !note) return res.status(400).json({ error: 'Укажите причину отказа: поставщик её увидит' });

        const updated = await prisma.generalProduct.update({
            where: { id: product.id },
            data: { moderationStatus: status, moderationNote: note },
            include: PRODUCT_INCLUDE,
        });
        if (product.createdById && product.createdById !== req.user.id) {
            sendNotification({
                userId: product.createdById,
                title: status === 'APPROVED' ? 'Товар добавлен в справочник' : 'Товар не принят в справочник',
                message: status === 'APPROVED'
                    ? `«${product.name}» проверен и теперь виден всем участникам.`
                    : `«${product.name}» не принят. Причина: ${note}`,
                type: status === 'APPROVED' ? 'success' : 'warning',
            }).catch((e) => console.error('notify moderation:', e));
        }
        res.json(updated);
    } catch (error) {
        sendError(res, error, 'Ошибка при проверке позиции');
    }
};

module.exports = {
    getAttributes, createAttribute, updateAttribute, deleteAttribute,
    getCategoryAttributesHandler, setCategoryAttributes,
    approveProduct: moderateProduct('APPROVED'), rejectProduct: moderateProduct('REJECTED'),
};

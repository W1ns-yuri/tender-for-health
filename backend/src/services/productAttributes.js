/**
 * Характеристики товаров: какие поля у категории, проверка значений, кто какие товары видит.
 */
const prisma = require('../lib/prisma');

const MAX_DEPTH = 10; // защита от зацикленного дерева категорий

/**
 * Характеристики категории вместе с унаследованными от родителей.
 * Сначала характеристики корня, потом подкатегорий. Если подкатегория повторяет
 * характеристику родителя, берётся её флаг «обязательно».
 */
async function getCategoryAttributes(categoryId, db = prisma) {
    if (!categoryId) return [];
    const chain = [];
    let currentId = categoryId;
    const seen = new Set();
    while (currentId && !seen.has(currentId) && chain.length < MAX_DEPTH) {
        seen.add(currentId);
        const cat = await db.category.findUnique({
            where: { id: currentId },
            select: {
                id: true, name: true, parentId: true, photoEnabled: true,
                attributes: { include: { attribute: true }, orderBy: { order: 'asc' } },
            },
        });
        if (!cat) break;
        chain.unshift(cat);
        currentId = cat.parentId;
    }
    const byAttr = new Map();
    for (const cat of chain) {
        for (const ca of cat.attributes) {
            if (!ca.attribute.isActive) continue;
            byAttr.set(ca.attributeId, {
                attributeId: ca.attributeId,
                name: ca.attribute.name,
                type: ca.attribute.type,
                unit: ca.attribute.unit,
                options: ca.attribute.options,
                isRequired: ca.isRequired,
                inheritedFrom: cat.id === categoryId ? null : cat.name,
            });
        }
    }
    return [...byAttr.values()];
}

/** Нужна ли товарам категории фотография (смотрим саму категорию) */
async function isPhotoEnabled(categoryId) {
    if (!categoryId) return true;
    const cat = await prisma.category.findUnique({ where: { id: categoryId }, select: { photoEnabled: true } });
    return cat ? cat.photoEnabled : true;
}

const BOOLEAN_TRUE = ['true', 'да', 'yes', 'hawa', '1'];
const BOOLEAN_FALSE = ['false', 'нет', 'no', 'ýok', 'yok', '0'];

/**
 * Проверка и нормализация значений характеристик товара.
 * input: [{ attributeId, value }] или [{ customName, value }] (своя характеристика товара).
 * Возвращает { rows } для createMany или { error }.
 */
async function normalizeAttributeValues(categoryId, input) {
    if (input === undefined || input === null) input = [];
    if (!Array.isArray(input)) return { error: 'Характеристики должны быть списком' };
    if (input.length > 100) return { error: 'Слишком много характеристик у одного товара' };

    const catAttrs = await getCategoryAttributes(categoryId);
    const allowed = new Map(catAttrs.map((a) => [a.attributeId, a]));
    const rows = [];
    const usedAttrIds = new Set();

    for (let i = 0; i < input.length; i++) {
        const item = input[i] || {};
        const raw = item.value === undefined || item.value === null ? '' : String(item.value).trim();
        if (!raw) continue; // пустые поля просто не сохраняем
        if (raw.length > 500) return { error: `Характеристика ${i + 1}: слишком длинное значение` };

        if (item.attributeId) {
            const attr = allowed.get(item.attributeId);
            if (!attr) return { error: 'Указана характеристика, которой нет у этой категории' };
            if (usedAttrIds.has(item.attributeId)) return { error: `Характеристика «${attr.name}» указана дважды` };
            usedAttrIds.add(item.attributeId);

            let value = raw;
            let numberValue = null;
            if (attr.type === 'NUMBER') {
                numberValue = Number(raw.replace(',', '.'));
                if (!Number.isFinite(numberValue)) return { error: `«${attr.name}»: нужно число` };
                value = String(numberValue);
            } else if (attr.type === 'LIST') {
                const match = attr.options.find((o) => o.toLowerCase() === raw.toLowerCase());
                if (!match) return { error: `«${attr.name}»: выберите один из вариантов (${attr.options.join(', ')})` };
                value = match;
            } else if (attr.type === 'BOOLEAN') {
                const low = raw.toLowerCase();
                if (BOOLEAN_TRUE.includes(low)) value = 'true';
                else if (BOOLEAN_FALSE.includes(low)) value = 'false';
                else return { error: `«${attr.name}»: ответ «да» или «нет»` };
            }
            rows.push({ attributeId: attr.attributeId, value, numberValue, order: rows.length });
        } else {
            const customName = item.customName ? String(item.customName).trim() : '';
            if (!customName) return { error: `Характеристика ${i + 1}: укажите название` };
            if (customName.length > 100) return { error: `Характеристика ${i + 1}: название не длиннее 100 символов` };
            rows.push({ customName, value: raw, numberValue: null, order: rows.length });
        }
    }

    const missing = catAttrs.filter((a) => a.isRequired && !usedAttrIds.has(a.attributeId));
    if (missing.length) {
        return { error: `Заполните обязательные характеристики: ${missing.map((a) => a.name).join(', ')}` };
    }
    return { rows };
}

/**
 * Кто какие товары справочника видит:
 * админ — все; поставщик — одобренные и свои на проверке; гость — только одобренные.
 */
function productVisibilityWhere(user) {
    if (user?.roleType === 'ADMIN') return {};
    if (user?.id) return { OR: [{ moderationStatus: 'APPROVED' }, { createdById: user.id }] };
    return { moderationStatus: 'APPROVED' };
}

/** Что отдаём вместе с товаром */
const PRODUCT_INCLUDE = {
    category: true,
    brand: true,
    createdBy: { select: { id: true, firstName: true, lastName: true, roleType: true } },
    attributeValues: { include: { attribute: true }, orderBy: { order: 'asc' } },
};

/** Ссылка на сайт производителя: только http(s), не длиннее 1000 символов */
function officialUrlError(url) {
    if (url === undefined || url === null || url === '') return null;
    if (typeof url !== 'string' || url.length > 1000) return 'Слишком длинная ссылка';
    try {
        const u = new URL(url.trim());
        if (!['http:', 'https:'].includes(u.protocol)) return 'Ссылка должна начинаться с http:// или https://';
    } catch {
        return 'Некорректная ссылка на сайт производителя';
    }
    return null;
}

/** Фото товара: файл должен быть загружен этим же пользователем (или админом) и быть картинкой */
async function imageFileError(user, fileName) {
    if (!fileName) return null;
    const doc = await prisma.document.findFirst({ where: { fileName: String(fileName) }, select: { uploadedById: true, fileType: true } });
    if (!doc) return 'Фото не найдено: загрузите его ещё раз';
    if (user.roleType !== 'ADMIN' && doc.uploadedById !== user.id) return 'Нельзя использовать чужой файл как фото товара';
    if (!/^image\//.test(doc.fileType || '')) return 'Фото товара должно быть картинкой (JPG, PNG, WEBP)';
    return null;
}

module.exports = {
    getCategoryAttributes, isPhotoEnabled, normalizeAttributeValues, productVisibilityWhere,
    PRODUCT_INCLUDE, officialUrlError, imageFileError,
};

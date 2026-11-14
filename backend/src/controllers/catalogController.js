const prisma = require('../lib/prisma');
const { sendError } = require('../utils/httpErrors');
const {
    normalizeAttributeValues, productVisibilityWhere, PRODUCT_INCLUDE, officialUrlError, imageFileError, isPhotoEnabled,
} = require('../services/productAttributes');
const { notifyAdmins } = require('./notificationController');

// =============================
// 1. Категории (Categories)
// =============================
const getCategories = async (req, res) => {
    try {
        const { type } = req.query;
        const where = {};
        if (type && type !== 'ALL') {
            where.type = type;
        }
        const categories = await prisma.category.findMany({
            where,
            orderBy: { name: 'asc' },
            include: { _count: { select: { attributes: true, children: true } } },
        });
        res.json(categories);
    } catch (error) {
        sendError(res, error, 'Ошибка при получении категорий');
    }
};

const createCategory = async (req, res) => {
    try {
        const { name, code, type, description, parentId, photoEnabled } = req.body;
        if (!name || !String(name).trim()) return res.status(400).json({ error: 'Укажите название категории' });
        const cleanCode = (code && typeof code === 'string' && code.trim()) ? code.trim() : null;
        const category = await prisma.category.create({
            data: { 
                name: (name || '').trim(), 
                code: cleanCode, 
                type: type || 'GOODS',
                description: description || null,
                parentId: parentId || null,
                photoEnabled: photoEnabled === undefined ? true : Boolean(photoEnabled),
            },
        });
        res.status(201).json(category);
    } catch (error) {
        console.error('createCategory error:', error);
        sendError(res, error, 'Ошибка при создании категории');
    }
};

// =============================
// 2. Общие товары / Услуги / Работы (GeneralProduct)
// =============================
const getGeneralProducts = async (req, res) => {
    try {
        const { itemType, type } = req.query;
        const filterType = itemType || (type && ['GOODS', 'WORKS', 'SERVICES'].includes(type) ? type : undefined);
        const where = { ...productVisibilityWhere(req.user) };
        if (filterType && filterType !== 'ALL') {
            where.itemType = filterType;
        }
        if (req.query.moderationStatus && req.user?.roleType === 'ADMIN') {
            where.moderationStatus = req.query.moderationStatus;
        }

        const products = await prisma.generalProduct.findMany({
            where,
            include: PRODUCT_INCLUDE,
            orderBy: { name: 'asc' },
        });
        res.json(products);
    } catch (error) {
        sendError(res, error, 'Ошибка при получении справочника позиций');
    }
};

/**
 * Общие поля товара из тела запроса (создание и правка). Возвращает { data, attributes } или { error }.
 * attributes === undefined значит «характеристики не трогать».
 */
async function readProductInput(req, existing = null) {
    const { name, tradeName, code, categoryId, type, itemType, description, brandId, officialUrl, imageFileName, attributes } = req.body;
    const clean = (v) => (v && typeof v === 'string' && v.trim() ? v.trim() : null);
    const data = {};
    if (!existing || name !== undefined) {
        if (!name || typeof name !== 'string' || !name.trim()) return { error: 'Укажите название позиции' };
        if (name.trim().length > 500) return { error: 'Название позиции: не длиннее 500 символов' };
        data.name = name.trim();
    }
    if (!existing || tradeName !== undefined) data.tradeName = clean(tradeName);
    if (!existing || code !== undefined) data.code = clean(code);
    if (!existing || categoryId !== undefined) data.categoryId = clean(categoryId);
    if (!existing || itemType !== undefined) data.itemType = itemType || 'GOODS';
    if (!existing || type !== undefined || itemType !== undefined) {
        data.type = (type === 'HYZMAT' || itemType === 'WORKS' || itemType === 'SERVICES') ? 'HYZMAT' : 'HARYT';
    }
    if (!existing || description !== undefined) data.description = description ? String(description).slice(0, 5000) : null;
    if (!existing || brandId !== undefined) data.brandId = clean(brandId);
    if (!existing || officialUrl !== undefined) {
        const urlErr = officialUrlError(officialUrl);
        if (urlErr) return { error: urlErr };
        data.officialUrl = clean(officialUrl);
    }
    if (!existing || imageFileName !== undefined) {
        const imgErr = await imageFileError(req.user, imageFileName);
        if (imgErr) return { error: imgErr };
        data.imageFileName = clean(imageFileName);
    }

    const finalCategoryId = data.categoryId !== undefined ? data.categoryId : existing?.categoryId;
    if (data.imageFileName && !(await isPhotoEnabled(finalCategoryId))) data.imageFileName = null;

    // Характеристики проверяем, если их прислали или сменилась категория (у новой могут быть обязательные)
    let rows;
    if (attributes !== undefined || !existing || (data.categoryId !== undefined && data.categoryId !== existing.categoryId)) {
        const result = await normalizeAttributeValues(finalCategoryId, attributes);
        if (result.error) return { error: result.error };
        rows = result.rows;
    }
    return { data, attributes: rows };
}

const createGeneralProduct = async (req, res) => {
    try {
        const input = await readProductInput(req);
        if (input.error) return res.status(400).json({ error: input.error });

        // Товар от поставщика попадает в справочник «на проверку» и виден только ему и админу
        const isSupplier = req.user.roleType !== 'ADMIN';
        if (isSupplier) {
            const verified = await prisma.supplier.findFirst({ where: { userId: req.user.id, verificationStatus: 'VERIFIED' }, select: { id: true } });
            if (!verified) return res.status(403).json({ error: 'Добавлять товары в справочник могут только проверенные поставщики' });
        }
        const product = await prisma.generalProduct.create({
            data: {
                ...input.data,
                createdById: req.user.id,
                moderationStatus: isSupplier ? 'PENDING' : 'APPROVED',
                attributeValues: { create: input.attributes },
            },
            include: PRODUCT_INCLUDE,
        });

        if (isSupplier) {
            notifyAdmins({
                title: 'Новый товар на проверку',
                message: `Поставщик добавил в справочник «${product.name}». Проверьте и одобрите, чтобы товар стал виден всем.`,
                type: 'warning',
                link: '/haryt?moderation=1',
            }).catch((e) => console.error('notify pending product:', e));
        }
        res.status(201).json(product);
    } catch (error) {
        sendError(res, error, 'Ошибка при добавлении записи в справочник');
    }
};

// =============================
// 3. Единицы измерения (Unit)
// =============================
const getUnits = async (req, res) => {
    try {
        const units = await prisma.unit.findMany({
            orderBy: { order: 'asc' },
        });
        res.json(units);
    } catch (error) {
        sendError(res, error, 'Ошибка при получении единиц измерения');
    }
};

const createUnit = async (req, res) => {
    try {
        const { name, shortName, order } = req.body;
        const unit = await prisma.unit.create({
            data: { name, shortName, order: order || 0 },
        });
        res.status(201).json(unit);
    } catch (error) {
        sendError(res, error, 'Ошибка при создании единицы измерения');
    }
};

// =============================
// 4. Валюты и Курсы (Currency & ExchangeRate)
// =============================
const getCurrencies = async (req, res) => {
    try {
        const currencies = await prisma.currency.findMany({
            orderBy: { order: 'asc' },
        });
        res.json(currencies);
    } catch (error) {
        sendError(res, error, 'Ошибка при получении валют');
    }
};

const createCurrency = async (req, res) => {
    try {
        const { name, code, flag, symbol, order } = req.body;
        const currency = await prisma.currency.create({
            data: { name, code, flag, symbol, order: order || 0 },
        });
        res.status(201).json(currency);
    } catch (error) {
        sendError(res, error, 'Ошибка при добавлении валюты');
    }
};

const setExchangeRate = async (req, res) => {
    try {
        const { fromCurrencyId, toCurrencyId, value } = req.body;
        
        // Используем составной уникальный ключ для upsert
        const rate = await prisma.exchangeRate.upsert({
            where: {
                fromCurrencyId_toCurrencyId: {
                    fromCurrencyId,
                    toCurrencyId,
                },
            },
            create: {
                fromCurrencyId,
                toCurrencyId,
                value: parseFloat(value),
            },
            update: {
                value: parseFloat(value),
            },
        });
        res.json(rate);
    } catch (error) {
        sendError(res, error, 'Ошибка при обновлении курса валют');
    }
};

// =============================
// 5. Страны (Country)
// =============================
const getCountries = async (req, res) => {
    try {
        const countries = await prisma.country.findMany({
            orderBy: { name: 'asc' },
        });
        res.json(countries);
    } catch (error) {
        sendError(res, error, 'Ошибка при получении списка стран');
    }
};

const createCountry = async (req, res) => {
    try {
        const { name, alpha2, alpha3, order } = req.body;
        const country = await prisma.country.create({
            data: { name, alpha2, alpha3, order: order || 0 },
        });
        res.status(201).json(country);
    } catch (error) {
        sendError(res, error, 'Ошибка при создании страны');
    }
};

// =============================
// 6. Условия поставки (DeliveryTerm / INCOTERMS)
// =============================
const getDeliveryTerms = async (req, res) => {
    try {
        const terms = await prisma.deliveryTerm.findMany({
            orderBy: { name: 'asc' },
        });
        res.json(terms);
    } catch (error) {
        sendError(res, error, 'Ошибка при получении условий поставки');
    }
};

const createDeliveryTerm = async (req, res) => {
    try {
        const { name, shortName } = req.body;
        const term = await prisma.deliveryTerm.create({
            data: { name, shortName },
        });
        res.status(201).json(term);
    } catch (error) {
        sendError(res, error, 'Ошибка при создании условия поставки');
    }
};

// =============================
// 7. Производители (Manufacturer)
// =============================
const getManufacturers = async (req, res) => {
    try {
        const manufacturers = await prisma.manufacturer.findMany({
            include: { country: true, brand: true },
            orderBy: { name: 'asc' },
        });
        res.json(manufacturers);
    } catch (error) {
        sendError(res, error, 'Ошибка при получении производителей');
    }
};

const createManufacturer = async (req, res) => {
    try {
        const { name, code, countryId } = req.body;
        const cleanCode = (code && typeof code === 'string' && code.trim()) ? code.trim() : null;
        const cleanCountryId = (countryId && typeof countryId === 'string' && countryId.trim()) ? countryId.trim() : null;
        const manufacturer = await prisma.manufacturer.create({
            data: { 
                name: (name || '').trim(), 
                code: cleanCode, 
                countryId: cleanCountryId 
            },
        });
        res.status(201).json(manufacturer);
    } catch (error) {
        console.error('createManufacturer error:', error);
        sendError(res, error, 'Ошибка при создании производителя');
    }
};

const updateCategory = async (req, res) => {
    try {
        const { name, code, type, description, isActive } = req.body;
        const data = {};
        if (name !== undefined) data.name = (name || '').trim();
        if (code !== undefined) data.code = (code && typeof code === 'string' && code.trim()) ? code.trim() : null;
        if (type !== undefined) data.type = type;
        if (description !== undefined) data.description = description || null;
        if (isActive !== undefined) data.isActive = Boolean(isActive);
        if (req.body.photoEnabled !== undefined) data.photoEnabled = Boolean(req.body.photoEnabled);
        if (req.body.parentId !== undefined) {
            const parentId = req.body.parentId || null;
            // Нельзя сделать категорию подкатегорией самой себя или своего потомка
            let cursor = parentId;
            for (let i = 0; cursor && i < 20; i++) {
                if (cursor === req.params.id) {
                    return res.status(400).json({ error: 'Категория не может быть вложена сама в себя' });
                }
                cursor = (await prisma.category.findUnique({ where: { id: cursor }, select: { parentId: true } }))?.parentId;
            }
            data.parentId = parentId;
        }

        const category = await prisma.category.update({ where: { id: req.params.id }, data });
        res.json(category);
    } catch (error) { 
        console.error('updateCategory error:', error);
        sendError(res, error, 'Ошибка обновления категории'); 
    }
};
const deleteCategory = async (req, res) => {
    try {
        await prisma.category.delete({ where: { id: req.params.id } });
        res.status(204).send();
    } catch (error) { 
        console.error('deleteCategory error:', error);
        sendError(res, error, 'Ошибка удаления категории'); 
    }
};

const updateGeneralProduct = async (req, res) => {
    try {
        const existing = await prisma.generalProduct.findUnique({ where: { id: req.params.id } });
        if (!existing) return res.status(404).json({ error: 'Позиция не найдена' });

        const input = await readProductInput(req, existing);
        if (input.error) return res.status(400).json({ error: input.error });
        if (req.body.isActive !== undefined) input.data.isActive = Boolean(req.body.isActive);

        const product = await prisma.$transaction(async (tx) => {
            if (input.attributes !== undefined) {
                await tx.productAttributeValue.deleteMany({ where: { productId: existing.id } });
                if (input.attributes.length) {
                    await tx.productAttributeValue.createMany({ data: input.attributes.map((r) => ({ ...r, productId: existing.id })) });
                }
            }
            return tx.generalProduct.update({ where: { id: existing.id }, data: input.data, include: PRODUCT_INCLUDE });
        });
        res.json(product);
    } catch (error) {
        sendError(res, error, 'Ошибка обновления позиции');
    }
};
const deleteGeneralProduct = async (req, res) => {
    try {
        await prisma.generalProduct.delete({ where: { id: req.params.id } });
        res.status(204).send();
    } catch (error) { 
        console.error('deleteGeneralProduct error:', error);
        sendError(res, error, 'Ошибка удаления позиции'); 
    }
};

const updateUnit = async (req, res) => {
    try {
        const { name, shortName, order, isActive } = req.body;
        const data = {};
        if (name !== undefined) data.name = (name || '').trim();
        if (shortName !== undefined) data.shortName = (shortName || '').trim();
        if (order !== undefined) data.order = parseInt(order, 10) || 0;
        if (isActive !== undefined) data.isActive = Boolean(isActive);

        const unit = await prisma.unit.update({ where: { id: req.params.id }, data });
        res.json(unit);
    } catch (error) { 
        console.error('updateUnit error:', error);
        sendError(res, error, 'Ошибка обновления единицы измерения'); 
    }
};
const deleteUnit = async (req, res) => {
    try {
        await prisma.unit.delete({ where: { id: req.params.id } });
        res.status(204).send();
    } catch (error) { 
        console.error('deleteUnit error:', error);
        sendError(res, error, 'Ошибка удаления единицы измерения'); 
    }
};

const updateCurrency = async (req, res) => {
    try {
        const { name, code, flag, symbol, order, isActive } = req.body;
        const data = {};
        if (name !== undefined) data.name = (name || '').trim();
        if (code !== undefined) data.code = (code || '').trim().toUpperCase();
        if (flag !== undefined) data.flag = flag || null;
        if (symbol !== undefined) data.symbol = symbol || null;
        if (order !== undefined) data.order = parseInt(order, 10) || 0;
        if (isActive !== undefined) data.isActive = Boolean(isActive);

        const currency = await prisma.currency.update({ where: { id: req.params.id }, data });
        res.json(currency);
    } catch (error) { 
        console.error('updateCurrency error:', error);
        sendError(res, error, 'Ошибка обновления валюты'); 
    }
};
const deleteCurrency = async (req, res) => {
    try {
        await prisma.currency.delete({ where: { id: req.params.id } });
        res.status(204).send();
    } catch (error) { 
        console.error('deleteCurrency error:', error);
        sendError(res, error, 'Ошибка удаления валюты'); 
    }
};

const updateCountry = async (req, res) => {
    try {
        const { name, alpha2, alpha3, order, isActive } = req.body;
        const data = {};
        if (name !== undefined) data.name = (name || '').trim();
        if (alpha2 !== undefined) data.alpha2 = (alpha2 || '').trim().toUpperCase();
        if (alpha3 !== undefined) data.alpha3 = (alpha3 || '').trim().toUpperCase();
        if (order !== undefined) data.order = parseInt(order, 10) || 0;
        if (isActive !== undefined) data.isActive = Boolean(isActive);

        const country = await prisma.country.update({ where: { id: req.params.id }, data });
        res.json(country);
    } catch (error) { 
        console.error('updateCountry error:', error);
        sendError(res, error, 'Ошибка обновления страны'); 
    }
};
const deleteCountry = async (req, res) => {
    try {
        await prisma.country.delete({ where: { id: req.params.id } });
        res.status(204).send();
    } catch (error) { 
        console.error('deleteCountry error:', error);
        sendError(res, error, 'Ошибка удаления страны'); 
    }
};

const updateDeliveryTerm = async (req, res) => {
    try {
        const { name, shortName, isActive } = req.body;
        const data = {};
        if (name !== undefined) data.name = (name || '').trim();
        if (shortName !== undefined) data.shortName = (shortName || '').trim().toUpperCase();
        if (isActive !== undefined) data.isActive = Boolean(isActive);

        const term = await prisma.deliveryTerm.update({ where: { id: req.params.id }, data });
        res.json(term);
    } catch (error) { 
        console.error('updateDeliveryTerm error:', error);
        sendError(res, error, 'Ошибка обновления условия поставки'); 
    }
};
const deleteDeliveryTerm = async (req, res) => {
    try {
        await prisma.deliveryTerm.delete({ where: { id: req.params.id } });
        res.status(204).send();
    } catch (error) { 
        console.error('deleteDeliveryTerm error:', error);
        sendError(res, error, 'Ошибка удаления условия поставки'); 
    }
};

const updateManufacturer = async (req, res) => {
    try {
        const { name, code, countryId, isActive } = req.body;
        const data = {};
        if (name !== undefined) data.name = (name || '').trim();
        if (code !== undefined) data.code = (code && typeof code === 'string' && code.trim()) ? code.trim() : null;
        if (countryId !== undefined) data.countryId = (countryId && typeof countryId === 'string' && countryId.trim()) ? countryId.trim() : null;
        if (isActive !== undefined) data.isActive = Boolean(isActive);

        const m = await prisma.manufacturer.update({ where: { id: req.params.id }, data });
        res.json(m);
    } catch (error) { 
        console.error('updateManufacturer error:', error);
        sendError(res, error, 'Ошибка обновления производителя'); 
    }
};
const deleteManufacturer = async (req, res) => {
    try {
        await prisma.manufacturer.delete({ where: { id: req.params.id } });
        res.status(204).send();
    } catch (error) { 
        console.error('deleteManufacturer error:', error);
        sendError(res, error, 'Ошибка удаления производителя'); 
    }
};


// =============================
// Заказчики (Clients)
// =============================
const getClients = async (req, res) => {
    try {
        const clients = await prisma.client.findMany({
            orderBy: { name: 'asc' },
        });
        res.json(clients);
    } catch (error) {
        sendError(res, error, 'Ошибка при получении заказчиков');
    }
};

const createClient = async (req, res) => {
    try {
        const { name } = req.body;
        const client = await prisma.client.create({
            data: { name },
        });
        res.status(201).json(client);
    } catch (error) {
        sendError(res, error, 'Ошибка при создании заказчика');
    }
};

const updateClient = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, isActive } = req.body;
        const client = await prisma.client.update({
            where: { id },
            data: { name, isActive },
        });
        res.json(client);
    } catch (error) {
        sendError(res, error, 'Ошибка при обновлении заказчика');
    }
};

const deleteClient = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.client.delete({
            where: { id },
        });
        res.json({ message: 'Заказчик удален' });
    } catch (error) {
        sendError(res, error, 'Ошибка при удалении заказчика');
    }
};

// =============================
// МНН (Международные непатентованные наименования)
// =============================
const getUniqueMNNs = async (req, res) => {
    try {
        const products = await prisma.generalProduct.findMany({
            where: { itemType: 'GOODS', ...productVisibilityWhere(req.user) },
            include: { category: true },
            orderBy: { name: 'asc' },
        });

        const mnnMap = new Map();
        for (const p of products) {
            const trimmedName = (p.name || '').trim();
            if (!trimmedName) continue;
            const key = trimmedName.toLowerCase();
            if (!mnnMap.has(key)) {
                mnnMap.set(key, {
                    id: p.id,
                    name: trimmedName,
                    count: 0,
                    tradeNames: [],
                    codes: [],
                    categories: [],
                    products: []
                });
            }
            const entry = mnnMap.get(key);
            entry.count += 1;
            if (p.tradeName && !entry.tradeNames.includes(p.tradeName.trim())) {
                entry.tradeNames.push(p.tradeName.trim());
            }
            if (p.code && !entry.codes.includes(p.code.trim())) {
                entry.codes.push(p.code.trim());
            }
            if (p.category && !entry.categories.some(c => c.id === p.category.id)) {
                entry.categories.push(p.category);
            }
            entry.products.push({
                id: p.id,
                tradeName: p.tradeName,
                code: p.code,
                categoryId: p.categoryId,
                categoryName: p.category?.name,
                description: p.description,
                isActive: p.isActive
            });
        }

        const mnnList = Array.from(mnnMap.values()).sort((a, b) => a.name.localeCompare(b.name));
        res.json(mnnList);
    } catch (error) {
        sendError(res, error, 'Ошибка при получении списка МНН');
    }
};

// =============================
// Бренды (Brands)
// =============================
const getBrands = async (req, res) => {
    try {
        const brands = await prisma.brand.findMany({
            include: { manufacturers: true },
            orderBy: { name: 'asc' },
        });
        res.json(brands);
    } catch (error) {
        sendError(res, error, 'Ошибка при получении брендов');
    }
};

const createBrand = async (req, res) => {
    try {
        const { name, code } = req.body;
        const cleanCode = (code && typeof code === 'string' && code.trim()) ? code.trim() : null;
        const brand = await prisma.brand.create({
            data: { 
                name: (name || '').trim(), 
                code: cleanCode 
            },
        });
        res.status(201).json(brand);
    } catch (error) {
        console.error('createBrand error:', error);
        sendError(res, error, 'Ошибка при создании бренда');
    }
};

const updateBrand = async (req, res) => {
    try {
        const { name, code, isActive } = req.body;
        const data = {};
        if (name !== undefined) data.name = (name || '').trim();
        if (code !== undefined) data.code = (code && typeof code === 'string' && code.trim()) ? code.trim() : null;
        if (isActive !== undefined) data.isActive = Boolean(isActive);

        const brand = await prisma.brand.update({
            where: { id: req.params.id },
            data,
        });
        res.json(brand);
    } catch (error) {
        console.error('updateBrand error:', error);
        sendError(res, error, 'Ошибка при обновлении бренда');
    }
};

const deleteBrand = async (req, res) => {
    try {
        await prisma.brand.delete({ where: { id: req.params.id } });
        res.status(204).send();
    } catch (error) {
        console.error('deleteBrand error:', error);
        sendError(res, error, 'Ошибка при удалении бренда');
    }
};

// =============================
// Вариации и формы (Variations)
// =============================
const getVariationGroups = async (req, res) => {
    try {
        const groups = await prisma.variationGroup.findMany({
            include: { values: true },
            orderBy: { name: 'asc' },
        });
        res.json(groups);
    } catch (error) {
        sendError(res, error, 'Ошибка при получении вариаций');
    }
};

const createVariationGroup = async (req, res) => {
    try {
        const { name, values } = req.body;
        const group = await prisma.variationGroup.create({
            data: {
                name,
                values: values && Array.isArray(values) && values.length > 0 ? {
                    create: values.map(v => typeof v === 'string' ? { value: v } : { value: v.value })
                } : undefined
            },
            include: { values: true }
        });
        res.status(201).json(group);
    } catch (error) {
        sendError(res, error, 'Ошибка при создании группы вариаций');
    }
};

const updateVariationGroup = async (req, res) => {
    try {
        const { name } = req.body;
        const group = await prisma.variationGroup.update({
            where: { id: req.params.id },
            data: { name },
            include: { values: true }
        });
        res.json(group);
    } catch (error) {
        sendError(res, error, 'Ошибка при обновлении группы вариаций');
    }
};

const deleteVariationGroup = async (req, res) => {
    try {
        await prisma.variationGroup.delete({ where: { id: req.params.id } });
        res.status(204).send();
    } catch (error) {
        sendError(res, error, 'Ошибка при удалении группы вариаций');
    }
};

const addVariationValue = async (req, res) => {
    try {
        const { groupId } = req.params;
        const { value } = req.body;
        const val = await prisma.variationValue.create({
            data: { groupId, value }
        });
        res.status(201).json(val);
    } catch (error) {
        sendError(res, error, 'Ошибка добавления значения вариации');
    }
};

const deleteVariationValue = async (req, res) => {
    try {
        await prisma.variationValue.delete({ where: { id: req.params.id } });
        res.status(204).send();
    } catch (error) {
        sendError(res, error, 'Ошибка удаления значения вариации');
    }
};

module.exports = {
    getClients, createClient, updateClient, deleteClient,
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    getGeneralProducts,
    createGeneralProduct,
    updateGeneralProduct,
    deleteGeneralProduct,
    getUniqueMNNs,
    getUnits,
    createUnit,
    updateUnit,
    deleteUnit,
    getCurrencies,
    createCurrency,
    updateCurrency,
    deleteCurrency,
    setExchangeRate,
    getCountries,
    createCountry,
    updateCountry,
    deleteCountry,
    getDeliveryTerms,
    createDeliveryTerm,
    updateDeliveryTerm,
    deleteDeliveryTerm,
    getManufacturers,
    createManufacturer,
    updateManufacturer,
    deleteManufacturer,
    getBrands,
    createBrand,
    updateBrand,
    deleteBrand,
    getVariationGroups,
    createVariationGroup,
    updateVariationGroup,
    deleteVariationGroup,
    addVariationValue,
    deleteVariationValue
};

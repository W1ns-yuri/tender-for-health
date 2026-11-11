const prisma = require('../lib/prisma');
const { sendError } = require('../utils/httpErrors');

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
        });
        res.json(categories);
    } catch (error) {
        sendError(res, error, 'Ошибка при получении категорий');
    }
};

const createCategory = async (req, res) => {
    try {
        const { name, code, type, description } = req.body;
        const cleanCode = (code && typeof code === 'string' && code.trim()) ? code.trim() : null;
        const category = await prisma.category.create({
            data: { 
                name: (name || '').trim(), 
                code: cleanCode, 
                type: type || 'GOODS',
                description: description || null
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
        const where = {};
        if (filterType && filterType !== 'ALL') {
            where.itemType = filterType;
        }

        const products = await prisma.generalProduct.findMany({
            where,
            include: { category: true },
            orderBy: { name: 'asc' },
        });
        res.json(products);
    } catch (error) {
        sendError(res, error, 'Ошибка при получении справочника позиций');
    }
};

const createGeneralProduct = async (req, res) => {
    try {
        const { name, tradeName, code, categoryId, type, itemType, description } = req.body;
        const cleanCode = (code && typeof code === 'string' && code.trim()) ? code.trim() : null;
        const cleanCatId = (categoryId && typeof categoryId === 'string' && categoryId.trim()) ? categoryId.trim() : null;
        const cleanTrade = (tradeName && typeof tradeName === 'string' && tradeName.trim()) ? tradeName.trim() : null;

        if (!name || typeof name !== 'string' || !name.trim()) {
            return res.status(400).json({ error: 'Укажите название позиции' });
        }

        const product = await prisma.generalProduct.create({
            data: {
                name: (name || '').trim(),
                tradeName: cleanTrade,
                code: cleanCode,
                categoryId: cleanCatId,
                type: (type === 'HYZMAT' || itemType === 'WORKS' || itemType === 'SERVICES') ? 'HYZMAT' : 'HARYT',
                itemType: itemType || 'GOODS',
                description: description || null,
            },
            include: { category: true }
        });
        res.status(201).json(product);
    } catch (error) {
        console.error('createGeneralProduct error:', error);
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
        const { name, tradeName, code, categoryId, type, itemType, description, isActive } = req.body;
        const data = {};
        if (name !== undefined) data.name = (name || '').trim();
        if (tradeName !== undefined) data.tradeName = (tradeName && typeof tradeName === 'string' && tradeName.trim()) ? tradeName.trim() : null;
        if (code !== undefined) data.code = (code && typeof code === 'string' && code.trim()) ? code.trim() : null;
        if (categoryId !== undefined) data.categoryId = (categoryId && typeof categoryId === 'string' && categoryId.trim()) ? categoryId.trim() : null;
        if (type !== undefined) data.type = (type === 'HYZMAT' || itemType === 'WORKS' || itemType === 'SERVICES') ? 'HYZMAT' : 'HARYT';
        if (itemType !== undefined) data.itemType = itemType;
        if (description !== undefined) data.description = description || null;
        if (isActive !== undefined) data.isActive = Boolean(isActive);

        const product = await prisma.generalProduct.update({ 
            where: { id: req.params.id }, 
            data,
            include: { category: true }
        });
        res.json(product);
    } catch (error) { 
        console.error('updateGeneralProduct error:', error);
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
            where: { itemType: 'GOODS' },
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

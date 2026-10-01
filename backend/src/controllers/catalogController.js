const prisma = require('../lib/prisma');

// =============================
// 1. Категории (Categories)
// =============================
const getCategories = async (req, res) => {
    try {
        const categories = await prisma.category.findMany({
            orderBy: { name: 'asc' },
        });
        res.json(categories);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка при получении категорий', details: error.message });
    }
};

const createCategory = async (req, res) => {
    try {
        const { name, code } = req.body;
        const category = await prisma.category.create({
            data: { name, code },
        });
        res.status(201).json(category);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка при создании категории', details: error.message });
    }
};

// =============================
// 2. Общие товары (МНН / GeneralProduct)
// =============================
const getGeneralProducts = async (req, res) => {
    try {
        const products = await prisma.generalProduct.findMany({
            include: { category: true },
            orderBy: { name: 'asc' },
        });
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка при получении справочника товаров МНН', details: error.message });
    }
};

const createGeneralProduct = async (req, res) => {
    try {
        const { name, tradeName, code, categoryId, type, description } = req.body;
        const product = await prisma.generalProduct.create({
            data: {
                name,
                tradeName,
                code,
                categoryId: categoryId || null,
                type: type || 'HARYT',
                description,
            },
        });
        res.status(201).json(product);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка при добавлении товара в справочник МНН', details: error.message });
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
        res.status(500).json({ error: 'Ошибка при получении единиц измерения', details: error.message });
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
        res.status(500).json({ error: 'Ошибка при создании единицы измерения', details: error.message });
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
        res.status(500).json({ error: 'Ошибка при получении валют', details: error.message });
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
        res.status(500).json({ error: 'Ошибка при добавлении валюты', details: error.message });
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
        res.status(500).json({ error: 'Ошибка при обновлении курса валют', details: error.message });
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
        res.status(500).json({ error: 'Ошибка при получении списка стран', details: error.message });
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
        res.status(500).json({ error: 'Ошибка при создании страны', details: error.message });
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
        res.status(500).json({ error: 'Ошибка при получении условий поставки', details: error.message });
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
        res.status(500).json({ error: 'Ошибка при создании условия поставки', details: error.message });
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
        res.status(500).json({ error: 'Ошибка при получении производителей', details: error.message });
    }
};

const createManufacturer = async (req, res) => {
    try {
        const { name, code, countryId } = req.body;
        const manufacturer = await prisma.manufacturer.create({
            data: { name, code, countryId: countryId || null },
        });
        res.status(201).json(manufacturer);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка при создании производителя', details: error.message });
    }
};

const updateCategory = async (req, res) => {
    try {
        const category = await prisma.category.update({ where: { id: req.params.id }, data: req.body });
        res.json(category);
    } catch (error) { res.status(500).json({ error: 'Ошибка обновления' }); }
};
const deleteCategory = async (req, res) => {
    try {
        await prisma.category.delete({ where: { id: req.params.id } });
        res.status(204).send();
    } catch (error) { res.status(500).json({ error: 'Ошибка удаления' }); }
};

const updateGeneralProduct = async (req, res) => {
    try {
        const product = await prisma.generalProduct.update({ where: { id: req.params.id }, data: req.body });
        res.json(product);
    } catch (error) { res.status(500).json({ error: 'Ошибка обновления' }); }
};
const deleteGeneralProduct = async (req, res) => {
    try {
        await prisma.generalProduct.delete({ where: { id: req.params.id } });
        res.status(204).send();
    } catch (error) { res.status(500).json({ error: 'Ошибка удаления' }); }
};

const updateUnit = async (req, res) => {
    try {
        const unit = await prisma.unit.update({ where: { id: req.params.id }, data: req.body });
        res.json(unit);
    } catch (error) { res.status(500).json({ error: 'Ошибка обновления' }); }
};
const deleteUnit = async (req, res) => {
    try {
        await prisma.unit.delete({ where: { id: req.params.id } });
        res.status(204).send();
    } catch (error) { res.status(500).json({ error: 'Ошибка удаления' }); }
};

const updateCurrency = async (req, res) => {
    try {
        const currency = await prisma.currency.update({ where: { id: req.params.id }, data: req.body });
        res.json(currency);
    } catch (error) { res.status(500).json({ error: 'Ошибка обновления' }); }
};
const deleteCurrency = async (req, res) => {
    try {
        await prisma.currency.delete({ where: { id: req.params.id } });
        res.status(204).send();
    } catch (error) { res.status(500).json({ error: 'Ошибка удаления' }); }
};

const updateCountry = async (req, res) => {
    try {
        const country = await prisma.country.update({ where: { id: req.params.id }, data: req.body });
        res.json(country);
    } catch (error) { res.status(500).json({ error: 'Ошибка обновления' }); }
};
const deleteCountry = async (req, res) => {
    try {
        await prisma.country.delete({ where: { id: req.params.id } });
        res.status(204).send();
    } catch (error) { res.status(500).json({ error: 'Ошибка удаления' }); }
};

const updateDeliveryTerm = async (req, res) => {
    try {
        const term = await prisma.deliveryTerm.update({ where: { id: req.params.id }, data: req.body });
        res.json(term);
    } catch (error) { res.status(500).json({ error: 'Ошибка обновления' }); }
};
const deleteDeliveryTerm = async (req, res) => {
    try {
        await prisma.deliveryTerm.delete({ where: { id: req.params.id } });
        res.status(204).send();
    } catch (error) { res.status(500).json({ error: 'Ошибка удаления' }); }
};

const updateManufacturer = async (req, res) => {
    try {
        const m = await prisma.manufacturer.update({ where: { id: req.params.id }, data: req.body });
        res.json(m);
    } catch (error) { res.status(500).json({ error: 'Ошибка обновления' }); }
};
const deleteManufacturer = async (req, res) => {
    try {
        await prisma.manufacturer.delete({ where: { id: req.params.id } });
        res.status(204).send();
    } catch (error) { res.status(500).json({ error: 'Ошибка удаления' }); }
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
        res.status(500).json({ error: 'Ошибка при получении заказчиков', details: error.message });
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
        res.status(500).json({ error: 'Ошибка при создании заказчика', details: error.message });
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
        res.status(500).json({ error: 'Ошибка при обновлении заказчика', details: error.message });
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
        res.status(500).json({ error: 'Ошибка при удалении заказчика', details: error.message });
    }
};

// =============================
// МНН (Международные непатентованные наименования)
// =============================
const getUniqueMNNs = async (req, res) => {
    try {
        const products = await prisma.generalProduct.findMany({
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
        res.status(500).json({ error: 'Ошибка при получении списка МНН', details: error.message });
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
        res.status(500).json({ error: 'Ошибка при получении брендов', details: error.message });
    }
};

const createBrand = async (req, res) => {
    try {
        const { name, code } = req.body;
        const brand = await prisma.brand.create({
            data: { name, code: code || null },
        });
        res.status(201).json(brand);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка при создании бренда', details: error.message });
    }
};

const updateBrand = async (req, res) => {
    try {
        const brand = await prisma.brand.update({
            where: { id: req.params.id },
            data: req.body,
        });
        res.json(brand);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка при обновлении бренда', details: error.message });
    }
};

const deleteBrand = async (req, res) => {
    try {
        await prisma.brand.delete({ where: { id: req.params.id } });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Ошибка при удалении бренда', details: error.message });
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
        res.status(500).json({ error: 'Ошибка при получении вариаций', details: error.message });
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
        res.status(500).json({ error: 'Ошибка при создании группы вариаций', details: error.message });
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
        res.status(500).json({ error: 'Ошибка при обновлении группы вариаций', details: error.message });
    }
};

const deleteVariationGroup = async (req, res) => {
    try {
        await prisma.variationGroup.delete({ where: { id: req.params.id } });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Ошибка при удалении группы вариаций', details: error.message });
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
        res.status(500).json({ error: 'Ошибка добавления значения вариации', details: error.message });
    }
};

const deleteVariationValue = async (req, res) => {
    try {
        await prisma.variationValue.delete({ where: { id: req.params.id } });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Ошибка удаления значения вариации', details: error.message });
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

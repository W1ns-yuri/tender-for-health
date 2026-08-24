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
        const { name, code, categoryId, type, description } = req.body;
        const product = await prisma.generalProduct.create({
            data: {
                name,
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

module.exports = {
    getCategories,
    createCategory,
    getGeneralProducts,
    createGeneralProduct,
    getUnits,
    createUnit,
    getCurrencies,
    createCurrency,
    setExchangeRate,
    getCountries,
    createCountry,
    getDeliveryTerms,
    createDeliveryTerm,
    getManufacturers,
    createManufacturer
};

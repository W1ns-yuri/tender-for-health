const express = require('express');
const {
    getCategories, createCategory,
    getGeneralProducts, createGeneralProduct,
    getUnits, createUnit,
    getCurrencies, createCurrency, setExchangeRate,
    getCountries, createCountry,
    getDeliveryTerms, createDeliveryTerm,
    getManufacturers, createManufacturer,
} = require('../controllers/catalogController');
const authMiddleware = require('../middleware/authMiddleware');
const { checkRole } = require('../middleware/rbacMiddleware');

const router = express.Router();

// Категории
router.get('/categories', getCategories);
router.post('/categories', authMiddleware, checkRole(['ADMIN', 'PURCHASING_SPECIALIST']), createCategory);

// Общие товары (МНН)
router.get('/products', getGeneralProducts);
router.post('/products', authMiddleware, checkRole(['ADMIN', 'PURCHASING_SPECIALIST']), createGeneralProduct);

// Единицы измерения
router.get('/units', getUnits);
router.post('/units', authMiddleware, checkRole(['ADMIN']), createUnit);

// Валюты и курсы
router.get('/currencies', getCurrencies);
router.post('/currencies', authMiddleware, checkRole(['ADMIN']), createCurrency);
router.post('/currencies/rates', authMiddleware, checkRole(['ADMIN']), setExchangeRate);

// Страны
router.get('/countries', getCountries);
router.post('/countries', authMiddleware, checkRole(['ADMIN']), createCountry);

// Условия поставки (INCOTERMS)
router.get('/delivery-terms', getDeliveryTerms);
router.post('/delivery-terms', authMiddleware, checkRole(['ADMIN']), createDeliveryTerm);

// Производители
router.get('/manufacturers', getManufacturers);
router.post('/manufacturers', authMiddleware, checkRole(['ADMIN', 'PURCHASING_SPECIALIST']), createManufacturer);

module.exports = router;

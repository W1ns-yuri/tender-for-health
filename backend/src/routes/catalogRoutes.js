const express = require('express');
const {
    getCategories, createCategory, updateCategory, deleteCategory,
    getGeneralProducts, createGeneralProduct, updateGeneralProduct, deleteGeneralProduct,
    getUnits, createUnit, updateUnit, deleteUnit,
    getCurrencies, createCurrency, updateCurrency, deleteCurrency, setExchangeRate,
    getCountries, createCountry, updateCountry, deleteCountry,
    getDeliveryTerms, createDeliveryTerm, updateDeliveryTerm, deleteDeliveryTerm,
    getManufacturers, createManufacturer, updateManufacturer, deleteManufacturer,
    getClients, createClient, updateClient, deleteClient,
} = require('../controllers/catalogController');
const authMiddleware = require('../middleware/authMiddleware');
const { checkRole } = require('../middleware/rbacMiddleware');

const router = express.Router();

// Категории
router.get('/categories', getCategories);
router.post('/categories', authMiddleware, checkRole(['ADMIN', 'PURCHASING_SPECIALIST']), createCategory);
router.put('/categories/:id', authMiddleware, checkRole(['ADMIN', 'PURCHASING_SPECIALIST']), updateCategory);
router.delete('/categories/:id', authMiddleware, checkRole(['ADMIN', 'PURCHASING_SPECIALIST']), deleteCategory);

// Общие товары (МНН)
router.get('/products', getGeneralProducts);
router.post('/products', authMiddleware, checkRole(['ADMIN', 'PURCHASING_SPECIALIST']), createGeneralProduct);
router.put('/products/:id', authMiddleware, checkRole(['ADMIN', 'PURCHASING_SPECIALIST']), updateGeneralProduct);
router.delete('/products/:id', authMiddleware, checkRole(['ADMIN', 'PURCHASING_SPECIALIST']), deleteGeneralProduct);

// Единицы измерения
router.get('/units', getUnits);
router.post('/units', authMiddleware, checkRole(['ADMIN']), createUnit);
router.put('/units/:id', authMiddleware, checkRole(['ADMIN']), updateUnit);
router.delete('/units/:id', authMiddleware, checkRole(['ADMIN']), deleteUnit);

// Валюты и курсы
router.get('/currencies', getCurrencies);
router.post('/currencies', authMiddleware, checkRole(['ADMIN']), createCurrency);
router.put('/currencies/:id', authMiddleware, checkRole(['ADMIN']), updateCurrency);
router.delete('/currencies/:id', authMiddleware, checkRole(['ADMIN']), deleteCurrency);
router.post('/currencies/rates', authMiddleware, checkRole(['ADMIN']), setExchangeRate);

// Страны
router.get('/countries', getCountries);
router.post('/countries', authMiddleware, checkRole(['ADMIN']), createCountry);
router.put('/countries/:id', authMiddleware, checkRole(['ADMIN']), updateCountry);
router.delete('/countries/:id', authMiddleware, checkRole(['ADMIN']), deleteCountry);

// Условия поставки (INCOTERMS)
router.get('/delivery-terms', getDeliveryTerms);
router.post('/delivery-terms', authMiddleware, checkRole(['ADMIN']), createDeliveryTerm);
router.put('/delivery-terms/:id', authMiddleware, checkRole(['ADMIN']), updateDeliveryTerm);
router.delete('/delivery-terms/:id', authMiddleware, checkRole(['ADMIN']), deleteDeliveryTerm);

// Производители
router.get('/manufacturers', getManufacturers);
router.post('/manufacturers', authMiddleware, checkRole(['ADMIN', 'PURCHASING_SPECIALIST']), createManufacturer);
router.put('/manufacturers/:id', authMiddleware, checkRole(['ADMIN', 'PURCHASING_SPECIALIST']), updateManufacturer);
router.delete('/manufacturers/:id', authMiddleware, checkRole(['ADMIN', 'PURCHASING_SPECIALIST']), deleteManufacturer);


// Заказчики
router.get('/clients', getClients);
router.post('/clients', authMiddleware, checkRole(['ADMIN']), createClient);
router.put('/clients/:id', authMiddleware, checkRole(['ADMIN']), updateClient);
router.delete('/clients/:id', authMiddleware, checkRole(['ADMIN']), deleteClient);

module.exports = router;

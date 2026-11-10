const express = require('express');
const {
    getCategories, createCategory, updateCategory, deleteCategory,
    getGeneralProducts, createGeneralProduct, updateGeneralProduct, deleteGeneralProduct,
    getUniqueMNNs,
    getUnits, createUnit, updateUnit, deleteUnit,
    getCurrencies, createCurrency, updateCurrency, deleteCurrency, setExchangeRate,
    getCountries, createCountry, updateCountry, deleteCountry,
    getDeliveryTerms, createDeliveryTerm, updateDeliveryTerm, deleteDeliveryTerm,
    getManufacturers, createManufacturer, updateManufacturer, deleteManufacturer,
    getBrands, createBrand, updateBrand, deleteBrand,
    getVariationGroups, createVariationGroup, updateVariationGroup, deleteVariationGroup,
    addVariationValue, deleteVariationValue,
    getClients, createClient, updateClient, deleteClient,
} = require('../controllers/catalogController');
const authMiddleware = require('../middleware/authMiddleware');
const { checkRole } = require('../middleware/rbacMiddleware');

const router = express.Router();

// Категории
router.get('/categories', getCategories);
router.post('/categories', authMiddleware, checkRole(['ADMIN']), createCategory);
router.put('/categories/:id', authMiddleware, checkRole(['ADMIN']), updateCategory);
router.delete('/categories/:id', authMiddleware, checkRole(['ADMIN']), deleteCategory);

// Общие товары (МНН / Препараты)
router.get('/products', getGeneralProducts);
router.post('/products', authMiddleware, checkRole(['ADMIN', 'SUPPLIER']), createGeneralProduct);
router.put('/products/:id', authMiddleware, checkRole(['ADMIN']), updateGeneralProduct);
router.delete('/products/:id', authMiddleware, checkRole(['ADMIN']), deleteGeneralProduct);

// МНН (Уникальные международные непатентованные наименования)
router.get('/mnn', getUniqueMNNs);

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
router.post('/manufacturers', authMiddleware, checkRole(['ADMIN']), createManufacturer);
router.put('/manufacturers/:id', authMiddleware, checkRole(['ADMIN']), updateManufacturer);
router.delete('/manufacturers/:id', authMiddleware, checkRole(['ADMIN']), deleteManufacturer);

// Торговые марки / Бренды
router.get('/brands', getBrands);
router.post('/brands', authMiddleware, checkRole(['ADMIN']), createBrand);
router.put('/brands/:id', authMiddleware, checkRole(['ADMIN']), updateBrand);
router.delete('/brands/:id', authMiddleware, checkRole(['ADMIN']), deleteBrand);

// Вариации и формы (VariationGroup & VariationValue)
router.get('/variations', getVariationGroups);
router.post('/variations', authMiddleware, checkRole(['ADMIN']), createVariationGroup);
router.put('/variations/:id', authMiddleware, checkRole(['ADMIN']), updateVariationGroup);
router.delete('/variations/:id', authMiddleware, checkRole(['ADMIN']), deleteVariationGroup);
router.post('/variations/:groupId/values', authMiddleware, checkRole(['ADMIN']), addVariationValue);
router.delete('/variations/values/:id', authMiddleware, checkRole(['ADMIN']), deleteVariationValue);

// Заказчики
router.get('/clients', getClients);
router.post('/clients', authMiddleware, checkRole(['ADMIN']), createClient);
router.put('/clients/:id', authMiddleware, checkRole(['ADMIN']), updateClient);
router.delete('/clients/:id', authMiddleware, checkRole(['ADMIN']), deleteClient);

module.exports = router;


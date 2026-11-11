/**
 * Общие помощники для интеграционных тестов.
 * Тесты ходят в ЖИВОЙ сервер (API_URL, по умолчанию http://localhost:5000) и в ту же базу через Prisma.
 * Перед запуском: база с миграциями и `npm run seed:demo`, сервер запущен (`node index.js`).
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env'), quiet: true });
const prisma = require('../src/lib/prisma');

const API = (process.env.API_URL || 'http://localhost:5000') + '/api';
const RUN = Date.now().toString(36); // уникальный суффикс, чтобы тесты не мешали друг другу и демо-данным

async function api(token, method, path, body) {
    const res = await fetch(API + path, {
        method,
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: body === undefined || method === 'GET' ? undefined : JSON.stringify(body),
    });
    let data = null;
    try { data = await res.json(); } catch { /* пустой ответ */ }
    return { status: res.status, data };
}

/** Загрузка файла (multipart), как это делает фронт */
async function upload(token, fields, { name = 'doc.pdf', type = 'application/pdf', content = '%PDF-1.4 test' } = {}) {
    const form = new FormData();
    for (const [k, v] of Object.entries(fields)) form.append(k, v);
    form.append('file', new Blob([content], { type }), name);
    const res = await fetch(API + '/documents/upload', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
    });
    let data = null;
    try { data = await res.json(); } catch { /* пустой ответ */ }
    return { status: res.status, data };
}

async function login(username, password) {
    const r = await api(null, 'POST', '/auth/login', { username, password });
    if (!r.data?.token) throw new Error(`Не удалось войти как ${username}: ${r.status} ${JSON.stringify(r.data)}`);
    return r.data.token;
}

const loginAdmin = () => login('admin', 'admin123');

/** Новый поставщик через регистрацию. verified=true — сразу одобрить, как это сделал бы админ. */
async function newSupplier(adminToken, { verified = true, categoryNames = [] } = {}) {
    const n = Math.random().toString(36).slice(2, 8);
    const username = `t_${RUN}_${n}@test.tm`;
    const password = 'TestPass123';
    const reg = await api(null, 'POST', '/auth/register', {
        username, password, firstName: 'Test', lastName: n, phone: '+993 65 00-00-00',
        companyName: `Test Co ${n}`, taxId: String(10000000 + Math.floor(Math.random() * 89999999)), countryCode: 'TM',
    });
    if (reg.status !== 201) throw new Error(`Регистрация не прошла: ${reg.status} ${JSON.stringify(reg.data)}`);
    const supplier = await prisma.supplier.findFirst({ where: { userId: reg.data.user.id } });
    if (categoryNames.length) {
        const cats = await prisma.category.findMany({ where: { name: { in: categoryNames } } });
        await prisma.supplierCategory.createMany({ data: cats.map((c) => ({ supplierId: supplier.id, categoryId: c.id })) });
    }
    if (verified) {
        await prisma.supplier.update({ where: { id: supplier.id }, data: { verificationStatus: 'PENDING_REVIEW' } });
        const ok = await api(adminToken, 'POST', `/suppliers/${supplier.id}/approve`);
        if (ok.status !== 200) throw new Error(`Одобрение не прошло: ${ok.status} ${JSON.stringify(ok.data)}`);
    }
    return { token: reg.data.token, userId: reg.data.user.id, supplierId: supplier.id, username, password };
}

/** Опубликованный тендер с одним лотом и двумя позициями. visibility: ACYK | YAPYK */
async function newTender(adminToken, { visibility = 'ACYK', invitedSupplierIds = [], publish = true, categoryName = 'Фармацевтика и лекарственные препараты' } = {}) {
    const category = await prisma.category.findFirst({ where: { name: { contains: categoryName.split(' ')[0] } } });
    const client = await prisma.client.findFirst();
    const products = await prisma.generalProduct.findMany({ take: 2 });
    const deadline = new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10);
    const created = await api(adminToken, 'POST', '/tenders', {
        tenderNumber: `T-${RUN}-${Math.random().toString(36).slice(2, 6)}`,
        title: `Test tender ${RUN}`, type: 'YERLI', status: 'TASLAMA', visibility, invitedSupplierIds,
        categoryId: category.id, clientId: client.id, procurementType: 'GOODS',
        announcementDate: new Date().toISOString().slice(0, 10), deadline, lots: [],
    });
    if (created.status !== 201) throw new Error(`Тендер не создан: ${created.status} ${JSON.stringify(created.data)}`);
    const tenderId = created.data.id;
    const lot = await api(adminToken, 'POST', `/tenders/${tenderId}/lots`, { lotNumber: 1, name: 'Лот тестовый', lotType: 'GOODS' });
    const lotId = lot.data.id;
    const upd = await api(adminToken, 'PUT', `/tenders/${tenderId}/lots/${lotId}`, {
        categoryId: category.id,
        specs: products.map((p, i) => ({ name: p.name, generalProductId: p.id, quantity: (i + 1) * 100 })),
    });
    if (upd.status !== 200) throw new Error(`Лот не сохранён: ${upd.status} ${JSON.stringify(upd.data)}`);
    if (publish) {
        const pub = await api(adminToken, 'POST', `/tenders/${tenderId}/publish`);
        if (pub.status !== 200) throw new Error(`Тендер не опубликован: ${pub.status} ${JSON.stringify(pub.data)}`);
    }
    const specs = await prisma.tenderSpecification.findMany({ where: { tenderId }, orderBy: { positionNumber: 'asc' } });
    return { tenderId, lotId, specs, categoryId: category.id };
}

/** Подать предложение: prices — цена за единицу для каждой позиции по порядку */
function submitOffer(token, tender, prices) {
    return api(token, 'POST', '/offers', {
        tenderId: tender.tenderId,
        specs: tender.specs.map((s, i) => ({ tenderSpecId: s.id, name: s.name, quantity: Number(s.quantity), unitPrice: prices[i] })),
    });
}

/** «Перемотать время»: дедлайн в прошлом, тендер закрыт для приёма заявок */
async function expireDeadline(tenderId) {
    await prisma.tender.update({ where: { id: tenderId }, data: { deadline: new Date(Date.now() - 60e3), status: 'YAPYK' } });
}

module.exports = { api, upload, login, loginAdmin, newSupplier, newTender, submitOffer, expireDeadline, prisma, RUN };

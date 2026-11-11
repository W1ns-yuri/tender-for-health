/**
 * Матрица доступа: каждый «админский» запрос × каждая роль.
 * Гость (без входа) → 401, поставщик (даже одобренный) → 403, админ → не 401/403.
 * Плюс точечные проверки «поставщик не видит чужое» и «админ не делает то, что должен только поставщик».
 */
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { api, upload, loginAdmin, newSupplier, newTender, submitOffer, expireDeadline, prisma } = require('./helpers');

const PHARMA = 'Фармацевтика и лекарственные препараты';
const FAKE = '00000000-0000-0000-0000-000000000000';
let admin, sup, other, pending;

before(async () => {
    admin = await loginAdmin();
    sup = await newSupplier(admin, { categoryNames: [PHARMA] });
    other = await newSupplier(admin, { categoryNames: [PHARMA] });
    pending = await newSupplier(admin, { verified: false });
});

after(() => prisma.$disconnect());

// Только для организатора. Тело запроса не важно: проверка роли идёт раньше валидации.
const ADMIN_ONLY = [
    ['GET', '/users'], ['POST', '/users'], ['PUT', `/users/${FAKE}`], ['PUT', `/users/${FAKE}/status`],
    ['GET', '/companies'], ['POST', '/companies'], ['GET', `/companies/${FAKE}/stats`],
    ['GET', '/tenders/next-number'], ['POST', '/tenders'], ['PUT', `/tenders/${FAKE}`], ['DELETE', `/tenders/${FAKE}`],
    ['POST', `/tenders/${FAKE}/publish`], ['POST', `/tenders/${FAKE}/lots`],
    ['PUT', `/tenders/${FAKE}/lots/${FAKE}`], ['DELETE', `/tenders/${FAKE}/lots/${FAKE}`],
    ['POST', `/evaluation/open/${FAKE}`], ['GET', `/evaluation/evaluate/${FAKE}`], ['GET', '/evaluation/tenders'],
    ['GET', `/evaluation/tenders/${FAKE}/details`], ['POST', '/evaluation/award-lot'], ['POST', '/evaluation/award-item'],
    ['POST', `/evaluation/complete/${FAKE}`], ['POST', '/evaluation/select-winner'],
    ['GET', '/offers'], ['GET', '/offers/suppliers'], ['POST', '/offers/suppliers'],
    ['GET', '/suppliers'], ['GET', '/suppliers/pending'], ['GET', '/suppliers/moderation/archive'],
    ['POST', `/suppliers/${FAKE}/approve`], ['POST', `/suppliers/${FAKE}/reject`],
    ['PUT', `/suppliers/${FAKE}`], ['DELETE', `/suppliers/${FAKE}`],
    ['GET', '/dashboard/logs'], ['GET', '/dashboard/analytics'],
    ...['categories', 'units', 'currencies', 'countries', 'delivery-terms', 'manufacturers', 'brands', 'variations', 'clients']
        .flatMap((c) => [['POST', `/catalogs/${c}`], ['PUT', `/catalogs/${c}/${FAKE}`], ['DELETE', `/catalogs/${c}/${FAKE}`]]),
    ['PUT', `/catalogs/products/${FAKE}`], ['DELETE', `/catalogs/products/${FAKE}`],
    ['POST', '/catalogs/currencies/rates'],
    ['POST', '/catalogs/attributes'], ['PUT', `/catalogs/attributes/${FAKE}`], ['DELETE', `/catalogs/attributes/${FAKE}`],
    ['PUT', `/catalogs/categories/${FAKE}/attributes`],
    ['POST', `/catalogs/products/${FAKE}/approve`], ['POST', `/catalogs/products/${FAKE}/reject`],
    ['DELETE', `/tenders/${FAKE}/schedule`],
];

test('админские запросы: гость 401, поставщик 403, админ проходит', async () => {
    const problems = [];
    for (const [method, path] of ADMIN_ONLY) {
        const anon = await api(null, method, path, {});
        const s = await api(sup.token, method, path, {});
        const p = await api(pending.token, method, path, {});
        const a = await api(admin, method, path, {});
        if (anon.status !== 401) problems.push(`${method} ${path}: гость получил ${anon.status}`);
        if (s.status !== 403) problems.push(`${method} ${path}: поставщик получил ${s.status}`);
        if (p.status !== 403) problems.push(`${method} ${path}: неодобренный поставщик получил ${p.status}`);
        if ([401, 403].includes(a.status)) problems.push(`${method} ${path}: админ получил ${a.status}`);
    }
    assert.deepEqual(problems, []);
});

test('запросы только для вошедших: гость 401', async () => {
    const AUTHED = [
        ['GET', '/auth/me'], ['POST', '/auth/change-password'], ['GET', `/tenders/${FAKE}`],
        ['GET', '/documents?tenderId=' + FAKE], ['POST', '/documents/upload'], ['PUT', `/documents/${FAKE}`], ['DELETE', `/documents/${FAKE}`],
        ['GET', '/notifications'], ['PUT', '/notifications/read-all'], ['PUT', `/notifications/${FAKE}/read`],
        ['GET', '/dashboard/stats'], ['POST', '/offers'], ['GET', '/offers/my'], ['GET', '/offers/my-wins'],
        ['GET', `/offers/${FAKE}`], ['DELETE', `/offers/${FAKE}`], ['GET', `/offers/tender/${FAKE}`],
        ['GET', '/suppliers/profile'], ['PUT', '/suppliers/profile'], ['GET', `/suppliers/${FAKE}`], ['GET', `/suppliers/${FAKE}/stats`],
        ['POST', '/catalogs/products'],
    ];
    const problems = [];
    for (const [method, path] of AUTHED) {
        const r = await api(null, method, path, {});
        if (r.status !== 401) problems.push(`${method} ${path}: гость получил ${r.status}`);
    }
    assert.deepEqual(problems, []);
});

test('поставщик не видит чужой профиль, статистику и документы профиля', async () => {
    assert.equal((await api(sup.token, 'GET', `/suppliers/${other.supplierId}`)).status, 403);
    assert.equal((await api(sup.token, 'GET', `/suppliers/${other.supplierId}/stats`)).status, 403);
    assert.equal((await api(sup.token, 'GET', `/documents?supplierId=${other.supplierId}`)).status, 403);
    assert.equal((await api(sup.token, 'GET', '/documents')).status, 403, 'список всех документов системы');
    assert.equal((await api(sup.token, 'GET', `/suppliers/${sup.supplierId}`)).status, 200, 'свой профиль');
    // Обход через комбинацию фильтров (раньше where брался по первому фильтру, а проверка — по другому)
    const combo = await api(sup.token, 'GET', `/documents?supplierId=${other.supplierId}&offerId=${FAKE}`);
    assert.equal(combo.status, 400);
});

test('поставщик не может загрузить файл в чужой профиль, тендер или лот', async () => {
    const t = await newTender(admin, { publish: true });
    assert.equal((await upload(sup.token, { supplierId: other.supplierId })).status, 403);
    assert.equal((await upload(sup.token, { tenderId: t.tenderId })).status, 403);
    assert.equal((await upload(sup.token, { lotId: t.lotId })).status, 403);
    const own = await upload(sup.token, { supplierId: sup.supplierId });
    assert.equal(own.status, 201, JSON.stringify(own.data));
    // Чужой документ поставщик не может ни переименовать, ни удалить
    assert.equal((await api(other.token, 'PUT', `/documents/${own.data.id}`, { name: 'x' })).status, 403);
    assert.equal((await api(other.token, 'DELETE', `/documents/${own.data.id}`)).status, 403);
});

test('админ может загрузить документ лота (раньше падало с 500)', async () => {
    const t = await newTender(admin, { publish: false });
    const r = await upload(admin, { lotId: t.lotId });
    assert.equal(r.status, 201, JSON.stringify(r.data));
});

test('закрытый тендер: неприглашённый не видит ни тендер, ни его документы', async () => {
    const t = await newTender(admin, { visibility: 'YAPYK', invitedSupplierIds: [sup.supplierId] });
    const doc = await upload(admin, { tenderId: t.tenderId });
    assert.equal(doc.status, 201);

    assert.equal((await api(sup.token, 'GET', `/tenders/${t.tenderId}`)).status, 200, 'приглашённый');
    assert.equal((await api(sup.token, 'GET', `/documents?tenderId=${t.tenderId}`)).status, 200, 'приглашённый, документы');

    assert.equal((await api(other.token, 'GET', `/tenders/${t.tenderId}`)).status, 403);
    assert.equal((await api(other.token, 'GET', `/documents?tenderId=${t.tenderId}`)).status, 403);
    assert.equal((await api(other.token, 'GET', `/documents?lotId=${t.lotId}`)).status, 403);
    const list = await api(other.token, 'GET', '/tenders');
    assert.ok(!list.data.map((x) => x.id).includes(t.tenderId), 'закрытый тендер в списке неприглашённого');
    const anonList = await api(null, 'GET', '/tenders');
    assert.ok(!anonList.data.map((x) => x.id).includes(t.tenderId), 'закрытый тендер в списке гостя');
    assert.equal((await submitOffer(other.token, t, [10, 5])).status >= 400, true, 'неприглашённый подал заявку');
});

test('после итогов: чужое предложение целиком не отдаётся, админ не удаляет заявки', async () => {
    const t = await newTender(admin);
    const mine = await submitOffer(sup.token, t, [10, 5]);
    const theirs = await submitOffer(other.token, t, [12, 6]);
    assert.equal(mine.status, 201);
    assert.equal(theirs.status, 201);

    // Отозвать заявку может только автор: ни конкурент, ни организатор
    assert.equal((await api(other.token, 'DELETE', `/offers/${mine.data.id}`)).status, 403);
    assert.equal((await api(admin, 'DELETE', `/offers/${mine.data.id}`)).status, 403);

    await expireDeadline(t.tenderId);
    assert.equal((await api(admin, 'POST', `/evaluation/open/${t.tenderId}`)).status, 200);
    const award = await api(admin, 'POST', '/evaluation/award-lot', { tenderId: t.tenderId, lotId: t.lotId, offerId: mine.data.id });
    assert.ok(award.status < 300, JSON.stringify(award.data));
    assert.equal((await api(admin, 'POST', `/evaluation/complete/${t.tenderId}`)).status, 200);

    // Раньше после итогов любой поставщик получал чужую заявку с банком, паспортом и файлами
    assert.equal((await api(other.token, 'GET', `/offers/${mine.data.id}`)).status, 403);
    assert.equal((await api(sup.token, 'GET', `/offers/${mine.data.id}`)).status, 200, 'своя заявка');
    assert.equal((await api(admin, 'GET', `/offers/${mine.data.id}`)).status, 200, 'админ после вскрытия');
});

test('дашборд поставщика без внутренней статистики организатора', async () => {
    const s = await api(sup.token, 'GET', '/dashboard/stats');
    assert.equal(s.status, 200);
    assert.equal(s.data.counters.totalSuppliers, null);
    assert.deepEqual(s.data.statusBreakdown, {});
    assert.deepEqual(s.data.recentLogs, []);
    assert.ok(!s.data.recentTenders.some((t) => t.status === 'TASLAMA'), 'черновик на дашборде поставщика');
    const a = await api(admin, 'GET', '/dashboard/stats');
    assert.equal(typeof a.data.counters.totalSuppliers, 'number');
});

test('нельзя поднять себе права через регистрацию или профиль', async () => {
    const n = Math.random().toString(36).slice(2, 8);
    const reg = await api(null, 'POST', '/auth/register', {
        username: `esc_${n}@test.tm`, password: 'TestPass123', firstName: 'E', lastName: 'S', phone: '+993 65 00-00-01',
        companyName: `Esc ${n}`, taxId: String(10000000 + Math.floor(Math.random() * 89999999)), countryCode: 'TM',
        roleType: 'ADMIN', verificationStatus: 'VERIFIED',
    });
    assert.equal(reg.status, 201);
    assert.equal(reg.data.user.roleType, 'SUPPLIER');
    const s = await prisma.supplier.findFirst({ where: { userId: reg.data.user.id } });
    assert.notEqual(s.verificationStatus, 'VERIFIED');

    await api(pending.token, 'PUT', '/suppliers/profile', { verificationStatus: 'VERIFIED', roleType: 'ADMIN' });
    const after = await prisma.supplier.findFirst({ where: { id: pending.supplierId }, include: { user: true } });
    assert.notEqual(after.verificationStatus, 'VERIFIED');
    assert.equal(after.user.roleType, 'SUPPLIER');
});

/**
 * Дыры, найденные при аудите перед продом: пароли, токены, чужие файлы, итоги закрытых тендеров, профиль.
 */
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { api, upload, login, loginAdmin, newSupplier, newTender, submitOffer, expireDeadline, prisma } = require('./helpers');

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
let admin;

before(async () => { admin = await loginAdmin(); });
after(() => prisma.$disconnect());

test('смена пароля: старый токен перестаёт работать, текущий пароль не попадает в журнал', async () => {
    const sup = await newSupplier(admin, { verified: false });
    await wait(1100); // iat в секундах: токен регистрации должен быть старше смены пароля

    const weak = await api(sup.token, 'POST', '/auth/change-password', { currentPassword: sup.password, newPassword: 'short1' });
    assert.equal(weak.status, 400, 'правило длины как при регистрации: 8 символов');

    const ok = await api(sup.token, 'POST', '/auth/change-password', { currentPassword: sup.password, newPassword: 'NewPass12345' });
    assert.equal(ok.status, 200, JSON.stringify(ok.data));
    assert.ok(ok.data.token, 'текущей вкладке выдают новый токен');

    assert.equal((await api(sup.token, 'GET', '/auth/me')).status, 401, 'старый токен отозван');
    assert.equal((await api(ok.data.token, 'GET', '/auth/me')).status, 200);
    await login(sup.username, 'NewPass12345');

    const log = await prisma.log.findFirst({
        where: { userId: sup.userId, data: { path: ['url'], equals: '/api/auth/change-password' } },
        orderBy: { createdAt: 'desc' },
    });
    assert.ok(log, 'смена пароля записана в журнал');
    assert.equal(log.data.body.currentPassword, '***HIDDEN***');
    assert.equal(log.data.body.newPassword, '***HIDDEN***');
});

test('админ сбрасывает пароль: выдаётся временный, прежние сессии завершаются', async () => {
    const sup = await newSupplier(admin, { verified: false });
    await wait(1100);

    const denied = await api(sup.token, 'POST', `/users/${sup.userId}/reset-password`);
    assert.equal(denied.status, 403, 'поставщик не может сбрасывать пароли');

    const res = await api(admin, 'POST', `/users/${sup.userId}/reset-password`);
    assert.equal(res.status, 200, JSON.stringify(res.data));
    assert.match(res.data.temporaryPassword, /^[A-Za-z2-9]{12}$/);

    assert.equal((await api(sup.token, 'GET', '/auth/me')).status, 401);
    await login(sup.username, res.data.temporaryPassword);
});

test('к заявке нельзя прикрепить чужой загруженный файл', async () => {
    const supA = await newSupplier(admin, { categoryNames: ['Фармацевтика и лекарственные препараты'] });
    const supB = await newSupplier(admin, { categoryNames: ['Фармацевтика и лекарственные препараты'] });
    const t = await newTender(admin);

    const bFile = await upload(supB.token, {});
    assert.equal(bFile.status, 201, JSON.stringify(bFile.data));

    const res = await api(supA.token, 'POST', '/offers', {
        tenderId: t.tenderId,
        specs: t.specs.map((s) => ({ tenderSpecId: s.id, unitPrice: 5 })),
        attachedDocumentIds: [bFile.data.id],
    });
    assert.equal(res.status, 400, 'файл поставщика B не должен стать «своим» для A');
    const dl = await fetch(`${process.env.API_URL || 'http://localhost:5000'}/uploads/${bFile.data.fileName}`, { headers: { Authorization: `Bearer ${supA.token}` } });
    assert.equal(dl.status, 403);
});

test('итоги закрытого тендера видят только приглашённые', async () => {
    const cat = ['Фармацевтика и лекарственные препараты'];
    const invited = await newSupplier(admin, { categoryNames: cat });
    const outsider = await newSupplier(admin, { categoryNames: cat });
    const t = await newTender(admin, { visibility: 'YAPYK', invitedSupplierIds: [invited.supplierId] });
    const offer = await submitOffer(invited.token, t, [10, 2]);
    assert.equal(offer.status, 201, JSON.stringify(offer.data));
    await expireDeadline(t.tenderId);
    await api(admin, 'POST', `/evaluation/open/${t.tenderId}`);
    await api(admin, 'POST', '/evaluation/award-lot', { tenderId: t.tenderId, lotId: t.lotId, offerId: offer.data.id });
    assert.equal((await api(admin, 'POST', `/evaluation/complete/${t.tenderId}`)).status, 200);

    assert.equal((await api(invited.token, 'GET', `/offers/tender/${t.tenderId}`)).status, 200);
    const peek = await api(outsider.token, 'GET', `/offers/tender/${t.tenderId}`);
    assert.equal(peek.status, 403, 'чужой поставщик не видит цены закрытого тендера');
});

test('проверенная компания не меняет реквизиты в обход повторной проверки', async () => {
    const sup = await newSupplier(admin, { categoryNames: ['Фармацевтика и лекарственные препараты'] });
    const silent = await api(sup.token, 'PUT', '/suppliers/profile', { bankAccount: '99999999999999999999', submitForReview: false });
    assert.equal(silent.status, 400);
    const after = await prisma.supplier.findUnique({ where: { id: sup.supplierId } });
    assert.equal(after.verificationStatus, 'VERIFIED');
    assert.notEqual(after.bankAccount, '99999999999999999999');

    const other = await newSupplier(admin, { verified: false });
    const otherTax = (await prisma.supplier.findUnique({ where: { id: other.supplierId } })).taxId;
    assert.equal((await upload(sup.token, { supplierId: sup.supplierId })).status, 201);
    const dup = await api(sup.token, 'PUT', '/suppliers/profile', { taxId: otherTax });
    assert.equal(dup.status, 400);
    assert.match(dup.data.error, /ИНН уже зарегистрирована/);
});

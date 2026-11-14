/**
 * Договоры по итогам: создаются сами при объявлении итогов, дальше подпись поставщика и организатора.
 */
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { api, upload, loginAdmin, newSupplier, newTender, submitOffer, expireDeadline, prisma } = require('./helpers');

let admin, supA, supB, t, offerA, offerB, contract;

before(async () => {
    admin = await loginAdmin();
    supA = await newSupplier(admin, { categoryNames: ['Фармацевтика и лекарственные препараты'] });
    supB = await newSupplier(admin, { categoryNames: ['Фармацевтика и лекарственные препараты'] });
    t = await newTender(admin);
    offerA = (await submitOffer(supA.token, t, [10, 2.5])).data.id;
    offerB = (await submitOffer(supB.token, t, [12, 3])).data.id;
    await expireDeadline(t.tenderId);
    await api(admin, 'POST', `/evaluation/open/${t.tenderId}`);
    const award = await api(admin, 'POST', '/evaluation/award-lot', { tenderId: t.tenderId, lotId: t.lotId, offerId: offerA });
    assert.equal(award.status, 200, JSON.stringify(award.data));
    const done = await api(admin, 'POST', `/evaluation/complete/${t.tenderId}`);
    assert.equal(done.status, 200, JSON.stringify(done.data));
});

after(() => prisma.$disconnect());

test('после итогов создан один договор с победителем на сумму выигранных позиций', async () => {
    const list = await api(admin, 'GET', `/contracts?tenderId=${t.tenderId}`);
    assert.equal(list.status, 200);
    assert.equal(list.data.length, 1);
    contract = list.data[0];
    assert.equal(contract.offerId, offerA);
    assert.equal(contract.status, 'DRAFT');
    // 100 × 10 + 200 × 2.5
    assert.equal(Number(contract.amount), 1500);

    const again = await api(admin, 'POST', `/contracts/generate/${t.tenderId}`);
    assert.equal(again.data.created, 0, 'повторный вызов не дублирует');
});

test('договор видят только стороны', async () => {
    assert.equal((await api(supA.token, 'GET', '/contracts')).data.filter((c) => c.id === contract.id).length, 1);
    assert.equal((await api(supB.token, 'GET', '/contracts')).data.filter((c) => c.id === contract.id).length, 0);
    assert.equal((await api(supB.token, 'GET', `/contracts/${contract.id}`)).status, 404);
    const mine = await api(supA.token, 'GET', `/contracts/${contract.id}`);
    assert.equal(mine.status, 200);
    assert.equal(mine.data.offer.specs.length, 2, 'в договоре выигранные позиции');
});

test('подписание: черновик → отправлен → подписан поставщиком → возврат → подписан', async () => {
    const id = contract.id;
    assert.equal((await api(supA.token, 'POST', `/contracts/${id}/supplier-sign`, {})).status, 400, 'ещё не отправлен');
    assert.equal((await api(admin, 'POST', `/contracts/${id}/send`)).status, 200);
    assert.equal((await api(admin, 'POST', `/contracts/${id}/send`)).status, 400, 'дважды');

    const scanA = (await upload(supA.token, {})).data.fileName;
    const scanB = (await upload(supB.token, {})).data.fileName;
    const txt = (await upload(supA.token, {}, { name: 'a.txt', type: 'text/plain', content: 'x' })).data?.fileName;

    assert.equal((await api(supB.token, 'POST', `/contracts/${id}/supplier-sign`, { fileName: scanB })).status, 404, 'чужой договор');
    assert.equal((await api(supA.token, 'POST', `/contracts/${id}/supplier-sign`, { fileName: scanB })).status, 400, 'чужой файл');
    if (txt) assert.equal((await api(supA.token, 'POST', `/contracts/${id}/supplier-sign`, { fileName: txt })).status, 400, 'не PDF');
    const signed = await api(supA.token, 'POST', `/contracts/${id}/supplier-sign`, { fileName: scanA });
    assert.equal(signed.status, 200, JSON.stringify(signed.data));
    assert.equal(signed.data.status, 'SUPPLIER_SIGNED');

    // Скан видят стороны, конкурент нет
    const file = (token) => fetch(`${process.env.API_URL || 'http://localhost:5000'}/uploads/${scanA}`, { headers: { Authorization: `Bearer ${token}` } });
    assert.equal((await file(admin)).status, 200);
    assert.equal((await file(supB.token)).status, 403);

    assert.equal((await api(admin, 'POST', `/contracts/${id}/return`, {})).status, 400, 'без замечания');
    const back = await api(admin, 'POST', `/contracts/${id}/return`, { note: 'Нет печати' });
    assert.equal(back.data.status, 'SENT');
    assert.equal(back.data.note, 'Нет печати');
    assert.equal((await api(supA.token, 'POST', `/contracts/${id}/supplier-sign`, { fileName: scanA })).status, 200);

    const adminScan = (await upload(admin, {})).data.fileName;
    const done = await api(admin, 'POST', `/contracts/${id}/admin-sign`, { fileName: adminScan });
    assert.equal(done.status, 200, JSON.stringify(done.data));
    assert.equal(done.data.status, 'SIGNED');
    assert.equal((await api(admin, 'POST', `/contracts/${id}/cancel`, { reason: 'x' })).status, 400, 'подписанный не отменить');

    const notes = await prisma.notification.findMany({ where: { userId: supA.userId, link: `/contracts/${id}` } });
    assert.ok(notes.length >= 3, 'поставщика оповещали');
});

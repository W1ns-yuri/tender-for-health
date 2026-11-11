/**
 * Полный цикл тендера с двух сторон: что видит и что может каждая роль на каждом этапе.
 * Черновик → публикация → заявки → дедлайн → вскрытие → выбор победителя → итоги.
 */
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { api, loginAdmin, newSupplier, newTender, submitOffer, expireDeadline, prisma } = require('./helpers');

const PHARMA = 'Фармацевтика и лекарственные препараты';
let admin, supA, supB, outsider, pending, tender;

before(async () => {
    admin = await loginAdmin();
    supA = await newSupplier(admin, { categoryNames: [PHARMA] });
    supB = await newSupplier(admin, { categoryNames: [PHARMA] });
    outsider = await newSupplier(admin, { categoryNames: ['Ремонт, сервисное обслуживание и клининг ЛПУ'] });
    pending = await newSupplier(admin, { verified: false });
    tender = await newTender(admin, { publish: false });
});

after(() => prisma.$disconnect());

test('черновик не виден поставщику ни в списке, ни по ссылке, ни через документы', async () => {
    const list = await api(supA.token, 'GET', '/tenders');
    const ids = (list.data.tenders || list.data.data || list.data).map((t) => t.id);
    assert.ok(!ids.includes(tender.tenderId), 'черновик в списке поставщика');
    assert.ok([403, 404].includes((await api(supA.token, "GET", `/tenders/${tender.tenderId}`)).status));
    const docs = await api(supA.token, 'GET', `/documents?tenderId=${tender.tenderId}`);
    assert.ok([403, 404].includes(docs.status), `документы черновика отдались: ${docs.status}`);
    const lotDocs = await api(supA.token, 'GET', `/documents?lotId=${tender.lotId}`);
    assert.ok([403, 404].includes(lotDocs.status), `документы лота черновика отдались: ${lotDocs.status}`);
});

test('на черновик нельзя подать заявку', async () => {
    const r = await submitOffer(supA.token, tender, [10, 5]);
    assert.ok(r.status >= 400 && r.status < 500, `заявка на черновик: ${r.status}`);
});

test('публикация: тендер виден, поставщик не может его менять или публиковать', async () => {
    assert.equal((await api(admin, 'POST', `/tenders/${tender.tenderId}/publish`)).status, 200);
    assert.equal((await api(supA.token, 'GET', `/tenders/${tender.tenderId}`)).status, 200);
    assert.equal((await api(supA.token, 'PUT', `/tenders/${tender.tenderId}`, { title: 'x' })).status, 403);
    assert.equal((await api(supA.token, 'DELETE', `/tenders/${tender.tenderId}`)).status, 403);
    assert.equal((await api(supA.token, 'POST', `/tenders/${tender.tenderId}/lots`, { name: 'x' })).status, 403);
});

test('подать заявку: только верифицированный поставщик своей категории, одна на тендер, цена > 0', async () => {
    assert.equal((await submitOffer(pending.token, tender, [10, 5])).status, 403, 'неверифицированный подал заявку');
    assert.equal((await submitOffer(outsider.token, tender, [10, 5])).status, 400, 'чужая категория подала заявку');
    assert.equal((await submitOffer(admin, tender, [10, 5])).status, 403, 'админ подал заявку');
    assert.equal((await submitOffer(supA.token, tender, [0, 5])).status, 400, 'цена 0 принята');
    assert.equal((await submitOffer(supA.token, tender, [-1, 5])).status, 400, 'отрицательная цена принята');

    const a = await submitOffer(supA.token, tender, [10, 5]);
    assert.equal(a.status, 201, JSON.stringify(a.data));
    assert.equal((await submitOffer(supA.token, tender, [9, 4])).status, 400, 'вторая заявка того же поставщика');
    const b = await submitOffer(supB.token, tender, [11, 4]);
    assert.equal(b.status, 201, JSON.stringify(b.data));
    tender.offerA = a.data.id;
    tender.offerB = b.data.id;
});

test('количество задаёт заказчик: подменить quantity нельзя', async () => {
    const spec = await prisma.offerSpecification.findFirst({ where: { offerId: tender.offerA }, include: { tenderSpec: true } });
    assert.equal(Number(spec.quantity), Number(spec.tenderSpec.quantity));
});

test('до вскрытия: цены конкурента не видит никто, включая админа', async () => {
    assert.equal((await api(supA.token, 'GET', `/offers/${tender.offerB}`)).status, 403);
    const forA = await api(supA.token, 'GET', `/offers/tender/${tender.tenderId}`);
    assert.deepEqual(forA.data.map((o) => o.id), [tender.offerA], 'поставщик видит чужие заявки');

    const forAdmin = await api(admin, 'GET', `/offers/tender/${tender.tenderId}`);
    assert.equal(forAdmin.data.length, 2);
    for (const o of forAdmin.data) {
        assert.equal(o.offeredPrice, null, 'админ видит сумму до вскрытия');
        assert.deepEqual(o.specs, [], 'админ видит позиции до вскрытия');
    }
    const one = await api(admin, 'GET', `/offers/${tender.offerA}`);
    assert.ok(one.status === 403 || (one.data.specs || []).length === 0, 'админ открыл чужой конверт по id');
    const evalDetails = await api(admin, 'GET', `/evaluation/tenders/${tender.tenderId}/details`);
    assert.equal(evalDetails.data.isSealed, true);
});

test('до дедлайна вскрыть нельзя, структуру и дедлайн «назад» менять нельзя', async () => {
    assert.equal((await api(admin, 'POST', `/evaluation/open/${tender.tenderId}`)).status, 400);
    assert.equal((await api(admin, 'DELETE', `/tenders/${tender.tenderId}/lots/${tender.lotId}`)).status, 400);
    assert.equal((await api(admin, 'PUT', `/tenders/${tender.tenderId}/lots/${tender.lotId}`, { specs: [] })).status, 400);
    const earlier = new Date(Date.now() + 2 * 864e5).toISOString().slice(0, 10);
    assert.equal((await api(admin, 'PUT', `/tenders/${tender.tenderId}`, { deadline: earlier })).status, 400);
});

test('поставщик не может вскрывать, оценивать и выбирать победителя', async () => {
    for (const [m, p, body] of [
        ['POST', `/evaluation/open/${tender.tenderId}`],
        ['GET', `/evaluation/tenders/${tender.tenderId}/details`],
        ['POST', '/evaluation/award-lot', { tenderId: tender.tenderId, lotId: tender.lotId, offerId: tender.offerA }],
        ['POST', `/evaluation/complete/${tender.tenderId}`],
        ['POST', '/evaluation/select-winner', { tenderId: tender.tenderId, offerId: tender.offerA }],
    ]) {
        assert.equal((await api(supA.token, m, p, body)).status, 403, `${m} ${p}`);
    }
});

test('после дедлайна: заявку не подать и не отозвать', async () => {
    await expireDeadline(tender.tenderId);
    const late = await newSupplier(admin, { categoryNames: [PHARMA] });
    assert.equal((await submitOffer(late.token, tender, [1, 1])).status, 400);
    assert.equal((await api(supA.token, 'DELETE', `/offers/${tender.offerA}`)).status, 400);
});

test('выбрать победителя до вскрытия нельзя', async () => {
    const r = await api(admin, 'POST', '/evaluation/award-lot', { tenderId: tender.tenderId, lotId: tender.lotId, offerId: tender.offerA });
    assert.equal(r.status, 400);
});

test('вскрытие: админ видит цены, поставщики всё ещё не видят чужие', async () => {
    assert.equal((await api(admin, 'POST', `/evaluation/open/${tender.tenderId}`)).status, 200);
    assert.equal((await api(admin, 'POST', `/evaluation/open/${tender.tenderId}`)).status, 400, 'повторное вскрытие');
    const d = await api(admin, 'GET', `/evaluation/tenders/${tender.tenderId}/details`);
    assert.notEqual(d.data.isSealed, true);
    assert.ok(d.data.offers.every((o) => o.specs.length === 2));
    const forA = await api(supA.token, 'GET', `/offers/tender/${tender.tenderId}`);
    assert.deepEqual(forA.data.map((o) => o.id), [tender.offerA]);
});

test('выбор победителя и итоги', async () => {
    const award = await api(admin, 'POST', '/evaluation/award-lot', { tenderId: tender.tenderId, lotId: tender.lotId, offerId: tender.offerA });
    assert.equal(award.status, 200, JSON.stringify(award.data));
    const done = await api(admin, 'POST', `/evaluation/complete/${tender.tenderId}`);
    assert.equal(done.status, 200, JSON.stringify(done.data));
    assert.equal((await api(admin, 'POST', '/evaluation/award-lot', { tenderId: tender.tenderId, lotId: tender.lotId, offerId: tender.offerB })).status, 400, 'победителя сменили после итогов');
});

test('после итогов: победа у победителя, у проигравшего нет; чужие банк и паспорт не видны', async () => {
    const winsA = await api(supA.token, 'GET', '/offers/my-wins');
    const winsB = await api(supB.token, 'GET', '/offers/my-wins');
    const has = (r) => JSON.stringify(r.data).includes(tender.tenderId);
    assert.ok(has(winsA), 'у победителя нет победы');
    assert.ok(!has(winsB), 'у проигравшего есть победа');

    for (const path of [`/offers/tender/${tender.tenderId}`, `/tenders/${tender.tenderId}`]) {
        const r = await api(supB.token, 'GET', path);
        const text = JSON.stringify(r.data);
        for (const field of ['bankAccount', 'passportInfo', 'passportSeries', 'directorPersonalCode', 'taxId']) {
            const foreign = new RegExp(`"${field}":"[^"]+"`).test(text.replace(new RegExp(supB.supplierId, 'g'), ''));
            // поле может быть только у своей заявки; проверяем, что у чужой его нет
            if (foreign) {
                const offers = (r.data.offers || r.data).filter?.((o) => o.supplier && o.supplier.id !== supB.supplierId) || [];
                for (const o of offers) assert.equal(o.supplier[field], undefined, `${path}: виден ${field} конкурента`);
            }
        }
    }
});

test('дашборд поставщика считает только его собственные победы', async () => {
    const a = await api(supA.token, 'GET', '/dashboard/stats');
    const b = await api(supB.token, 'GET', '/dashboard/stats');
    assert.ok(a.data.counters.totalWinners >= 1);
    assert.equal(b.data.counters.totalWinners, 0);
});

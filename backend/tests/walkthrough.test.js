/**
 * Находки сквозного прохода «от регистрации до договора»: аналоги, валюта, единицы измерения,
 * мягкая перепроверка профиля, одинаковые счётчики на главной и в списке.
 */
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { api, upload, loginAdmin, newSupplier, newTender, prisma } = require('./helpers');

const CAT = ['Фармацевтика и лекарственные препараты'];
let admin;

before(async () => { admin = await loginAdmin(); });
after(() => prisma.$disconnect());

test('аналог без названия товара не принимается', async () => {
    const sup = await newSupplier(admin, { categoryNames: CAT });
    const t = await newTender(admin);
    const offer = (equivalentName) => api(sup.token, 'POST', '/offers', {
        tenderId: t.tenderId,
        specs: t.specs.map((s, i) => ({
            tenderSpecId: s.id, unitPrice: 5,
            ...(i === 0 ? { isEquivalent: true, equivalentName, equivalentJustification: 'дешевле' } : {}),
        })),
    });
    const empty = await offer('   ');
    assert.equal(empty.status, 400, 'пустое название аналога');
    assert.match(empty.data.error, /аналог/i);

    const ok = await offer('Амоксициллин Сандоз');
    assert.equal(ok.status, 201, JSON.stringify(ok.data));
    const spec = ok.data.specs.find((s) => s.tenderSpecId === t.specs[0].id);
    assert.equal(spec.equivalentName, 'Амоксициллин Сандоз');
    assert.equal(spec.equivalentJustification, 'дешевле');
});

test('заявка в валюте без курса не принимается, курс попадает в оценку', async () => {
    const sup = await newSupplier(admin, { categoryNames: CAT });
    const t = await newTender(admin);
    const usd = await prisma.currency.findUnique({ where: { code: 'USD' } });
    const tmt = await prisma.currency.findUnique({ where: { code: 'TMT' } });
    const body = { tenderId: t.tenderId, baseCurrencyId: usd.id, specs: t.specs.map((s) => ({ tenderSpecId: s.id, unitPrice: 2 })) };

    await prisma.exchangeRate.deleteMany({ where: { fromCurrencyId: usd.id } });
    const noRate = await api(sup.token, 'POST', '/offers', body);
    assert.equal(noRate.status, 400, 'без курса USD→TMT сумму не сравнить');
    assert.match(noRate.data.error, /Курс USD/);

    await prisma.exchangeRate.create({ data: { fromCurrencyId: usd.id, toCurrencyId: tmt.id, value: 3.5 } });
    try {
        const ok = await api(sup.token, 'POST', '/offers', body);
        assert.equal(ok.status, 201, JSON.stringify(ok.data));
        assert.ok(ok.data.exchangeRates.some((r) => r.currencyId === usd.id && Number(r.value) === 3.5), 'курс зафиксирован в заявке');

        await prisma.tender.update({ where: { id: t.tenderId }, data: { status: 'BAHALANDYRYLDY' } });
        const det = await api(admin, 'GET', `/evaluation/tenders/${t.tenderId}/details`);
        assert.equal(det.status, 200);
        const o = det.data.offers.find((x) => x.id === ok.data.id);
        assert.ok(o.exchangeRates?.length, 'экран оценки получает курс для пересчёта');
    } finally {
        await prisma.exchangeRate.deleteMany({ where: { fromCurrencyId: usd.id } });
    }
});

test('тендер с позицией без единицы измерения не публикуется', async () => {
    const t = await newTender(admin, { publish: false });
    const product = await prisma.generalProduct.findFirst();
    const put = await api(admin, 'PUT', `/tenders/${t.tenderId}/lots/${t.lotId}`, {
        categoryId: t.categoryId, specs: [{ name: 'Без единицы', generalProductId: product.id, quantity: 10 }],
    });
    assert.equal(put.status, 200, JSON.stringify(put.data));
    const pub = await api(admin, 'POST', `/tenders/${t.tenderId}/publish`);
    assert.equal(pub.status, 400);
    assert.match(pub.data.error, /единица измерения/);
});

test('проверенная компания меняет телефон без перепроверки, а счёт только через перепроверку', async () => {
    const sup = await newSupplier(admin, { categoryNames: CAT });
    assert.equal((await upload(sup.token, { supplierId: sup.supplierId })).status, 201);

    const phone = await api(sup.token, 'PUT', '/suppliers/profile', { phone: '+993 65 11-22-33', email: 'new@test.tm' });
    assert.equal(phone.status, 200, JSON.stringify(phone.data));
    assert.equal(phone.data.verificationStatus, 'VERIFIED', 'контакты не снимают проверку');

    const quiet = await api(sup.token, 'PUT', '/suppliers/profile', { phone: '+993 65 44-55-66', submitForReview: false });
    assert.equal(quiet.status, 200, 'контакты можно сохранить и без отправки на проверку');

    const bank = await api(sup.token, 'PUT', '/suppliers/profile', { bankAccount: '12345678901234567890' });
    assert.equal(bank.status, 200, JSON.stringify(bank.data));
    assert.equal(bank.data.verificationStatus, 'PENDING_REVIEW', 'новый счёт проверяет админ');
});

test('счётчик открытых тендеров на главной совпадает со списком тендеров поставщика', async () => {
    const sup = await newSupplier(admin, { categoryNames: CAT });
    await newTender(admin);
    const stats = await api(sup.token, 'GET', '/dashboard/stats');
    const list = await api(sup.token, 'GET', '/tenders?status=ACYK');
    assert.equal(stats.status, 200);
    assert.equal(list.status, 200);
    const items = Array.isArray(list.data) ? list.data : list.data.items || list.data.tenders || [];
    assert.ok(items.length > 0, 'новый тендер по категории поставщика виден в списке');
    assert.equal(stats.data.counters.totalOpenTenders, items.filter((x) => x.status === 'ACYK').length);
});

test('у организатора на главной есть блок «Требует внимания»', async () => {
    const stats = await api(admin, 'GET', '/dashboard/stats');
    assert.equal(stats.status, 200);
    for (const k of ['pendingSuppliers', 'awaitingOpening', 'inEvaluation', 'contractsToSend', 'contractsToSign']) {
        assert.equal(typeof stats.data.attention[k], 'number', k);
    }
    const sup = await newSupplier(admin, { categoryNames: CAT });
    assert.equal((await api(sup.token, 'GET', '/dashboard/stats')).data.attention, null, 'поставщику блок не отдаём');
});

test('номер заявки читаемый: номер тендера / порядковый номер', async () => {
    const t = await newTender(admin);
    const tender = await prisma.tender.findUnique({ where: { id: t.tenderId } });
    const a = await newSupplier(admin, { categoryNames: CAT });
    const b = await newSupplier(admin, { categoryNames: CAT });
    const body = { tenderId: t.tenderId, number: 'HACK', specs: t.specs.map((s) => ({ tenderSpecId: s.id, unitPrice: 3 })) };
    const o1 = await api(a.token, 'POST', '/offers', body);
    const o2 = await api(b.token, 'POST', '/offers', body);
    assert.equal(o1.data.number, `${tender.tenderNumber}/01`, 'номер задаёт сервер, не поставщик');
    assert.equal(o2.data.number, `${tender.tenderNumber}/02`);
});

test('организатор видит, что у компаний одинаковый расчётный счёт', async () => {
    const a = await newSupplier(admin, { verified: false });
    const b = await newSupplier(admin, { verified: false });
    const acc = String(Date.now()).padEnd(20, '7');
    await prisma.supplier.updateMany({ where: { id: { in: [a.supplierId, b.supplierId] } }, data: { bankAccount: acc } });
    const r = await api(admin, 'GET', `/suppliers/${a.supplierId}`);
    assert.deepEqual(r.data.sameBankAccount.map((x) => x.id), [b.supplierId]);
    const own = await api(a.token, 'GET', `/suppliers/${a.supplierId}`);
    assert.deepEqual(own.data.sameBankAccount, [], 'поставщику чужие компании не показываем');
});

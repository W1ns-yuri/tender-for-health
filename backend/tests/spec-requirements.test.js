/**
 * Требования к характеристикам позиции лота и сравнение с ними аналога поставщика.
 * Обязательное требование нарушить нельзя (победить не даст), желательное только подсвечивается.
 */
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { api, loginAdmin, newSupplier, newTender, expireDeadline, prisma, RUN } = require('./helpers');

let admin, supA, supB, diag, color, cat;

before(async () => {
    admin = await loginAdmin();
    supA = await newSupplier(admin, { categoryNames: ['Фармацевтика и лекарственные препараты'] });
    supB = await newSupplier(admin, { categoryNames: ['Фармацевтика и лекарственные препараты'] });
    diag = (await api(admin, 'POST', '/catalogs/attributes', { name: `Диагональ ${RUN}`, type: 'NUMBER', unit: 'дюйм' })).data;
    color = (await api(admin, 'POST', '/catalogs/attributes', { name: `Цвет ${RUN}`, type: 'LIST', options: 'белый, чёрный' })).data;
    cat = (await api(admin, 'POST', '/catalogs/categories', { name: `Мониторы ${RUN}`, type: 'GOODS' })).data;
    await api(admin, 'PUT', `/catalogs/categories/${cat.id}/attributes`, { attributes: [{ attributeId: diag.id }, { attributeId: color.id }] });
});

after(() => prisma.$disconnect());

const reqSpecs = (t, requirements) => t.specs.map((s, i) => ({
    name: s.name, generalProductId: s.generalProductId, quantity: Number(s.quantity),
    requirements: i === 0 ? requirements : [],
}));

test('требования сохраняются и проверяются по типу характеристики', async () => {
    const t = await newTender(admin, { publish: false });
    const put = (requirements) => api(admin, 'PUT', `/tenders/${t.tenderId}/lots/${t.lotId}`, { specs: reqSpecs(t, requirements) });

    assert.equal((await put([{ attributeId: color.id, operator: 'GTE', value: 'белый' }])).status, 400, '«не меньше» у списка');
    assert.equal((await put([{ attributeId: color.id, value: 'зелёный' }])).status, 400, 'нет такого варианта');
    assert.equal((await put([{ attributeId: diag.id, operator: 'GTE', value: 'большой' }])).status, 400, 'не число');
    assert.equal((await put([{ value: '3 года' }])).status, 400, 'своё требование без названия');
    assert.equal((await put([{ attributeId: diag.id, value: '23' }, { attributeId: diag.id, value: '24' }])).status, 400, 'дважды');

    const ok = await put([
        { attributeId: diag.id, operator: 'GTE', value: '23,5' },
        { attributeId: color.id, value: 'Белый', isMandatory: false },
        { customName: 'Гарантия', value: '3 года' },
        { attributeId: diag.id, value: '' }, // пустая строка формы пропускается
    ]);
    assert.equal(ok.status, 200, JSON.stringify(ok.data));
    const tender = await api(admin, 'GET', `/tenders/${t.tenderId}`);
    const reqs = tender.data.lots[0].specs[0].requirements;
    assert.deepEqual(reqs.map((r) => [r.operator, r.value, r.isMandatory]), [['GTE', '23.5', true], ['EQ', 'белый', false], ['EQ', '3 года', true]]);
    assert.equal(reqs[0].attribute.name, diag.name);
});

test('аналог с нарушением обязательного требования не может победить, желательное только подсвечивается', async () => {
    const t = await newTender(admin, { publish: false });
    const put = await api(admin, 'PUT', `/tenders/${t.tenderId}/lots/${t.lotId}`, {
        specs: reqSpecs(t, [
            { attributeId: diag.id, operator: 'GTE', value: '23' },
            { attributeId: color.id, value: 'белый', isMandatory: false },
        ]),
    });
    assert.equal(put.status, 200, JSON.stringify(put.data));
    assert.equal((await api(admin, 'POST', `/tenders/${t.tenderId}/publish`)).status, 200);
    // Позиции лота пересоздаются при сохранении — берём актуальные id
    t.specs = await prisma.tenderSpecification.findMany({ where: { tenderId: t.tenderId }, orderBy: { positionNumber: 'asc' } });

    // Поставщики добавляют свои аналоги в справочник (на проверку)
    const mkProduct = (sup, d, c) => api(sup.token, 'POST', '/catalogs/products', {
        name: `Монитор ${d} ${RUN}`, categoryId: cat.id,
        attributes: [{ attributeId: diag.id, value: d }, { attributeId: color.id, value: c }],
    });
    const small = await mkProduct(supA, '21,5', 'белый');
    const big = await mkProduct(supB, '24', 'чёрный');
    assert.equal(small.status, 201, JSON.stringify(small.data));

    const offer = (sup, productId) => api(sup.token, 'POST', '/offers', {
        tenderId: t.tenderId,
        specs: t.specs.map((s, i) => ({
            tenderSpecId: s.id, name: s.name, quantity: Number(s.quantity), unitPrice: 10 + i,
            ...(i === 0 ? { generalProductId: productId, isEquivalent: true, equivalentName: 'аналог' } : {}),
        })),
    });
    const oA = await offer(supA, small.data.id);
    const oB = await offer(supB, big.data.id);
    assert.equal(oA.status, 201, JSON.stringify(oA.data));
    assert.equal(oB.status, 201, JSON.stringify(oB.data));

    await expireDeadline(t.tenderId);
    assert.equal((await api(admin, 'POST', `/evaluation/open/${t.tenderId}`)).status, 200);

    const details = await api(admin, 'GET', `/evaluation/tenders/${t.tenderId}/details`);
    const checkOf = (offerId) => details.data.offers.find((o) => o.id === offerId).specs.find((s) => s.tenderSpecId === t.specs[0].id).requirementCheck;
    assert.equal(checkOf(oA.data.id).mandatoryFailed, 1, 'A: 21,5 < 23');
    assert.equal(checkOf(oA.data.id).optionalFailed, 0);
    assert.equal(checkOf(oB.data.id).mandatoryFailed, 0);
    assert.equal(checkOf(oB.data.id).optionalFailed, 1, 'B: чёрный вместо белого');

    const awardA = await api(admin, 'POST', '/evaluation/award-lot', { tenderId: t.tenderId, lotId: t.lotId, offerId: oA.data.id });
    assert.equal(awardA.status, 400);
    assert.match(awardA.data.error, /обязательным требованиям/);
    assert.match(awardA.data.error, /не меньше 23/);
    const awardB = await api(admin, 'POST', '/evaluation/award-lot', { tenderId: t.tenderId, lotId: t.lotId, offerId: oB.data.id });
    assert.ok(awardB.status < 300, JSON.stringify(awardB.data));
});

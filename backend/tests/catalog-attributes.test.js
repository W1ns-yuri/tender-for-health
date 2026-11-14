/**
 * Характеристики товаров, дерево категорий, проверка товаров от поставщиков, отложенная публикация.
 */
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { api, upload, loginAdmin, newSupplier, newTender, prisma, RUN } = require('./helpers');

const PNG = Buffer.from('89504e470d0a1a0a0000000d49484452', 'hex'); // начало настоящего PNG
let admin, sup, other, pending, diag, color, vesa, parent, child;

before(async () => {
    admin = await loginAdmin();
    sup = await newSupplier(admin, { categoryNames: ['Фармацевтика и лекарственные препараты'] });
    other = await newSupplier(admin, { categoryNames: ['Фармацевтика и лекарственные препараты'] });
    pending = await newSupplier(admin, { verified: false });
});

after(() => prisma.$disconnect());

test('админ создаёт характеристики; поставщик не может', async () => {
    assert.equal((await api(sup.token, 'POST', '/catalogs/attributes', { name: 'x' })).status, 403);
    diag = (await api(admin, 'POST', '/catalogs/attributes', { name: `Диагональ ${RUN}`, type: 'NUMBER', unit: 'дюйм' })).data;
    color = (await api(admin, 'POST', '/catalogs/attributes', { name: `Цвет ${RUN}`, type: 'LIST', options: 'белый, чёрный' })).data;
    vesa = (await api(admin, 'POST', '/catalogs/attributes', { name: `Крепление ${RUN}`, type: 'BOOLEAN' })).data;
    assert.ok(diag.id && color.id && vesa.id);
    assert.deepEqual(color.options, ['белый', 'чёрный']);
    assert.equal((await api(admin, 'POST', '/catalogs/attributes', { name: 'Список', type: 'LIST', options: 'один' })).status, 400, 'список из 1 варианта');
    assert.equal((await api(admin, 'POST', '/catalogs/attributes', { name: '', type: 'TEXT' })).status, 400);
});

test('дерево категорий: подкатегория наследует характеристики, цикл запрещён', async () => {
    parent = (await api(admin, 'POST', '/catalogs/categories', { name: `Электроника ${RUN}` })).data;
    child = (await api(admin, 'POST', '/catalogs/categories', { name: `Мониторы ${RUN}`, parentId: parent.id })).data;
    assert.equal((await api(admin, 'PUT', `/catalogs/categories/${parent.id}/attributes`, { attributes: [{ attributeId: color.id }] })).status, 200);
    assert.equal((await api(admin, 'PUT', `/catalogs/categories/${child.id}/attributes`, {
        attributes: [{ attributeId: diag.id, isRequired: true }, { attributeId: vesa.id }],
    })).status, 200);
    const r = await api(sup.token, 'GET', `/catalogs/categories/${child.id}/attributes`);
    assert.deepEqual(r.data.attributes.map((a) => a.attributeId), [color.id, diag.id, vesa.id]);
    assert.equal(r.data.attributes.find((a) => a.attributeId === color.id).inheritedFrom, parent.name);
    assert.equal((await api(admin, 'PUT', `/catalogs/categories/${parent.id}`, { parentId: child.id })).status, 400, 'цикл');
    assert.equal((await api(sup.token, 'PUT', `/catalogs/categories/${child.id}/attributes`, { attributes: [] })).status, 403);
});

test('значения характеристик проверяются по типу и обязательности', async () => {
    const base = { name: `Монитор ${RUN}`, categoryId: child.id };
    assert.equal((await api(admin, 'POST', '/catalogs/products', { ...base, attributes: [] })).status, 400, 'без обязательной диагонали');
    assert.equal((await api(admin, 'POST', '/catalogs/products', { ...base, attributes: [{ attributeId: diag.id, value: 'большой' }] })).status, 400);
    assert.equal((await api(admin, 'POST', '/catalogs/products', { ...base, attributes: [{ attributeId: diag.id, value: '23' }, { attributeId: color.id, value: 'розовый' }] })).status, 400);
    const other = await api(admin, 'POST', '/catalogs/categories', { name: `Другая ${RUN}` });
    const foreign = await api(admin, 'POST', '/catalogs/attributes', { name: `Чужая ${RUN}`, type: 'TEXT' });
    assert.equal((await api(admin, 'POST', '/catalogs/products', { name: 'x', categoryId: other.data.id, attributes: [{ attributeId: foreign.data.id, value: 'a' }] })).status, 400, 'характеристика не из категории');
    const ok = await api(admin, 'POST', '/catalogs/products', {
        ...base, officialUrl: 'https://www.hp.com/monitor',
        attributes: [{ attributeId: diag.id, value: '23,5' }, { attributeId: color.id, value: 'Белый' }, { attributeId: vesa.id, value: 'нет' }, { customName: 'Без крепления на стену', value: 'да' }],
    });
    assert.equal(ok.status, 201, JSON.stringify(ok.data));
    assert.equal(ok.data.moderationStatus, 'APPROVED');
    const vals = Object.fromEntries(ok.data.attributeValues.map((v) => [v.attribute?.name || v.customName, v.value]));
    assert.equal(vals[diag.name], '23.5');
    assert.equal(vals[color.name], 'белый');
    assert.equal(vals[vesa.name], 'false');
    assert.equal(vals['Без крепления на стену'], 'да');
    assert.equal((await api(admin, 'POST', '/catalogs/products', { ...base, officialUrl: 'javascript:alert(1)', attributes: [{ attributeId: diag.id, value: '23' }] })).status, 400);
});

test('товар от поставщика: на проверке, виден только ему и админу; после одобрения всем', async () => {
    assert.equal((await api(pending.token, 'POST', '/catalogs/products', { name: 'x' })).status, 403, 'неодобренный поставщик');
    const img = await upload(sup.token, {}, { name: 'm.png', type: 'image/png', content: PNG });
    assert.equal(img.status, 201, JSON.stringify(img.data));
    const pdf = await upload(sup.token, {}, { name: 'm.pdf' });
    assert.equal((await api(sup.token, 'POST', '/catalogs/products', { name: 'x', imageFileName: pdf.data.fileName })).status, 400, 'pdf вместо фото');
    const foreignImg = await upload(other.token, {}, { name: 'o.png', type: 'image/png', content: PNG });
    assert.equal((await api(sup.token, 'POST', '/catalogs/products', { name: 'x', imageFileName: foreignImg.data.fileName })).status, 400, 'чужое фото');

    const p = await api(sup.token, 'POST', '/catalogs/products', {
        name: `HP 24 ${RUN}`, categoryId: child.id, imageFileName: img.data.fileName,
        attributes: [{ attributeId: diag.id, value: '24' }],
    });
    assert.equal(p.status, 201, JSON.stringify(p.data));
    assert.equal(p.data.moderationStatus, 'PENDING');
    const has = async (token) => ((await api(token, 'GET', '/catalogs/products')).data || []).some((x) => x.id === p.data.id);
    assert.equal(await has(sup.token), true, 'автор видит свой');
    assert.equal(await has(other.token), false, 'другой поставщик не видит');
    assert.equal(await has(null), false, 'гость не видит');
    assert.equal(await has(admin), true);
    const imgUrl = `/../uploads/${img.data.fileName}`;
    assert.equal((await api(other.token, 'GET', imgUrl)).status, 403, 'фото до проверки');

    assert.equal((await api(sup.token, 'POST', `/catalogs/products/${p.data.id}/approve`)).status, 403);
    assert.equal((await api(admin, 'POST', `/catalogs/products/${p.data.id}/reject`, {})).status, 400, 'отказ без причины');
    assert.equal((await api(admin, 'POST', `/catalogs/products/${p.data.id}/approve`)).status, 200);
    assert.equal(await has(other.token), true, 'после одобрения видят все');
    assert.equal(await has(null), true);
    const pic = await fetch((process.env.API_URL || 'http://localhost:5000') + `/uploads/${img.data.fileName}`, { headers: { Authorization: `Bearer ${other.token}` } });
    assert.equal(pic.status, 200, 'фото после проверки');
    assert.equal((await api(sup.token, 'PUT', `/catalogs/products/${p.data.id}`, { name: 'y' })).status, 403, 'поставщик не правит справочник');
});

test('отложенная публикация: тендер ждёт даты, поставщик его не видит, потом он публикуется сам', async () => {
    const { publishScheduledTenders } = require('../src/services/tenderScheduler');
    const t = await newTender(admin, { publish: false });
    const past = new Date(Date.now() - 60e3).toISOString();
    assert.equal((await api(admin, 'POST', `/tenders/${t.tenderId}/publish`, { publishAt: past })).status, 400, 'дата в прошлом');
    const future = new Date(Date.now() + 3600e3).toISOString();
    const r = await api(admin, 'POST', `/tenders/${t.tenderId}/publish`, { publishAt: future });
    assert.equal(r.status, 200, JSON.stringify(r.data));
    assert.equal(r.data.status, 'TASLAMA');
    assert.ok([403, 404].includes((await api(sup.token, 'GET', `/tenders/${t.tenderId}`)).status), 'запланированный виден поставщику');

    assert.equal((await api(admin, 'DELETE', `/tenders/${t.tenderId}/schedule`)).status, 200);
    assert.equal((await prisma.tender.findUnique({ where: { id: t.tenderId } })).publishAt, null);

    await api(admin, 'POST', `/tenders/${t.tenderId}/publish`, { publishAt: future });
    await prisma.tender.update({ where: { id: t.tenderId }, data: { publishAt: new Date(Date.now() - 1000) } });
    await publishScheduledTenders();
    const after = await prisma.tender.findUnique({ where: { id: t.tenderId } });
    assert.equal(after.status, 'ACYK');
    assert.equal(after.publishAt, null);
    assert.equal((await api(sup.token, 'GET', `/tenders/${t.tenderId}`)).status, 200);
});

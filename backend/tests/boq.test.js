/**
 * Ведомость объёмов работ: разделы позиций и разбор вставки из Excel.
 */
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const { pathToFileURL } = require('url');
const { api, loginAdmin, newTender, prisma } = require('./helpers');

let admin, units;

before(async () => {
    admin = await loginAdmin();
    units = await prisma.unit.findMany();
});

after(() => prisma.$disconnect());

test('строительные единицы есть в справочнике', () => {
    const have = new Set(units.map((u) => u.shortName));
    for (const u of ['м', 'п.м', 'м²', 'м³', 'т', 'этап']) assert.ok(have.has(u), `нет единицы ${u}`);
});

test('разделы позиций сохраняются по порядку', async () => {
    const t = await newTender(admin, { publish: false });
    const unit = (s) => units.find((u) => u.shortName === s).id;
    const put = await api(admin, 'PUT', `/tenders/${t.tenderId}/lots/${t.lotId}`, {
        lotType: 'WORKS',
        specs: [
            { name: 'Демонтаж перегородок', quantity: 45.5, unitId: unit('м³'), section: 'Демонтаж' },
            { name: 'Вывоз мусора', quantity: 12, unitId: unit('т'), section: 'Демонтаж' },
            { name: 'Штукатурка стен', quantity: 860, unitId: unit('м²'), section: '  Отделка  ' },
            { name: 'Уборка', quantity: 1, unitId: unit('этап') },
        ],
    });
    assert.equal(put.status, 200, JSON.stringify(put.data));
    const tender = await api(admin, 'GET', `/tenders/${t.tenderId}`);
    const specs = tender.data.lots[0].specs;
    assert.deepEqual(specs.map((s) => s.section), ['Демонтаж', 'Демонтаж', 'Отделка', null]);
    assert.equal(specs[0].quantity, 45.5);
});

test('разбор вставки из Excel: разделы, шапка, итоги, единицы', async () => {
    const { parseBoq } = await import(pathToFileURL(path.resolve(__dirname, '../../frontend/src/utils/boqParser.js')).href);
    const text = [
        '№\tНаименование работ\tЕд. изм.\tКол-во',
        '1\tДемонтажные работы',
        '1.1\tДемонтаж перегородок\tм3\t45,5',
        '1.2\tВывоз мусора\tтн\t1 200\tс погрузкой',
        '2\tОтделка',
        '2.1\tШтукатурка стен\tкв.м\t860',
        '2.2\tПокраска\tлитр\t10',
        '2.3\tНулевой объём\tм2\t0',
        '\tИтого\t\t',
        '3;Монтаж окон;шт;12',
    ].join('\n');
    const r = parseBoq(text, units);
    assert.deepEqual(r.rows.map((x) => [x.section, x.name, x.quantity]), [
        ['Демонтажные работы', 'Демонтаж перегородок', 45.5],
        ['Демонтажные работы', 'Вывоз мусора', 1200],
        ['Отделка', 'Штукатурка стен', 860],
        ['Отделка', 'Покраска', 10],
        ['Отделка', 'Монтаж окон', 12],
    ]);
    const short = (id) => units.find((u) => u.id === id)?.shortName;
    assert.deepEqual(r.rows.map((x) => short(x.unitId) || null), ['м³', 'т', 'м²', null, 'шт']);
    assert.equal(r.rows[1].desc, 'с погрузкой');
    assert.equal(r.sections, 2);
    assert.equal(r.warnings.length, 2, r.warnings.join('; ')); // «литр» и нулевой объём
});

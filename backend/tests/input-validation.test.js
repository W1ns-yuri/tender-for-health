/**
 * «Тест на дурака»: то, что обычный человек не сделает, но запрос можно отправить в обход формы.
 * Мусор в полях, огромные числа и тексты, подделанные файлы, двойной клик, повтор ИНН.
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { api, upload, loginAdmin, newSupplier, newTender, submitOffer, prisma, RUN } = require('./helpers');
const out = [];
const chk = (name, r, ok) => { const good = ok(r.status, r.data); out.push(`${good ? 'OK ' : 'BAD'} ${r.status} ${name}${good ? '' : '  -> ' + JSON.stringify(r.data).slice(0, 160)}`); };
const is4xx = (s) => s >= 400 && s < 500;
test('сервер отбивает мусорные и странные данные', async () => {
  const admin = await loginAdmin();
  const sup = await newSupplier(admin, { categoryNames: ['Фармацевтика и лекарственные препараты'] });
  const cat = await prisma.category.findFirst(); const client = await prisma.client.findFirst();
  const base = { type: 'YERLI', status: 'TASLAMA', visibility: 'ACYK', categoryId: cat.id, clientId: client.id, procurementType: 'GOODS', announcementDate: new Date().toISOString().slice(0,10), deadline: new Date(Date.now()+7*864e5).toISOString().slice(0,10), lots: [] };
  const num = () => `F-${RUN}-${Math.random().toString(36).slice(2,6)}`;
  // --- Админ делает странное при создании тендера
  const noTitle = await api(admin, 'POST', '/tenders', { ...base, tenderNumber: num(), title: '' });
  chk('черновик без названия сохраняется (автосохранение)', noTitle, (s) => s === 201);
  { const pr = await prisma.generalProduct.findFirst(); const lot = await api(admin, 'POST', `/tenders/${noTitle.data.id}/lots`, { name: 'L', specs: [{ name: 'x', generalProductId: pr.id, quantity: 1 }] });
    chk('…но опубликовать без названия нельзя', await api(admin, 'POST', `/tenders/${noTitle.data.id}/publish`), (s, d) => s === 400 && /название/.test(d.error)); }
  chk('название из пробелов не сохраняется как пробелы', await api(admin, 'POST', '/tenders', { ...base, tenderNumber: num(), title: '     ' }), (s, d) => s === 201 && d.title === 'Без названия');
  chk('название 20 000 символов', await api(admin, 'POST', '/tenders', { ...base, tenderNumber: num(), title: 'А'.repeat(20000) }), is4xx);
  const xss = await api(admin, 'POST', '/tenders', { ...base, tenderNumber: num(), title: '<img src=x onerror=alert(1)> 💊' });
  chk('XSS/эмодзи в названии сохраняется как текст', xss, (s) => s === 201);
  chk('дедлайн в 1970', await api(admin, 'POST', '/tenders', { ...base, tenderNumber: num(), title: 'x', deadline: '1970-01-01' }), is4xx);
  chk('дедлайн в 9999', await api(admin, 'POST', '/tenders', { ...base, tenderNumber: num(), title: 'x', deadline: '9999-12-31' }), is4xx);
  chk('дедлайн "завтра" текстом', await api(admin, 'POST', '/tenders', { ...base, tenderNumber: num(), title: 'x', deadline: 'завтра' }), is4xx);
  chk('дедлайн раньше даты объявления', await api(admin, 'POST', '/tenders', { ...base, tenderNumber: num(), title: 'x', announcementDate: '2027-01-10', deadline: new Date(Date.now()+3*864e5).toISOString().slice(0,10) }), is4xx);
  const dupNum = num();
  await api(admin, 'POST', '/tenders', { ...base, tenderNumber: dupNum, title: 'x' });
  chk('повтор номера тендера', await api(admin, 'POST', '/tenders', { ...base, tenderNumber: dupNum, title: 'y' }), is4xx);
  chk('несуществующая категория', await api(admin, 'POST', '/tenders', { ...base, tenderNumber: num(), title: 'x', categoryId: '00000000-0000-0000-0000-000000000000' }), is4xx);
  chk('id не UUID', await api(admin, 'GET', '/tenders/abc'), is4xx);
  chk('id не UUID в лоте', await api(admin, 'PUT', '/tenders/abc/lots/xyz', {}), is4xx);
  // --- Лоты и позиции
  const t = await newTender(admin, { publish: false });
  const prods = await prisma.generalProduct.findMany({ take: 1 });
  for (const [label, q] of [['количество -5', -5], ['количество 0', 0], ['количество "abc"', 'abc'], ['количество 1e20', 1e20], ['количество 2.5 штуки', 2.5]]) {
    chk(label, await api(admin, 'PUT', `/tenders/${t.tenderId}/lots/${t.lotId}`, { categoryId: t.categoryId, specs: [{ name: 'x', generalProductId: prods[0].id, quantity: q }] }), label.includes('2.5') ? (s) => s === 200 : is4xx);
  }
  chk('позиция без названия просто пропускается', await api(admin, 'PUT', `/tenders/${t.tenderId}/lots/${t.lotId}`, { categoryId: t.categoryId, specs: [{ quantity: 5 }] }), (s, d) => s === 200);
  chk('лот с номером -1', await api(admin, 'POST', `/tenders/${t.tenderId}/lots`, { lotNumber: -1, name: 'x' }), is4xx);
  const unnamed = await api(admin, 'POST', `/tenders/${t.tenderId}/lots`, { name: '' });
  chk('лот без названия получает «Лот №N»', unnamed, (s, d) => s === 201 && /Лот №/.test(d.name));
  const del = await api(admin, 'DELETE', `/tenders/${t.tenderId}/lots/${unnamed.data.id}`);
  // восстановим валидные позиции и проверим двойную публикацию
  await api(admin, 'PUT', `/tenders/${t.tenderId}/lots/${t.lotId}`, { categoryId: t.categoryId, specs: [{ name: 'x', generalProductId: prods[0].id, quantity: 10 }] });
  const [p1, p2] = await Promise.all([api(admin, 'POST', `/tenders/${t.tenderId}/publish`), api(admin, 'POST', `/tenders/${t.tenderId}/publish`)]);
  chk('двойной клик «Опубликовать»: одна 200, вторая 400', { status: [p1.status, p2.status].sort().join('+'), data: [p1.data, p2.data] }, (s) => s === '200+400');
  // --- Поставщик делает странное
  const pub = await newTender(admin);
  const other = await newTender(admin);
  chk('цена 1e30', await submitOffer(sup.token, pub, [1e30, 1]), is4xx);
  chk('цена "дёшево"', await submitOffer(sup.token, pub, ['дёшево', 1]), is4xx);
  chk('цена NaN/null', await submitOffer(sup.token, pub, [null, 1]), is4xx);
  chk('позиции из чужого тендера', await api(sup.token, 'POST', '/offers', { tenderId: pub.tenderId, specs: other.specs.map((s) => ({ tenderSpecId: s.id, quantity: Number(s.quantity), unitPrice: 5 })) }), is4xx);
  chk('пустой список позиций', await api(sup.token, 'POST', '/offers', { tenderId: pub.tenderId, specs: [] }), is4xx);
  chk('одна позиция дважды', await api(sup.token, 'POST', '/offers', { tenderId: pub.tenderId, specs: [pub.specs[0], pub.specs[0]].map((s) => ({ tenderSpecId: s.id, quantity: Number(s.quantity), unitPrice: 5 })) }), is4xx);
  chk('цена с 10 знаками после запятой', await submitOffer(sup.token, pub, [10.1234567891, 1]), (s) => s === 201 || is4xx(s));
  // --- Файлы
  chk('exe переименованный в .pdf', await upload(sup.token, { supplierId: sup.supplierId }, { name: 'virus.pdf', type: 'application/pdf', content: 'MZ\x90\x00 this is exe' }), is4xx);
  chk('файл .exe', await upload(sup.token, { supplierId: sup.supplierId }, { name: 'virus.exe', type: 'application/x-msdownload', content: 'MZ' }), is4xx);
  chk('html под видом картинки', await upload(sup.token, { supplierId: sup.supplierId }, { name: 'x.png', type: 'image/png', content: '<script>alert(1)</script>' }), is4xx);
  chk('пустой файл 0 байт', await upload(sup.token, { supplierId: sup.supplierId }, { name: 'empty.pdf', content: '' }), is4xx);
  chk('имя файла с ../ обрезается до безопасного', await upload(sup.token, { supplierId: sup.supplierId }, { name: '../../etc.pdf' }), (s, d) => (s === 201 && !d.fileName.includes('..')) || is4xx(s));
  chk('файл 30 МБ', await upload(sup.token, { supplierId: sup.supplierId }, { name: 'big.pdf', content: '%PDF-' + 'a'.repeat(30 * 1024 * 1024) }), is4xx);
  // --- Регистрация
  const reg = (b) => api(null, 'POST', '/auth/register', { username: `r_${Math.random().toString(36).slice(2,7)}@t.tm`, password: 'TestPass123', firstName: 'A', lastName: 'B', phone: '+993 65 00-00-00', companyName: 'Co', taxId: String(10000000 + Math.floor(Math.random()*89999999)), countryCode: 'TM', ...b });
  chk('пароль "1"', await reg({ password: '1' }), is4xx);
  chk('email без @', await reg({ username: 'просто_текст' }), is4xx);
  chk('телефон буквами', await reg({ phone: 'позвоните мне' }), is4xx);
  chk('ИНН буквами', await reg({ taxId: 'ABCDEFG' }), is4xx);
  chk('компания 5000 символов', await reg({ companyName: 'Я'.repeat(5000) }), is4xx);
  chk('SQL-инъекция в логине', await api(null, 'POST', '/auth/login', { username: "admin' OR '1'='1", password: 'x' }), (s) => s === 401 || s === 400);
  chk('логин объектом (NoSQL-приём)', await api(null, 'POST', '/auth/login', { username: { not: '' }, password: { not: '' } }), (s) => s === 400 || s === 401);
  const exist = await reg({});
  chk('тот же ИНН второй раз', await reg({ taxId: (await prisma.supplier.findFirst({ where: { userId: exist.data?.user?.id } }))?.taxId }), is4xx);
  await prisma.$disconnect();
  assert.deepEqual(out.filter((l) => l.startsWith('BAD')), []);
});

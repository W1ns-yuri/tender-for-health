/**
 * Разбор ведомости объёмов, вставленной из Excel (или CSV через «;»).
 *
 * Каждая строка: [№] Наименование | Ед. | Объём [| Примечание]
 * Строка без объёма — это заголовок раздела («Демонтажные работы»): он становится разделом для строк ниже.
 * Шапку таблицы («Наименование работ | Ед. изм. | Кол-во») пропускаем.
 */

const HEADER_RE = /наименован|название|вид работ|ед\.?\s*изм|кол-?во|количеств|объ[её]м/i;
const TOTAL_RE = /^(итого|всего|в\s*т\.?\s*ч)/i;
const ROW_NUMBER_RE = /^\d+(\.\d+)*\.?$/;

// Как люди пишут единицы в сметах → как они записаны в справочнике
const UNIT_ALIASES = {
  'м2': 'м²', 'm2': 'м²', 'квм': 'м²', 'кв.м': 'м²', 'м.кв': 'м²',
  'м3': 'м³', 'm3': 'м³', 'кубм': 'м³', 'куб.м': 'м³', 'м.куб': 'м³',
  'пм': 'п.м', 'пог.м': 'п.м', 'мп': 'п.м',
  'тн': 'т', 'тонна': 'т', 'шт.': 'шт', 'компл.': 'компл', 'комплект': 'компл',
};

const squash = (s) => String(s ?? '').toLowerCase().replace(/\s+/g, '');
const squashNoDots = (s) => squash(s).replace(/\.+$/, '');

/** Число из ячейки: «1 250,5», «1.250,50», «1,250.50» → 1250.5; не число → NaN */
export function parseNumber(cell) {
  let s = String(cell ?? '').replace(/[\s\u00a0]/g, '');
  if (s.includes(',') && s.includes('.')) {
    // Разделитель дробной части — тот, что правее; другой — разряды
    s = s.lastIndexOf(',') > s.lastIndexOf('.') ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, '');
  } else {
    s = s.replace(',', '.');
  }
  if (!/^-?\d+(\.\d+)?$/.test(s)) return NaN;
  return Number(s);
}

/**
 * Текст из буфера → строки ячеек. Excel берёт в кавычки ячейку с переносом строки или кавычкой внутри,
 * поэтому делить просто по \n нельзя: многострочное наименование развалилось бы на несколько позиций.
 * Без табуляции считаем, что это CSV через «;».
 */
export function splitCells(text) {
  const src = String(text ?? '').replace(/\r\n?/g, '\n');
  const sep = src.includes('\t') ? '\t' : ';';
  const lines = [];
  let row = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"' && src[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"' && cell === '') quoted = true;
    else if (ch === sep) { row.push(cell); cell = ''; }
    else if (ch === '\n') { row.push(cell); lines.push(row); row = []; cell = ''; }
    else cell += ch;
  }
  row.push(cell);
  lines.push(row);
  return lines.map((r) => r.map((c) => c.replace(/\s+/g, ' ').trim()));
}

/** Найти единицу справочника по тексту ячейки */
export function matchUnit(cell, units) {
  const raw = squash(cell);
  if (!raw) return null;
  const alias = UNIT_ALIASES[raw] || UNIT_ALIASES[squashNoDots(raw)] || raw;
  const want = [alias, squashNoDots(alias)];
  return units.find((u) => want.includes(squash(u.shortName)) || want.includes(squashNoDots(u.shortName)))
    || units.find((u) => want.includes(squash(u.name)))
    || null;
}

/**
 * text: вставленный текст; units: справочник единиц [{ id, name, shortName }].
 * Возвращает { rows: [{ name, unitId, unitText, quantity, section, desc, line }], warnings: [строки], sections: число }.
 */
export function parseBoq(text, units = []) {
  const rows = [];
  const warnings = [];
  const sections = new Set();
  let section = '';
  const isNum = (c) => !Number.isNaN(parseNumber(c));

  splitCells(text).forEach((raw, i) => {
    const lineNo = i + 1;
    // Строка из CSV «;» среди вставки из Excel
    let cells = raw.length === 1 && raw[0].includes(';') ? raw[0].split(';').map((c) => c.trim()) : [...raw];
    while (cells.length && !cells[cells.length - 1]) cells.pop();
    if (!cells.some(Boolean)) return;
    // Номер строки в первой колонке («1», «2.3») отбрасываем
    if (cells.length > 1 && ROW_NUMBER_RE.test(cells[0])) cells = cells.slice(1);
    const firstText = cells.findIndex((c) => c && !isNum(c));
    if (firstText === -1) return; // строка из одних чисел (итоги, номера колонок)
    if (cells.some((c) => TOTAL_RE.test(c))) return; // «Итого», «Всего» — не позиция и не раздел
    const qtyAt = cells.findIndex((c, k) => k > firstText && isNum(c));
    const before = (qtyAt === -1 ? cells : cells.slice(0, qtyAt)).map((c, k) => ({ c, k })).filter((x) => x.c && !isNum(x.c));

    if (qtyAt === -1) {
      // Нет объёма: шапка таблицы или заголовок раздела
      if (cells.some((c) => HEADER_RE.test(c)) && cells.filter(Boolean).length > 1) return;
      section = before.map((x) => x.c).sort((a, b) => b.length - a.length)[0].slice(0, 200);
      sections.add(section);
      return;
    }

    const quantity = parseNumber(cells[qtyAt]);
    if (!(quantity > 0)) {
      warnings.push(`Строка ${lineNo}: объём должен быть больше нуля, строка пропущена`);
      return;
    }
    // Единица: текстовая ячейка до объёма, которая есть в справочнике (или короткая), иначе текст сразу после объёма.
    // Наименование: самая длинная из остальных текстовых ячеек (шифр расценки «ГЭСН 46-01-001» короче названия).
    const after = cells[qtyAt + 1] && !isNum(cells[qtyAt + 1]) ? { c: cells[qtyAt + 1], k: qtyAt + 1 } : null;
    let unitCell = before.find((x) => matchUnit(x.c, units)) || null;
    if (!unitCell && after && (matchUnit(after.c, units) || after.c.length <= 8)) unitCell = after;
    if (!unitCell && before.length > 1) {
      const short = before.filter((x) => x.c.length <= 8);
      unitCell = short[short.length - 1] || null;
    }
    const nameCell = before.filter((x) => x !== unitCell).sort((a, b) => b.c.length - a.c.length)[0];
    if (!nameCell) {
      warnings.push(`Строка ${lineNo}: не нашли наименование, строка пропущена`);
      return;
    }
    const unitText = unitCell?.c || '';
    const unit = matchUnit(unitText, units);
    if (unitText && !unit) warnings.push(`Строка ${lineNo}: единицы «${unitText}» нет в справочнике, выберите её вручную`);
    const descCells = cells.slice(qtyAt + 1).filter((c, k) => c && !isNum(c) && qtyAt + 1 + k !== unitCell?.k);
    rows.push({
      name: nameCell.c.slice(0, 500),
      unitId: unit?.id || '',
      unitText,
      quantity,
      section,
      desc: descCells.join(' ').slice(0, 1000),
      line: lineNo,
    });
  });

  return { rows, warnings, sections: sections.size };
}

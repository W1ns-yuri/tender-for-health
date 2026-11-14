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

/** Число из ячейки: «1 250,5» → 1250.5; не число → NaN */
export function parseNumber(cell) {
  const s = String(cell ?? '').replace(/[\s ]/g, '').replace(',', '.');
  if (!/^-?\d+(\.\d+)?$/.test(s)) return NaN;
  return Number(s);
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

  String(text ?? '').split(/\r?\n/).forEach((line, i) => {
    const lineNo = i + 1;
    if (!line.trim()) return;
    let cells = (line.includes('\t') ? line.split('\t') : line.split(';')).map((c) => c.trim());
    while (cells.length && !cells[cells.length - 1]) cells.pop();
    // Номер строки в первой колонке («1», «2.3») отбрасываем
    if (cells.length > 1 && ROW_NUMBER_RE.test(cells[0])) cells = cells.slice(1);
    const nameIdx = cells.findIndex((c) => c && Number.isNaN(parseNumber(c)));
    if (nameIdx === -1) return; // строка из одних чисел (итоги, номера колонок)
    const name = cells[nameIdx];
    if (TOTAL_RE.test(name)) return; // «Итого», «Всего» — не позиция и не раздел
    const rest = cells.slice(nameIdx + 1);
    const qtyIdx = rest.findIndex((c) => !Number.isNaN(parseNumber(c)));

    if (qtyIdx === -1) {
      // Нет объёма: шапка таблицы или заголовок раздела
      if (rest.some((c) => HEADER_RE.test(c)) || (HEADER_RE.test(name) && rest.length > 0)) return;
      section = name.slice(0, 200);
      sections.add(section);
      return;
    }

    const quantity = parseNumber(rest[qtyIdx]);
    if (!(quantity > 0)) {
      warnings.push(`Строка ${lineNo}: объём должен быть больше нуля, строка пропущена`);
      return;
    }
    // Единица — текстовая ячейка между наименованием и объёмом, иначе сразу после объёма
    const unitText = rest.slice(0, qtyIdx).find((c) => c) || rest[qtyIdx + 1] || '';
    const unit = matchUnit(unitText, units);
    if (unitText && !unit) warnings.push(`Строка ${lineNo}: единицы «${unitText}» нет в справочнике, выберите её вручную`);
    const descCells = rest.slice(qtyIdx + 1).filter((c) => c && c !== unitText);
    rows.push({
      name: name.slice(0, 500),
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

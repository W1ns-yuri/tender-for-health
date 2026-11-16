// Существительные для «N лотов / 2 lots / 2 lot»: в туркменском после числа слово не меняется
const NOUNS = {
  lot: { RU: ['лот', 'лота', 'лотов'], TM: 'lot', EN: ['lot', 'lots'] },
  bid: { RU: ['заявка', 'заявки', 'заявок'], TM: 'arza', EN: ['bid', 'bids'] },
  item: { RU: ['позиция', 'позиции', 'позиций'], TM: 'pozisiýa', EN: ['item', 'items'] },
  tender: { RU: ['тендер', 'тендера', 'тендеров'], TM: 'tender', EN: ['tender', 'tenders'] },
  company: { RU: ['компания', 'компании', 'компаний'], TM: 'kompaniýa', EN: ['company', 'companies'] },
};
const PLURAL_LOCALE = { RU: 'ru-RU', EN: 'en-US', TM: 'tk-TM' };

/** Язык интерфейса по функции перевода: в каждом словаре есть ключ langCode */
const langOf = (t) => (typeof t === 'function' ? t('langCode', 'RU') : 'RU');

/**
 * «3 заявки» / «3 bids» / «3 arza».
 * noun — ключ из NOUNS ('lot', 'bid', 'item', 'tender', 'company'); t — функция перевода компонента.
 */
export function countLabel(n, noun, t, includeCount = true) {
  const count = Math.abs(Number(n) || 0);
  const lang = langOf(t);
  const forms = NOUNS[noun]?.[lang] ?? NOUNS[noun]?.RU ?? [noun, noun, noun];
  let word;
  if (typeof forms === 'string') word = forms;
  else {
    const rule = new Intl.PluralRules(PLURAL_LOCALE[lang] || 'ru-RU').select(count);
    word = lang === 'RU' ? (rule === 'one' ? forms[0] : rule === 'few' ? forms[1] : forms[2]) : (rule === 'one' ? forms[0] : forms[1]);
  }
  return includeCount ? `${count} ${word}` : word;
}

/**
 * Очистка дублирующихся префиксов лотов (например, "ЛОТ #1: Лот №1: Кардиомониторы" -> "Кардиомониторы")
 * number — номер лота для показа, используется только если без префикса имени не осталось.
 */
export function cleanLotTitle(title, number = null, t = null) {
  const cleaned = String(title || '')
    .replace(/^(?:(?:лот|lot)\s*[№#]?\s*\d+[\s:.-]*)+/gi, '')
    .trim();
  if (cleaned) return cleaned;
  return number !== null ? `${lotPrefix(t)}${number}` : String(title || '');
}

const lotPrefix = (t) => (typeof t === 'function' ? t('lotNumberPrefix', 'Лот №') : 'Лот №');

/** «Лот №1: Цефалоспорины» — для мест, где номер лота больше нигде не показан */
export function lotLabel(title, number, t = null) {
  const cleaned = cleanLotTitle(title);
  const bare = /^(?:лот|lot)\s*[№#]?\s*\d+$/i.test(cleaned) || !cleaned;
  return bare ? `${lotPrefix(t)}${number}` : `${lotPrefix(t)}${number}: ${cleaned}`;
}

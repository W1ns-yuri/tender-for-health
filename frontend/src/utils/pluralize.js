/**
 * Утилита плюрализации числительных (Русский язык)
 * @param {number} n Число
 * @param {[string, string, string]} forms Массив из трех форм [один, два-четыре, много] (напр. ['заявка', 'заявки', 'заявок'])
 * @param {boolean} includeCount Включать ли само число в строку (по умолчанию true)
 * @returns {string}
 */
export function pluralize(n, forms, includeCount = true) {
  const count = Math.abs(Number(n) || 0);
  const pr = new Intl.PluralRules('ru-RU');
  const rule = pr.select(count);

  let word = forms[2];
  if (rule === 'one') {
    word = forms[0];
  } else if (rule === 'few') {
    word = forms[1];
  }

  return includeCount ? `${count} ${word}` : word;
}

/**
 * Очистка дублирующихся префиксов лотов (например, "ЛОТ #1: Лот №1: Кардиомониторы" -> "Кардиомониторы")
 * @param {string} title Название лота
 * @param {number} [idx] Индекс лота (если нужно сформировать стандартный вид "Лот №1: ...")
 * @returns {string}
 */
export function cleanLotTitle(title, idx = null) {
  if (!title) return idx !== null ? `Лот №${idx + 1}` : '';
  // Убираем цепочки повторяющихся префиксов "Лот №X", "ЛОТ #X:", "Лот 1:", "Lot #1:", etc.
  const cleaned = String(title)
    .replace(/^(?:(?:лот|lot)\s*[№#]?\s*\d+[\s:.-]*)+/gi, '')
    .trim();

  if (idx !== null) {
    return cleaned ? `Лот №${idx + 1}: ${cleaned}` : `Лот №${idx + 1}`;
  }
  return cleaned || String(title);
}

/**
 * Извлечение ОПФ (HJ, HK, ИП / Hususy telekeçi) и чистого названия компании
 * @param {string} companyName
 * @returns {{ opf: string|null, cleanName: string }}
 */
export function parseCompanyName(companyName) {
  if (!companyName) return { opf: null, cleanName: '' };
  const str = String(companyName).trim();
  
  // Паттерн для поиска известных ОПФ в начале (HJ, HK, ИП, Hususy telekeçi, SP, etc.)
  const opfRegex = /^(HJ|HK|ИП|Hususy\s+telekeçi|A\.Ş\.|Ý\.P\.|SP|ООО|ОАО|ЗАО)\s*["«'“”]?([^"»'“”]+)["»'“”]?$/i;
  const match = str.match(opfRegex);
  if (match) {
    return {
      opf: match[1].toUpperCase(),
      cleanName: match[2].trim()
    };
  }

  // Если кавычки есть с префиксом или суффиксом
  const quotesRegex = /^([^«"]+)?\s*[«"]([^»"]+)[»"]\s*([^«"]+)?$/;
  const qMatch = str.match(quotesRegex);
  if (qMatch) {
    const rawOpf = (qMatch[1] || qMatch[3] || '').trim();
    return {
      opf: rawOpf || null,
      cleanName: qMatch[2].trim()
    };
  }

  return { opf: null, cleanName: str };
}

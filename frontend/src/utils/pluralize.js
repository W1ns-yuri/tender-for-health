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
 * Каноническая нормализация типа ОПФ (Enum)
 * @param {string} rawTextOrType 
 * @returns {string|null}
 */
export function normalizeCompanyOpfType(rawTextOrType) {
  if (!rawTextOrType) return null;
  const str = String(rawTextOrType).trim().toLowerCase();

  if (
    str === 'entrepreneur' ||
    str === 'ип' ||
    str === 'ht' ||
    str === 'ie' ||
    str.includes('индивидуальный предприниматель') ||
    str.includes('hususy telekeçi') ||
    str.includes('telekeçi') ||
    str === 'sp' ||
    str === 'sole proprietor'
  ) {
    return 'ENTREPRENEUR';
  }

  if (
    str === 'business_society' ||
    str === 'хо' ||
    str === 'hj' ||
    str === 'bs' ||
    str === 'llc' ||
    str === 'ооо' ||
    str.includes('хозяйственное общество') ||
    str.includes('hojalyk jemgyýeti') ||
    str.includes('hojalyk jemgyeti')
  ) {
    return 'BUSINESS_SOCIETY';
  }

  if (
    str === 'private_enterprise' ||
    str === 'business_company' ||
    str === 'чп' ||
    str === 'хп' ||
    str === 'hk' ||
    str === 'pe' ||
    str.includes('частное предприятие') ||
    str.includes('hususy kärhana') ||
    str.includes('hususy karhana')
  ) {
    return 'PRIVATE_ENTERPRISE';
  }

  if (
    str === 'government' ||
    str === 'гп' ||
    str === 'dk' ||
    str === 'se' ||
    str.includes('государственное предприятие') ||
    str.includes('döwlet kärhanasy') ||
    str.includes('dowlet karhanasy')
  ) {
    return 'GOVERNMENT';
  }

  if (
    str === 'daýhan_hojalygy' ||
    str === 'dayhan_hojalygy' ||
    str === 'farmer_association' ||
    str === 'дх' ||
    str === 'dh' ||
    str === 'fh' ||
    str.includes('дайханское хозяйство') ||
    str.includes('daýhan hojalygy') ||
    str.includes('dayhan hojalygy')
  ) {
    return 'DAÝHAN_HOJALYGY';
  }

  if (
    str === 'foreign_entity' ||
    str === 'foreign_branch' ||
    str === 'foreign_sole_trader' ||
    str === 'ин' ||
    str === 'ýgp' ||
    str === 'ygp' ||
    str === 'for' ||
    str.includes('иностранное') ||
    str.includes('foreign') ||
    str.includes('daşary ýurt')
  ) {
    return 'FOREIGN_ENTITY';
  }

  return null;
}

/**
 * Получение стандартизированного сокращения ОПФ для бейджа в зависимости от языка интерфейса
 * @param {string} typeOrOpf - канонический тип или строка ОПФ
 * @param {string} lang - 'RU' | 'TM' | 'EN'
 * @returns {string|null}
 */
export function getStandardizedOpfBadge(typeOrOpf, lang = 'RU') {
  const norm = normalizeCompanyOpfType(typeOrOpf);
  if (!norm) return null;

  const currentLang = (lang || 'RU').toUpperCase();

  if (currentLang === 'TM') {
    switch (norm) {
      case 'ENTREPRENEUR': return 'HT';
      case 'BUSINESS_SOCIETY': return 'HJ';
      case 'PRIVATE_ENTERPRISE': return 'HK';
      case 'GOVERNMENT': return 'DK';
      case 'DAÝHAN_HOJALYGY': return 'DH';
      case 'FOREIGN_ENTITY': return 'ÝGP';
      default: return 'HJ';
    }
  }

  if (currentLang === 'EN') {
    switch (norm) {
      case 'ENTREPRENEUR': return 'IE';
      case 'BUSINESS_SOCIETY': return 'BS';
      case 'PRIVATE_ENTERPRISE': return 'PE';
      case 'GOVERNMENT': return 'SE';
      case 'DAÝHAN_HOJALYGY': return 'FH';
      case 'FOREIGN_ENTITY': return 'FOR';
      default: return 'BS';
    }
  }

  // RU по умолчанию
  switch (norm) {
    case 'ENTREPRENEUR': return 'ИП';
    case 'BUSINESS_SOCIETY': return 'ХО';
    case 'PRIVATE_ENTERPRISE': return 'ЧП';
    case 'GOVERNMENT': return 'ГП';
    case 'DAÝHAN_HOJALYGY': return 'ДХ';
    case 'FOREIGN_ENTITY': return 'ИН';
    default: return 'ХО';
  }
}

/**
 * Извлечение ОПФ (HJ, HK, ИП / Hususy telekeçi) и чистого названия компании
 * со стандартизацией бейджа по языку
 * @param {string} companyName
 * @param {string} lang - 'RU' | 'TM' | 'EN'
 * @param {string|null} explicitType - сохраненный в БД s.type
 * @returns {{ opf: string|null, cleanName: string, canonicalType: string|null }}
 */
export function parseCompanyName(companyName, lang = 'RU', explicitType = null) {
  if (!companyName) return { opf: null, cleanName: '', canonicalType: null };
  const str = String(companyName).trim();
  
  let detectedType = normalizeCompanyOpfType(explicitType);
  let clean = str;

  // 1. Поиск длинных названий ОПФ с кавычками: Hojalyk Jemgyýeti «Derman Saglyk», Хозяйственное общество «...»
  const longOpfQuotesRegex = /^(Hojalyk\s+Jemgyýeti|Hojalyk\s+Jemgyeti|Хозяйственное\s+общество|Hususy\s+kärhana|Hususy\s+karhana|Частное\s+предприятие|Hususy\s+telekeçi|Индивидуальный\s+предприниматель|Döwlet\s+kärhanasy|Государственное\s+предприятие|Daýhan\s+hojalygy|Дайханское\s+хозяйство)\s*["«'“”]?([^"»'“”]+)["»'“”]?$/i;
  const longMatch = str.match(longOpfQuotesRegex);
  if (longMatch) {
    if (!detectedType) {
      detectedType = normalizeCompanyOpfType(longMatch[1]);
    }
    clean = longMatch[2].trim();
  } else {
    // 2. Короткие префиксы ОПФ в начале: HJ, HK, ИП, ХО, ЧП, HT, DH, etc.
    const shortOpfRegex = /^(HJ|HK|HT|ИП|ХО|ЧП|ГП|ДХ|DK|DH|ÝGP|YGP|A\.Ş\.|Ý\.P\.|SP|ООО|ОАО|ЗАО)\s*["«'“”]?([^"»'“”]+)["»'“”]?$/i;
    const shortMatch = str.match(shortOpfRegex);
    if (shortMatch) {
      if (!detectedType) {
        detectedType = normalizeCompanyOpfType(shortMatch[1]);
      }
      clean = shortMatch[2].trim();
    } else {
      // 3. Кавычки общего вида: «Название» или Префикс «Название»
      const quotesRegex = /^([^«"]+)?\s*[«"]([^»"]+)[»"]\s*([^«"]+)?$/;
      const qMatch = str.match(quotesRegex);
      if (qMatch) {
        const rawPrefix = (qMatch[1] || qMatch[3] || '').trim();
        if (rawPrefix) {
          const typeFromPrefix = normalizeCompanyOpfType(rawPrefix);
          if (typeFromPrefix && !detectedType) {
            detectedType = typeFromPrefix;
          }
        }
        clean = qMatch[2].trim();
      }
    }
  }

  // Очистка от лишних кавычек в начале и конце
  clean = clean.replace(/^[«"']+|[»"']+$/g, '').trim();

  // Получаем стандартизированный бейдж по текущему языку
  const opfBadge = detectedType ? getStandardizedOpfBadge(detectedType, lang) : null;

  return {
    opf: opfBadge,
    cleanName: clean || str,
    canonicalType: detectedType
  };
}

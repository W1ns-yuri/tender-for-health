export const getRoleTheme = (role, isDarkMode) => {
  const isAdmin = role === 'ADMIN';

  return {
    isAdmin,
    primaryBg: isAdmin ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white',
    primaryBtn: isAdmin ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white',
    primaryText: isAdmin ? 'text-emerald-600' : 'text-blue-600',
    primaryBorder: isAdmin ? 'border-emerald-600' : 'border-blue-600',
    primaryBadge: isAdmin ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-blue-50 text-blue-700 border-blue-200',

    cardBg: isDarkMode ? 'bg-[#111827] border-slate-800 text-slate-100' : 'bg-white border-slate-200/80 text-slate-800',
    cardHeaderBg: isDarkMode ? 'bg-[#1f2937] border-slate-800' : 'bg-slate-50 border-slate-100',
    inputBg: isDarkMode
      ? (isAdmin
          ? 'bg-[#1f2937] border border-slate-700 text-slate-100 placeholder:text-slate-500 hover:border-emerald-500/70 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/25 active:border-emerald-500 transition-all duration-150'
          : 'bg-[#1f2937] border border-slate-700 text-slate-100 placeholder:text-slate-500 hover:border-blue-500/70 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25 active:border-blue-500 transition-all duration-150')
      : (isAdmin
          ? 'bg-slate-50 border border-slate-200 text-slate-800 placeholder:text-slate-400 hover:border-emerald-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 active:border-emerald-500 transition-all duration-150'
          : 'bg-slate-50 border border-slate-200 text-slate-800 placeholder:text-slate-400 hover:border-blue-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 active:border-blue-500 transition-all duration-150'),

    // Тонкая цветная акцентная полоска на самой карточке таблицы (4px)
    tableCardBorderTop: isAdmin ? 'border-t-4 border-t-emerald-500' : 'border-t-4 border-t-blue-500',

    // Мягкая брендовая подложка шапки таблицы: мятная для админа, голубая для поставщика, с четкой разделительной линией
    tableHeaderBg: isDarkMode
      ? (isAdmin ? 'bg-emerald-950/40 text-slate-300 font-semibold uppercase tracking-wider text-xs border-b border-slate-800' : 'bg-blue-950/40 text-slate-300 font-semibold uppercase tracking-wider text-xs border-b border-slate-800')
      : (isAdmin ? 'bg-emerald-50/70 text-slate-700 font-semibold uppercase tracking-wider text-xs border-b border-slate-200' : 'bg-blue-50/70 text-slate-700 font-semibold uppercase tracking-wider text-xs border-b border-slate-200'),

    // Зебра для строк (striped) и фирменная подсветка при наведении
    tableRowHover: isDarkMode
      ? (isAdmin ? 'even:bg-slate-800/20 hover:bg-emerald-950/30' : 'even:bg-slate-800/20 hover:bg-blue-950/30')
      : (isAdmin ? 'even:bg-slate-50/40 hover:bg-emerald-50/40' : 'even:bg-slate-50/40 hover:bg-blue-50/40'),

    // Квадратная кнопка действия (глаз) с рамкой, мягким фоном и интерактивной зоной клика
    actionBtn: isAdmin
      ? 'w-8 h-8 rounded-lg border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-800 shadow-2xs flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 hover:border-emerald-300 dark:hover:bg-emerald-950/50 dark:hover:text-emerald-400 dark:hover:border-emerald-700 transition-all active:scale-95'
      : 'w-8 h-8 rounded-lg border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-800 shadow-2xs flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-300 dark:hover:bg-blue-950/50 dark:hover:text-blue-400 dark:hover:border-blue-700 transition-all active:scale-95',

    subText: isDarkMode ? 'text-slate-400' : 'text-slate-500',
  };
};

export const safeString = (val, fallback = '') => {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'string' || typeof val === 'number') return String(val);
  if (typeof val === 'object') {
    const extracted = val.name || val.shortName || val.title || val.description || val.code || val.tenderNumber || val.value;
    if (extracted && (typeof extracted === 'string' || typeof extracted === 'number')) {
      return String(extracted);
    }
    return fallback;
  }
  return fallback;
};

/**
 * Генерация двухбуквенных инициалов для аватарок (например: Test Testow -> TT, Winfinity -> WI, Admin -> AD)
 */
export const getAvatarInitials = (userOrName, role = 'SUPPLIER') => {
  let nameStr = '';
  if (typeof userOrName === 'string') {
    nameStr = userOrName.trim();
  } else if (userOrName && typeof userOrName === 'object') {
    const compName = (userOrName.companies?.[0] || userOrName.suppliers?.[0])?.name;
    if (compName && role !== 'ADMIN') {
      nameStr = compName.trim();
    } else if (userOrName.firstName || userOrName.lastName) {
      nameStr = `${userOrName.firstName || ''} ${userOrName.lastName || ''}`.trim();
    } else if (userOrName.username) {
      nameStr = userOrName.username.trim();
    }
  }

  if (!nameStr) {
    return role === 'ADMIN' ? 'AD' : 'SU';
  }

  const parts = nameStr.split(/[\s_-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  if (parts[0].length >= 2) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + (role === 'ADMIN' ? 'D' : 'U')).toUpperCase();
};

/**
 * Получение текстового формата валюты без эмодзи флагов для надежного отображения в Windows
 */
export const getCurrencyLabel = (currencyObjOrCode) => {
  const code = (typeof currencyObjOrCode === 'string' 
    ? currencyObjOrCode 
    : (currencyObjOrCode?.code || 'TMT')).toUpperCase();

  const labels = {
    TMT: 'TMT — Государственный манат Туркменистана',
    USD: 'USD — Доллар США',
    EUR: 'EUR — Евро',
    RUB: 'RUB — Российский рубль',
  };

  if (labels[code]) return labels[code];
  if (typeof currencyObjOrCode === 'object' && currencyObjOrCode?.name) {
    return `${code} — ${currencyObjOrCode.name.replace(/\p{Extended_Pictographic}/gu, '').trim()}`;
  }
  return code;
};

/**
 * Корректное преобразование локальных/серверных путей к загруженным файлам и логотипам
 */
export const resolveFileUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('blob:') || url.startsWith('data:') || url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  // Нормализуем слеши и извлекаем чистое имя файла из /uploads/ или абсолютного пути
  const normalized = url.replace(/\\/g, '/');
  const filename = normalized.includes('/uploads/') 
    ? normalized.split('/uploads/').pop() 
    : normalized.split('/').pop();
    
  // Если задан внешний VITE_API_URL, используем его, иначе используем относительный URL через прокси
  if (import.meta.env.VITE_API_URL) {
    const baseUrl = import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '');
    return `${baseUrl}/uploads/${encodeURIComponent(filename)}`;
  }
  return `/uploads/${encodeURIComponent(filename)}`;
};

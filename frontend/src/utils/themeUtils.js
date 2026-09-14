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
    inputBg: isDarkMode ? 'bg-[#1f2937] border border-slate-700 text-slate-100 placeholder:text-slate-500' : 'bg-slate-50 border border-slate-200 text-slate-800 placeholder:text-slate-400',

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

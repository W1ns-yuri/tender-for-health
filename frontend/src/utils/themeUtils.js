export const getRoleTheme = (role, isDarkMode) => {
  const isAdmin = role === 'ADMIN';

  return {
    isAdmin,
    primaryBg: isAdmin ? 'bg-teal-600 hover:bg-teal-700 text-white' : 'bg-[#1e3a8a] hover:bg-blue-900 text-white',
    primaryBtn: isAdmin ? 'bg-teal-600 hover:bg-teal-700 text-white' : 'bg-[#1e3a8a] hover:bg-blue-900 text-white',
    primaryText: isAdmin ? 'text-teal-600' : 'text-[#1e3a8a]',
    primaryBorder: isAdmin ? 'border-teal-500' : 'border-[#1e3a8a]',
    primaryBadge: isAdmin ? 'bg-teal-50 text-teal-700 border-teal-200' : 'bg-blue-50 text-[#1e3a8a] border-[#1e3a8a]/20',

    cardBg: isDarkMode ? 'bg-[#111827] border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800',
    cardHeaderBg: isDarkMode ? 'bg-[#1f2937] border-slate-800' : 'bg-slate-50 border-slate-100',
    inputBg: isDarkMode ? 'bg-[#1f2937] border border-slate-700 text-slate-100 placeholder:text-slate-500' : 'bg-slate-50 border border-slate-200 text-slate-800 placeholder:text-slate-400',

    // Динамический цвет шапок таблиц: Изумрудный для Админа, Синий для Поставщика
    tableHeaderBg: isDarkMode
      ? 'bg-[#0f172a] text-slate-100'
      : (isAdmin ? 'bg-teal-600 text-white' : 'bg-[#1e3a8a] text-white'),

    tableRowHover: isDarkMode ? 'hover:bg-slate-800/60' : 'hover:bg-slate-50/80',
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

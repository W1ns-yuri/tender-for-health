export const getRoleTheme = (role, isDarkMode) => {
  const isAdmin = role === 'ADMIN';

  return {
    isAdmin,
    primaryBg: isAdmin ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white',
    primaryBtn: isAdmin ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white',
    primaryText: isAdmin ? 'text-emerald-600' : 'text-blue-600',
    primaryBorder: isAdmin ? 'border-emerald-600' : 'border-blue-600',
    primaryBadge: isAdmin ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-blue-50 text-blue-700 border-blue-200',

    cardBg: isDarkMode ? 'bg-[#111827] border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800',
    cardHeaderBg: isDarkMode ? 'bg-[#1f2937] border-slate-800' : 'bg-slate-50 border-slate-100',
    inputBg: isDarkMode ? 'bg-[#1f2937] border border-slate-700 text-slate-100 placeholder:text-slate-500' : 'bg-slate-50 border border-slate-200 text-slate-800 placeholder:text-slate-400',

    // Современные просторные светлые шапки таблиц вместо сплошной темной заливки
    tableHeaderBg: isDarkMode
      ? 'bg-slate-800/80 text-slate-300 font-bold uppercase tracking-wider text-[11px] border-b border-slate-700'
      : 'bg-slate-50/90 text-slate-500 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200',

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

import React from 'react';
import { getTranslation } from './translations';

export const getStatusBadge = (status, lang = 'RU', isDarkMode = false) => {
  const normalized = String(status || '').toUpperCase();
  const baseClass = "px-3 py-1 text-xs rounded-md whitespace-nowrap inline-flex items-center justify-center border font-semibold";

  switch (normalized) {
    case 'TASLAMA':
      return (
        <span className={`${baseClass} font-semibold ${isDarkMode ? 'bg-amber-950/60 text-amber-300 border-amber-800/60' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
          {getTranslation(lang, 'statusTaslama', 'Черновик')}
        </span>
      );
    case 'ACYK':
    case 'OPEN':
      return (
        <span className={`${baseClass} ${isDarkMode ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
          {getTranslation(lang, 'statusAcyk', 'Açyk')}
        </span>
      );
    case 'YAPYK':
    case 'CLOSED':
      return (
        <span className={`${baseClass} font-medium ${isDarkMode ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
          {getTranslation(lang, 'statusYapyk', 'Ýapyk')}
        </span>
      );
    case 'BAHALANDYRYLDY':
    case 'EVALUATION':
      return (
        <span className={`${baseClass} ${isDarkMode ? 'bg-amber-950/60 text-amber-300 border-amber-800/60' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
          {getTranslation(lang, 'statusBahalandyryldy', 'Bahalandyryldy')}
        </span>
      );
    case 'YENIJI_YGLAN_EDILDI':
    case 'YENIJI':
      return (
        <span className={`${baseClass} ${isDarkMode ? 'bg-purple-950/60 text-purple-300 border-purple-800/60' : 'bg-purple-50 text-purple-700 border-purple-200'}`}>
          {getTranslation(lang, 'statusYeniji', 'Ýeňiji yglan edildi')}
        </span>
      );
    case 'TABSARYLDY':
      return (
        <span className={`${baseClass} ${isDarkMode ? 'bg-blue-950/60 text-blue-300 border-blue-800/60' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
          {getTranslation(lang, 'statusTabsyryldy', 'Tabşyryldy')}
        </span>
      );
    case 'KABUL_EDILDI':
      return (
        <span className={`${baseClass} ${isDarkMode ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
          {getTranslation(lang, 'statusKabulEdildi', 'Принято')}
        </span>
      );
    case 'GOYBOLSUN_EDILDI':
    case 'CANCELLED':
      return (
        <span className={`${baseClass} ${isDarkMode ? 'bg-orange-950/60 text-orange-300 border-orange-800/60' : 'bg-orange-50 text-orange-700 border-orange-200'}`}>
          {getTranslation(lang, 'statusGoybolsun', 'Goýbolsun edildi')}
        </span>
      );
    case 'RET_EDILDI':
    case 'REJECTED':
      return (
        <span className={`${baseClass} ${isDarkMode ? 'bg-rose-950/60 text-rose-300 border-rose-800/60' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
          {getTranslation(lang, 'statusRet', 'Ret edildi')}
        </span>
      );
    case 'ARHIWLENDI':
    case 'ARCHIVED':
      return (
        <span className={`${baseClass} font-medium ${isDarkMode ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
          {getTranslation(lang, 'statusArhiw', 'Arhiwlendi')}
        </span>
      );
    default:
      return (
        <span className={`${baseClass} font-medium ${isDarkMode ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
          {status}
        </span>
      );
  }
};

export const getTypeBadge = (type, lang = 'RU', isDarkMode = false) => {
  const isLocal = String(type).toUpperCase() === 'YERLI';
  
  const bgClass = isDarkMode
    ? (isLocal ? 'bg-slate-800 text-slate-300 border border-slate-700' : 'bg-sky-950/60 text-sky-300 border border-sky-800/60')
    : (isLocal ? 'bg-slate-100 text-slate-700 border border-slate-200' : 'bg-sky-50 text-sky-700 border border-sky-200');

  return (
    <span className={`px-2.5 py-0.5 text-xs font-semibold rounded whitespace-nowrap inline-flex items-center justify-center ${bgClass}`}>
      {isLocal ? getTranslation(lang, 'typeLocal', 'Ýerli') : getTranslation(lang, 'typeGlobal', 'Halkara')}
    </span>
  );
};

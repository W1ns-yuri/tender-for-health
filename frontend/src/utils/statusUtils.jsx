import React from 'react';
import { getTranslation } from './translations';

export const getStatusBadge = (status, lang = 'RU', isDarkMode = false) => {
  const normalized = String(status || '').toUpperCase();
  const baseClass = "px-3 py-1 text-xs rounded-md whitespace-nowrap inline-flex items-center justify-center border";

  switch (normalized) {
    case 'TASLAMA':
      return (
        <span className={`${baseClass} font-medium ${isDarkMode ? 'bg-purple-900/40 text-purple-400 border-purple-800/50' : 'bg-purple-50 text-purple-600 border-purple-200'}`}>
          {getTranslation(lang, 'statusTaslama', 'Taslama')}
        </span>
      );
    case 'ACYK':
    case 'OPEN':
      return (
        <span className={`${baseClass} font-semibold ${isDarkMode ? 'bg-emerald-900/40 text-emerald-400 border-emerald-800/50' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}>
          {getTranslation(lang, 'statusAcyk', 'Açyk')}
        </span>
      );
    case 'YAPYK':
    case 'CLOSED':
      return (
        <span className={`${baseClass} font-medium ${isDarkMode ? 'bg-rose-900/40 text-rose-400 border-rose-800/50' : 'bg-rose-50 text-rose-600 border-rose-200'}`}>
          {getTranslation(lang, 'statusYapyk', 'Ýapyk')}
        </span>
      );
    case 'BAHALANDYRYLDY':
    case 'EVALUATION':
      return (
        <span className={`${baseClass} font-medium ${isDarkMode ? 'bg-sky-900/40 text-sky-400 border-sky-800/50' : 'bg-sky-50 text-sky-600 border-sky-200'}`}>
          {getTranslation(lang, 'statusBahalandyryldy', 'Bahalandyryldy')}
        </span>
      );
    case 'YENIJI_YGLAN_EDILDI':
    case 'YENIJI':
      return (
        <span className={`${baseClass} font-semibold ${isDarkMode ? 'bg-teal-900/40 text-teal-400 border-teal-800/50' : 'bg-teal-50 text-teal-700 border-teal-300'}`}>
          {getTranslation(lang, 'statusYeniji', 'Ýeňiji yglan edildi')}
        </span>
      );
    case 'TABSARYLDY':
      return (
        <span className={`${baseClass} font-medium ${isDarkMode ? 'bg-blue-900/40 text-blue-400 border-blue-800/50' : 'bg-blue-50 text-blue-600 border-blue-200'}`}>
          {getTranslation(lang, 'statusTabsyryldy', 'Tabşyryldy')}
        </span>
      );
    case 'KABUL_EDILDI':
      return (
        <span className={`${baseClass} font-medium ${isDarkMode ? 'bg-emerald-900/40 text-emerald-400 border-emerald-800/50' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
          {lang === 'RU' ? 'Принято' : 'Kabul edildi'}
        </span>
      );
    case 'GOYBOLSUN_EDILDI':
    case 'CANCELLED':
      return (
        <span className={`${baseClass} font-medium ${isDarkMode ? 'bg-orange-900/40 text-orange-400 border-orange-800/50' : 'bg-orange-50 text-orange-600 border-orange-200'}`}>
          {getTranslation(lang, 'statusGoybolsun', 'Goýbolsun edildi')}
        </span>
      );
    case 'RET_EDILDI':
    case 'REJECTED':
      return (
        <span className={`${baseClass} font-medium ${isDarkMode ? 'bg-red-900/40 text-red-400 border-red-800/50' : 'bg-red-50 text-red-600 border-red-200'}`}>
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
    ? (isLocal ? 'bg-emerald-900/40 text-emerald-400 border border-emerald-800/50' : 'bg-cyan-900/40 text-cyan-400 border border-cyan-800/50')
    : (isLocal ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-cyan-50 text-cyan-600 border border-cyan-200');

  return (
    <span className={`px-2.5 py-0.5 text-xs font-medium rounded whitespace-nowrap inline-flex items-center justify-center ${bgClass}`}>
      {isLocal ? getTranslation(lang, 'typeLocal', 'Ýerli') : getTranslation(lang, 'typeGlobal', 'Halkara')}
    </span>
  );
};

import React from 'react';
import { FileText, Package, Paperclip } from 'lucide-react';

/**
 * Вкладки верхнего уровня браузерного типа (Chrome/Edge style):
 * «Параметры закупки», «Лоты и спецификации», «Общие документы».
 */
export default function TenderTopNavigationTabs({
  activeTopTab,
  onNavigateTab,
  canAccessLots,
  canAccessDocs,
  lotsCount = 0,
  tenderFilesCount = 0,
  t = (k, f) => f
}) {
  return (
    <div className="flex items-end gap-1.5 -mb-[1px] relative z-10 overflow-x-auto scrollbar-thin">
      {/* Вкладка 1: Параметры закупки */}
      <button
        type="button"
        onClick={() => onNavigateTab('params')}
        className={`px-5 py-3 rounded-t-2xl font-black text-xs sm:text-sm flex items-center gap-2.5 border-t-2 border-x transition-all cursor-pointer select-none ${
          activeTopTab === 'params'
            ? 'bg-white dark:bg-[#111827] border-t-emerald-500 border-x-slate-200 dark:border-x-slate-800 border-b-transparent text-emerald-600 dark:text-emerald-400 shadow-xs'
            : 'bg-slate-100/70 hover:bg-slate-200/70 dark:bg-slate-800/40 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 border-transparent'
        }`}
      >
        <FileText size={16} />
        <span>{t('tabGeneralParams', 'Параметры закупки')}</span>
      </button>

      {/* Вкладка 2: Лоты и спецификации */}
      <button
        type="button"
        onClick={() => onNavigateTab('lots')}
        className={`px-5 py-3 rounded-t-2xl font-black text-xs sm:text-sm flex items-center gap-2.5 border-t-2 border-x transition-all select-none ${
          !canAccessLots
            ? 'opacity-40 cursor-not-allowed text-slate-400 border-transparent bg-slate-100/40 dark:bg-slate-800/20'
            : activeTopTab === 'lots'
            ? 'bg-white dark:bg-[#111827] border-t-emerald-500 border-x-slate-200 dark:border-x-slate-800 border-b-transparent text-emerald-600 dark:text-emerald-400 shadow-xs cursor-pointer'
            : 'bg-slate-100/70 hover:bg-slate-200/70 dark:bg-slate-800/40 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 border-transparent cursor-pointer'
        }`}
      >
        <Package size={16} />
        <span>{t('tabLotsSpecs', 'Лоты и спецификации')}</span>
        <span
          className={`font-mono text-xs px-2 py-0.5 rounded-full font-black ${
            activeTopTab === 'lots'
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
              : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
          }`}
        >
          {lotsCount}
        </span>
      </button>

      {/* Вкладка 3: Общие документы */}
      <button
        type="button"
        onClick={() => onNavigateTab('docs')}
        className={`px-5 py-3 rounded-t-2xl font-black text-xs sm:text-sm flex items-center gap-2.5 border-t-2 border-x transition-all select-none ${
          !canAccessDocs
            ? 'opacity-40 cursor-not-allowed text-slate-400 border-transparent bg-slate-100/40 dark:bg-slate-800/20'
            : activeTopTab === 'docs'
            ? 'bg-white dark:bg-[#111827] border-t-emerald-500 border-x-slate-200 dark:border-x-slate-800 border-b-transparent text-emerald-600 dark:text-emerald-400 shadow-xs cursor-pointer'
            : 'bg-slate-100/70 hover:bg-slate-200/70 dark:bg-slate-800/40 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 border-transparent cursor-pointer'
        }`}
      >
        <Paperclip size={16} />
        <span>{t('tabGeneralDocs', 'Общие документы')}</span>
        <span
          className={`font-mono text-xs px-2 py-0.5 rounded-full font-black ${
            activeTopTab === 'docs'
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
              : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
          }`}
        >
          {tenderFilesCount}
        </span>
      </button>
    </div>
  );
}

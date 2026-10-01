import React, { useState, useEffect } from 'react';
import {
  BarChart2,
  Database,
  Sparkles,
  RefreshCw,
  Download,
  Printer,
  FileSpreadsheet,
  FileCode,
} from 'lucide-react';
import { CustomSelect } from '../ui';

export default function AnalyticsHeader({
  dataSource,
  onToggleDataSource,
  period,
  onPeriodChange,
  currency,
  onCurrencyChange,
  loading,
  onRefresh,
  onExport,
  isDarkMode,
  t,
}) {
  const [showExportMenu, setShowExportMenu] = useState(false);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('#export-dropdown-container')) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const periodOptions = [
    { id: '24h', label: t('period24h', '24 ч') },
    { id: '7d', label: t('period7d', '7 дней') },
    { id: '30d', label: t('period30d', '30 дней') },
    { id: '6m', label: t('period6m', '6 мес') },
    { id: '1y', label: t('period1y', '1 год') },
  ];

  return (
    <div
      className={`p-6 rounded-2xl border transition-all ${
        isDarkMode
          ? 'bg-[#111827] border-slate-800 shadow-md'
          : 'bg-white border-slate-200/80 shadow-sm'
      }`}
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Левый блок: Заголовок */}
        <div>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <BarChart2 size={22} className="animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {t('analyticsTitle', 'Аналитический центр платформы')}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {t(
                  'analyticsSubtitle',
                  'Сводные показатели торгов, финансовая эффективность и активность участников'
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Правый блок: Переключатель режима данных + Табы периодов + Валюта + Экспорт */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Переключатель: Демо / Реальная БД */}
          <button
            type="button"
            onClick={() => onToggleDataSource(dataSource === 'demo' ? 'real' : 'demo')}
            className={`inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all duration-150 cursor-pointer ${
              dataSource === 'real'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-600/25'
                : isDarkMode
                ? 'bg-[#0b0f17] border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
                : 'bg-slate-100/90 border-slate-200/80 text-slate-700 hover:bg-slate-200/70'
            }`}
            title="Переключить между демонстрационным показом и реальной базой данных"
          >
            {dataSource === 'real' ? (
              <>
                <Database size={13} className="text-white" />
                <span>{t('realDbModeBtn', 'Реальная БД')}</span>
              </>
            ) : (
              <>
                <Sparkles size={13} className="text-amber-500" />
                <span>{t('demoModeBtn', 'Демо')}</span>
              </>
            )}
          </button>

          {/* Табы периодов */}
          <div
            className={`inline-flex items-center p-1 rounded-xl border ${
              isDarkMode ? 'bg-[#0b0f17] border-slate-800' : 'bg-slate-100/80 border-slate-200/60'
            }`}
          >
            {periodOptions.map((p) => {
              const isActive = period === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onPeriodChange(p.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 cursor-pointer ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                      : isDarkMode
                      ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          {/* Выбор валюты */}
          <div className="w-32">
            <CustomSelect
              value={currency}
              onChange={onCurrencyChange}
              options={[
                { value: 'TMT', label: 'TMT' },
                { value: 'USD', label: 'USD' },
                { value: 'EUR', label: 'EUR' },
              ]}
              isDarkMode={isDarkMode}
              size="sm"
            />
          </div>

          {/* Кнопка обновления */}
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            title={t('updatedJustNow', 'Обновить данные')}
            className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${
              isDarkMode
                ? 'border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                : 'border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            <RefreshCw size={16} className={loading ? 'animate-spin text-emerald-500' : ''} />
          </button>

          {/* Кнопка экспорта */}
          <div className="relative" id="export-dropdown-container">
            <button
              type="button"
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm shadow-emerald-600/25 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <Download size={15} />
              <span>{t('exportReportBtn', 'Экспорт отчета')}</span>
            </button>

            {showExportMenu && (
              <div
                className={`absolute right-0 mt-2 w-52 rounded-xl border shadow-xl z-50 py-1.5 animate-in fade-in zoom-in-95 duration-100 ${
                  isDarkMode
                    ? 'bg-[#1e293b] border-slate-700 text-slate-200'
                    : 'bg-white border-slate-200 text-slate-700'
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    setShowExportMenu(false);
                    onExport('PDF');
                  }}
                  className="w-full flex items-center px-4 py-2.5 text-xs font-medium hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  <Printer size={15} className="mr-2.5 text-slate-400" />
                  {t('exportPDF', 'Печать в PDF')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowExportMenu(false);
                    onExport('CSV');
                  }}
                  className="w-full flex items-center px-4 py-2.5 text-xs font-medium hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  <FileSpreadsheet size={15} className="mr-2.5 text-slate-400" />
                  {t('exportCSV', 'Данные CSV (Excel)')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowExportMenu(false);
                    onExport('JSON');
                  }}
                  className="w-full flex items-center px-4 py-2.5 text-xs font-medium hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  <FileCode size={15} className="mr-2.5 text-slate-400" />
                  {t('exportJSON', 'Сырые данные JSON')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

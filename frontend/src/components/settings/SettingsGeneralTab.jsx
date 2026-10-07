import React from 'react';
import { Sun, Moon, Laptop } from 'lucide-react';

/**
 * Вкладка 1: Внешний вид, язык платформы и плотность отображения данных
 */
export default function SettingsGeneralTab({
  lang = 'RU',
  handleLanguageChange,
  themeMode = 'light',
  handleThemeModeChange,
  density = 'comfortable',
  handleDensityChange,
  t
}) {
  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-2xs divide-y divide-slate-100 dark:divide-slate-800/80 overflow-hidden">
        
        {/* Язык платформы */}
        <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="max-w-md">
            <div className="font-bold text-sm text-slate-900 dark:text-white">
              {t('interfaceLanguage', 'Язык платформы')}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {t('interfaceLanguageDesc', 'Основной язык отображения форм, таблиц, меню и системных уведомлений')}
            </div>
          </div>

          {/* Сегментированный переключатель языка */}
          <div className="inline-flex flex-wrap p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shrink-0 gap-1">
            {[
              { id: 'RU', label: 'Русский', code: 'RU' },
              { id: 'TM', label: 'Türkmençe', code: 'TM' },
              { id: 'EN', label: 'English', code: 'EN' },
            ].map((item) => {
              const isSelected = lang === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleLanguageChange(item.id)}
                  className={`
                    px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5
                    ${
                      isSelected
                        ? 'bg-white dark:bg-[#111827] text-slate-900 dark:text-white shadow-2xs border border-slate-200/60 dark:border-slate-700/60'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }
                  `}
                >
                  <span className="font-mono text-[10px] px-1 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-black">
                    {item.code}
                  </span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Тема интерфейса */}
        <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="max-w-md">
            <div className="font-bold text-sm text-slate-900 dark:text-white">
              {t('colorThemeTitle', 'Тема оформления')}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {t('colorThemeDesc', 'Настройте цветовую схему для комфортной работы в дневное или ночное время')}
            </div>
          </div>

          {/* Сегментированный переключатель темы */}
          <div className="inline-flex flex-wrap p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shrink-0 gap-1">
            {[
              { id: 'light', label: t('themeLight', 'Светлая'), icon: <Sun size={14} className="text-amber-500" /> },
              { id: 'dark', label: t('themeDark', 'Тёмная'), icon: <Moon size={14} className="text-indigo-400" /> },
              { id: 'system', label: t('themeSystem', 'Системная'), icon: <Laptop size={14} className="text-slate-400" /> },
            ].map((item) => {
              const isSelected = themeMode === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleThemeModeChange(item.id)}
                  className={`
                    px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5
                    ${
                      isSelected
                        ? 'bg-white dark:bg-[#111827] text-slate-900 dark:text-white shadow-2xs border border-slate-200/60 dark:border-slate-700/60'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }
                  `}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Плотность строк в таблицах */}
        <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="max-w-md">
            <div className="font-bold text-sm text-slate-900 dark:text-white">
              {t('densityTitle', 'Плотность табличных данных')}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {t('densityDesc', 'Режим отступов для работы с большими перечнями спецификаций и реестрами')}
            </div>
          </div>

          {/* Сегментированный переключатель плотности */}
          <div className="inline-flex flex-wrap p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shrink-0 gap-1">
            {[
              { id: 'comfortable', label: t('densityComfortable', 'Стандартная'), sub: '48px' },
              { id: 'compact', label: t('densityCompact', 'Компактная'), sub: '36px' },
            ].map((item) => {
              const isSelected = density === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleDensityChange(item.id)}
                  className={`
                    px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5
                    ${
                      isSelected
                        ? 'bg-white dark:bg-[#111827] text-slate-900 dark:text-white shadow-2xs border border-slate-200/60 dark:border-slate-700/60'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }
                  `}
                >
                  <span>{item.label}</span>
                  <span className="font-mono text-[10px] text-slate-400 font-normal">
                    ({item.sub})
                  </span>
                </button>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}

import React from 'react';
import { ChevronRight } from 'lucide-react';

/**
 * Боковая навигация по разделам настроек (адаптивная: вертикальная на десктопе, горизонтальная на мобильных)
 */
export default function SettingsSidebar({
  tabs = [],
  activeTab = 'general',
  setActiveTab,
  isSupplier = false
}) {
  return (
    <div className="w-full">
      {/* Мобильная версия (горизонтальный скролл) */}
      <div className="flex lg:hidden overflow-x-auto no-scrollbar gap-2 pb-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`
                px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer select-none shrink-0 border
                ${
                  isActive
                    ? isSupplier
                      ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-800 shadow-2xs'
                      : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 shadow-2xs'
                    : 'bg-white dark:bg-[#111827] text-slate-600 dark:text-slate-400 border-slate-200/80 dark:border-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                }
              `}
            >
              <Icon size={15} className={isActive ? (isSupplier ? 'text-blue-600 dark:text-blue-400' : 'text-emerald-600 dark:text-emerald-400') : 'text-slate-400'} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Десктопная версия (вертикальный список) */}
      <div className="hidden lg:block bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-2 shadow-2xs space-y-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`
                w-full px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer select-none text-left
                ${
                  isActive
                    ? isSupplier
                      ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 shadow-2xs border border-blue-200/60 dark:border-blue-800/60'
                      : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 shadow-2xs border border-emerald-200/60 dark:border-emerald-800/60'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200 border border-transparent'
                }
              `}
            >
              <div className="flex items-center gap-2.5">
                <span className={isActive ? (isSupplier ? 'text-blue-600 dark:text-blue-400' : 'text-emerald-600 dark:text-emerald-400') : 'text-slate-400'}>
                  <Icon size={16} />
                </span>
                <span>{tab.label}</span>
              </div>
              {isActive && <ChevronRight size={14} className={isSupplier ? 'text-blue-600' : 'text-emerald-600'} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

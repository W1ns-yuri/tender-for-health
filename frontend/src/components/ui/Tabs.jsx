import React from 'react';

export default function Tabs({
  tabs = [],
  activeTab,
  onChange,
  variant = 'pills', // 'pills' | 'underline' | 'segmented'
  size = 'md', // 'sm' | 'md'
  className = '',
}) {
  if (variant === 'segmented') {
    return (
      <div className={`inline-flex p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl gap-1 border border-slate-200/60 dark:border-slate-700/60 ${className}`}>
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              disabled={tab.disabled}
              onClick={() => onChange?.(tab.id)}
              className={`
                flex items-center gap-2 font-semibold transition-all duration-150 rounded-lg cursor-pointer
                ${size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-xs sm:text-sm'}
                ${
                  isActive
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }
                ${tab.disabled ? 'opacity-40 cursor-not-allowed' : ''}
              `}
            >
              {tab.icon && <span className="shrink-0">{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`
                    px-1.5 py-0.2 rounded-full text-[10px] font-bold
                    ${isActive ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}
                  `}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  if (variant === 'underline') {
    return (
      <div className={`flex border-b border-slate-200 dark:border-slate-800 gap-6 overflow-x-auto ${className}`}>
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              disabled={tab.disabled}
              onClick={() => onChange?.(tab.id)}
              className={`
                flex items-center gap-2 pb-3 font-semibold text-xs sm:text-sm transition-all duration-150 relative cursor-pointer whitespace-nowrap
                ${
                  isActive
                    ? 'text-blue-600 dark:text-blue-400 font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }
                ${tab.disabled ? 'opacity-40 cursor-not-allowed' : ''}
              `}
            >
              {tab.icon && <span className="shrink-0">{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`
                    px-1.5 py-0.5 rounded-full text-[10px] font-bold
                    ${isActive ? 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}
                  `}
                >
                  {tab.count}
                </span>
              )}
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-500 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // Default: 'pills'
  return (
    <div className={`flex items-center gap-2 overflow-x-auto ${className}`}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            disabled={tab.disabled}
            onClick={() => onChange?.(tab.id)}
            className={`
              flex items-center gap-2 font-semibold transition-all duration-150 rounded-xl cursor-pointer whitespace-nowrap border
              ${size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'}
              ${
                isActive
                  ? 'bg-blue-600 border-blue-600 text-white shadow-xs shadow-blue-500/20 font-bold'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }
              ${tab.disabled ? 'opacity-40 cursor-not-allowed' : ''}
            `}
          >
            {tab.icon && <span className="shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`
                  px-1.5 py-0.2 rounded-full text-[10px] font-bold
                  ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}
                `}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

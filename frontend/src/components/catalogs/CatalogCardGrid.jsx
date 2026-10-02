import React from 'react';

/**
 * Grid View showing catalog cards when no specific catalog is selected
 */
export default function CatalogCardGrid({
  items,
  activeSection,
  onSelectCatalog,
  isDarkMode,
  t,
}) {
  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {activeSection === 'haryt'
              ? t('sectionProducts', 'Каталог товаров')
              : t('sectionDirectories', 'Справочники')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {activeSection === 'haryt'
              ? t(
                  'catProductCatalogSubtitle',
                  'Единый классификатор номенклатуры товаров, торговых марок, действующих веществ (МНН) и характеристик'
                )
              : t(
                  'catalogsTitle',
                  'Общесистемные классификаторы, валюты, условия поставки и заказчики'
                )}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-fr">
        {items.map((item) => (
          <div
            key={item.id}
            onClick={() => onSelectCatalog(item.id)}
            className={`p-4 sm:p-5 rounded-2xl border flex items-center space-x-4 cursor-pointer transition-all duration-150 h-full min-h-[104px] ${
              isDarkMode
                ? 'bg-slate-800/90 border-slate-700/80 hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-950/30'
                : 'bg-white border-slate-200 hover:border-emerald-400 hover:shadow-md'
            }`}
          >
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                isDarkMode ? 'bg-slate-700/70 text-emerald-400' : 'bg-emerald-50 text-emerald-600'
              }`}
            >
              {item.icon}
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <h4
                className={`font-bold text-sm truncate ${
                  isDarkMode ? 'text-slate-100' : 'text-slate-800'
                }`}
                title={item.title}
              >
                {item.title}
              </h4>
              <p
                className="text-xs text-slate-400 dark:text-slate-500 line-clamp-2 mt-1 leading-snug h-[2rem]"
                title={item.subtitle}
              >
                {item.subtitle}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

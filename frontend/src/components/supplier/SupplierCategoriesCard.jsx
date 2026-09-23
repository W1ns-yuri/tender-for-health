import React from 'react';

export default function SupplierCategoriesCard({
  categoriesList = [],
  selectedCategoryIds = [],
  setSelectedCategoryIds,
  isEditable,
  supplier,
  t = (k, f) => f
}) {
  return (
    <div className="sm:col-span-2">
      <div className="flex items-center justify-between mb-1.5 ml-1">
        <label className="block text-xs font-bold text-slate-500">
          {t('supplierCategories', 'Категории деятельности')} {isEditable && <span className="text-rose-500">*</span>}
        </label>
        <span className="text-xs font-bold text-blue-600">
          {selectedCategoryIds.length} {t('categoriesSelected', 'выбрано')}
        </span>
      </div>
      {isEditable ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl">
          {categoriesList.map(cat => {
            const isChecked = selectedCategoryIds.includes(cat.id);
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setSelectedCategoryIds(prev => 
                    isChecked ? prev.filter(id => id !== cat.id) : [...prev, cat.id]
                  );
                }}
                className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-semibold border transition-all text-left cursor-pointer ${
                  isChecked
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-300'
                }`}
              >
                <div className={`w-4 h-4 rounded flex items-center justify-center border text-[10px] font-bold shrink-0 ${
                  isChecked ? 'bg-white text-blue-600 border-white' : 'border-slate-300 bg-white'
                }`}>
                  {isChecked ? '✓' : ''}
                </div>
                <span className="truncate">{cat.name}</span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-wrap gap-2 p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-2xl">
          {supplier?.categories && supplier.categories.length > 0 ? (
            supplier.categories.map(sc => (
              <span
                key={sc.categoryId}
                className="px-3 py-1 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-xl text-xs font-bold"
              >
                {sc.category?.name}
              </span>
            ))
          ) : (
            <span className="text-xs text-slate-400 italic">
              {t('noCategoriesAssigned', 'Направления не указаны')}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

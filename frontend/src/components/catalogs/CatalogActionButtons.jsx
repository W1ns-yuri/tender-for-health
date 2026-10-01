import React from 'react';
import { ToggleRight, ToggleLeft, Edit2, Trash2 } from 'lucide-react';

/**
 * Reusable action buttons for catalog table rows (Toggle Active, Edit, Delete)
 */
export default function CatalogActionButtons({
  item,
  allowToggle = true,
  onToggleActive,
  onEdit,
  onDelete,
  t,
}) {
  return (
    <div className="flex items-center justify-center gap-1.5">
      {allowToggle && item.isActive !== undefined && (
        <button
          type="button"
          onClick={() => onToggleActive && onToggleActive(item)}
          title={item.isActive ? t('deactivate', 'Деактивировать') : t('activate', 'Активировать')}
          className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-all cursor-pointer"
        >
          {item.isActive ? (
            <ToggleRight size={18} className="text-emerald-600" />
          ) : (
            <ToggleLeft size={18} className="text-slate-400" />
          )}
        </button>
      )}
      <button
        type="button"
        onClick={() => onEdit && onEdit(item)}
        title={t('edit', 'Редактировать')}
        className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center justify-center transition-all cursor-pointer"
      >
        <Edit2 size={14} />
      </button>
      <button
        type="button"
        onClick={() => onDelete && onDelete(item.id)}
        title={t('delete', 'Удалить')}
        className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 dark:hover:bg-rose-950/40 dark:hover:border-rose-900/60 dark:hover:text-rose-400 flex items-center justify-center transition-all cursor-pointer"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}

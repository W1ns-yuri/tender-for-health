import React from 'react';
import { Plus, Layers } from 'lucide-react';
import { Button } from '../ui';
import { getTranslation } from '../../utils/translations';

export default function SupplierListHeader({
  role = 'ADMIN',
  lang = 'RU',
  onManageCategories,
  onAddSupplier,
}) {
  const t = (key, fallback) => getTranslation(lang, key, fallback);
  const isAdmin = role === 'ADMIN';

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          {t('suppliersListTitle', 'Üpjün edijiler')}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {t('suppliersListDesc', 'Ulgamda hasaba alnan üpjün edijiler')}
        </p>
      </div>

      <div className="flex items-center gap-2.5">
        {isAdmin && onManageCategories && (
          <Button
            variant="outline"
            size="sm"
            onClick={onManageCategories}
            leftIcon={<Layers size={15} className="text-emerald-600 dark:text-emerald-400" />}
            title={t('manageCategoriesBtn', 'Управление категориями')}
          >
            <span>{t('manageCategoriesBtn', 'Управление категориями')}</span>
          </Button>
        )}

        {onAddSupplier && (
          <Button
            variant={isAdmin ? 'success' : 'primary'}
            size="sm"
            onClick={onAddSupplier}
            leftIcon={<Plus size={16} />}
          >
            <span>{t('addSupplier', 'Üpjün ediji goşmak')}</span>
          </Button>
        )}
      </div>
    </div>
  );
}

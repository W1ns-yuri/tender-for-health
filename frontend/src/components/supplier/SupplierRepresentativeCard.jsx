import React from 'react';
import { User } from 'lucide-react';

export default function SupplierRepresentativeCard({
  supplier,
  formData,
  t = (k, f) => f
}) {
  if (!supplier) return null;

  return (
    <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-50/70 to-indigo-50/40 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-100 dark:border-blue-900/40 rounded-2xl">
      <div className="flex items-center gap-2 mb-3">
        <User size={16} className="text-blue-600" />
        <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900 dark:text-blue-300">
          {t('accountRepresentativeInfo', 'Данные представителя аккаунта')}
        </h4>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        <div>
          <span className="text-slate-400 block mb-0.5">{t('fullNameLabel', 'ФИО')}</span>
          <span className="font-bold text-slate-800 dark:text-slate-200">
            {supplier.user?.firstName || supplier.user?.lastName 
              ? `${supplier.user?.firstName || ''} ${supplier.user?.lastName || ''}`.trim() 
              : (formData?.directorName || supplier.directorName || '—')}
          </span>
        </div>
        <div>
          <span className="text-slate-400 block mb-0.5">{t('email', 'Почта')}</span>
          <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">
            {supplier.user?.email || supplier.email || '—'}
          </span>
        </div>
        <div>
          <span className="text-slate-400 block mb-0.5">{t('phone', 'Телефон')}</span>
          <span className="font-bold text-slate-800 dark:text-slate-200">
            {supplier.user?.phone || supplier.phone || '—'}
          </span>
        </div>
        <div>
          <span className="text-slate-400 block mb-0.5">{t('registeredAt', 'Дата регистрации')}</span>
          <span className="font-bold text-slate-800 dark:text-slate-200">
            {supplier.user?.createdAt ? new Date(supplier.user.createdAt).toLocaleDateString() : (supplier.createdAt ? new Date(supplier.createdAt).toLocaleDateString() : '—')}
          </span>
        </div>
      </div>
    </div>
  );
}

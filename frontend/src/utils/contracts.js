/** Статусы договора: подпись и цвет плашки */
export const CONTRACT_STATUSES = {
  DRAFT: { label: 'Черновик', cls: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700' },
  SENT: { label: 'На подписи у поставщика', cls: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/60' },
  SUPPLIER_SIGNED: { label: 'Ждёт подписи организатора', cls: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800/60' },
  SIGNED: { label: 'Подписан', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/60' },
  CANCELLED: { label: 'Отменён', cls: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800/60' },
};

export const contractStatus = (s) => CONTRACT_STATUSES[s] || { label: s, cls: CONTRACT_STATUSES.DRAFT.cls };

/** 1500 → «1 500,00 TMT» */
export const formatMoney = (amount, currency) =>
  `${Number(amount || 0).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${currency ? ` ${currency}` : ''}`;

export const formatDate = (d) => (d ? new Date(d).toLocaleDateString('ru-RU') : '');

/** Чей сейчас ход: подсказка в списке */
export const nextStep = (status, isAdmin) => {
  if (status === 'DRAFT') return isAdmin ? 'Проверьте и отправьте поставщику' : 'Готовится организатором';
  if (status === 'SENT') return isAdmin ? 'Ждём скан от поставщика' : 'Подпишите и загрузите скан';
  if (status === 'SUPPLIER_SIGNED') return isAdmin ? 'Проверьте скан и подпишите' : 'Ждём подписи организатора';
  return '';
};

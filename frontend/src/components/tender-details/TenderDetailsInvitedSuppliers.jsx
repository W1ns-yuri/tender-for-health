import React from 'react';
import { Lock, Eye, Clock, CheckCircle2 } from 'lucide-react';

export default function TenderDetailsInvitedSuppliers({
  invitedSuppliers,
  offers,
  formatDate,
  isDarkMode,
  theme,
  t,
}) {
  const list = invitedSuppliers || [];

  return (
    <div className={`rounded-xl border shadow-xs overflow-hidden ${theme.cardBg}`}>
      <div
        className={`p-4 border-b flex items-center justify-between ${
          isDarkMode ? 'border-slate-800' : 'border-slate-100'
        }`}
      >
        <div className="flex items-center gap-2">
          <Lock size={16} className="text-amber-500" />
          <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">
            {t('invitedSuppliersMonitoring', 'Приглашенные поставщики')} ({list.length})
          </h3>
        </div>
        <span className="text-xs text-amber-700 dark:text-amber-300 font-bold px-2.5 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800">
          {t('closedTenderProtocol', 'Закрытая процедура (Ýapyk)')}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className={theme.tableHeaderBg}>
              <th className="py-3 px-4 w-12 text-center">#</th>
              <th className="py-3 px-4 min-w-56">{t('supplier', 'Поставщик')}</th>
              <th className="py-3 px-4 text-center w-36">{t('taxIdShort', 'ИНН / STŞK')}</th>
              <th className="py-3 px-4 text-center w-36">{t('invitationDate', 'Дата приглашения')}</th>
              <th className="py-3 px-4 text-center w-40">{t('viewStatus', 'Статус просмотра')}</th>
              <th className="py-3 px-4 text-center w-40">{t('offerStatus', 'Подача КП')}</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
            {list.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-6 text-center text-slate-400">
                  {t('noInvitedSuppliersFound', 'Список приглашенных поставщиков пуст')}
                </td>
              </tr>
            ) : (
              list.map((inv, idx) => {
                const hasSubmitted = (offers || []).some(
                  (o) => o.supplierId === inv.supplierId || o.supplier?.id === inv.supplierId
                );
                return (
                  <tr key={inv.id || idx} className={theme.tableRowHover}>
                    <td className="py-3.5 px-4 text-center font-bold text-slate-400">
                      {idx + 1}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-100">
                      {inv.supplier?.name || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-slate-500">
                      {inv.supplier?.taxId || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-center text-slate-500">
                      {formatDate(inv.invitedAt || inv.createdAt)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {inv.isViewed ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          <Eye size={12} />
                          <span>{t('viewed', 'Ознакомился')}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-500">
                          <Clock size={12} />
                          <span>{t('awaitingView', 'Ожидает просмотра')}</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {hasSubmitted ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200">
                          <CheckCircle2 size={12} />
                          <span>{t('offerSubmitted', 'КП подано')}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 font-medium">—</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

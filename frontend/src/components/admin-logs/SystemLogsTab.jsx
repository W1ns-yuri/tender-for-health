import React from 'react';
import { Eye } from 'lucide-react';
import { TableSkeletonRows } from '../ui';

/**
 * SystemLogsTab Component
 * Displays the comprehensive audit trail table with operation badges,
 * user identities, IP addresses, and payload inspection triggers.
 */
export default function SystemLogsTab({
  logs,
  loading,
  onSelectLog,
  isDarkMode,
  tableHeaderBg,
  t
}) {
  const getOperationBadge = (op) => {
    const norm = String(op || '').toUpperCase();
    if (norm === 'YAZMAK' || norm === 'ÝAZMAK' || norm === 'CREATE') {
      return (
        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 rounded font-semibold text-[11px]">
          {t('opCreate', 'СОЗДАНИЕ / ЗАПИСЬ')}
        </span>
      );
    }
    if (norm === 'TAZELEMEK' || norm === 'TÄZELEMEK' || norm === 'UPDATE') {
      return (
        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded font-semibold text-[11px]">
          {t('opUpdate', 'ИЗМЕНЕНИЕ')}
        </span>
      );
    }
    if (norm === 'POZMAK' || norm === 'DELETE') {
      return (
        <span className="px-2 py-0.5 bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300 rounded font-semibold text-[11px]">
          {t('opDelete', 'УДАЛЕНИЕ')}
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 rounded font-semibold text-[11px]">
        {op || 'LOG'}
      </span>
    );
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className={tableHeaderBg}>
            <th className="py-3 px-4">{t('auditColLogin', 'Логин')}</th>
            <th className="py-3 px-4">{t('auditColFullName', 'ФИО')}</th>
            <th className="py-3 px-4">{t('auditColEvent', 'Событие')}</th>
            <th className="py-3 px-4 text-center">{t('auditColAction', 'Действие')}</th>
            <th className="py-3 px-4 text-center">{t('auditColIp', 'IP-адрес')}</th>
            <th className="py-3 px-4 text-center">{t('auditColDate', 'Дата')}</th>
            <th className="py-3 px-4 text-center">{t('auditColDetails', 'Подробности')}</th>
          </tr>
        </thead>
        <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
          {loading ? (
            <TableSkeletonRows rows={8} cols={7} />
          ) : logs.length === 0 ? (
            <tr>
              <td colSpan="7" className="py-8 text-center text-slate-400">
                {t('noAuditLogsFound', 'Записи журнала аудита не найдены')}
              </td>
            </tr>
          ) : (
            logs.map((log) => {
              const dateStr = log.createdAt ? new Date(log.createdAt).toLocaleString('ru-RU') : '-';
              const userName = log.user
                ? `${log.user.firstName || ''} ${log.user.lastName || ''}`.trim()
                : log.data?.username || '-';
              const userLogin = log.user?.username || 'SYSTEM';

              return (
                <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4 font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                    {userLogin}
                  </td>
                  <td className="py-3 px-4 font-medium">{userName || '-'}</td>
                  <td className="py-3 px-4 font-semibold text-slate-600 dark:text-slate-300">
                    {log.eventType || 'SYSTEM'}
                  </td>
                  <td className="py-3 px-4 text-center">{getOperationBadge(log.operationType)}</td>
                  <td className="py-3 px-4 text-center font-mono text-slate-500">{log.ip || '127.0.0.1'}</td>
                  <td className="py-3 px-4 text-center text-slate-500">{dateStr}</td>
                  <td className="py-3 px-4 text-center">
                    {log.data ? (
                      <button
                        type="button"
                        onClick={() => onSelectLog(log)}
                        className="w-8 h-8 mx-auto rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center justify-center transition-all cursor-pointer"
                        title={t('auditColDetails', 'Подробности')}
                        aria-label={t('auditColDetails', 'Подробности')}
                      >
                        <Eye size={15} />
                      </button>
                    ) : (
                      '-'
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

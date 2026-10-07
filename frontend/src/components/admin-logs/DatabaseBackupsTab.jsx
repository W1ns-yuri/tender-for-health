import React from 'react';
import { CheckCircle, HardDriveDownload, Download, Undo2, Copy } from 'lucide-react';

/**
 * DatabaseBackupsTab Component
 * PostgreSQL maintenance dashboard showing health status, replication,
 * and dump creation / restore controls.
 */
export default function DatabaseBackupsTab({
  logsCount,
  usersCount,
  backupHistory,
  isDumping,
  onCreateDump,
  onDownloadDump,
  onRestoreDump,
  cardBg,
  tableHeaderBg,
  theme,
  isDarkMode,
  t
}) {
  return (
    <div className="p-6 space-y-6">
      {/* Active Database Status Banner */}
      <div className="flex items-center space-x-3 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-300 rounded-xl">
        <CheckCircle size={24} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
        <div>
          <h4 className="font-bold text-sm">
            {t('databaseActiveStatus', 'База данных PostgreSQL активна и защищена')}
          </h4>
          <p className="text-xs opacity-90 mt-0.5">
            {t(
              'backupSnapshotsNotice',
              'Автоматические снапшоты базы создаются регулярно. Журнал аудита фиксирует каждое мутирующее действие.'
            )}
          </p>
        </div>
      </div>

      {/* KPI metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className={`p-4 rounded-xl border ${cardBg} space-y-1`}>
          <p className="text-xs text-slate-400 font-semibold uppercase">
            {t('totalAuditLogsCount', 'Всего записей аудита')}
          </p>
          <p className="text-2xl font-bold text-emerald-600">{logsCount}</p>
        </div>
        <div className={`p-4 rounded-xl border ${cardBg} space-y-1`}>
          <p className="text-xs text-slate-400 font-semibold uppercase">
            {t('activeAccountsCount', 'Активных учетных записей')}
          </p>
          <p className="text-2xl font-bold text-blue-600">{usersCount}</p>
        </div>
        <div className={`p-4 rounded-xl border ${cardBg} space-y-1`}>
          <p className="text-xs text-slate-400 font-semibold uppercase">
            {t('replicationState', 'Состояние репликации')}
          </p>
          <p className="text-base font-bold text-emerald-600 flex items-center gap-1.5 mt-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
            {t('synchronizedStatus', 'Синхронизировано')}
          </p>
        </div>
      </div>

      {/* Backup list and Create Dump button */}
      <div className="pt-2 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">
              {t('backupDumpHistoryTitle', 'История резервных копий базы данных')}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Полные дампы структуры и данных PostgreSQL со сверкой целостности SHA-256
            </p>
          </div>
          <button
            type="button"
            onClick={onCreateDump}
            disabled={isDumping}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer ${
              theme.primaryBg
            } text-white disabled:opacity-70`}
          >
            <HardDriveDownload size={15} className={isDumping ? 'animate-bounce' : ''} />
            <span>{isDumping ? 'Формирование дампа...' : t('dumpDbBtn', 'Создать резервную копию (Dump DB)')}</span>
          </button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className={tableHeaderBg}>
                <th className="py-3 px-4">{t('backupColDate', 'Дата создания')}</th>
                <th className="py-3 px-4">{t('backupColDbVersion', 'Версия базы')}</th>
                <th className="py-3 px-4 text-center">{t('backupColArchiveSize', 'Размер архива')}</th>
                <th className="py-3 px-4">{t('backupColHash', 'Хеш SHA-256')}</th>
                <th className="py-3 px-4 text-center w-28">{t('backupColDownload', 'Скачать')}</th>
                <th className="py-3 px-4 text-center w-28">{t('backupColRestore', 'Восстановить')}</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
              {backupHistory.map((bk) => (
                <tr key={bk.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200 font-mono">
                    {bk.createdAt}
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{bk.dbVersion}</td>
                  <td className="py-3 px-4 text-center font-bold text-emerald-600 dark:text-emerald-400">
                    {bk.size}
                  </td>
                  <td className="py-3 px-4 font-mono text-[10px] text-slate-500 max-w-xs truncate" title={bk.sha256}>
                    {bk.sha256}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => onDownloadDump(bk)}
                      title={t('backupColDownload', 'Скачать')}
                      className="w-8 h-8 mx-auto rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center justify-center transition-all cursor-pointer"
                    >
                      <Download size={14} />
                    </button>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => onRestoreDump(bk)}
                      title={t('backupColRestore', 'Восстановить')}
                      className="w-8 h-8 mx-auto rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 hover:text-amber-600 hover:bg-amber-50 hover:border-amber-200 dark:hover:bg-amber-950/40 dark:hover:border-amber-900/60 dark:hover:text-amber-400 flex items-center justify-center transition-all cursor-pointer"
                    >
                      <Undo2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { Server, Download } from 'lucide-react';
import { Button } from '../ui';

/**
 * Вкладка 4: Системная информация и экспорт журнала аудита (только для Администратора)
 */
export default function SettingsSystemTab({
  isExportingLogs = false,
  handleExportAuditLogs,
  t
}) {
  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Экспорт системного журнала */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-2xs p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="font-bold text-sm text-slate-900 dark:text-white">
            {t('exportAuditLogsTitle', 'Выгрузка системного журнала аудита')}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {t('exportAuditLogsDesc', 'Выгрузка последних 500 записей действий пользователей, изменений статусов и транзакций в JSON-файл')}
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          isLoading={isExportingLogs}
          onClick={handleExportAuditLogs}
        >
          <Download size={14} className="mr-1.5" />
          <span>{t('downloadJson', 'Скачать JSON')}</span>
        </Button>
      </div>

      {/* Сведения о платформе */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-2xs p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Server size={16} className="text-emerald-600 dark:text-emerald-400" />
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            {t('systemInfoTitle', 'Информация об инфраструктуре')}
          </h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800">
            <span className="text-slate-400 text-[11px] block">{t('platformLabel', 'Платформа')}</span>
            <span className="font-bold text-slate-900 dark:text-white mt-0.5 block">Tender Ulgam</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800">
            <span className="text-slate-400 text-[11px] block">{t('buildVersionLabel', 'Версия сборки')}</span>
            <span className="font-mono font-bold text-slate-900 dark:text-white mt-0.5 block">v1.2.4-prod</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800">
            <span className="text-slate-400 text-[11px] block">{t('databaseLabel', 'База данных')}</span>
            <span className="font-bold text-slate-900 dark:text-white mt-0.5 block">PostgreSQL (Prisma)</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800">
            <span className="text-slate-400 text-[11px] block">{t('environmentLabel', 'Среда запуска')}</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 block">Production</span>
          </div>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { HardDriveDownload } from 'lucide-react';

/**
 * Резервное копирование.
 * Раньше вкладка была полностью имитацией: список «дампов» был захардкожен, кнопка «Создать дамп»
 * генерировала случайный sha256, а «Восстановить» показывала «База данных успешно восстановлена»,
 * ничего не делая. Админ был уверен, что бэкапы есть.
 * Бэкапы делаются на сервере (pg_dump по расписанию или средствами хостинга БД) — см. backend/README.md.
 */
export default function DatabaseBackupsTab({ logsCount, usersCount, cardBg, t }) {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start gap-3 p-4 rounded-xl border border-amber-200 bg-amber-50 text-amber-900 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-200">
        <HardDriveDownload size={22} className="shrink-0 mt-0.5" />
        <div className="space-y-1 text-sm">
          <h4 className="font-bold">{t('backupServerSideTitle', 'Резервное копирование выполняется на сервере')}</h4>
          <p className="opacity-90">
            {t(
              'backupServerSideDesc',
              'Создание и восстановление дампов из браузера не поддерживается. Настройте ежедневный pg_dump (скрипт backend/scripts/backup.sh) или автоматические бэкапы у хостинга базы данных и регулярно проверяйте восстановление.'
            )}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className={`p-4 rounded-xl border ${cardBg} space-y-1`}>
          <p className="text-xs text-slate-400 font-semibold uppercase">{t('totalAuditLogsCount', 'Всего записей аудита')}</p>
          <p className="text-2xl font-bold text-emerald-600">{logsCount}</p>
        </div>
        <div className={`p-4 rounded-xl border ${cardBg} space-y-1`}>
          <p className="text-xs text-slate-400 font-semibold uppercase">{t('activeAccountsCount', 'Активных учетных записей')}</p>
          <p className="text-2xl font-bold text-blue-600">{usersCount}</p>
        </div>
      </div>
    </div>
  );
}

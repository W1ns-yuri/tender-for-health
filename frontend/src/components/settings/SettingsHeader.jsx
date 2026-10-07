import React from 'react';
import { Badge } from '../ui';

/**
 * Шапка страницы настроек с заголовком, бейджем роли и чипом текущего пользователя
 */
export default function SettingsHeader({
  role = 'ADMIN',
  isSupplier = false,
  user = null,
  userInitials = 'U',
  t
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800">
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {t('settings', 'Настройки системы')}
          </h1>
          <Badge
            variant={isSupplier ? 'blue' : 'emerald'}
            status="ACTIVE"
            size="sm"
          >
            {isSupplier ? t('supplierStr', 'Поставщик') : t('adminStr', 'Администратор')}
          </Badge>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          {t('settingsSubtitle', 'Управление параметрами интерфейса, уведомлений и безопасности')}
        </p>
      </div>

      {/* Индикатор текущей учетной записи в шапке */}
      <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-2xs self-start sm:self-auto">
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
          isSupplier 
            ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300' 
            : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
        }`}>
          {userInitials}
        </div>
        <div className="text-left text-xs leading-tight">
          <div className="font-bold text-slate-900 dark:text-white">
            {user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : (t ? t('user', 'Пользователь') : 'Пользователь')}
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            @{user?.username || 'user'}
          </div>
        </div>
      </div>
    </div>
  );
}

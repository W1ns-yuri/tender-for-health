import React from 'react';
import { Bell, Volume2, VolumeX, Check } from 'lucide-react';
import { Button, Badge } from '../ui';

/**
 * Вкладка 2: Центр уведомлений, звуковые сигналы и событийные триггеры
 */
export default function SettingsNotificationsTab({
  isSupplier = false,
  soundEnabled = true,
  handleToggleSound,
  notifications = {},
  handleToggleNotification,
  handleSaveNotifications,
  t
}) {
  const eventTriggers = isSupplier ? [
    {
      key: 'deadlineReminder24h',
      title: t('notifyDeadline24h', 'Напоминание о дедлайне за 24 часа'),
      desc: t('notifyDeadline24hDesc', 'Предупреждать до наступления крайнего срока подачи заявок по открытым процедурам'),
    },
    {
      key: 'newTendersAlert',
      title: t('notifyNewTenders', 'Новые тендеры по моим категориям'),
      desc: t('notifyNewTendersDesc', 'Оповещать при публикации процедур по профилю вашей медицинской деятельности'),
    },
    {
      key: 'evaluationResults',
      title: t('notifyEvalResults', 'Итоги оценки и объявление победителя'),
      desc: t('notifyEvalResultsDesc', 'Мгновенное уведомление о результатах рассмотрения ваших поданных предложений'),
    },
    {
      key: 'verificationStatus',
      title: t('notifyVerification', 'Статус верификации компании'),
      desc: t('notifyVerificationDesc', 'Оповещения об одобрении модератором или замечаниях к документам организации'),
    },
  ] : [
    {
      key: 'newOfferSubmitted',
      title: t('notifyNewOffer', 'Подача нового предложения'),
      desc: t('notifyNewOfferDesc', 'Оповещать организатора, когда поставщик отправляет конверт с предложением'),
    },
    {
      key: 'supplierPendingReview',
      title: t('notifyPendingSupplier', 'Новый поставщик на модерацию'),
      desc: t('notifyPendingSupplierDesc', 'Уведомлять при регистрации компании, требующей проверки документов'),
    },
    {
      key: 'tendersOpeningDue',
      title: t('notifyOpeningDue', 'Наступление дедлайна тендера'),
      desc: t('notifyOpeningDueDesc', 'Оповещать о закрытии приема предложений и готовности процедуры к вскрытию конвертов'),
    },
    {
      key: 'securityAlerts',
      title: t('notifySecurityAlerts', 'Критические системные события'),
      desc: t('notifySecurityAlertsDesc', 'Оповещения об ошибках авторизации и модификации ключевых справочников'),
    },
  ];

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Каналы оповещений */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-2xs overflow-hidden">
        <div className="px-5 py-4 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200/80 dark:border-slate-800">
          <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider">
            {t('notificationChannels', 'Каналы оповещений')}
          </h3>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
          {/* Toast уведомления */}
          <div className="p-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                isSupplier 
                  ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-900/40' 
                  : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/40'
              }`}>
                <Bell size={18} />
              </div>
              <div>
                <div className="font-bold text-sm text-slate-900 dark:text-white">
                  {t('pushNotificationsActive', 'Всплывающие уведомления (Toasts)')}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {t('toastConfiguredStandard', 'Стандартное время показа уведомлений установлено на 3 секунды с возможностью паузы при наведении мыши')}
                </div>
              </div>
            </div>

            <Badge variant={isSupplier ? 'blue' : 'emerald'} size="sm">
              3 сек
            </Badge>
          </div>

          {/* Звуковые оповещения */}
          <div className="p-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                soundEnabled
                  ? (isSupplier ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600' : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600')
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
              } border border-slate-200/60 dark:border-slate-800`}>
                {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
              </div>
              <div>
                <div className="font-bold text-sm text-slate-900 dark:text-white">
                  {t('soundAlertsTitle', 'Звуковые сигналы')}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {t('soundAlertsDesc', 'Воспроизводить мягкий звуковой индикатор при получении системных оповещений')}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleToggleSound}
              className={`
                w-11 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer shrink-0
                ${soundEnabled ? (isSupplier ? 'bg-blue-600' : 'bg-emerald-600') : 'bg-slate-300 dark:bg-slate-700'}
              `}
            >
              <div
                className={`
                  w-5 h-5 rounded-full bg-white transition-transform shadow-xs
                  ${soundEnabled ? 'translate-x-5' : 'translate-x-0'}
                `}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Событийные триггеры */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-2xs overflow-hidden">
        <div className="px-5 py-4 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200/80 dark:border-slate-800">
          <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider">
            {isSupplier ? t('supplierProcurementEvents', 'События закупок поставщика') : t('organizerMonitoringEvents', 'События мониторинга организатора')}
          </h3>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
          {eventTriggers.map((item) => {
            const isChecked = Boolean(notifications[item.key]);
            return (
              <div key={item.key} className="p-5 flex items-center justify-between gap-4">
                <div className="max-w-2xl">
                  <div className="font-bold text-sm text-slate-800 dark:text-slate-200">{item.title}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{item.desc}</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleNotification(item.key)}
                  className={`
                    w-11 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer shrink-0
                    ${isChecked ? (isSupplier ? 'bg-blue-600' : 'bg-emerald-600') : 'bg-slate-300 dark:bg-slate-700'}
                  `}
                >
                  <div
                    className={`
                      w-5 h-5 rounded-full bg-white transition-transform shadow-xs
                      ${isChecked ? 'translate-x-5' : 'translate-x-0'}
                    `}
                  />
                </button>
              </div>
            );
          })}
        </div>

        <div className="p-4 bg-slate-50/70 dark:bg-slate-800/40 border-t border-slate-200/80 dark:border-slate-800 flex justify-end">
          <Button
            type="button"
            variant={isSupplier ? 'primary' : 'success'}
            size="sm"
            onClick={handleSaveNotifications}
          >
            <Check size={14} className="mr-1.5" />
            <span>{t('saveSettings', 'Сохранить настройки')}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

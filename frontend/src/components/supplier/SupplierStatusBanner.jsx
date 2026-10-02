import React from 'react';
import { CheckCircle2, XCircle, Clock, AlertCircle, X, Edit3, FileEdit } from 'lucide-react';
import { parseSupplierChanges } from './supplierUtils';

export default function SupplierStatusBanner({
  supplier,
  effectiveIsOwner,
  isAdmin,
  isBannerDismissed,
  onDismissBanner,
  isEditing,
  onStartEdit,
  t = (k, f) => f
}) {
  if (!supplier) return null;

  if (supplier.verificationStatus === 'VERIFIED') {
    if (isBannerDismissed || !effectiveIsOwner) return null;
    return (
      <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-start justify-between gap-3 mb-6 animate-in fade-in duration-200">
        <div className="flex items-start space-x-3">
          <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-emerald-800">{t('companyVerifiedBadge', 'Компания верифицирована на 100%')}</h3>
            <p className="text-emerald-600 text-sm mt-0.5">{t('biddingAccessGrantedNotice', 'Доступ к торгам открыт. Вы можете подавать заявки на тендеры.')}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onDismissBanner}
          className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-100/80 rounded-xl transition-colors cursor-pointer shrink-0"
          title={t('closeNotificationBtn', 'Закрыть уведомление')}
        >
          <X size={18} />
        </button>
      </div>
    );
  }

  if (supplier.verificationStatus === 'REJECTED') {
    return (
      <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 p-5 rounded-2xl mb-6 shadow-xs animate-in fade-in duration-200">
        <div className="flex items-start gap-3.5">
          <XCircle className="text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" size={24} />
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-rose-900 dark:text-rose-100 text-base">
              {t('rejectionBannerTitle', 'Верификация отклонена администратором Минздрава')}
            </h3>
            <p className="text-rose-700 dark:text-rose-300 text-xs mt-1 leading-relaxed">
              {t('rejectionBannerDesc', 'Администратор отклонил заявку на верификацию. Пожалуйста, ознакомьтесь с замечаниями ниже, внесите исправления и отправьте профиль на повторную проверку.')}
            </p>

            <div className="mt-3 p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-rose-200 dark:border-rose-900/60 shadow-xs">
              <span className="text-[11px] font-bold text-rose-500 uppercase tracking-wider block mb-1">
                {t('rejectionReasonLabel', 'Причина отклонения')}:
              </span>
              <p className="text-sm font-semibold text-rose-950 dark:text-rose-100 whitespace-pre-wrap">
                {supplier.rejectionReason || (t('reasonNotSpecifiedNotice', 'Причина не указана'))}
              </p>
            </div>

            {effectiveIsOwner && !isEditing && (
              <div className="mt-4 flex items-center gap-3">
                <button
                  type="button"
                  onClick={onStartEdit}
                  className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-rose-600/20 flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <Edit3 size={14} />
                  <span>{t('fixAndResubmitBtn', 'Редактировать профиль и исправить замечания')}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (supplier.verificationStatus === 'PENDING_REVIEW') {
    if (!effectiveIsOwner && !isAdmin) return null;

    const parsedNotes = parseSupplierChanges(supplier.notes);
    const hasChanges = Boolean(parsedNotes && parsedNotes.changes && parsedNotes.changes.length > 0);

    return (
      <div className="bg-gradient-to-r from-amber-50 to-orange-50/60 dark:from-amber-950/40 dark:to-orange-950/20 border border-amber-200/80 dark:border-amber-800/60 p-5 rounded-2xl mb-6 shadow-xs animate-in fade-in duration-200">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0 mt-0.5">
            {hasChanges ? <FileEdit size={22} /> : <Clock size={22} />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-amber-900 dark:text-amber-100 text-base">
                {isAdmin
                  ? t('moderationChangesTitle', 'Изменения, отправленные на проверку')
                  : t('docsUnderReviewTitle', 'Документы на проверке')}
              </h3>
              {hasChanges && (
                <span className="px-2.5 py-0.5 bg-amber-200/80 dark:bg-amber-900/70 text-amber-900 dark:text-amber-200 text-xs font-black rounded-full uppercase tracking-wider">
                  {t('moderationFieldChangedBadge', 'Изменено')} ({parsedNotes.changes.length})
                </span>
              )}
            </div>

            <p className="text-amber-800 dark:text-amber-200/90 text-xs mt-1 leading-relaxed">
              {isAdmin
                ? (hasChanges
                    ? t('moderationChangesSubtitle', 'Поставщик обновил только указанные ниже данные. Вам не требуется проверять весь профиль повторно — обратите внимание на измененные секции.')
                    : t('initialReviewSubtitle', 'Поставщик подал первичную заявку на верификацию. Проверьте реквизиты и прикрепленные уставные документы.'))
                : t('docsUnderReviewNotice', 'Ваши документы находятся на проверке специалистами Минздрава. Подача заявок временно заблокирована.')}
            </p>

            {hasChanges && (
              <div className="mt-3.5 pt-3 border-t border-amber-200/60 dark:border-amber-900/60">
                <span className="text-[11px] font-bold text-amber-800/80 dark:text-amber-300/80 uppercase tracking-wider block mb-2">
                  {t('modifiedFieldsLabel', 'Обновленные разделы анкеты:')}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {parsedNotes.changes.map((item, idx) => {
                    const labelText = t(item.key, item.label);
                    return (
                      <div
                        key={item.field || idx}
                        className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-amber-200/70 dark:border-amber-900/50 flex items-start gap-2 shadow-xs"
                      >
                        <span className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0"></span>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight">
                            {labelText}
                          </p>
                          {item.description && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!effectiveIsOwner) return null;

  // Статус PENDING: Гостевой режим
  return (
    <div className="bg-blue-50/90 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 p-4 sm:p-5 rounded-2xl flex items-start gap-3.5 mb-6">
      <AlertCircle className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" size={22} />
      <div>
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-blue-900 dark:text-blue-200 text-sm">
            {t('statusGuestTitle', 'Гостевой режим: доступен только просмотр торгов')}
          </h3>
          <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-[10px] font-black rounded-md">
            {t('statusGuestBadge', 'Гостевой доступ')}
          </span>
        </div>
        <p className="text-blue-700 dark:text-blue-300 text-xs mt-1 leading-relaxed">
          {t('statusGuestNotice', 'Для подачи ценовых предложений заполните профиль, прикрепите документы и отправьте анкету на модерацию в Минздрав.')}
        </p>
      </div>
    </div>
  );
}

import React from 'react';
import { Edit3, FileText, AlertCircle } from 'lucide-react';

export default function SupplierActionButtons({
  effectiveIsOwner,
  isVerified,
  isEditing,
  hasChanges,
  saving,
  hasDocuments,
  isCategoriesSelected,
  isLicenseExpired,
  isSubmitDisabled,
  supplier,
  onStartEdit,
  onCancelEdit,
  onShowCompanyCard,
  isDarkMode,
  t = (k, f) => f
}) {
  if (!effectiveIsOwner) return null;

  return (
    <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
      {isVerified ? (
        !isEditing ? (
          /* ВЕРИФИЦИРОВАН: Режим просмотра */
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              onClick={onStartEdit}
              className={`w-full sm:flex-1 py-3.5 px-6 border font-bold rounded-2xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer text-sm active:scale-[0.99] ${
                isDarkMode 
                  ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200' 
                  : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700'
              }`}
            >
              <Edit3 size={18} />
              <span>{t('editProfileBtn', 'Редактировать профиль')}</span>
            </button>
            
            <button
              type="button"
              onClick={onShowCompanyCard}
              className="w-full sm:flex-1 py-3.5 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 cursor-pointer text-sm active:scale-[0.99]"
            >
              <FileText size={18} />
              <span>{t('downloadCompanyCard', 'Скачать карточку предприятия (PDF)')}</span>
            </button>
          </div>
        ) : (
          /* ВЕРИФИЦИРОВАН: Режим редактирования */
          <div className="space-y-4">
            {hasChanges && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-xs text-amber-800 animate-in fade-in">
                <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">{t('resubmitWarningTitle', 'Повторная модерация')}</p>
                  <p className="mt-0.5 leading-relaxed">
                    {t('resubmitWarning', 'При изменении юридических или банковских реквизитов статус верификации будет временно приостановлен до проверки администратором Минздрава.')}
                  </p>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                type="button"
                onClick={onCancelEdit}
                disabled={saving}
                className="w-full sm:w-auto px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition-all text-sm cursor-pointer"
              >
                {t('cancelEditBtn', 'Отмена')}
              </button>

              {hasChanges ? (
                <button
                  type="submit"
                  disabled={saving || !hasDocuments || isLicenseExpired}
                  className="w-full sm:flex-1 py-4 px-6 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-amber-600/20 flex items-center justify-center gap-2 cursor-pointer text-sm active:scale-[0.99]"
                >
                  {saving ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>{t('submitting', 'Отправка...')}</span>
                    </>
                  ) : (
                    <span>{t('resubmitBtn', 'Сохранить и отправить на повторную проверку')}</span>
                  )}
                </button>
              ) : (
                <div className="text-xs text-slate-400 italic px-2">
                  {t('editFieldsToResubmitPrompt', 'Измените поля, чтобы отправить на повторную проверку')}
                </div>
              )}
            </div>
          </div>
        )
      ) : (
        /* НЕ ВЕРИФИЦИРОВАН (PENDING / REJECTED): Кнопка отправки на модерацию */
        <div className="space-y-3">
          {!isCategoriesSelected && (
            <div className="flex items-center gap-2.5 p-3.5 bg-amber-50 border border-amber-200/80 rounded-xl text-xs font-semibold text-amber-800 animate-in fade-in">
              <AlertCircle size={16} className="text-amber-600 shrink-0" />
              <span>{t('atLeastOneCategoryRequired', 'Выберите хотя бы одну категорию деятельности')}</span>
            </div>
          )}

          {!hasDocuments && (
            <div className="flex items-center gap-2.5 p-3.5 bg-amber-50 border border-amber-200/80 rounded-xl text-xs font-semibold text-amber-800 animate-in fade-in">
              <AlertCircle size={16} className="text-amber-600 shrink-0" />
              <span>{t('attachDocsToSubmit', 'Прикрепите документы для отправки на проверку')}</span>
            </div>
          )}

          {isLicenseExpired && (
            <div className="flex items-center gap-2.5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-800 animate-in fade-in">
              <AlertCircle size={16} className="text-rose-600 shrink-0" />
              <span>{t('licenseExpiredError', 'Внимание: срок действия вашей медицинской лицензии истек!')}</span>
            </div>
          )}

          {supplier?.verificationStatus === 'REJECTED' && !hasChanges && (
            <div className="flex items-center gap-2.5 p-3.5 bg-rose-50 border border-rose-200/80 rounded-xl text-xs font-semibold text-rose-800 animate-in fade-in">
              <AlertCircle size={16} className="text-rose-600 shrink-0" />
              <span>{t('noChangesResubmitError', 'Внесите изменения в реквизиты перед повторной отправкой на проверку')}</span>
            </div>
          )}

          <button 
            type="submit" 
            disabled={isSubmitDisabled} 
            className={`w-full py-4 rounded-2xl font-bold transition-all flex items-center justify-center space-x-2 text-base ${
              isSubmitDisabled
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed opacity-50 shadow-none'
                : 'bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white shadow-lg shadow-blue-500/25 cursor-pointer'
            }`}
          >
            {saving ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>{t('submitting', 'Отправка...')}</span>
              </>
            ) : (
              <span>{t('submitToModerationBtn', 'Отправить анкету на модерацию в Минздрав')}</span>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

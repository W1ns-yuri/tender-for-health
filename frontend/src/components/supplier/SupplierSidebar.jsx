import React from 'react';
import { ShieldCheck, CheckCircle2, XCircle, ArrowLeft, Check, Clock, FileText, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getCompanyTypeBadge } from './supplierUtils';

export default function SupplierSidebar({
  supplier,
  formData,
  documents = [],
  readiness,
  stats = { totalOffers: 0, wonOffers: 0 },
  isAdmin,
  isModerating,
  isForeignCompany,
  isLicenseExpired,
  onApprove,
  onOpenRejectModal,
  cardBg,
  t = (k, f) => f
}) {
  const navigate = useNavigate();

  if (!supplier) return null;

  return (
    <div className="w-full lg:w-80 shrink-0">
      <div className="sticky top-6 self-start space-y-6">
        {isAdmin ? (
          /* ВИДЖЕТ МОДЕРАТОРА ДЛЯ АДМИНИСТРАТОРА */
          <div className={`rounded-[2rem] p-6 space-y-5 ${cardBg} border`}>
            <div className="flex items-center space-x-2.5 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white text-sm leading-tight">
                  {t('adminReviewDossier', 'Анкета поставщика')}
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {t('profileVerificationHeader', 'Проверка профиля')}
                </p>
              </div>
            </div>

            {/* Текущий статус */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                {t('currentStatusLabel', 'Текущий статус')}
              </span>
              <div className="flex items-center gap-2">
                {supplier.verificationStatus === 'VERIFIED' ? (
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    {t('statusVerifiedBadge', 'Верифицирован')}
                  </span>
                ) : supplier.verificationStatus === 'PENDING_REVIEW' ? (
                  <span className="text-xs font-bold text-amber-600 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                    {t('statusInReviewBadge', 'На проверке')}
                  </span>
                ) : supplier.verificationStatus === 'REJECTED' ? (
                  <span className="text-xs font-bold text-rose-600 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                    {t('statusRejectedBadge', 'Отклонен')}
                  </span>
                ) : (
                  <span className="text-xs font-bold text-blue-600 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                    {t('statusGuestBadge', 'Гостевой доступ')}
                  </span>
                )}
              </div>
            </div>

            {/* Сводка реквизитов */}
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">{t('countryLabel', 'Страна')}:</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">{formData?.countryName || 'Туркменистан'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">{t('companyLegalForm', 'Форма')}:</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">{getCompanyTypeBadge(supplier.type, supplier, isForeignCompany, t)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">{isForeignCompany ? 'Tax ID:' : 'STŞK:'}</span>
                <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{supplier.taxId || '-'}</span>
              </div>
              {formData?.isMedicalLicensed && (
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400">Лицензия:</span>
                  <span className={`font-bold ${isLicenseExpired ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {formData.licenseNumber} ({isLicenseExpired ? 'Просрочена' : 'Действует'})
                  </span>
                </div>
              )}
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">{t('uploadedDocsCount', 'Документы')}:</span>
                <span className="font-bold text-blue-600">{documents.length} {t('attachedCountSuffix', 'прикреплено')}</span>
              </div>
            </div>

            {/* Если отклонен - показываем причину в сайдбаре */}
            {supplier.verificationStatus === 'REJECTED' && supplier.rejectionReason && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 rounded-xl">
                <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider block mb-1">
                  {t('rejectionReasonLabel', 'Причина отклонения')}:
                </span>
                <p className="text-xs text-rose-800 dark:text-rose-200 font-medium">
                  {supplier.rejectionReason}
                </p>
              </div>
            )}

            {/* Кнопки действий администратора */}
            {supplier.verificationStatus !== 'VERIFIED' ? (
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={onApprove}
                  disabled={isModerating}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <CheckCircle2 size={16} />
                  <span>{t('approveSupplier', 'Одобрить верификацию')}</span>
                </button>
                <button
                  type="button"
                  onClick={onOpenRejectModal}
                  disabled={isModerating}
                  className="w-full py-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 dark:bg-rose-950/30 dark:border-rose-900/40 dark:text-rose-400 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <XCircle size={16} />
                  <span>{t('rejectSupplier', 'Отклонить заявку')}</span>
                </button>
              </div>
            ) : (
              <div className="pt-2">
                <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-xl text-center space-y-2">
                  <p className="text-xs font-bold text-emerald-800 dark:text-emerald-200">
                    {t('profileVerified100', '🟢 Профиль активен на 100%')}
                  </p>
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400">
                    {t('verificationConfirmedStatus', 'Верификация подтверждена')}
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate('/suppliers', { state: { activeTab: 'pending' } })}
                    className="w-full mt-1.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ArrowLeft size={14} />
                    <span>{t('backToModerationList', 'К заявкам')}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Для невалидированного поставщика показываем виджет готовности профиля */
          supplier.verificationStatus !== 'VERIFIED' ? (
            <div className={`rounded-[2rem] p-6 space-y-6 ${cardBg} border`}>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-white text-sm leading-tight">
                      {t('profileReadiness', 'Готовность профиля')}
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {t('profileReadinessSub', 'Для допуска к торгам')}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-black text-blue-600 bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 rounded-lg">
                  {readiness?.percent || 0}%
                </span>
              </div>

              {/* Прогресс-бар */}
              <div className="space-y-1.5">
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${readiness?.percent || 0}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-[11px] text-slate-400 font-medium">
                  <span>{t('profileProgress', 'Прогресс')}</span>
                  <span>{readiness?.percent || 0}%</span>
                </div>
              </div>

              {/* Чек-лист шагов */}
              <div className="space-y-3.5 pt-1">
                {readiness?.steps?.map((step) => (
                  <div key={step.id} className="flex items-start space-x-3">
                    {step.completed ? (
                      <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                        <Check size={12} strokeWidth={3} />
                      </div>
                    ) : step.pending ? (
                      <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 mt-0.5 animate-pulse shadow-xs">
                        <Clock size={12} strokeWidth={2.5} />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-slate-300 dark:border-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                      </div>
                    )}
                    <div className="text-xs leading-snug">
                      <p className={`font-semibold ${step.completed ? 'text-slate-800 dark:text-slate-200' : 'text-slate-500'}`}>
                        {step.title}
                      </p>
                      {step.pending && (
                        <span className="text-[10px] text-amber-600 font-medium">
                          {t('profileStepWaiting', 'Ожидает решения модератора Минздрава')}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Подсказка */}
              <div className="p-3.5 bg-blue-50/70 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 rounded-xl text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                {t('profileFillTip', 'Заполните все разделы формы, прикрепите сканы документов и отправьте профиль на проверку.')}
              </div>
            </div>
          ) : (
            /* Для подтвержденного пользователя возвращаем карточки статистики */
            <div className="space-y-4">
              <div className={`rounded-[2rem] p-6 flex flex-col items-center justify-center text-center space-y-3 ${cardBg}`}>
                <div className="p-4 bg-blue-50 text-blue-600 rounded-full">
                  <FileText size={32} />
                </div>
                <div>
                  <p className="text-4xl font-black text-slate-800 dark:text-white">{stats.totalOffers}</p>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">
                    {t('totalProposalsCount', 'Всего заявок')}
                  </p>
                </div>
              </div>

              <div className={`rounded-[2rem] p-6 flex flex-col items-center justify-center text-center space-y-3 ${cardBg}`}>
                <div className="p-4 bg-amber-50 text-amber-600 rounded-full">
                  <Trophy size={32} />
                </div>
                <div>
                  <p className="text-4xl font-black text-slate-800 dark:text-white">{stats.wonOffers}</p>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">
                    {t('tenderWinsCount', 'Побед в тендерах')}
                  </p>
                </div>
              </div>

              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center">
                <p className="text-xs font-bold text-emerald-800">
                  {t('profileVerified100', '🟢 Профиль активен на 100%')}
                </p>
                <p className="text-[11px] text-emerald-600 mt-0.5">
                  {t('profileVerified100Sub', 'Вы можете подавать ценовые предложения')}
                </p>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}

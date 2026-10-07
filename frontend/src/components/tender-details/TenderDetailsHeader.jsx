import React from 'react';
import { Clock, Users, LayoutGrid, Edit2, Lock, AlertCircle } from 'lucide-react';
import { getStatusBadge, getTypeBadge } from '../../utils/statusUtils';
import { safeString } from '../../utils/themeUtils';

export default function TenderDetailsHeader({
  data,
  role,
  isDarkMode,
  theme,
  isSupplierVerified,
  hasSubmittedOffer,
  supplierProfile,
  formatDate,
  getClientName,
  getCategoryName,
  navigate,
  lang = 'RU',
  t,
}) {
  return (
    <div className={`p-6 rounded-xl border shadow-xs ${theme.cardBg}`}>
      {/* Верхний заголовок и кнопки действий */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {safeString(data?.tenderNumber)}
            </h1>
            {data?.visibility === 'YAPYK' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 shadow-2xs">
                <Lock size={12} />
                <span>{t('closedTenderBadge', 'Закрытый тендер')}</span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
            {safeString(data?.title)}
          </p>
        </div>

        {/* Кнопки действий */}
        <div className="flex items-center gap-2.5 shrink-0">
          {role === 'ADMIN' && (
            <button
              type="button"
              onClick={() => navigate(`/tenders/${data.id}/edit`)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Edit2 size={14} />
              <span>{t('editTenderAndLots', 'Редактировать / Управлять лотами')}</span>
            </button>
          )}

          {role === 'SUPPLIER' && (
            hasSubmittedOffer ? (
              <button
                type="button"
                disabled
                className={`px-5 py-2.5 rounded-xl font-bold text-xs shadow-sm transition-all opacity-60 cursor-not-allowed ${theme.primaryBtn}`}
                title={t('alreadySubmitted', 'Вы уже подали заявку на этот тендер')}
              >
                {t('offerSubmitted', 'КП подано')}
              </button>
            ) : !isSupplierVerified ? (
              <button
                type="button"
                disabled
                className="px-5 py-2.5 rounded-xl font-bold text-xs shadow-sm transition-all opacity-50 cursor-not-allowed bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                title={t('verificationRequiredToBid', 'Для подачи ценового предложения необходимо пройти верификацию компании')}
              >
                {t('submitOfferBtn', 'Подать предложение')}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate(`/create-offer/${data.id}`)}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer active:scale-95 ${theme.primaryBtn}`}
              >
                {t('submitOfferBtn', 'Подать предложение')}
              </button>
            )
          )}
        </div>
      </div>

      {/* Баннер предупреждения для неверифицированного поставщика */}
      {role === 'SUPPLIER' && supplierProfile && supplierProfile.verificationStatus !== 'VERIFIED' && (
        <div className="mt-4 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <AlertCircle size={18} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-900 dark:text-amber-100">
                {t('verificationRequiredToBidTitle', 'Требуется верификация компании')}
              </h4>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                {supplierProfile.verificationStatus === 'PENDING_REVIEW'
                  ? t('profileInReviewCannotBidNotice', 'Ваши документы находятся на проверке у администратора. Доступ к торгам откроется после одобрения.')
                  : supplierProfile.verificationStatus === 'REJECTED'
                  ? t('profileRejectedCannotBidNotice', 'Верификация отклонена. Исправьте замечания в профиле и отправьте его на повторную проверку.')
                  : t('completeProfileToBidNotice', 'Для подачи ценовых предложений необходимо заполнить реквизиты и прикрепить документы в профиле.')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/profile')}
            className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer"
          >
            {t('goToProfileBtn', 'Перейти в профиль')}
          </button>
        </div>
      )}

      {/* Даты и статусы */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <div className={`flex items-center space-x-6 text-sm font-medium ${theme.subText}`}>
          <div className="flex items-center space-x-1.5">
            <Clock size={16} className="opacity-75" />
            <span>
              {t('announcementDate', 'Дата объявления')}:{' '}
              <strong className={isDarkMode ? 'text-slate-200' : 'text-slate-700 font-medium'}>
                {formatDate(data?.announcementDate)}
              </strong>
            </span>
          </div>
          <div className="flex items-center space-x-1.5">
            <Clock size={16} className="opacity-75" />
            <span>
              {t('deadline', 'Срок приема')}:{' '}
              <strong className={isDarkMode ? 'text-slate-200' : 'text-slate-700 font-medium'}>
                {formatDate(data?.deadline)}
              </strong>
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-sm flex-wrap gap-y-2">
          <span className={theme.subText}>{t('type', 'Вид закупки')}:</span>{' '}
          {getTypeBadge(data?.type, lang, isDarkMode)}
          <span className={`ml-2 ${theme.subText}`}>{t('status', 'Статус')}:</span>{' '}
          {getStatusBadge(data?.status, lang, isDarkMode)}
          <span className={`ml-2 ${theme.subText}`}>{t('visibility', 'Доступность')}:</span>
          <span
            className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${
              data?.visibility === 'YAPYK'
                ? 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700/60'
                : role === 'SUPPLIER'
                ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800'
            }`}
          >
            {data?.visibility === 'YAPYK'
              ? t('visibilityPrivate', 'Закрытый')
              : t('openVisibility', 'Открытый')}
          </span>
        </div>
      </div>

      {/* Заказчик и Категория */}
      <div className={`mt-3 flex items-center space-x-6 text-sm font-medium pb-6 border-b ${isDarkMode ? 'border-slate-800' : 'border-slate-100'} ${theme.subText}`}>
        <div className="flex items-center space-x-1.5">
          <Users size={16} className="opacity-75" />
          <span>
            {t('client', 'Заказчик')}:{' '}
            <strong className={isDarkMode ? 'text-slate-200' : 'text-slate-700 font-medium'}>
              {getClientName(data)}
            </strong>
          </span>
        </div>
        <div className="flex items-center space-x-1.5">
          <LayoutGrid size={16} className="opacity-75" />
          <span>
            {t('category', 'Категория')}:{' '}
            <strong className={isDarkMode ? 'text-slate-200' : 'text-slate-700 font-medium'}>
              {getCategoryName(data)}
            </strong>
          </span>
        </div>
      </div>

      {/* Описание (Mazmuny) */}
      {data?.description && (
        <div className="mt-5">
          <h4 className={`text-sm font-bold mb-1.5 ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
            {t('description', 'Описание закупки')}:
          </h4>
          <div className={`text-xs sm:text-sm leading-relaxed whitespace-normal text-wrap ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
            {safeString(data.description)}
          </div>
        </div>
      )}

      {/* Технические требования */}
      {data?.technicalSpecs && (
        <div className="mt-5">
          <h4 className={`text-sm font-bold mb-1.5 ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
            {t('technicalSpecs', 'Технические требования')}:
          </h4>
          <div className={`text-xs sm:text-sm leading-relaxed whitespace-normal text-wrap ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
            {safeString(data.technicalSpecs)}
          </div>
        </div>
      )}
    </div>
  );
}

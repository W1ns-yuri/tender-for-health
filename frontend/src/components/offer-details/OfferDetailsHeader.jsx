import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  FileText, 
  Calendar, 
  MapPin, 
  Building2, 
  CheckCircle2,
  Globe2,
  ExternalLink
} from 'lucide-react';
import { getStatusBadge, getTypeBadge } from '../../utils/statusUtils';
import { pluralize } from '../../utils/pluralize';

/**
 * OfferDetailsHeader Component
 * Renders the top navigation, offer identification badge, total price widget,
 * and key metadata cards (Related Tender & Commercial Terms).
 */
export default function OfferDetailsHeader({
  offer,
  role,
  lang,
  isDarkMode,
  theme,
  t,
  formatDate,
  currencyCode,
  supplierName,
  tenderNumber,
  tenderTitle,
  rawSpecsCount,
  lotGroups
}) {
  const navigate = useNavigate();
  const isAdmin = role === 'ADMIN';

  // Check if tender is of type SERVICES / WORKS or contains service-oriented lots
  const isServiceOrWork = 
    offer?.tender?.type === 'SERVICES' || 
    offer?.tender?.type === 'WORKS' || 
    lotGroups.some(g => 
      g.lot?.lotType === 'SERVICES' || 
      g.lot?.lotType === 'WORKS' || 
      (g.lot?.name && (
        g.lot.name.toLowerCase().includes('сервис') || 
        g.lot.name.toLowerCase().includes('ремонт') ||
        g.lot.name.toLowerCase().includes('hyzmat')
      ))
    );

  const firstLot = lotGroups[0]?.lot;
  const deliveryAddress = firstLot?.workAddress || firstLot?.deliveryAddress || t('ashgabatCity', 'г. Ашхабад');
  const slaPeriod = firstLot?.slaPeriod || firstLot?.workPeriod || t('standardSla', 'По регламенту SLA');

  return (
    <div className="space-y-4">
      {/* Back button */}
      <div>
        <button 
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 px-3 py-1.5 -ml-1 text-sm font-semibold rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label={t('back', 'Назад')}
        >
          <ArrowLeft size={16} />
          <span>{t('back', 'Назад')}</span>
        </button>
      </div>

      {/* Main card */}
      <div className={`p-5 sm:p-6 rounded-2xl border shadow-xs transition-colors ${theme.cardBg}`}>
        {/* Top Header Row */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100 dark:border-slate-800/80">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {offer.number || `OFFER-${offer.id.slice(0, 8)}`}
              </h1>
              {getStatusBadge(offer.status, lang, isDarkMode)}
            </div>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs sm:text-sm text-slate-500 font-medium">
              <span className="flex items-center gap-1.5">
                <Calendar size={15} className="opacity-70 text-slate-400 shrink-0" />
                <span className="text-slate-400">{t('submissionDateLabel', 'Дата подачи:')}</span>
                <strong className="text-slate-700 dark:text-slate-200 font-semibold">{formatDate(offer.createdAt)}</strong>
              </span>

              <span className="flex items-center gap-1.5">
                <Building2 size={15} className="opacity-70 text-slate-400 shrink-0" />
                <span className="text-slate-400">{t('supplierLabel', 'Поставщик:')}</span>
                <strong className="text-slate-700 dark:text-slate-200 font-semibold">{supplierName}</strong>
              </span>

              {offer.supplier?.country?.name && (
                <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                  <Globe2 size={14} className="opacity-60" />
                  <span>({offer.supplier.country.name})</span>
                </span>
              )}
            </div>
          </div>

          {/* Proposal Total Amount Badge */}
          <div className={`w-full sm:w-auto px-5 py-4 rounded-xl border shadow-xs text-left sm:text-right ${
            isAdmin
              ? 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-300'
              : 'bg-blue-50/90 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/80 text-blue-800 dark:text-blue-300'
          }`}>
            <span className={`text-[11px] font-bold uppercase tracking-wider block ${
              isAdmin ? 'text-emerald-700 dark:text-emerald-300' : 'text-blue-700 dark:text-blue-300'
            }`}>
              {t('proposalAmountTitle', 'Сумма предложения')}
            </span>
            <div className={`text-2xl sm:text-3xl font-black my-1 tracking-tight whitespace-nowrap ${
              isAdmin ? 'text-emerald-700 dark:text-emerald-300' : 'text-blue-600 dark:text-blue-400'
            }`}>
              {(offer.offeredPrice || 0).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currencyCode}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium flex items-center sm:justify-end gap-1.5">
              <CheckCircle2 size={13} className={isAdmin ? 'text-emerald-600 dark:text-emerald-400' : 'text-blue-600 dark:text-blue-400'} />
              <span>{pluralize(rawSpecsCount, ['позиция', 'позиции', 'позиций'])} {t('inBidSuffix', 'в заявке')}</span>
            </div>
          </div>
        </div>

        {/* 2 Metadata Cards: Related Tender & Terms */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-6">
          {/* Card 1: Related Tender */}
          <div className="p-4 sm:p-5 rounded-xl bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200/70 dark:border-slate-800/80 space-y-3.5">
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <FileText size={16} className={theme.primaryText} />
              <span>{t('relatedTenderTitle', 'Связанный тендер')}</span>
            </h3>

            <div className="space-y-2.5 text-xs sm:text-sm">
              <div className="flex items-start justify-between gap-3">
                <span className="text-slate-400 font-medium shrink-0">{t('tenderNumberWithColon', 'Номер тендера:')}</span>
                <span className="font-bold font-mono text-slate-700 dark:text-slate-200 text-right">{tenderNumber}</span>
              </div>

              <div className="flex items-start justify-between gap-3">
                <span className="text-slate-400 font-medium shrink-0">{t('tenderSubjectWithColon', 'Предмет тендера:')}</span>
                <button
                  type="button"
                  onClick={() => offer.tender?.id && navigate(`/tender-details/${offer.tender.id}`)}
                  className={`font-semibold text-right hover:underline inline-flex items-center gap-1 transition-colors max-w-xs ${theme.primaryText}`}
                  title={tenderTitle}
                >
                  <span className="line-clamp-2">{tenderTitle}</span>
                  <ExternalLink size={12} className="shrink-0 opacity-70" />
                </button>
              </div>

              <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-200/50 dark:border-slate-800">
                <span className="text-slate-400 font-medium shrink-0">{t('procurementTypeWithColon', 'Тип закупки:')}</span>
                <div>{getTypeBadge(offer.tender?.type, lang, isDarkMode)}</div>
              </div>
            </div>
          </div>

          {/* Card 2: Commercial & Delivery Terms */}
          <div className="p-4 sm:p-5 rounded-xl bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200/70 dark:border-slate-800/80 space-y-3.5">
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <MapPin size={16} className={theme.primaryText} />
              <span>{t('paymentAndDeliveryTermsTitle', 'Условия оплаты и поставки')}</span>
            </h3>

            <div className="space-y-2.5 text-xs sm:text-sm">
              {isServiceOrWork ? (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-slate-400 font-medium shrink-0">{t('workAddressLabel', 'Адрес выполнения работ:')}</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-200 text-right">{deliveryAddress}</span>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-slate-400 font-medium shrink-0">{t('slaReglamentLabel', 'Срок оказания услуг / Регламент SLA:')}</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-200 text-right">{slaPeriod}</span>
                  </div>
                </>
              ) : (
                <div className="flex items-start justify-between gap-3">
                  <span className="text-slate-400 font-medium shrink-0">{t('generalDeliveryTermLabel', 'Условие поставки (общее):')}</span>
                  <span className={`px-2.5 py-0.5 rounded-md font-bold text-xs border ${
                    isAdmin
                      ? 'bg-emerald-100/80 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                      : 'bg-blue-100/80 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                  }`}>
                    {offer.deliveryTerm ? `${offer.deliveryTerm.shortName} — ${offer.deliveryTerm.name}` : (t('byLotsBadge', 'По лотам'))}
                  </span>
                </div>
              )}

              <div className="flex items-start justify-between gap-3">
                <span className="text-slate-400 font-medium shrink-0">{t('paymentTermsLabel', 'Условия оплаты:')}</span>
                <span className="font-semibold text-slate-700 dark:text-slate-200 text-right">{offer.paymentTerms || t('notSpecifiedPlural', 'Не указаны')}</span>
              </div>

              {offer.comment && (
                <div className="pt-2 border-t border-slate-200/50 dark:border-slate-800">
                  <span className="text-slate-400 font-medium block mb-1">{t('supplierNotesLabel', 'Примечание поставщика:')}</span>
                  <p className="text-slate-600 dark:text-slate-300 italic text-xs leading-relaxed bg-white/50 dark:bg-slate-800/40 p-2.5 rounded-lg border border-slate-200/40 dark:border-slate-800">
                    {offer.comment}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

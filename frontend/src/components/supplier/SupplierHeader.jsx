import React, { useRef } from 'react';
import { Camera, Globe, Lock } from 'lucide-react';
import { getCleanCompanyName, getBrandInitials, getCompanyTypeBadge } from './supplierUtils';

export default function SupplierHeader({
  supplier,
  formData,
  isEditable,
  isForeignCompany,
  onLogoUpload,
  t = (k, f) => f
}) {
  const logoInputRef = useRef(null);

  if (!supplier) return null;

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 pb-6 border-b border-slate-100 dark:border-slate-800">
      <div className="relative group shrink-0">
        <div className="h-20 w-20 bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 text-white rounded-[1.25rem] flex items-center justify-center shadow-lg shadow-blue-500/30 shrink-0 font-black text-2xl tracking-wider select-none overflow-hidden">
          {(formData?.logoUrl || supplier.logoUrl) ? (
            <img
              src={formData?.logoUrl || supplier.logoUrl}
              alt={supplier.name}
              className="w-full h-full object-cover"
            />
          ) : (
            getBrandInitials(supplier.name)
          )}
        </div>
        {isEditable && (
          <>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              className="hidden"
              onChange={onLogoUpload}
            />
            <button
              type="button"
              onClick={() => logoInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-md border-2 border-white dark:border-slate-900 transition-all hover:scale-110 cursor-pointer"
              title={t('uploadLogo', 'Загрузить логотип')}
            >
              <Camera size={13} />
            </button>
          </>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <h1 className="text-2xl font-black tracking-tight truncate">
          {getCleanCompanyName(supplier.name)}
        </h1>
        <div className="flex flex-wrap items-center gap-2.5 mt-2">
          {/* Форма собственности */}
          <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg">
            {getCompanyTypeBadge(supplier.type, supplier, isForeignCompany, t)}
          </span>

          {/* Страна регистрации */}
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-xs font-bold rounded-lg">
            <Globe size={13} />
            <span>{formData?.countryName || supplier.country?.nameRu || supplier.country?.name || 'Туркменистан'}</span>
          </span>
          
          {/* Налоговый идентификатор STŞK / TIN */}
          <span 
            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg cursor-help hover:bg-slate-200/70 transition-colors" 
            title={t('stskLockedHint', 'Идентификационный номер зафиксирован после верификации')}
          >
            <Lock size={12} className="text-slate-400" />
            <span>{isForeignCompany ? 'Tax ID / TIN:' : 'STŞK:'} <strong className="text-slate-900 dark:text-white font-bold">{supplier.taxId}</strong></span>
          </span>

          {/* Бейдж статуса верификации в шапке */}
          {supplier.verificationStatus === 'VERIFIED' ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200/80 rounded-full text-xs font-bold shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              {t('statusVerifiedBadge', 'Верифицирован')}
            </span>
          ) : supplier.verificationStatus === 'PENDING_REVIEW' ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200/80 rounded-full text-xs font-bold shadow-xs">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              {t('statusInReviewBadge', 'На проверке')}
            </span>
          ) : supplier.verificationStatus === 'REJECTED' ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-700 border border-rose-200/80 rounded-full text-xs font-bold shadow-xs">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              {t('statusRejectedBadge', 'Отклонен')}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200/80 rounded-full text-xs font-bold shadow-xs">
              <span className="w-2 h-2 rounded-full bg-blue-400"></span>
              {t('statusGuestBadge', 'Гостевой доступ')}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

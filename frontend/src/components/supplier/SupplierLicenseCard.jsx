import React from 'react';
import { Award, AlertCircle, ShieldCheck, FileCheck, Info } from 'lucide-react';

export default function SupplierLicenseCard({
  formData,
  setFormData,
  isEditable,
  inputBg,
  t = (k, f) => f
}) {
  const isLicensed = Boolean(formData?.isMedicalLicensed);
  const isLicenseExpired = Boolean(
    isLicensed &&
    formData?.licenseExpiryDate &&
    new Date(formData.licenseExpiryDate) < new Date().setHours(0, 0, 0, 0)
  );

  const handleToggle = () => {
    if (!isEditable) return;
    setFormData(prev => ({
      ...prev,
      isMedicalLicensed: !prev.isMedicalLicensed
    }));
  };

  return (
    <div className="p-6 bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs space-y-5 transition-all">
      
      {/* 1. Заголовок блока на всю ширину */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
            <Award size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
              {t('medicalLicenseBlockTitle', 'Лицензии и сертификаты Минздрава')}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {t('medicalLicenseSubtitle', 'Обязательно для поставщиков медикаментов, мед. оборудования и изделий мед. назначения')}
            </p>
          </div>
        </div>

        {/* Бейдж текущего статуса лицензии */}
        <div className="shrink-0 self-start sm:self-center">
          {isLicensed ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 shadow-2xs">
              <ShieldCheck size={13} className="text-emerald-500" />
              <span>{t('licenseClaimedBadge', 'Лицензия заявлена')}</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
              <span>{t('noLicenseBadge', 'Без лицензии')}</span>
            </span>
          )}
        </div>
      </div>

      {/* 2. Полноразмерный интерактивный переключатель (Toggle Card) */}
      <div
        onClick={handleToggle}
        className={`w-full p-4 rounded-xl border transition-all duration-200 select-none ${
          isEditable ? 'cursor-pointer hover:shadow-xs' : 'cursor-default'
        } ${
          isLicensed
            ? 'bg-blue-50/70 dark:bg-blue-950/30 border-blue-200/90 dark:border-blue-800/60'
            : 'bg-slate-50/80 dark:bg-slate-850/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
        } flex items-center justify-between gap-4`}
      >
        <div className="flex items-start sm:items-center gap-3 min-w-0">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
            isLicensed
              ? 'bg-blue-600 text-white shadow-xs shadow-blue-600/30'
              : 'bg-slate-200 dark:bg-slate-750 text-slate-400 dark:text-slate-500'
          }`}>
            <FileCheck size={18} />
          </div>
          <div className="min-w-0">
            <span className={`text-xs sm:text-sm font-semibold block leading-snug wrap-break-word ${
              isLicensed
                ? 'text-blue-950 dark:text-blue-200'
                : 'text-slate-850 dark:text-slate-200'
            }`}>
              {t('isMedicalLicensedLabel', 'Деятельность подлежит лицензированию Минздравом (Фармацевтика / Медтехника)')}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
              {isLicensed
                ? t('licenseEnabledNotice', 'Заполните обязательные поля реквизитов лицензии ниже')
                : t('licenseDisabledNotice', 'Включите переключатель, если ваша организация поставляет медикаменты или медтехнику')}
            </span>
          </div>
        </div>

        {/* Современный плавный iOS-style Toggle Switch */}
        {isEditable && (
          <div className="shrink-0 flex items-center">
            <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${
              isLicensed ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
            }`}>
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition-transform duration-200 ease-in-out ${
                isLicensed ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </div>
          </div>
        )}
      </div>

      {/* 3. Блок полей лицензии (раскрывается только если лицензия включена) */}
      {isLicensed ? (
        <div className="space-y-4 pt-1 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Номер лицензии */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 ml-0.5">
                {t('licenseNumberLabel', 'Номер лицензии Минздрава')} <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required={isLicensed}
                disabled={!isEditable}
                value={formData?.licenseNumber || ''}
                onChange={e => setFormData(prev => ({ ...prev, licenseNumber: e.target.value }))}
                placeholder={isEditable ? 'MED-LIC-00123-TM' : '—'}
                className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-medium border transition-colors ${inputBg} ${
                  !formData?.licenseNumber && isEditable ? 'border-amber-300/80 focus:border-blue-500' : ''
                }`}
              />
            </div>

            {/* Кем выдана */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 ml-0.5">
                {t('licenseIssuedByLabel', 'Кем выдана')}
              </label>
              <input
                type="text"
                disabled={!isEditable}
                value={formData?.licenseIssuedBy || ''}
                onChange={e => setFormData(prev => ({ ...prev, licenseIssuedBy: e.target.value }))}
                placeholder={isEditable ? t('licenseIssuedByPlaceholder', 'Минздрав Туркменистана') : '—'}
                className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-medium border transition-colors ${inputBg}`}
              />
            </div>

            {/* Срок действия до */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 ml-0.5">
                {t('licenseExpiryDateLabel', 'Срок действия до')} <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required={isLicensed}
                disabled={!isEditable}
                value={formData?.licenseExpiryDate ? String(formData.licenseExpiryDate).slice(0, 10) : ''}
                onChange={e => setFormData(prev => ({ ...prev, licenseExpiryDate: e.target.value }))}
                className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-medium border transition-colors ${
                  isLicenseExpired 
                    ? 'border-rose-400 bg-rose-50/80 text-rose-900 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-200' 
                    : inputBg
                }`}
              />
            </div>

          </div>

          {/* Предупреждение о просроченной лицензии */}
          {isLicenseExpired && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-300 rounded-xl text-xs font-semibold flex items-center gap-2.5 animate-in fade-in">
              <AlertCircle size={18} className="text-rose-600 dark:text-rose-400 shrink-0" />
              <span>{t('licenseExpiredError', 'Внимание: срок действия вашей медицинской лицензии истек!')}</span>
            </div>
          )}
        </div>
      ) : (
        /* Информационный текст при отсутствии лицензии */
        <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
          <Info size={15} className="text-slate-400 shrink-0" />
          <span>{t('medicalLicenseNotClaimed', 'Компания не заявляет наличие специальной лицензии Минздрава.')}</span>
        </div>
      )}

    </div>
  );
}

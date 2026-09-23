import React from 'react';
import { Award, AlertCircle } from 'lucide-react';

export default function SupplierLicenseCard({
  formData,
  setFormData,
  isEditable,
  inputBg,
  t = (k, f) => f
}) {
  const isLicenseExpired = Boolean(
    formData?.isMedicalLicensed &&
    formData?.licenseExpiryDate &&
    new Date(formData.licenseExpiryDate) < new Date().setHours(0, 0, 0, 0)
  );

  return (
    <div className="p-5 bg-gradient-to-br from-indigo-50/60 via-blue-50/40 to-slate-50/60 dark:from-slate-800/50 dark:to-slate-900/50 border border-blue-100 dark:border-slate-700/80 rounded-2xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Award size={18} className="text-blue-600" />
            {t('medicalLicenseBlockTitle', 'Лицензии и сертификаты Минздрава')}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t('medicalLicenseSubtitle', 'Обязательно для поставщиков медикаментов, мед. оборудования и изделий мед. назначения')}
          </p>
        </div>
        {isEditable && (
          <label className="inline-flex items-center gap-2 cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={Boolean(formData?.isMedicalLicensed)}
              onChange={e => setFormData(prev => ({ ...prev, isMedicalLicensed: e.target.checked }))}
              className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
            />
            <span className="text-xs font-bold text-blue-900 dark:text-blue-300">
              {t('isMedicalLicensedLabel', 'Есть лицензия Минздрава')}
            </span>
          </label>
        )}
      </div>

      {formData?.isMedicalLicensed ? (
        <div className="space-y-3 pt-2 border-t border-blue-100 dark:border-slate-700">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1 ml-1">
                {t('licenseNumberLabel', 'Номер лицензии Минздрава')} <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required={formData.isMedicalLicensed}
                disabled={!isEditable}
                value={formData.licenseNumber}
                onChange={e => setFormData(prev => ({ ...prev, licenseNumber: e.target.value }))}
                placeholder={isEditable ? '№ 12-34/56' : ''}
                className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-medium border ${inputBg}`}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1 ml-1">
                {t('licenseIssuedByLabel', 'Кем выдана')}
              </label>
              <input
                type="text"
                disabled={!isEditable}
                value={formData.licenseIssuedBy}
                onChange={e => setFormData(prev => ({ ...prev, licenseIssuedBy: e.target.value }))}
                placeholder={isEditable ? t('licenseIssuedByPlaceholder', 'Минздрав Туркменистана') : ''}
                className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-medium border ${inputBg}`}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1 ml-1">
                {t('licenseExpiryDateLabel', 'Срок действия до')} <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required={formData.isMedicalLicensed}
                disabled={!isEditable}
                value={formData.licenseExpiryDate}
                onChange={e => setFormData(prev => ({ ...prev, licenseExpiryDate: e.target.value }))}
                className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-medium border ${
                  isLicenseExpired 
                    ? 'border-rose-400 bg-rose-50 text-rose-800' 
                    : inputBg
                }`}
              />
            </div>
          </div>

          {/* Предупреждение о просроченной лицензии */}
          {isLicenseExpired && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <AlertCircle size={18} className="text-rose-600 shrink-0" />
              <span>{t('licenseExpiredError', 'Внимание: срок действия вашей медицинской лицензии истек!')}</span>
            </div>
          )}
        </div>
      ) : (
        <p className="text-xs text-slate-400 italic">
          {t('medicalLicenseNotClaimed', 'Компания не заявляет наличие специальной лицензии Минздрава.')}
        </p>
      )}
    </div>
  );
}

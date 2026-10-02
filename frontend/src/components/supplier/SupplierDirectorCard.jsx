import React from 'react';
import { User } from 'lucide-react';

export default function SupplierDirectorCard({
  formData,
  setFormData,
  isEditable,
  isForeignCompany,
  passportError,
  setPassportError,
  personalCodeError,
  setPersonalCodeError,
  isDirectorModified = false,
  inputBg,
  t = (k, f) => f
}) {
  // Обработка ввода паспорта: серия (римские цифры + дефис + 2 буквы) + пробел + строго максимум 6 цифр
  const handlePassportChange = (e) => {
    let input = e.target.value.toUpperCase();
    if (setPassportError) setPassportError('');

    const digits = (input.match(/\d/g) || []).join('').slice(0, 6);
    let letters = input.replace(/[0-9]/g, '').trim();
    letters = letters.replace(/^([I|V|X]+)[-\s]?([A-ZА-Я]{1,2})/i, '$1-$2');
    letters = letters.replace(/-+$/, '');

    if (letters.length > 7) {
      letters = letters.slice(0, 7);
    }

    let result = letters;
    if (digits.length > 0 || input.includes(' ')) {
      result = letters ? `${letters} ${digits}`.trimEnd() : digits;
      if (input.endsWith(' ') && !result.endsWith(' ')) {
        result += ' ';
      }
    }

    setFormData(prev => ({
      ...prev,
      passportSeries: result
    }));
  };

  // Обработка ввода 14-значного личного кода руководителя (Шехсы код / Şahsy kod)
  const handlePersonalCodeChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 14);
    if (setPersonalCodeError) setPersonalCodeError('');
    setFormData(prev => ({ ...prev, directorPersonalCode: raw }));
  };

  return (
    <div>
      <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
        <User size={18} className="text-blue-600" />
        {t('directorData', 'Данные руководителя')}
        {isDirectorModified && (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200 border border-amber-300 dark:border-amber-800 uppercase tracking-wider">
            {t('moderationFieldChangedBadge', 'Изменено')}
          </span>
        )}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Серия и номер паспорта */}
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">
            {t('passportSeriesLabel', 'Серия и номер паспорта')} {isEditable && !isForeignCompany && <span className="text-rose-500">*</span>}
          </label>
          <input 
            type="text" 
            required={!isForeignCompany}
            disabled={!isEditable}
            value={formData.passportSeries}
            onChange={!isForeignCompany ? handlePassportChange : (e => setFormData(prev => ({ ...prev, passportSeries: e.target.value })))}
            placeholder={isEditable ? (!isForeignCompany ? "I-AS 123456" : "Паспорт руководителя") : ""}
            className={`w-full px-4 py-3 rounded-xl text-sm font-medium border ${inputBg}`} 
          />
          {isEditable && !isForeignCompany && (
            passportError ? (
              <p className="text-[11px] text-rose-500 font-semibold mt-1 ml-1">{passportError}</p>
            ) : (
              <p className="text-[11px] text-slate-400 mt-1 ml-1">{t('passportFormatHint', 'Пример: I-AS 123456 (серия и 6 цифр)')}</p>
            )
          )}
        </div>

        {/* Кем и когда выдан */}
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">
            {t('passportIssuedLabel', 'Кем и когда выдан')} {isEditable && !isForeignCompany && <span className="text-rose-500">*</span>}
          </label>
          <input 
            type="text" 
            required={!isForeignCompany}
            disabled={!isEditable}
            value={formData.passportIssuedBy}
            onChange={e => setFormData(prev => ({ ...prev, passportIssuedBy: e.target.value }))}
            placeholder={isEditable ? (t('samplePassportAuthority', 'Ашхабадским ГОВД, 15.05.2018')) : ''}
            className={`w-full px-4 py-3 rounded-xl text-sm font-medium border ${inputBg}`} 
          />
        </div>

        {/* Личный код руководителя (Şahsy kod / 14 цифр) */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">
            {t('directorPersonalCodeLabel', 'Личный код руководителя (Şahsy kody)')} {!isForeignCompany && isEditable && <span className="text-slate-400 font-normal"> (14 цифр из паспорта)</span>}
          </label>
          <input 
            type="text" 
            disabled={!isEditable}
            maxLength={14}
            value={formData.directorPersonalCode}
            onChange={handlePersonalCodeChange}
            placeholder={isEditable ? "14-значный номер из паспорта" : ""}
            className={`w-full px-4 py-3 rounded-xl text-sm font-medium tracking-wider border ${inputBg}`} 
          />
          {isEditable && (
            personalCodeError ? (
              <p className="text-[11px] text-rose-500 font-semibold mt-1 ml-1">{personalCodeError}</p>
            ) : (
              <p className="text-[11px] text-slate-400 mt-1 ml-1">
                {t('directorPersonalCodeHint', '14-значный персональный номер гражданина ТМ из биометрического паспорта')}
              </p>
            )
          )}
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { Building2 } from 'lucide-react';
import CustomSelect from '../CustomSelect';
import { getCleanCompanyName, getCompanyTypeBadge } from './supplierUtils';

export default function SupplierBasicInfoCard({
  formData,
  setFormData,
  isEditable,
  isForeignCompany,
  role,
  isDarkMode,
  inputBg,
  t = (k, f) => f
}) {
  return (
    <div>
      <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
        <Building2 size={18} className="text-blue-600" />
        {t('companyLegalData', 'Данные компании и форма')}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Организационно-правовая форма */}
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">
            {t('companyLegalForm', 'Организационно-правовая форма')} {isEditable && <span className="text-rose-500">*</span>}
          </label>
          {isEditable ? (
            <CustomSelect
              role={role}
              value={formData.type}
              onChange={(val) => setFormData(prev => ({ ...prev, type: val }))}
              options={isForeignCompany ? [
                { id: 'FOREIGN_ENTITY', name: t('foreignEntity', 'Иностранное юр. лицо (Foreign Entity)') },
                { id: 'FOREIGN_BRANCH', name: t('foreignBranch', 'Представительство / Филиал (Branch / Office)') },
                { id: 'FOREIGN_SOLE_TRADER', name: t('foreignSoleTrader', 'Индивидуальный предприниматель (Sole Proprietor)') },
              ] : [
                { id: 'ENTREPRENEUR', name: 'ИП (Hususy telekeçi)' },
                { id: 'BUSINESS_SOCIETY', name: 'ХО (Hojalyk jemgyýeti)' },
                { id: 'PRIVATE_ENTERPRISE', name: 'ЧП (Hususy kärhana)' },
                { id: 'DAÝHAN_HOJALYGY', name: 'DH (Daýhan hojalygy)' },
                { id: 'GOVERNMENT', name: 'Гос. предприятие (Döwlet kärhanasy)' }
              ]}
              isDarkMode={isDarkMode}
              size="md"
            />
          ) : (
            <div className={`w-full px-4 py-3 rounded-xl text-sm font-medium border ${inputBg}`}>
              {getCompanyTypeBadge(formData.type, null, isForeignCompany, t)}
            </div>
          )}
        </div>

        {/* Наименование компании / бренда */}
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">
            {t('companyBrandName', 'Наименование компании / бренда')} {isEditable && <span className="text-rose-500">*</span>}
          </label>
          <input
            type="text"
            required
            disabled={!isEditable}
            value={formData.name}
            onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
            onBlur={() => {
              const cleaned = getCleanCompanyName(formData.name);
              if (cleaned !== formData.name) {
                setFormData(prev => ({ ...prev, name: cleaned }));
              }
            }}
            placeholder={isEditable ? t('companyBrandPlaceholder', 'например, Медик-Фарм') : ''}
            className={`w-full px-4 py-3 rounded-xl text-sm font-medium border ${inputBg}`}
          />
          {isEditable && (
            <p className="text-[11px] text-slate-400 mt-1 ml-1">
              {t('companyBrandHint', 'Указывайте только название бренда без организационной формы (ИП, ХО, ЧП)')}
            </p>
          )}
        </div>

        {/* Код предприятия (ХОПО / ОКПО) для ТМ или регистрационный номер для иностранных компаний */}
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">
            {isForeignCompany ? t('taxIdLabelForeign', 'Регистрационный номер / Tax ID') : t('okpoCodeLabel', 'Код предприятия (ХОПО / ОКПО)')}
          </label>
          <input
            type="text"
            disabled={!isEditable}
            value={formData.okpoCode}
            onChange={e => setFormData(prev => ({ ...prev, okpoCode: e.target.value }))}
            placeholder={isEditable ? (isForeignCompany ? 'Reg. No / TIN' : '8 цифр') : ''}
            className={`w-full px-4 py-3 rounded-xl text-sm font-medium border ${inputBg}`}
          />
          {isEditable && (
            <p className="text-[11px] text-slate-400 mt-1 ml-1">
              {isForeignCompany ? t('foreignRegCodeHint', 'Регистрационный номер в торговом реестре') : t('okpoCodeHint', '8-значный код ОКПО предприятия')}
            </p>
          )}
        </div>

        {/* ФИО Руководителя */}
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">
            {t('directorFullNameLabel', 'ФИО Руководителя')} {isEditable && <span className="text-rose-500">*</span>}
          </label>
          <input
            type="text"
            required
            disabled={!isEditable}
            value={formData.directorName}
            onChange={e => setFormData(prev => ({ ...prev, directorName: e.target.value }))}
            placeholder={isEditable ? t('directorNamePlaceholder', 'например, Иванов Иван Иванович') : ''}
            className={`w-full px-4 py-3 rounded-xl text-sm font-medium border ${inputBg}`}
          />
          {isEditable && (
            <p className="text-[11px] text-slate-400 mt-1 ml-1">
              {t('directorNameHint', 'ФИО первого руководителя организации или ИП')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

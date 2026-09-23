import React from 'react';
import { FileText, Printer, X, CheckCircle2 } from 'lucide-react';
import { getFullFormalCompanyName, getCompanyTypeBadge } from './supplierUtils';

export default function SupplierCompanyCardModal({
  isOpen,
  onClose,
  supplier,
  formData,
  documents = [],
  isForeignCompany = false,
  regionLabel = '',
  t = (k, f) => f
}) {
  if (!isOpen || !supplier) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm print:p-0 print:bg-white print:static print:inset-auto">
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #company-card-printable, #company-card-printable * {
            visibility: visible !important;
          }
          #company-card-printable {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            padding: 1.5rem !important;
            margin: 0 !important;
            border: none !important;
          }
        }
      `}</style>
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden print:shadow-none print:max-w-none print:max-h-none print:w-full print:rounded-none">
        
        {/* Панель управления печатью */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="text-blue-600" size={20} />
            <h3 className="font-bold text-slate-800 text-sm">
              {t('companyCardOfficial', 'ОФИЦИАЛЬНАЯ КАРТОЧКА ПРЕДПРИЯТИЯ')}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm shadow-blue-500/20 active:scale-95"
            >
              <Printer size={15} />
              <span>{t('printCompanyCard', 'Печать / Сохранить в PDF')}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Карточка предприятия */}
        <div id="company-card-printable" className="p-8 overflow-y-auto space-y-6 text-slate-800 print:overflow-visible print:p-6 bg-white">
          
          {/* Фирменная шапка */}
          <div className="border-b-2 border-slate-900 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                TÜRKMENISTANYŇ DÖWLET SAGLYK GORAÝYŞ SANLY TENDER MEÝDANÇASY
              </p>
              <h2 className="text-2xl font-black text-slate-900 mt-1">
                {getFullFormalCompanyName(supplier.name, supplier.type)}
              </h2>
              <p className="text-xs text-slate-600 font-medium mt-0.5">
                {getCompanyTypeBadge(supplier.type, supplier, isForeignCompany, t)} • {formData?.countryName || 'Туркменистан'}
              </p>
            </div>
            <div className="text-left sm:text-right shrink-0">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-full text-xs font-black">
                <CheckCircle2 size={14} className="text-emerald-600" />
                {t('verifiedStateBadge', 'Верифицированный участник электронных торгов')}
              </span>
              <p className="text-[11px] text-slate-400 mt-1 font-mono">
                {t('exportDateLabel', 'Дата выгрузки')}: {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Сетка основных реквизитов */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            
            {/* Блок адреса и контактов */}
            <div className="p-4 bg-slate-50 rounded-2xl space-y-2.5 border border-slate-200/80">
              <p className="font-black text-slate-400 uppercase tracking-wider text-[10px]">
                {t('contactInfo', 'Адрес и контакты')}
              </p>
              <div>
                <p className="text-slate-500">{isForeignCompany ? 'Страна / Регион:' : 'Велаят / Регион:'}</p>
                <p className="font-bold text-slate-800">{regionLabel || supplier.region || formData?.countryName || '-'}</p>
              </div>
              <div>
                <p className="text-slate-500">{t('legalAddressLabel', 'Юридический адрес')}:</p>
                <p className="font-bold text-slate-800">{formData?.legalAddress || '-'}</p>
              </div>
              <div>
                <p className="text-slate-500">{t('actualAddressLabel', 'Фактический адрес')}:</p>
                <p className="font-bold text-slate-800">{formData?.address || '-'}</p>
              </div>
              <div>
                <p className="text-slate-500">{t('workPhone', 'Телефон')}:</p>
                <p className="font-bold text-slate-800">{formData?.phone || '-'}</p>
              </div>
              <div>
                <p className="text-slate-500">Email:</p>
                <p className="font-bold text-slate-800">{formData?.email || '-'}</p>
              </div>
            </div>

            {/* Блок банковских и налоговых реквизитов */}
            <div className="p-4 bg-slate-50 rounded-2xl space-y-2.5 border border-slate-200/80">
              <p className="font-black text-slate-400 uppercase tracking-wider text-[10px]">
                {t('bankDetails', 'Банковские и налоговые реквизиты')}
              </p>
              <div>
                <p className="text-slate-500">{isForeignCompany ? 'Tax ID / TIN:' : 'STŞK / Салык коду:'}</p>
                <p className="font-bold text-slate-900 text-sm tracking-wide">{supplier.taxId}</p>
              </div>
              {formData?.okpoCode && (
                <div>
                  <p className="text-slate-500">{isForeignCompany ? 'Reg. Code:' : 'Код предприятия (ОКПО):'}</p>
                  <p className="font-bold text-slate-800 font-mono">{formData.okpoCode}</p>
                </div>
              )}
              <div>
                <p className="text-slate-500">{t('bankNameLabel', 'Банк')}:</p>
                <p className="font-bold text-slate-800">{formData?.bankName || '-'}</p>
              </div>
              {formData?.bankAccount && (
                <div>
                  <p className="text-slate-500">{t('bankAccountLabel', 'Расчетный счет')}:</p>
                  <p className="font-bold text-slate-800 tracking-wider font-mono">{formData.bankAccount}</p>
                </div>
              )}
              {formData?.bankIban && (
                <div>
                  <p className="text-slate-500">IBAN:</p>
                  <p className="font-bold text-slate-800 tracking-wider font-mono">{formData.bankIban} ({formData?.bankCurrency})</p>
                </div>
              )}
              {formData?.bankSwift && (
                <div>
                  <p className="text-slate-500">SWIFT / BIC:</p>
                  <p className="font-bold text-slate-800 font-mono">{formData.bankSwift}</p>
                </div>
              )}
              {formData?.bankMfo && (
                <div>
                  <p className="text-slate-500">{t('bankMfoLabel', 'МФО банка')}:</p>
                  <p className="font-bold text-slate-800">{formData.bankMfo}</p>
                </div>
              )}
            </div>

          </div>

          {/* Данные руководителя и медицинские лицензии */}
          <div className="p-4 bg-slate-50 rounded-2xl space-y-2 border border-slate-200/80 text-xs">
            <p className="font-black text-slate-400 uppercase tracking-wider text-[10px]">
              {t('directorData', 'Руководитель и разрешения')}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {formData?.directorName && (
                <div>
                  <p className="text-slate-500">{t('directorFullNameLabel', 'ФИО Руководителя')}:</p>
                  <p className="font-bold text-slate-800 text-sm">{formData.directorName}</p>
                </div>
              )}
              {formData?.directorPersonalCode && (
                <div>
                  <p className="text-slate-500">{t('directorPersonalCodeLabel', 'Личный код руководителя (Şahsy kody)')}:</p>
                  <p className="font-bold text-slate-800 font-mono tracking-wider">{formData.directorPersonalCode}</p>
                </div>
              )}
              {formData?.passportSeries && (
                <div>
                  <p className="text-slate-500">{t('passportSeriesLabel', 'Серия и номер паспорта')}:</p>
                  <p className="font-bold text-slate-800 tracking-wider font-mono">{formData.passportSeries}</p>
                </div>
              )}
              {formData?.isMedicalLicensed && (
                <div className="sm:col-span-2 p-2.5 bg-blue-50/80 rounded-xl border border-blue-100 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-blue-900">Лицензия Минздрава: № {formData.licenseNumber}</p>
                    <p className="text-[11px] text-blue-700">Выдана: {formData.licenseIssuedBy || 'Минздрав ТМ'}</p>
                  </div>
                  <span className="text-xs font-bold text-blue-800">до {formData.licenseExpiryDate}</span>
                </div>
              )}
            </div>
          </div>

          {/* Проверенные документы */}
          {documents.length > 0 && (
            <div className="text-xs space-y-2">
              <p className="font-black text-slate-400 uppercase tracking-wider text-[10px]">
                {t('uploadedDocsCount', 'Проверенные регистрационные документы')} ({documents.length})
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {documents.map(doc => (
                  <div key={doc.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                    <span className="font-medium text-slate-700 truncate">{doc.name || doc.fileName}</span>
                    <span className="text-[10px] font-bold text-emerald-600 shrink-0 ml-2">✓ {t('statusVerifiedBadge', 'Проверено')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Официальный подвал с электронной подписью */}
          <div className="pt-5 border-t-2 border-slate-200 flex flex-col sm:flex-row items-center justify-between text-[10px] text-slate-400 gap-2">
            <p>
              {t('ePlatformFooterOfficial', 'Электронная торговая площадка Министерства здравоохранения Туркменистана • Сформировано автоматически')}
            </p>
            <p className="font-mono">ID: {supplier.id} • Tax ID: {supplier.taxId}</p>
          </div>

        </div>

      </div>
    </div>
  );
}

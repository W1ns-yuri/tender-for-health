import React, { useState, useRef, useEffect } from 'react';
import { CreditCard, ChevronDown, Search, Check } from 'lucide-react';
import CustomSelect from '../CustomSelect';
import { TURKMEN_BANKS } from './supplierConstants';

export default function SupplierBankCard({
  formData,
  setFormData,
  bankTab,
  setBankTab,
  isEditable,
  isCustomBank,
  setIsCustomBank,
  role,
  isDarkMode,
  inputBg,
  t = (k, f) => f
}) {
  const [isBankOpen, setIsBankOpen] = useState(false);
  const [bankSearch, setBankSearch] = useState('');
  const bankDropdownRef = useRef(null);

  // Закрытие выпадающего списка при клике вне его
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (bankDropdownRef.current && !bankDropdownRef.current.contains(e.target)) {
        setIsBankOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectBank = (bank) => {
    if (bank.id === 'OTHER' || bank.isCustom) {
      setIsCustomBank(true);
      setFormData(prev => ({
        ...prev,
        bankName: '',
        bankMfo: ''
      }));
    } else {
      setIsCustomBank(false);
      setFormData(prev => ({
        ...prev,
        bankName: bank.name,
        bankMfo: bank.code
      }));
    }
    setIsBankOpen(false);
    setBankSearch('');
  };

  const filteredBanks = TURKMEN_BANKS.filter(b => 
    b.name.toLowerCase().includes(bankSearch.toLowerCase()) || 
    t(b.key, b.name).toLowerCase().includes(bankSearch.toLowerCase()) ||
    (b.code && b.code.includes(bankSearch))
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <CreditCard size={18} className="text-blue-600" />
          {t('bankDetails', 'Банковские реквизиты')}
        </h3>

        {/* Переключатель вкладок реквизитов */}
        <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          <button
            type="button"
            onClick={() => setBankTab('local')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              bankTab === 'local'
                ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            {t('tabBankLocal', 'Местные реквизиты (TMT)')}
          </button>
          <button
            type="button"
            onClick={() => setBankTab('foreign')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              bankTab === 'foreign'
                ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            {t('tabBankForeign', 'Международные реквизиты (USD / EUR)')}
          </button>
        </div>
      </div>

      {bankTab === 'local' ? (
        /* Вкладка 1: Банк Туркменистана (TMT) */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in duration-150">
          {/* Селект с поиском для банка или свободный ввод если 'Другой банк' */}
          {isCustomBank && isEditable ? (
            <div className="sm:col-span-2">
              <div className="flex items-center justify-between mb-1.5 ml-1">
                <label className="block text-xs font-bold text-slate-500">
                  {t('customBankNameLabel', 'Наименование банка (ручной ввод)')} <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomBank(false);
                    setFormData(prev => ({ ...prev, bankName: '' }));
                  }}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 underline cursor-pointer"
                >
                  ← {t('chooseFromBankList', 'Выбрать из списка банков')}
                </button>
              </div>
              <input
                type="text"
                required
                value={formData.bankName}
                onChange={e => setFormData(prev => ({ ...prev, bankName: e.target.value }))}
                placeholder={t('customBankPlaceholder', 'Введите точное наименование банка')}
                className={`w-full px-4 py-3 rounded-xl text-sm font-medium border ${inputBg}`}
              />
            </div>
          ) : (
            <div className="sm:col-span-2 relative" ref={bankDropdownRef}>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">
                {t('bankNameLabel', 'Наименование банка')} {isEditable && <span className="text-rose-500">*</span>}
              </label>
              
              <button
                type="button"
                disabled={!isEditable}
                onClick={() => {
                  if (!isEditable) return;
                  setIsBankOpen(!isBankOpen);
                }}
                className={`w-full px-4 py-3 rounded-xl text-sm font-medium border flex items-center justify-between text-left transition-colors ${inputBg} ${
                  isEditable ? 'cursor-pointer' : 'cursor-not-allowed'
                }`}
              >
                <span className={isEditable ? (formData.bankName ? (isDarkMode ? 'text-slate-100 font-medium' : 'text-slate-900 font-medium') : 'text-slate-400') : (isDarkMode ? 'text-slate-400' : 'text-slate-500')}>
                  {formData.bankName || (isEditable ? t('bankSelectPlaceholder', 'Выберите банк из списка...') : '—')}
                </span>
                {isEditable && (
                  <ChevronDown size={18} className={`text-slate-400 transition-transform ${isBankOpen ? 'rotate-180' : ''}`} />
                )}
              </button>

              {isEditable && isBankOpen && (
                <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                  <div className="p-3 border-b border-slate-100 bg-slate-50/50">
                    <div className="relative">
                      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={bankSearch}
                        onChange={e => setBankSearch(e.target.value)}
                        placeholder={t('bankSearchPlaceholder', 'Поиск банка (название или МФО)...')}
                        className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                      />
                    </div>
                  </div>
                  
                  <div className="max-h-60 overflow-y-auto divide-y divide-slate-50 p-1">
                    {filteredBanks.length > 0 ? (
                      filteredBanks.map(bank => (
                        <button
                          key={bank.id}
                          type="button"
                          onClick={() => handleSelectBank(bank)}
                          className="w-full text-left px-3.5 py-2.5 rounded-xl hover:bg-blue-50/80 transition-colors flex items-center justify-between group cursor-pointer"
                        >
                          <div>
                            <p className="text-xs font-bold text-slate-800 group-hover:text-blue-700">{bank.name}</p>
                            {bank.code && <p className="text-[11px] text-slate-400">МФО: {bank.code}</p>}
                          </div>
                          {formData.bankName === bank.name && (
                            <Check size={16} className="text-blue-600" />
                          )}
                        </button>
                      ))
                    ) : (
                      <div className="p-4 text-center text-xs text-slate-400">
                        {t('bankNotFound', 'Банк не найден в стандартном списке')}
                        {bankSearch && (
                          <button
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({ ...prev, bankName: bankSearch }));
                              setIsBankOpen(false);
                            }}
                            className="mt-2 block w-full py-1.5 px-3 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 rounded-lg font-bold text-xs"
                          >
                            {t('useCustomBank', 'Использовать')}: "{bankSearch}"
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Расчетный счет (28 знаков) */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">
              {t('bankAccountLabel', 'Расчетный счет (Hasap belgisi)')} {isEditable && <span className="text-rose-500">*</span>}
            </label>
            <input 
              type="text" 
              required={bankTab === 'local'}
              disabled={!isEditable}
              maxLength={28}
              value={formData.bankAccount}
              onChange={e => setFormData({ ...formData, bankAccount: e.target.value.replace(/\s/g, '') })}
              placeholder={isEditable ? "23204934170123456789000" : ""}
              className={`w-full px-4 py-3 rounded-xl text-sm font-medium tracking-wider border ${inputBg}`} 
            />
            {isEditable && (
              <p className="text-[11px] text-slate-400 mt-1 ml-1">{t('bankAccountHint', '28 символов (стандарт ЦБ Туркменистана)')}</p>
            )}
          </div>

          {/* МФО банка (9 цифр) */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">
              {t('bankMfoLabel', 'МФО банка (MFO kody)')} {isEditable && <span className="text-rose-500">*</span>}
            </label>
            <input 
              type="text" 
              required={bankTab === 'local'}
              disabled={!isEditable}
              maxLength={9}
              value={formData.bankMfo}
              onChange={e => setFormData({ ...formData, bankMfo: e.target.value })}
              placeholder={isEditable ? "xxxxxxxxx" : ""}
              className={`w-full px-4 py-3 rounded-xl text-sm font-medium border ${inputBg}`} 
            />
          </div>

          {/* Корреспондентский счет банка */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">
              {t('bankCorrAccountLabel', 'Корреспондентский счет банка')}
            </label>
            <input 
              type="text" 
              disabled={!isEditable}
              value={formData.bankCorrAccount}
              onChange={e => setFormData({ ...formData, bankCorrAccount: e.target.value })}
              placeholder={isEditable ? "Корр. счет в Центральном банке ТМ" : ""}
              className={`w-full px-4 py-3 rounded-xl text-sm font-medium border ${inputBg}`} 
            />
          </div>
        </div>
      ) : (
        /* Вкладка 2: Международные реквизиты (USD / EUR) */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in duration-150">
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">
              {t('foreignBankNameLabel', 'Наименование иностранного банка')} {isEditable && <span className="text-rose-500">*</span>}
            </label>
            <input 
              type="text" 
              required={bankTab === 'foreign'}
              disabled={!isEditable}
              value={formData.bankName}
              onChange={e => setFormData({ ...formData, bankName: e.target.value })}
              placeholder={isEditable ? "Deutsche Bank AG, Ziraat Bankasi, etc." : ""}
              className={`w-full px-4 py-3 rounded-xl text-sm font-medium border ${inputBg}`} 
            />
          </div>

          {/* SWIFT / BIC */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">
              {t('bankSwiftLabel', 'SWIFT-код банка')} {isEditable && <span className="text-rose-500">*</span>}
            </label>
            <input 
              type="text" 
              required={bankTab === 'foreign'}
              disabled={!isEditable}
              maxLength={11}
              value={formData.bankSwift}
              onChange={e => setFormData({ ...formData, bankSwift: e.target.value.toUpperCase().trim() })}
              placeholder={isEditable ? "DEUTDEDDFXX" : ""}
              className={`w-full px-4 py-3 rounded-xl text-sm font-bold tracking-widest uppercase border ${inputBg}`} 
            />
          </div>

          {/* Валюта счета */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">
              {t('bankCurrencyLabel', 'Валюта счета')} {isEditable && <span className="text-rose-500">*</span>}
            </label>
            {isEditable ? (
              <CustomSelect
                role={role}
                value={formData.bankCurrency}
                onChange={(val) => setFormData(prev => ({ ...prev, bankCurrency: val }))}
                options={[
                  { id: 'USD', name: 'USD — Доллар США' },
                  { id: 'EUR', name: 'EUR — Евро' },
                  { id: 'TRY', name: 'TRY — Турецкая лира' },
                  { id: 'RUB', name: 'RUB — Российский рубль' },
                  { id: 'CNY', name: 'CNY — Китайский юань' },
                  { id: 'AED', name: 'AED — Дирхам ОАЭ' },
                ]}
                isDarkMode={isDarkMode}
                size="md"
              />
            ) : (
              <div className={`w-full px-4 py-3 rounded-xl text-sm font-bold border ${inputBg}`}>
                {formData.bankCurrency || 'USD'}
              </div>
            )}
          </div>

          {/* IBAN / Номер международного счета */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">
              {t('bankIbanLabel', 'IBAN / Международный номер счета')} {isEditable && <span className="text-rose-500">*</span>}
            </label>
            <input 
              type="text" 
              required={bankTab === 'foreign'}
              disabled={!isEditable}
              value={formData.bankIban}
              onChange={e => setFormData({ ...formData, bankIban: e.target.value.toUpperCase().replace(/\s/g, '') })}
              placeholder={isEditable ? "DE89370400440532013000" : ""}
              className={`w-full px-4 py-3 rounded-xl text-sm font-medium tracking-wider uppercase border ${inputBg}`} 
            />
          </div>
        </div>
      )}
    </div>
  );
}

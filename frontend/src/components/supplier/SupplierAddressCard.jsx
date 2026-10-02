import React, { useState, useRef, useEffect } from 'react';
import { MapPin, ChevronDown, Check } from 'lucide-react';
import { TURKMEN_REGIONS } from './supplierConstants';
import { cleanAddressString, formatPhoneString } from './supplierUtils';

export default function SupplierAddressCard({
  formData,
  setFormData,
  phoneDigits,
  setPhoneDigits,
  isEditable,
  isForeignCompany,
  isAddressModified = false,
  supplier,
  inputBg,
  isDarkMode,
  t = (k, f) => f
}) {
  const [isRegionOpen, setIsRegionOpen] = useState(false);
  const regionDropdownRef = useRef(null);

  // Закрытие выпадающего списка при клике вне его
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (regionDropdownRef.current && !regionDropdownRef.current.contains(e.target)) {
        setIsRegionOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getSelectedRegionLabel = () => {
    if (!formData.region) return '';
    const found = TURKMEN_REGIONS.find(r => r.id === formData.region || formData.region.toLowerCase().startsWith(r.id.toLowerCase().slice(0, 4)));
    if (found) {
      return t(found.key, found.defaultName);
    }
    return formData.region;
  };

  const handleAddressBlur = () => {
    if (!isForeignCompany) {
      const cleaned = cleanAddressString(formData.address, formData.region);
      if (cleaned !== formData.address) {
        setFormData(prev => ({ ...prev, address: cleaned }));
      }
    }
  };

  const handlePhoneInputChange = (e) => {
    if (isForeignCompany) {
      const val = e.target.value;
      setPhoneDigits(val);
      setFormData(prev => ({ ...prev, phone: val }));
    } else {
      let raw = e.target.value.replace(/\D/g, '');
      if (raw.startsWith('993')) {
        raw = raw.slice(3);
      }
      raw = raw.slice(0, 8);
      const formatted = formatPhoneString(raw);
      setPhoneDigits(formatted);
      setFormData(prev => ({
        ...prev,
        phone: raw ? `+993 ${formatted}` : ''
      }));
    }
  };

  return (
    <div>
      <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
        <MapPin size={18} className="text-blue-600" />
        {t('contactInfo', 'Контактная информация и адреса')}
        {isAddressModified && (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200 border border-amber-300 dark:border-amber-800 uppercase tracking-wider">
            {t('moderationFieldChangedBadge', 'Изменено')}
          </span>
        )}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Регион: для ТМ - выпадающий список 6 велаятов; для иностранцев - текстовое поле «Штат / Провинция / Регион» */}
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">
            {isForeignCompany ? t('foreignRegionLabel', 'Штат / Провинция / Регион') : t('regionLabel', 'Велаят')} {isEditable && <span className="text-rose-500">*</span>}
          </label>

          {!isForeignCompany ? (
            <div className="relative" ref={regionDropdownRef}>
              <button
                type="button"
                disabled={!isEditable}
                onClick={() => {
                  if (!isEditable) return;
                  setIsRegionOpen(!isRegionOpen);
                }}
                className={`w-full px-4 py-3 rounded-xl text-sm font-medium border flex items-center justify-between text-left transition-colors ${inputBg} ${
                  isEditable ? 'cursor-pointer' : 'cursor-not-allowed'
                }`}
              >
                <span className={isEditable ? (formData.region ? (isDarkMode ? 'text-slate-100 font-medium' : 'text-slate-900 font-medium') : 'text-slate-400') : (isDarkMode ? 'text-slate-400' : 'text-slate-500')}>
                  {getSelectedRegionLabel() || (isEditable ? t('regionSelect', 'Выберите велаят...') : '—')}
                </span>
                {isEditable && (
                  <ChevronDown size={18} className={`text-slate-400 transition-transform ${isRegionOpen ? 'rotate-180' : ''}`} />
                )}
              </button>

              {isEditable && isRegionOpen && (
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150 p-1.5 divide-y divide-slate-50">
                  {TURKMEN_REGIONS.map(r => {
                    const isSelected = formData.region === r.id || formData.region?.toLowerCase().startsWith(r.id.toLowerCase().slice(0, 4));
                    const translatedLabel = t(r.key, r.defaultName);
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, region: r.id }));
                          setIsRegionOpen(false);
                        }}
                        className={`w-full text-left px-3.5 py-3 rounded-xl transition-colors flex items-center justify-between group cursor-pointer ${
                          isSelected ? 'bg-blue-50/80 text-blue-700' : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div>
                          <p className={`text-xs ${isSelected ? 'font-bold text-blue-700' : 'font-semibold text-slate-800 group-hover:text-blue-700'}`}>
                            {translatedLabel}
                          </p>
                          {r.defaultName && r.defaultName !== r.name && (
                            <p className="text-[11px] text-slate-400 font-normal">{r.defaultName}</p>
                          )}
                        </div>
                        {isSelected && (
                          <Check size={16} className="text-blue-600 shrink-0 ml-2" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <input
              type="text"
              disabled={!isEditable}
              value={formData.region}
              onChange={e => setFormData(prev => ({ ...prev, region: e.target.value }))}
              placeholder={isEditable ? t('foreignRegionPlaceholder', 'Например: Бавария, Стамбул, Дубай') : ''}
              className={`w-full px-4 py-3 rounded-xl text-sm font-medium border ${inputBg}`}
            />
          )}
        </div>

        {/* Рабочий телефон */}
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">
            {t('workPhone', 'Рабочий телефон')} {isEditable && <span className="text-rose-500">*</span>}
          </label>
          {isEditable ? (
            !isForeignCompany ? (
              <div className="relative flex items-center">
                <span className="absolute left-4 font-bold select-none pointer-events-none text-sm tracking-tight text-slate-600">
                  +993
                </span>
                <input 
                  type="tel" 
                  required
                  value={phoneDigits}
                  onChange={handlePhoneInputChange}
                  placeholder="65 56-65-65"
                  className={`w-full pl-16 pr-4 py-3 rounded-xl text-sm font-medium border tracking-wider ${inputBg}`} 
                />
              </div>
            ) : (
              <input 
                type="tel" 
                required
                value={phoneDigits}
                onChange={handlePhoneInputChange}
                placeholder="+49 151 2345678"
                className={`w-full px-4 py-3 rounded-xl text-sm font-medium border tracking-wider ${inputBg}`} 
              />
            )
          ) : (
            <div className={`w-full px-4 py-3 rounded-xl text-sm font-semibold border ${inputBg} flex items-center`}>
              <span>
                {!isForeignCompany 
                  ? (phoneDigits ? `+993 ${phoneDigits}` : (supplier?.phone || '-'))
                  : (formData.phone || supplier?.phone || '-')}
              </span>
            </div>
          )}
          {isEditable && (
            <p className="text-[11px] text-slate-400 mt-1 ml-1">
              {!isForeignCompany ? t('phoneFormatHint', 'Формат: +993 XX XX-XX-XX') : t('phoneFormatInternationalHint', 'Формат: +[код страны] [номер]')}
            </p>
          )}
        </div>

        {/* Юридический адрес (по Уставу / ЕГР) */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">
            {t('legalAddressLabel', 'Юридический адрес (по Уставу / ЕГР)')} {isEditable && <span className="text-rose-500">*</span>}
          </label>
          <input 
            type="text" 
            required
            disabled={!isEditable}
            value={formData.legalAddress}
            onChange={e => setFormData(prev => ({ ...prev, legalAddress: e.target.value }))}
            placeholder={isEditable ? t('legalAddressPlaceholder', 'Официальный адрес государственной регистрации') : ''}
            className={`w-full px-4 py-3 rounded-xl text-sm font-medium border ${inputBg}`} 
          />
        </div>

        {/* Фактический адрес (Офис / Склад) */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">
            {t('actualAddressLabel', 'Фактический адрес (Офис / Склад)')} {isEditable && <span className="text-rose-500">*</span>}
          </label>
          <input 
            type="text" 
            required
            disabled={!isEditable}
            value={formData.address}
            onChange={e => setFormData(prev => ({ ...prev, address: e.target.value }))}
            onBlur={handleAddressBlur}
            placeholder={isEditable ? t('exactAddressPlaceholder', 'этрап, улица, дом/офис') : ''}
            className={`w-full px-4 py-3 rounded-xl text-sm font-medium border ${inputBg}`} 
          />
          {isEditable && !isForeignCompany && (
            <p className="text-[11px] text-slate-400 mt-1 ml-1">
              {t('addressCleanHint', 'Указывайте без повторения города/велаята: этрап, улица, дом, офис')}
            </p>
          )}
        </div>

        {/* Автозаполнение Email */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">
            {t('corpEmail', 'Корпоративный Email')} {isEditable && <span className="text-rose-500">*</span>}
          </label>
          <input 
            type="email" 
            required
            disabled={!isEditable}
            value={formData.email}
            onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
            placeholder={isEditable ? "company@example.com" : ""}
            className={`w-full px-4 py-3 rounded-xl text-sm font-medium border ${inputBg}`} 
          />
        </div>
      </div>
    </div>
  );
}

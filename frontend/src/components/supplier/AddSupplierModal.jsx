import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import API from '../../services/api';
import { getTranslation } from '../../utils/translations';
import { useAlert } from '../../context/AlertContext';
import { CustomSelect } from '../ui';

export default function AddSupplierModal({ onClose, onSuccess, lang = 'RU', isDarkMode, countries = [] }) {
  const t = (key, fallback) => getTranslation(lang, key, fallback);
  const { showAlert } = useAlert();
  const [formData, setFormData] = useState({
    name: '',
    inn: '',
    phone: '',
    address: '',
    email: '',
    license: '',
    username: '',
    password: '',
    countryId: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!formData.name || !formData.inn || !formData.username || !formData.password) {
      showAlert({
        title: t('fillRequired', 'Заполните обязательные поля'),
        message: t('fillRequiredDesc', 'Наименование, ИНН, логин и пароль обязательны для создания аккаунта.'),
        type: 'danger'
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await API.post('/suppliers', formData);
      showAlert({
        title: t('success', 'Успешно'),
        message: t('supplierCreatedSuccess', 'Поставщик успешно добавлен в систему.'),
        type: 'success'
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      showAlert({
        title: t('error', 'Ошибка'),
        message: err.response?.data?.message || t('errorCreateSupplier', 'Не удалось добавить поставщика.'),
        type: 'danger'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const countryOptions = countries.map(c => ({
    id: c.id,
    label: c.name
  }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div 
        className={`w-full max-w-lg rounded-2xl shadow-2xl border flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 ${
          isDarkMode ? 'bg-[#111827] border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
        }`}
      >
        {/* Header */}
        <div className={`px-6 py-4 border-b flex items-center justify-between ${
          isDarkMode ? 'border-slate-800 bg-slate-900/50' : 'border-slate-100 bg-slate-50/50'
        }`}>
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              {t('addSupplierTitle', 'Добавление поставщика')}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {t('addSupplierDesc', 'Регистрация новой компании и создание аккаунта')}
            </p>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto max-h-[70vh] space-y-4 text-xs">
          <div>
            <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
              {t('companyName', 'Наименование компании')} <span className="text-rose-500">*</span>
            </label>
            <input 
              type="text" 
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder={t('companyNamePlaceholder', 'например: ИП «Медицинские Технологии»')}
              className={`w-full px-3 py-2 rounded-xl border outline-hidden transition-all ${
                isDarkMode 
                  ? 'bg-slate-800 border-slate-700 text-white focus:border-emerald-500' 
                  : 'bg-white border-slate-200 text-slate-900 focus:border-emerald-500'
              }`}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                {t('inn', 'ИНН')} <span className="text-rose-500">*</span>
              </label>
              <input 
                type="text" 
                value={formData.inn}
                onChange={e => setFormData({ ...formData, inn: e.target.value })}
                placeholder="10-12 цифр"
                className={`w-full px-3 py-2 rounded-xl border outline-hidden transition-all ${
                  isDarkMode 
                    ? 'bg-slate-800 border-slate-700 text-white focus:border-emerald-500' 
                    : 'bg-white border-slate-200 text-slate-900 focus:border-emerald-500'
                }`}
              />
            </div>
            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                {t('country', 'Страна')}
              </label>
              <CustomSelect 
                options={countryOptions}
                value={formData.countryId}
                onChange={val => setFormData({ ...formData, countryId: val })}
                placeholder={t('selectCountry', 'Выберите страну')}
                isDarkMode={isDarkMode}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                {t('phone', 'Телефон')}
              </label>
              <input 
                type="text" 
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+993 ..."
                className={`w-full px-3 py-2 rounded-xl border outline-hidden transition-all ${
                  isDarkMode 
                    ? 'bg-slate-800 border-slate-700 text-white focus:border-emerald-500' 
                    : 'bg-white border-slate-200 text-slate-900 focus:border-emerald-500'
                }`}
              />
            </div>
            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                {t('email', 'Эл. почта')}
              </label>
              <input 
                type="email" 
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                placeholder="info@company.tm"
                className={`w-full px-3 py-2 rounded-xl border outline-hidden transition-all ${
                  isDarkMode 
                    ? 'bg-slate-800 border-slate-700 text-white focus:border-emerald-500' 
                    : 'bg-white border-slate-200 text-slate-900 focus:border-emerald-500'
                }`}
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
              {t('legalAddress', 'Юридический адрес')}
            </label>
            <input 
              type="text" 
              value={formData.address}
              onChange={e => setFormData({ ...formData, address: e.target.value })}
              placeholder={t('addressPlaceholder', 'г. Ашхабад, проспект...')}
              className={`w-full px-3 py-2 rounded-xl border outline-hidden transition-all ${
                isDarkMode 
                  ? 'bg-slate-800 border-slate-700 text-white focus:border-emerald-500' 
                  : 'bg-white border-slate-200 text-slate-900 focus:border-emerald-500'
              }`}
            />
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <h4 className="font-bold text-xs text-slate-900 dark:text-white mb-2">
              {t('credentialsTitle', 'Данные для входа в систему')}
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  {t('username', 'Логин')} <span className="text-rose-500">*</span>
                </label>
                <input 
                  type="text" 
                  value={formData.username}
                  onChange={e => setFormData({ ...formData, username: e.target.value })}
                  placeholder="логин_поставщика"
                  className={`w-full px-3 py-2 rounded-xl border outline-hidden transition-all ${
                    isDarkMode 
                      ? 'bg-slate-800 border-slate-700 text-white focus:border-emerald-500' 
                      : 'bg-white border-slate-200 text-slate-900 focus:border-emerald-500'
                  }`}
                />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  {t('password', 'Пароль')} <span className="text-rose-500">*</span>
                </label>
                <input 
                  type="password" 
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  className={`w-full px-3 py-2 rounded-xl border outline-hidden transition-all ${
                    isDarkMode 
                      ? 'bg-slate-800 border-slate-700 text-white focus:border-emerald-500' 
                      : 'bg-white border-slate-200 text-slate-900 focus:border-emerald-500'
                  }`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`px-6 py-4 border-t flex items-center justify-end space-x-2 ${
          isDarkMode ? 'border-slate-800 bg-slate-900/50' : 'border-slate-100 bg-slate-50/50'
        }`}>
          <button 
            type="button"
            onClick={onClose}
            className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              isDarkMode 
                ? 'border-slate-700 text-slate-300 hover:bg-slate-800' 
                : 'border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            {t('cancel', 'Отмена')}
          </button>
          <button 
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center space-x-1.5 transition-all cursor-pointer disabled:opacity-50"
          >
            <Check size={14} />
            <span>{isSubmitting ? t('saving', 'Сохранение...') : t('create', 'Создать')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import API from '../services/api';
import { getTranslation } from '../utils/translations';

export default function EditSupplierModal({ supplier, onClose, onSuccess, lang = 'RU', isDarkMode, countries = [] }) {
  const t = (key, fallback) => getTranslation(lang, key, fallback);
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

  useEffect(() => {
    if (supplier) {
      setFormData({
        name: supplier.name || '',
        inn: supplier.inn || supplier.reg || '',
        phone: supplier.phone || '',
        address: supplier.address || '',
        email: supplier.email || '',
        license: supplier.license || '',
        username: supplier.user?.username || '',
        password: '',
        countryId: supplier.countryId || ''
      });
    }
  }, [supplier]);

  const handleSubmit = async () => {
    if (!formData.name || !formData.inn || !formData.username) {
      alert(t('fillRequired', 'Заполните обязательные поля'));
      return;
    }
    setIsSubmitting(true);
    try {
      await API.put(`/companies/${supplier.id}`, formData);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      const errorMsg = err.response?.data?.error || t('errorUpdateSupplier', 'Ошибка при обновлении поставщика');
      alert(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const bgClass = isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800';
  const inputBg = isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className={`rounded-xl shadow-2xl border w-full max-w-md p-6 space-y-4 animate-in zoom-in-95 ${bgClass}`}>
        <div className="flex justify-between items-center border-b border-slate-200/50 pb-3">
          <h3 className="font-bold text-lg">{t('editSupplier', 'Изменить поставщика')}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 text-sm">
          <div>
            <label className="block font-semibold mb-1">{t('supplierName', 'Название компании')}*</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-teal-500/20 ${inputBg}`}
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">{t('regNo', 'Рег. номер')} (ИНН)*</label>
            <input
              type="text"
              value={formData.inn}
              onChange={(e) => setFormData({ ...formData, inn: e.target.value })}
              className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-teal-500/20 ${inputBg}`}
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">{t('license', 'Лицензия')}</label>
            <input
              type="text"
              value={formData.license}
              onChange={(e) => setFormData({ ...formData, license: e.target.value })}
              className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-teal-500/20 ${inputBg}`}
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">{t('phone', 'Телефон')}</label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-teal-500/20 ${inputBg}`}
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-teal-500/20 ${inputBg}`}
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">{t('login', 'Логин')}*</label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-teal-500/20 ${inputBg}`}
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">{t('password', 'Новый пароль')}</label>
            <input
              type="text"
              placeholder={t('passwordPlaceholder', 'Оставьте пустым, чтобы не менять')}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-teal-500/20 ${inputBg}`}
            />
          </div>

          
          <div>
            <label className="block font-semibold mb-1">{t('colCountry', 'Страна')}</label>
            <select
              value={formData.countryId}
              onChange={(e) => setFormData({ ...formData, countryId: e.target.value })}
              className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-teal-500/20 ${inputBg}`}
            >
              <option value="">{t('select', 'Выберите...')}</option>
              {countries.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold mb-1">{t('address', 'Адрес')}</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-teal-500/20 ${inputBg}`}
            />
          </div>
        </div>

        <div className="pt-4 flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-sm font-semibold transition-colors"
          >
            {t('cancelBtn', 'Отмена')}
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-semibold transition-colors flex items-center space-x-1"
          >
            <Check size={16} />
            <span>{t('saveBtn', 'Сохранить')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

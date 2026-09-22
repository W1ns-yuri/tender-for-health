import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import API from '../services/api';
import { getTranslation } from '../utils/translations';
import { useAlert } from '../context/AlertContext';
import CustomSelect from './CustomSelect';

export default function EditSupplierModal({ supplier, onClose, onSuccess, lang = 'RU', isDarkMode, countries = [] }) {
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
  const [categoriesList, setCategoriesList] = useState([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    API.get('/catalogs/categories').then(r => {
      if (Array.isArray(r.data)) setCategoriesList(r.data.filter(c => c.isActive));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (supplier) {
      setFormData({
        name: supplier.name || '',
        inn: supplier.taxId || supplier.inn || supplier.reg || '',
        phone: supplier.phone || '',
        address: supplier.address || '',
        email: supplier.email || '',
        license: supplier.licenseNumber || supplier.license || '',
        username: supplier.user?.username || '',
        password: '',
        countryId: supplier.countryId || ''
      });
      setSelectedCategoryIds(supplier.categories ? supplier.categories.map(c => c.categoryId) : []);
    }
  }, [supplier]);

  const handleSubmit = async () => {
    if (!formData.name || !formData.inn) {
      showAlert({
        title: t('validationError', 'Ошибка валидации'),
        message: t('fillRequired', 'Заполните обязательные поля: наименование и ИНН/STŞK'),
        type: 'warning'
      });
      return;
    }
    setIsSubmitting(true);
    try {
      await API.put(`/suppliers/${supplier.id}`, {
        ...formData,
        taxId: formData.inn,
        licenseNumber: formData.license,
        categoryIds: selectedCategoryIds
      });
      await showAlert({
        title: t('success', 'Успешно'),
        message: t('supplierUpdated', 'Данные поставщика успешно обновлены'),
        type: 'success'
      });
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      const errorMsg = err.response?.data?.error || t('errorUpdateSupplier', 'Ошибка при обновлении поставщика');
      showAlert({
        title: t('error', 'Ошибка'),
        message: errorMsg,
        type: 'error'
      });
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
              className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-emerald-500/20 ${inputBg}`}
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">{t('regNo', 'Рег. номер')} (ИНН)*</label>
            <input
              type="text"
              value={formData.inn}
              onChange={(e) => setFormData({ ...formData, inn: e.target.value })}
              className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-emerald-500/20 ${inputBg}`}
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">{t('license', 'Лицензия')}</label>
            <input
              type="text"
              value={formData.license}
              onChange={(e) => setFormData({ ...formData, license: e.target.value })}
              className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-emerald-500/20 ${inputBg}`}
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">{t('phone', 'Телефон')}</label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-emerald-500/20 ${inputBg}`}
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-emerald-500/20 ${inputBg}`}
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">{t('login', 'Логин')}*</label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-emerald-500/20 ${inputBg}`}
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">{t('password', 'Новый пароль')}</label>
            <input
              type="text"
              placeholder={t('passwordPlaceholder', 'Оставьте пустым, чтобы не менять')}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-emerald-500/20 ${inputBg}`}
            />
          </div>

          
          <div>
            <label className="block font-semibold mb-1">{t('colCountry', 'Страна')}</label>
            <CustomSelect
              role="ADMIN"
              value={formData.countryId}
              onChange={(val) => setFormData(prev => ({ ...prev, countryId: val }))}
              options={[
                { id: '', name: t('select', 'Выберите...') },
                ...countries.map(c => ({ id: c.id, name: c.name }))
              ]}
              searchable={countries.length > 5}
              isDarkMode={isDarkMode}
              t={t}
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">{t('address', 'Адрес')}</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-emerald-500/20 ${inputBg}`}
            />
          </div>

          {/* Категории деятельности поставщика */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-semibold">{t('supplierCategories', 'Категории деятельности')}</label>
              <span className="text-[11px] font-bold text-emerald-600">
                {selectedCategoryIds.length} {t('categoriesSelected', 'выбрано')}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-1 max-h-32 overflow-y-auto p-1.5 border rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40">
              {categoriesList.map(cat => {
                const isChecked = selectedCategoryIds.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setSelectedCategoryIds(prev => 
                        isChecked ? prev.filter(id => id !== cat.id) : [...prev, cat.id]
                      );
                    }}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-semibold border transition-all text-left cursor-pointer ${
                      isChecked
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-400'
                    }`}
                  >
                    <div className={`w-3.5 h-3.5 rounded flex items-center justify-center border text-[9px] font-bold ${
                      isChecked ? 'bg-white text-emerald-600 border-white' : 'border-slate-300 bg-white'
                    }`}>
                      {isChecked ? '✓' : ''}
                    </div>
                    <span className="truncate">{cat.name}</span>
                  </button>
                );
              })}
            </div>
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
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition-colors flex items-center space-x-1"
          >
            <Check size={16} />
            <span>{t('saveBtn', 'Сохранить')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

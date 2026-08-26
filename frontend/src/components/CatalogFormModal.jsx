import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';

export default function CatalogFormModal({
  isOpen,
  onClose,
  onSave,
  catalogId,
  editingItem,
  theme,
  t,
  isDarkMode,
  countries
}) {
  const [formData, setFormData] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Configuration for different catalogs
  const getCatalogConfig = (catId) => {
    switch (catId) {
            case 'clients':
        return {
          title: t('addClient', 'Добавить заказчика'),
          editTitle: t('editClient', 'Редактировать заказчика'),
          fields: [
            { name: 'name', label: t('colName', 'Название'), required: true }
          ]
        };
      case 'categories':
        return {
          title: t('addCategory', 'Добавить категорию'),
          editTitle: t('editCategory', 'Редактировать категорию'),
          fields: [
            { name: 'name', label: t('colName', 'Название'), required: true },
            { name: 'code', label: t('colCode', 'Код'), required: true }
          ]
        };
      case 'currencies':
        return {
          title: t('addCurrency', 'Добавить валюту'),
          editTitle: t('editCurrency', 'Редактировать валюту'),
          fields: [
            { name: 'name', label: t('colName', 'Название'), required: true },
            { name: 'code', label: t('colCode', 'Код (например, USD)'), required: true },
            { name: 'symbol', label: t('colSymbol', 'Символ (например, $)'), required: true },
            { name: 'flag', label: t('colFlag', 'Флаг (Эмодзи)'), required: false },
          ]
        };
      case 'countries':
        return {
          title: t('addCountry', 'Добавить страну'),
          editTitle: t('editCountry', 'Редактировать страну'),
          fields: [
            { name: 'name', label: t('colName', 'Название'), required: true },
            { name: 'alpha2', label: 'Alpha-2 Код (например, TM)', required: true },
            { name: 'alpha3', label: 'Alpha-3 Код (например, TKM)', required: true },
          ]
        };
      case 'delivery':
        return {
          title: t('addDelivery', 'Добавить условие поставки'),
          editTitle: t('editDelivery', 'Редактировать условие поставки'),
          fields: [
            { name: 'name', label: t('colName', 'Название'), required: true },
            { name: 'shortName', label: t('colShortName', 'Краткое название'), required: true }
          ]
        };
      case 'productsMNN':
        return {
          title: t('addProduct', 'Добавить товар'),
          editTitle: t('editProduct', 'Редактировать товар'),
          fields: [
            { name: 'name', label: t('innName', 'Международное непатентованное наименование (МНН)'), required: true },
            { name: 'tradeName', label: t('tradeName', 'Торговое (патентованное) название'), required: false },
            { name: 'code', label: t('colCode', 'Код'), required: false },
            { name: 'description', label: t('colDesc', 'Описание'), required: false, type: 'textarea' }
          ]
        };
      case 'units':
        return {
          title: t('addUnit', 'Добавить единицу измерения'),
          editTitle: t('editUnit', 'Редактировать единицу измерения'),
          fields: [
            { name: 'name', label: t('colName', 'Название'), required: true },
            { name: 'shortName', label: t('colShortName', 'Краткое название'), required: true },
          ]
        };
      case 'manufacturers':
        return {
          title: t('addManufacturer', 'Добавить производителя'),
          editTitle: t('editManufacturer', 'Редактировать производителя'),
          fields: [
            { name: 'name', label: t('colName', 'Название'), required: true },
            { name: 'code', label: t('colCode', 'Код'), required: false },
            { name: 'countryId', label: t('colCountry', 'Страна'), required: false, type: 'select', options: countries?.filter(c => c.isActive) || [] }
          ]
        };
      default:
        return null; // Not implemented
    }
  };

  const config = getCatalogConfig(catalogId);

  useEffect(() => {
    if (isOpen) {
      if (editingItem) {
        setFormData({ ...editingItem });
      } else {
        // Init with empty fields
        const initial = {};
        if (config && config.fields) {
          config.fields.forEach(f => {
            initial[f.name] = f.type === 'number' ? 0 : '';
          });
        }
        setFormData(initial);
      }
    }
  }, [isOpen, editingItem, catalogId]);

  if (!isOpen || !config) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSave(formData, editingItem?.id);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const bgClass = isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800';
  const inputBg = isDarkMode ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500' : 'bg-slate-50 border-slate-200 placeholder:text-slate-400';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className={`w-full max-w-lg rounded-2xl shadow-xl border ${bgClass} overflow-hidden animate-in zoom-in-95 duration-200`}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-slate-100/10">
          <h2 className={`text-xl font-bold ${isDarkMode ? 'text-teal-400' : 'text-teal-600'}`}>
            {editingItem ? config.editTitle : config.title}
          </h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-4">
          {config.fields.map((field) => (
            <div key={field.name}>
              <label className="block text-sm font-semibold mb-1">
                {field.label} {field.required && <span className="text-rose-500">*</span>}
              </label>
              
              {field.type === 'select' ? (
                <select
                  value={formData[field.name] || ''}
                  onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                  required={field.required}
                  className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 outline-none transition-all ${inputBg}`}
                >
                  <option value="">{t('select', 'Выберите...')}</option>
                  {field.options?.map(opt => (
                    <option key={opt.id} value={opt.id}>{opt.name}</option>
                  ))}
                </select>
              ) : field.type === 'textarea' ? (
                <textarea
                  value={formData[field.name] || ''}
                  onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                  required={field.required}
                  rows={3}
                  className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 outline-none transition-all ${inputBg}`}
                />
              ) : (
                <input
                  type={field.type === 'number' ? 'number' : 'text'}
                  value={formData[field.name] || ''}
                  onChange={(e) => setFormData({ ...formData, [field.name]: field.type === 'number' ? Number(e.target.value) : e.target.value })}
                  required={field.required}
                  className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 outline-none transition-all ${inputBg}`}
                />
              )}
            </div>
          ))}

          {/* Footer */}
          <div className="pt-4 mt-6 flex justify-end gap-3 border-t border-slate-100/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-lg text-sm font-semibold transition-colors"
            >
              {t('cancel', 'Отмена')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 ${theme.primaryBg} disabled:opacity-70`}
            >
              <Check size={16} />
              <span>{isSubmitting ? t('saving', 'Сохранение...') : t('save', 'Сохранить')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

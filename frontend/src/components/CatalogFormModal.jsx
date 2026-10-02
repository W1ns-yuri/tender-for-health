import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import CustomSelect from './CustomSelect';
import MnnCombobox from './MnnCombobox';
import API from '../services/api';

export default function CatalogFormModal({
  isOpen,
  onClose,
  onSave,
  catalogId,
  editingItem,
  role = 'ADMIN',
  theme,
  t = (k, f) => f,
  isDarkMode,
  countries = [],
  categories = [],
  existingProducts = []
}) {
  const [formData, setFormData] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [internalCategories, setInternalCategories] = useState(categories || []);
  const [internalCountries, setInternalCountries] = useState(countries || []);

  // Подгрузка категорий и стран, если не переданы извне
  useEffect(() => {
    if (isOpen) {
      if ((!categories || categories.length === 0) && (catalogId === 'productsMNN' || catalogId === 'generalProducts' || catalogId === 'categories' || catalogId === 'productCategories' || catalogId === 'works' || catalogId === 'services')) {
        API.get('/catalogs/categories')
          .then(res => {
            if (Array.isArray(res.data)) setInternalCategories(res.data);
          })
          .catch(err => console.error('Не удалось загрузить категории:', err));
      } else if (categories && categories.length > 0) {
        setInternalCategories(categories);
      }

      if ((!countries || countries.length === 0) && catalogId === 'manufacturers') {
        API.get('/catalogs/countries')
          .then(res => {
            if (Array.isArray(res.data)) setInternalCountries(res.data);
          })
          .catch(err => console.error('Не удалось загрузить страны:', err));
      } else if (countries && countries.length > 0) {
        setInternalCountries(countries);
      }
    }
  }, [isOpen, catalogId, categories, countries]);

  // Конфигурация полей для разных справочников
  const getCatalogConfig = (catId) => {
    switch (catId) {
      case 'clients':
        return {
          title: t('addClient', 'Добавить заказчика'),
          editTitle: t('editClient', 'Редактировать заказчика'),
          fields: [
            { name: 'name', label: t('colName', 'Название организации / заказчика'), required: true }
          ]
        };
      case 'categories':
      case 'productCategories':
        return {
          title: t('addCategory', 'Добавить категорию'),
          editTitle: t('editCategory', 'Редактировать категорию'),
          fields: [
            { name: 'name', label: t('colName', 'Название категории'), required: true, placeholder: 'Например: Антибиотики, Монтажные работы, Сервис МРТ...' },
            { 
              name: 'type', 
              label: t('categoryType', 'Тип категории (направление)'), 
              required: true,
              type: 'select',
              options: [
                { id: 'GOODS', name: t('typeGoods', 'Товары (Медикаменты и медизделия)') },
                { id: 'WORKS', name: t('typeWorks', 'Работы (Монтаж, ремонт, наладка)') },
                { id: 'SERVICES', name: t('typeServices', 'Услуги (ТО, поверка, утилизация)') }
              ]
            },
            { name: 'code', label: t('colCode', 'Код категории'), required: false, placeholder: 'Например: MED-01, WRK-01, SRV-01' }
          ]
        };
      case 'works':
        return {
          title: t('addWorkPosition', 'Добавить вид / этап работ'),
          editTitle: t('editWorkPosition', 'Редактировать вид работ'),
          fields: [
            { 
              name: 'name', 
              label: t('workStageName', 'Наименование вида или этапа работ'), 
              required: true,
              placeholder: 'Например: Монтаж и разводка кислородопровода...'
            },
            { 
              name: 'categoryId', 
              label: t('workCategory', 'Категория работ'), 
              required: false, 
              type: 'select', 
              placeholder: t('selectWorkCategory', 'Выберите категорию работ...'),
              options: internalCategories.filter(c => (c.type === 'WORKS' || !c.type) && c.isActive !== false)
            },
            { 
              name: 'code', 
              label: t('workCode', 'Код / шифр работ (СНиП / проектный)'), 
              required: false,
              placeholder: 'Например: WRK-GAS-01'
            },
            { 
              name: 'description', 
              label: t('workDescription', 'Техническое задание / Требования к квалификации / Спецификация'), 
              required: false, 
              type: 'textarea',
              placeholder: 'Опишите требования к допускам СРО, этапам сдачи, скрытым работам...'
            }
          ]
        };
      case 'services':
        return {
          title: t('addServicePosition', 'Добавить медицинскую услугу'),
          editTitle: t('editServicePosition', 'Редактировать услугу'),
          fields: [
            { 
              name: 'name', 
              label: t('servicePositionName', 'Наименование услуги / регламента'), 
              required: true,
              placeholder: 'Например: Техническое обслуживание томографа МРТ...'
            },
            { 
              name: 'categoryId', 
              label: t('serviceCategory', 'Категория услуг'), 
              required: false, 
              type: 'select', 
              placeholder: t('selectServiceCategory', 'Выберите категорию услуг...'),
              options: internalCategories.filter(c => (c.type === 'SERVICES' || !c.type) && c.isActive !== false)
            },
            { 
              name: 'code', 
              label: t('serviceCode', 'Код услуги (Номенклатура МЗ / внутренний)'), 
              required: false,
              placeholder: 'Например: SRV-TO-MRT-01'
            },
            { 
              name: 'description', 
              label: t('serviceDescription', 'Регламент / Периодичность / SLA / Требования'), 
              required: false, 
              type: 'textarea',
              placeholder: 'Периодичность выезда инженера, регламент работ по замене расходников...'
            }
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
            { name: 'name', label: t('colName', 'Название страны'), required: true },
            { name: 'alpha2', label: 'Alpha-2 Код (например, TM)', required: true },
            { name: 'alpha3', label: 'Alpha-3 Код (например, TKM)', required: true },
          ]
        };
      case 'delivery':
        return {
          title: t('addDelivery', 'Добавить условие поставки'),
          editTitle: t('editDelivery', 'Редактировать условие поставки'),
          fields: [
            { name: 'name', label: t('colName', 'Название (Инкотермс)'), required: true },
            { name: 'shortName', label: t('colShortName', 'Краткое название (DAP, DDP)'), required: true }
          ]
        };
      case 'productsMNN':
      case 'generalProducts':
        return {
          title: t('addProduct', 'Добавить товар / препарат'),
          editTitle: t('editProduct', 'Редактировать товар / препарат'),
          fields: [
            { 
              name: 'name', 
              label: t('innName', 'Международное непатентованное наименование (МНН)'), 
              required: true,
              type: 'mnn_combobox',
              placeholder: t('mnnPlaceholder', 'Выберите МНН из архива или введите новое...')
            },
            { 
              name: 'tradeName', 
              label: t('tradeName', 'Торговое (патентованное) название'), 
              required: false,
              placeholder: 'Например: Аспирин Кардио, Тромбо АСС, Панадол...'
            },
            { 
              name: 'categoryId', 
              label: t('category', 'Категория товара'), 
              required: false, 
              type: 'select', 
              options: internalCategories.filter(c => (!c.type || c.type === 'GOODS') && c.isActive !== false)
            },
            { 
              name: 'code', 
              label: t('colCode', 'Код (АТХ / номенклатурный)'), 
              required: false,
              placeholder: 'Например: B01AC06'
            },
            { 
              name: 'description', 
              label: t('colDesc', 'Описание / Форма выпуска / Дозировка'), 
              required: false, 
              type: 'textarea',
              placeholder: 'Например: Таблетки кишечнорастворимые 100 мг, блистер №20...'
            }
          ]
        };
      case 'units':
        return {
          title: t('addUnit', 'Добавить единицу измерения'),
          editTitle: t('editUnit', 'Редактировать единицу измерения'),
          fields: [
            { name: 'name', label: t('colName', 'Полное название'), required: true, placeholder: 'Штука, Упаковка, Флакон, Ампула' },
            { name: 'shortName', label: t('colShortName', 'Краткое название'), required: true, placeholder: 'шт, упак, фл, амп' },
          ]
        };
      case 'manufacturers':
        return {
          title: t('addManufacturer', 'Добавить производителя'),
          editTitle: t('editManufacturer', 'Редактировать производителя'),
          fields: [
            { name: 'name', label: t('colName', 'Название фармацевтического завода / фабрики'), required: true },
            { name: 'code', label: t('colCode', 'Код предприятия'), required: false },
            { name: 'countryId', label: t('colCountry', 'Страна происхождения'), required: false, type: 'select', options: internalCountries.filter(c => c.isActive !== false) }
          ]
        };
      case 'brands':
        return {
          title: t('addBrand', 'Добавить бренд / торговую марку'),
          editTitle: t('editBrand', 'Редактировать бренд / торговую марку'),
          fields: [
            { name: 'name', label: t('colName', 'Название бренда'), required: true, placeholder: 'Bayer, Novartis, Pfizer, Sanofi...' },
            { name: 'code', label: t('colCode', 'Код бренда'), required: false }
          ]
        };
      case 'variations':
        return {
          title: t('addVariationGroup', 'Добавить группу вариаций'),
          editTitle: t('editVariationGroup', 'Редактировать группу вариаций'),
          fields: [
            { name: 'name', label: t('groupName', 'Название группы'), required: true, placeholder: 'Форма выпуска, Дозировка, Объем...' },
            { 
              name: 'values', 
              label: t('groupValues', 'Значения (через запятую)'), 
              required: false, 
              placeholder: 'Таблетки, Капсулы, Ампулы, Раствор для инфузий'
            }
          ]
        };
      default:
        return null;
    }
  };

  const config = getCatalogConfig(catalogId);

  useEffect(() => {
    if (isOpen) {
      if (editingItem) {
        // Если редактируем вариацию, преобразуем массив values в строку через запятую
        let initialData = { ...editingItem };
        if (catalogId === 'variations' && Array.isArray(editingItem.values)) {
          initialData.values = editingItem.values.map(v => v.value).join(', ');
        }
        setFormData(initialData);
      } else {
        const initial = {};
        if (config && config.fields) {
          config.fields.forEach(f => {
            if (f.name === 'type' && (catalogId === 'categories' || catalogId === 'productCategories')) {
              initial[f.name] = 'GOODS';
            } else {
              initial[f.name] = f.type === 'number' ? 0 : '';
            }
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
      let submissionData = { ...formData };
      
      // Для вариаций преобразуем строку значений в массив
      if (catalogId === 'variations' && typeof submissionData.values === 'string') {
        submissionData.values = submissionData.values
          .split(',')
          .map(v => v.trim())
          .filter(Boolean);
      }

      if (catalogId === 'works') {
        submissionData.itemType = 'WORKS';
        submissionData.type = 'HYZMAT';
      } else if (catalogId === 'services') {
        submissionData.itemType = 'SERVICES';
        submissionData.type = 'HYZMAT';
      } else if (catalogId === 'productsMNN' || catalogId === 'generalProducts') {
        submissionData.itemType = 'GOODS';
        submissionData.type = 'HARYT';
      } else if (catalogId === 'categories' || catalogId === 'productCategories') {
        if (!submissionData.type) submissionData.type = 'GOODS';
      }

      delete submissionData.category;
      delete submissionData.country;
      delete submissionData.brand;
      delete submissionData.tenderSpecs;
      delete submissionData.offerSpecs;
      delete submissionData.createdAt;
      delete submissionData.updatedAt;

      await onSave(submissionData, editingItem?.id);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const bgClass = isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800';
  const inputBg = isDarkMode ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500' : 'bg-slate-50 border-slate-200 placeholder:text-slate-400';

  return (
    <div className="fixed inset-0 z-10000 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className={`w-full max-w-lg rounded-2xl shadow-2xl border ${bgClass} overflow-hidden animate-in zoom-in-95 duration-200 my-auto`}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-slate-100/10">
          <div>
            <h2 className={`text-lg md:text-xl font-bold ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
              {editingItem ? config.editTitle : config.title}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {catalogId === 'productsMNN' || catalogId === 'generalProducts' 
                ? t('productModalSub', 'Введите данные препарата или выберите активное МНН из архива')
                : catalogId === 'works'
                ? t('worksModalSub', 'Введите наименование вида или этапа монтажных / строительных работ')
                : catalogId === 'services'
                ? t('servicesModalSub', 'Введите наименование, регламент и требования к сервисной услуге')
                : t('fillCatalogRecordDetails', 'Заполните поля для сохранения записи в справочнике')}
            </p>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-4">
          {config.fields.map((field) => (
            <div key={field.name} className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                {field.label} {field.required && <span className="text-rose-500">*</span>}
              </label>
              
              {field.type === 'mnn_combobox' ? (
                <MnnCombobox
                  value={formData[field.name] || ''}
                  onChange={(val, suggestedCatId) => {
                    setFormData(prev => ({
                      ...prev,
                      [field.name]: val,
                      ...(suggestedCatId && !prev.categoryId ? { categoryId: suggestedCatId } : {})
                    }));
                  }}
                  existingProducts={existingProducts}
                  isDarkMode={isDarkMode}
                  role={role}
                  theme={theme}
                  t={t}
                  required={field.required}
                  placeholder={field.placeholder}
                />
              ) : field.type === 'select' ? (
                <CustomSelect
                  role={role}
                  value={formData[field.name] || ''}
                  onChange={(val) => setFormData(prev => ({ ...prev, [field.name]: val }))}
                  placeholder={field.placeholder || t('selectPrompt', 'Выберите...')}
                  options={[
                    { id: '', name: field.placeholder || t('selectPrompt', 'Выберите...') },
                    ...(field.options || [])
                  ]}
                  searchable={(field.options || []).length > 5}
                  isDarkMode={isDarkMode}
                  theme={theme}
                  t={t}
                />
              ) : field.type === 'textarea' ? (
                <textarea
                  value={formData[field.name] || ''}
                  onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                  required={field.required}
                  placeholder={field.placeholder || ''}
                  rows={3}
                  className={`w-full p-2.5 text-xs border rounded-lg outline-none transition-all ${
                    role === 'SUPPLIER'
                      ? 'focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500'
                      : 'focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500'
                  } ${inputBg}`}
                />
              ) : (
                <input
                  type={field.type === 'number' ? 'number' : 'text'}
                  value={formData[field.name] || ''}
                  onChange={(e) => setFormData({ ...formData, [field.name]: field.type === 'number' ? Number(e.target.value) : e.target.value })}
                  required={field.required}
                  placeholder={field.placeholder || ''}
                  className={`w-full p-2.5 text-xs border rounded-lg outline-none transition-all ${
                    role === 'SUPPLIER'
                      ? 'focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500'
                      : 'focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500'
                  } ${inputBg}`}
                />
              )}
            </div>
          ))}

          {/* Footer */}
          <div className="pt-4 mt-6 flex justify-end gap-3 border-t border-slate-100/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              {t('cancel', 'Отмена')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-5 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-2 ${
                theme?.primaryBg || (role === 'SUPPLIER' ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-emerald-600 text-white hover:bg-emerald-700')
              } disabled:opacity-70 cursor-pointer shadow-xs`}
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

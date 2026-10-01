import React, { useState, useEffect } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { 
  PlusCircle, Search, ArrowLeft, Database, Layers, Users, Truck, 
  Globe, DollarSign, Hash, Package, Wrench, Activity, Pill, Factory, 
  Tag, SlidersHorizontal 
} from 'lucide-react';
import API from '../services/api';
import { getRoleTheme } from '../utils/themeUtils';
import { getTranslation } from '../utils/translations';
import AdminLogs from './AdminLogs';
import { useAlert } from '../context/AlertContext';
import { TableSkeletonRows } from '../components/ui';

import {
  CatalogCardGrid,
  CategoriesCatalogTable,
  CurrenciesCatalogTable,
  CountriesCatalogTable,
  DeliveryTermsCatalogTable,
  ProductsCatalogTable,
  WorksCatalogTable,
  ServicesCatalogTable,
  MnnArchiveCatalogTable,
  UnitsCatalogTable,
  ManufacturersCatalogTable,
  BrandsCatalogTable,
  VariationsCatalogTable,
  ClientsCatalogTable,
  CatalogFormModal,
} from '../components/catalogs';

/**
 * Главный экран управления справочниками и классификаторами (AdminCatalogs)
 * Декомпозирован на изолированные компоненты таблиц в src/components/catalogs/
 */
export default function AdminCatalogs({ section = 'umumy', role, isDarkMode, lang = 'RU' }) {
  if (section === 'administrasiya') {
    return <AdminLogs role={role} isDarkMode={isDarkMode} lang={lang} />;
  }

  return (
    <AdminCatalogsContent 
      section={section} 
      role={role} 
      isDarkMode={isDarkMode} 
      lang={lang} 
    />
  );
}

function AdminCatalogsContent({ section = 'umumy', role, isDarkMode, lang = 'RU' }) {
  const theme = getRoleTheme(role, isDarkMode);
  const t = (key, fallback) => getTranslation(lang, key, fallback);
  const { showAlert, showConfirm } = useAlert();
  const location = useLocation();

  // Активная секция из пропа либо пути URL
  const activeSection = section || (location.pathname.includes('haryt') ? 'haryt' : 'umumy');
  
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCatalog = searchParams.get('catalog');
  const [searchQuery, setSearchQuery] = useState('');

  // Состояния данных справочников
  const [categories, setCategories] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [countries, setCountries] = useState([]);
  const [deliveryTerms, setDeliveryTerms] = useState([]);
  const [productsMNN, setProductsMNN] = useState([]);
  const [worksList, setWorksList] = useState([]);
  const [servicesList, setServicesList] = useState([]);
  const [mnnList, setMnnList] = useState([]);
  const [units, setUnits] = useState([]);
  const [manufacturers, setManufacturers] = useState([]);
  const [brands, setBrands] = useState([]);
  const [variations, setVariations] = useState([]);
  const [clients, setClients] = useState([]);
  
  const [loading, setLoading] = useState(Boolean(activeCatalog));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Пагинация (10 записей на страницу по умолчанию)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeCatalog, searchQuery]);

  const getEndpoint = (cat) => {
    if (cat === 'productsMNN' || cat === 'generalProducts' || cat === 'works' || cat === 'services') return 'products';
    if (cat === 'mnn') return 'mnn';
    if (cat === 'categories' || cat === 'productCategories') return 'categories';
    if (cat === 'delivery') return 'delivery-terms';
    if (cat === 'brands') return 'brands';
    if (cat === 'variations') return 'variations';
    return cat;
  };

  const fetchCatalogData = async (catalogKey) => {
    setLoading(true);
    try {
      if (catalogKey === 'categories' || catalogKey === 'productCategories') {
        const res = await API.get('/catalogs/categories');
        setCategories(Array.isArray(res.data) ? res.data : []);
      } else if (catalogKey === 'currencies') {
        const res = await API.get('/catalogs/currencies');
        setCurrencies(Array.isArray(res.data) ? res.data : []);
      } else if (catalogKey === 'countries') {
        const res = await API.get('/catalogs/countries');
        setCountries(Array.isArray(res.data) ? res.data : []);
      } else if (catalogKey === 'delivery') {
        const res = await API.get('/catalogs/delivery-terms');
        setDeliveryTerms(Array.isArray(res.data) ? res.data : []);
      } else if (catalogKey === 'productsMNN' || catalogKey === 'generalProducts') {
        const res = await API.get('/catalogs/products?itemType=GOODS');
        setProductsMNN(Array.isArray(res.data) ? res.data : []);
      } else if (catalogKey === 'works') {
        const res = await API.get('/catalogs/products?itemType=WORKS');
        setWorksList(Array.isArray(res.data) ? res.data : []);
      } else if (catalogKey === 'services') {
        const res = await API.get('/catalogs/products?itemType=SERVICES');
        setServicesList(Array.isArray(res.data) ? res.data : []);
      } else if (catalogKey === 'mnn') {
        const res = await API.get('/catalogs/mnn');
        setMnnList(Array.isArray(res.data) ? res.data : []);
      } else if (catalogKey === 'units') {
        const res = await API.get('/catalogs/units');
        setUnits(Array.isArray(res.data) ? res.data : []);
      } else if (catalogKey === 'manufacturers') {
        const res = await API.get('/catalogs/manufacturers');
        setManufacturers(Array.isArray(res.data) ? res.data : []);
      } else if (catalogKey === 'brands') {
        const res = await API.get('/catalogs/brands');
        setBrands(Array.isArray(res.data) ? res.data : []);
      } else if (catalogKey === 'variations') {
        const res = await API.get('/catalogs/variations');
        setVariations(Array.isArray(res.data) ? res.data : []);
      } else if (catalogKey === 'clients') {
        const res = await API.get('/catalogs/clients');
        setClients(Array.isArray(res.data) ? res.data : []);
      }
    } catch (e) {
      console.error('Failed to load catalog data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeCatalog) {
      setLoading(true);
      fetchCatalogData(activeCatalog);
      setSearchQuery('');
      if ((activeCatalog === 'manufacturers' || activeCatalog === 'brands') && countries.length === 0) {
        API.get('/catalogs/countries')
          .then(res => setCountries(Array.isArray(res.data) ? res.data : []))
          .catch(e => console.error('Failed to preload countries:', e));
      }
      if ((activeCatalog === 'productsMNN' || activeCatalog === 'mnn' || activeCatalog === 'works' || activeCatalog === 'services') && categories.length === 0) {
        API.get('/catalogs/categories')
          .then(res => setCategories(Array.isArray(res.data) ? res.data : []))
          .catch(e => console.error('Failed to preload categories:', e));
      }
    }
  }, [activeCatalog, countries.length, categories.length]);

  const handleSaveModal = async (formData, itemId) => {
    try {
      const endpoint = getEndpoint(activeCatalog);
      const dataToSave = { ...formData };
      if (activeCatalog === 'works') {
        dataToSave.itemType = 'WORKS';
        dataToSave.type = 'HYZMAT';
      } else if (activeCatalog === 'services') {
        dataToSave.itemType = 'SERVICES';
        dataToSave.type = 'HYZMAT';
      } else if (activeCatalog === 'productsMNN' || activeCatalog === 'generalProducts') {
        dataToSave.itemType = 'GOODS';
        dataToSave.type = 'HARYT';
      }
      if (itemId) {
        await API.put(`/catalogs/${endpoint}/${itemId}`, dataToSave);
      } else {
        await API.post(`/catalogs/${endpoint}`, dataToSave);
      }
      setIsModalOpen(false);
      fetchCatalogData(activeCatalog);
      showAlert({
        title: t('successTitle', 'Успешно'),
        message: t('recordSavedSuccess', 'Запись успешно сохранена'),
        type: 'success'
      });
    } catch (e) {
      console.error(e);
      showAlert({
        title: t('errorTitle', 'Ошибка'),
        message: e.response?.data?.error || t('profileSaveError', 'Ошибка при сохранении'),
        type: 'error'
      });
    }
  };

  const handleToggleActive = async (item) => {
    try {
      const endpoint = getEndpoint(activeCatalog);
      await API.put(`/catalogs/${endpoint}/${item.id}`, { isActive: !item.isActive });
      fetchCatalogData(activeCatalog);
    } catch (e) {
      console.error(e);
      showAlert({
        title: t('errorTitle', 'Ошибка'),
        message: t('statusUpdateError', 'Ошибка при изменении статуса'),
        type: 'error'
      });
    }
  };

  const handleDelete = async (itemId) => {
    const isConfirmed = await showConfirm({
      title: t('deleteRecordTitle', 'Удаление записи'),
      message: t('deleteRecordConfirm', 'Вы уверены, что хотите удалить эту запись?'),
      type: 'danger',
      confirmText: t('delete', 'Удалить'),
      cancelText: t('cancelEditBtn', 'Отмена'),
      isDanger: true
    });
    if (!isConfirmed) return;

    try {
      const endpoint = getEndpoint(activeCatalog);
      await API.delete(`/catalogs/${endpoint}/${itemId}`);
      fetchCatalogData(activeCatalog);
      showAlert({
        title: t('successTitle', 'Успешно'),
        message: t('recordDeletedSuccess', 'Запись успешно удалена'),
        type: 'success'
      });
    } catch (e) {
      console.error(e);
      showAlert({
        title: t('errorTitle', 'Ошибка'),
        message: t('deleteError', 'Ошибка при удалении'),
        type: 'error'
      });
    }
  };

  const sections = {
    umumy: [
      { id: 'categories', title: t('catTenderCategories', 'Категории закупок'), subtitle: t('catTenderCategoriesSub', 'Классификатор направлений и отраслей закупок'), icon: <Layers size={24}/> },
      { id: 'clients', title: t('catClients', 'Заказчики'), subtitle: t('catClientsSub', 'Организации, ведомства и учреждения здравоохранения'), icon: <Users size={24}/> },
      { id: 'delivery', title: t('catDelivery', 'Условия поставки (Инкотермс)'), subtitle: t('catDeliverySub', 'Базисы поставки товаров (DAP, DDP, CIP, CIF)'), icon: <Truck size={24}/> },
      { id: 'countries', title: t('catCountries', 'Страны мира'), subtitle: t('catCountriesSub', 'Классификатор государств (Alpha-2, Alpha-3)'), icon: <Globe size={24}/> },
      { id: 'currencies', title: t('catCurrencies', 'Валюты и курсы'), subtitle: t('catCurrenciesSub', 'Используемые валюты платформы (TMT, USD, EUR)'), icon: <DollarSign size={24}/> },
      { id: 'units', title: t('catUnits', 'Единицы измерения'), subtitle: t('catUnitsSub', 'Общесистемный классификатор (шт, упак, фл, амп)'), icon: <Hash size={24}/> }
    ],
    haryt: [
      { id: 'productsMNN', title: t('catProducts', 'Реестр препаратов и товаров'), subtitle: t('catProductsSub', 'Полная номенклатура по МНН и торговым наименованиям'), icon: <Package size={24}/> },
      { id: 'works', title: t('catWorks', 'Реестр видов и этапов работ'), subtitle: t('catWorksSub', 'Монтаж оборудования, чистые помещения, кислородопровод, вентиляция'), icon: <Wrench size={24}/> },
      { id: 'services', title: t('catServices', 'Реестр медицинских услуг'), subtitle: t('catServicesSub', 'ТО томографов и ИВЛ, сервис, поверка, утилизация отходов'), icon: <Activity size={24}/> },
      { id: 'mnn', title: t('catMnnArchive', 'Архив веществ (МНН)'), subtitle: t('catMnnArchiveSub', 'Действующие вещества и зарегистрированные препараты'), icon: <Pill size={24}/> },
      { id: 'productCategories', title: t('catProductCategories', 'Категории классификатора'), subtitle: t('catProductCategoriesSub', 'Классификатор категорий товаров, работ и услуг'), icon: <Layers size={24}/> },
      { id: 'manufacturers', title: t('catManufacturers', 'Производители'), subtitle: t('catManufacturersSub', 'Фармацевтические заводы и фабрики с привязкой к стране'), icon: <Factory size={24}/> },
      { id: 'brands', title: t('catBrands', 'Торговые марки / Бренды'), subtitle: t('catBrandsSub', 'Зарегистрированные международные бренды'), icon: <Tag size={24}/> },
      { id: 'units', title: t('catUnits', 'Единицы измерения'), subtitle: t('catUnitsSub', 'Классификатор единиц (шт, упак, флак, амп, мл, мг, усл)'), icon: <Hash size={24}/> },
      { id: 'variations', title: t('catVariations', 'Вариации и формы выпуска'), subtitle: t('catVariationsSub', 'Формы выпуска, дозировки и фасовки медикаментов'), icon: <SlidersHorizontal size={24}/> }
    ],
  };

  const tableHeaderClass = isDarkMode 
    ? "bg-slate-800 text-slate-200 font-semibold" 
    : "bg-slate-100 text-slate-700 font-semibold";

  const renderActiveTable = () => {
    if (loading) {
      return (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className={tableHeaderClass}>
                <th className="py-3 px-4 w-14 text-center">#</th>
                <th className="py-3 px-4">{t('colName', 'Название')}</th>
                <th className="py-3 px-4 text-center w-36">{t('colCode', 'Код / Данные')}</th>
                <th className="py-3 px-4 text-center w-32">{t('colAction', 'Действия')}</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
              <TableSkeletonRows rows={pageSize || 8} cols={4} />
            </tbody>
          </table>
        </div>
      );
    }

    const commonProps = {
      searchQuery,
      currentPage,
      pageSize,
      onPageChange: setCurrentPage,
      onPageSizeChange: (newSize) => { setPageSize(newSize); setCurrentPage(1); },
      onToggleActive: handleToggleActive,
      onEdit: (item) => { setEditingItem(item); setIsModalOpen(true); },
      onDelete: handleDelete,
      tableHeaderClass,
      theme,
      isDarkMode,
      role,
      lang,
      t,
    };

    switch (activeCatalog) {
      case 'categories':
      case 'productCategories':
        return <CategoriesCatalogTable {...commonProps} categories={categories} />;
      case 'currencies':
        return <CurrenciesCatalogTable {...commonProps} currencies={currencies} />;
      case 'countries':
        return <CountriesCatalogTable {...commonProps} countries={countries} />;
      case 'delivery':
        return <DeliveryTermsCatalogTable {...commonProps} deliveryTerms={deliveryTerms} />;
      case 'productsMNN':
      case 'generalProducts':
        return <ProductsCatalogTable {...commonProps} products={productsMNN} />;
      case 'works':
        return <WorksCatalogTable {...commonProps} works={worksList} />;
      case 'services':
        return <ServicesCatalogTable {...commonProps} services={servicesList} />;
      case 'mnn':
        return (
          <MnnArchiveCatalogTable 
            {...commonProps} 
            mnnList={mnnList} 
            onAddNewDrug={(item) => {
              setEditingItem({ name: item.name, categoryId: item.categories?.[0]?.id });
              setIsModalOpen(true);
            }} 
          />
        );
      case 'units':
        return <UnitsCatalogTable {...commonProps} units={units} />;
      case 'manufacturers':
        return <ManufacturersCatalogTable {...commonProps} manufacturers={manufacturers} />;
      case 'brands':
        return <BrandsCatalogTable {...commonProps} brands={brands} />;
      case 'variations':
        return <VariationsCatalogTable {...commonProps} variations={variations} />;
      case 'clients':
        return <ClientsCatalogTable {...commonProps} clients={clients} />;
      default:
        return (
          <div className="p-12 flex items-center justify-center">
            <div className="text-center text-slate-400">
              <Database size={48} className="mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium">{t('underConstruction', 'Раздел находится в разработке')}</p>
            </div>
          </div>
        );
    }
  };

  const currentSectionItems = sections[activeSection] || sections.umumy;
  const currentCatalogItem = currentSectionItems.find(s => s.id === activeCatalog) 
    || sections.umumy.find(s => s.id === activeCatalog) 
    || sections.haryt.find(s => s.id === activeCatalog);

  return (
    <div className={`flex flex-col min-h-[calc(100vh-100px)] -mx-6 -mt-6 ${isDarkMode ? 'bg-[#0b0f17]' : 'bg-slate-50/50'}`}>
      <div className="flex-1 p-6 overflow-y-auto">
        {!activeCatalog ? (
          <CatalogCardGrid
            items={currentSectionItems}
            activeSection={activeSection}
            onSelectCatalog={(catId) => setSearchParams({ catalog: catId })}
            isDarkMode={isDarkMode}
            t={t}
          />
        ) : (
          <div className="animate-in slide-in-from-right-4 duration-200 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSearchParams({})}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer ${
                    isDarkMode
                      ? 'bg-slate-800 border-slate-700 text-slate-200 hover:border-emerald-500 hover:text-emerald-400'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-emerald-400 hover:text-emerald-600'
                  }`}
                >
                  <ArrowLeft size={16} />
                  <span>{t('back', 'Назад')}</span>
                </button>
                <div>
                  <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                    {currentCatalogItem?.title || activeCatalog}
                  </h1>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    {currentCatalogItem?.subtitle}
                  </p>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('searchPlaceholder', 'Поиск по записям...')} 
                    className={`pl-9 pr-4 py-2 rounded-xl border text-xs w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${
                      isDarkMode 
                        ? 'bg-slate-800 border-slate-700 text-white' 
                        : 'bg-white border-slate-200 text-slate-800'
                    }`} 
                  />
                </div>
                
                {activeCatalog !== 'mnn' ? (
                  <button 
                    onClick={() => { setEditingItem(null); setIsModalOpen(true); }} 
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-sm shadow-emerald-600/20"
                  >
                    <PlusCircle size={15} />
                    <span>{t('addBtn', 'Добавить')}</span>
                  </button>
                ) : (
                  <button 
                    onClick={() => { 
                      setSearchParams({ catalog: 'productsMNN' });
                      setEditingItem(null); 
                      setIsModalOpen(true); 
                    }} 
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-sm shadow-emerald-600/20"
                  >
                    <PlusCircle size={15} />
                    <span>{t('addDrugBtn', 'Добавить препарат')}</span>
                  </button>
                )}
              </div>
            </div>

            <div className={`rounded-2xl border shadow-xs overflow-hidden ${theme.tableCardBorderTop} ${isDarkMode ? 'bg-slate-800/90 border-slate-700' : 'bg-white border-slate-200'}`}>
              <div className="overflow-x-auto">
                {renderActiveTable()}
              </div>
            </div>
          </div>
        )}
      </div>

      {isModalOpen && (
        <CatalogFormModal
          countries={countries}
          categories={categories}
          existingProducts={productsMNN}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveModal}
          catalogId={activeCatalog === 'mnn' ? 'productsMNN' : activeCatalog}
          editingItem={editingItem}
          theme={theme}
          t={t}
          isDarkMode={isDarkMode}
        />
      )}
    </div>
  );
}

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { 
  PlusCircle, Search, Edit2, ToggleRight, ToggleLeft, Trash2, Database, Package, Settings, 
  Hash, Globe, Truck, DollarSign, Layers, ShieldAlert, 
  Users, ArrowLeft, Tag, Factory, Pill, SlidersHorizontal, CheckCircle2, Plus
} from 'lucide-react';
import API from '../services/api';
import { getRoleTheme } from '../utils/themeUtils';
import { getTranslation } from '../utils/translations';
import CatalogFormModal from '../components/CatalogFormModal';
import AdminLogs from './AdminLogs';
import { useAlert } from '../context/AlertContext';
import { Pagination } from '../components/ui';

export default function AdminCatalogs({ section = 'umumy', role, isDarkMode, lang = 'RU' }) {
  if (section === 'administrasiya') {
    return <AdminLogs role={role} isDarkMode={isDarkMode} lang={lang} />;
  }

  return <AdminCatalogsContent section={section} role={role} isDarkMode={isDarkMode} lang={lang} />;
}

function AdminCatalogsContent({ section = 'umumy', role, isDarkMode, lang = 'RU' }) {
  const theme = getRoleTheme(role, isDarkMode);
  const t = (key, fallback) => getTranslation(lang, key, fallback);
  const { showAlert, showConfirm } = useAlert();
  const location = useLocation();

  // Определяем активную секцию из пропа либо пути URL
  const activeSection = section || (location.pathname.includes('haryt') ? 'haryt' : 'umumy');
  
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCatalog = searchParams.get('catalog');
  const [searchQuery, setSearchQuery] = useState('');

  // Состояния справочников
  const [categories, setCategories] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [countries, setCountries] = useState([]);
  const [deliveryTerms, setDeliveryTerms] = useState([]);
  const [productsMNN, setProductsMNN] = useState([]);
  const [mnnList, setMnnList] = useState([]);
  const [units, setUnits] = useState([]);
  const [manufacturers, setManufacturers] = useState([]);
  const [brands, setBrands] = useState([]);
  const [variations, setVariations] = useState([]);
  const [clients, setClients] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Пагинация (стандарт 10 записей на страницу)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeCatalog, searchQuery]);

  const getEndpoint = (cat) => {
    if (cat === 'productsMNN' || cat === 'generalProducts') return 'products';
    if (cat === 'mnn') return 'mnn';
    if (cat === 'categories' || cat === 'productCategories') return 'categories';
    if (cat === 'delivery') return 'delivery-terms';
    if (cat === 'brands') return 'brands';
    if (cat === 'variations') return 'variations';
    return cat;
  };

  const handleSaveModal = async (formData, itemId) => {
    try {
      const endpoint = getEndpoint(activeCatalog);
      if (itemId) {
        await API.put(`/catalogs/${endpoint}/${itemId}`, formData);
      } else {
        await API.post(`/catalogs/${endpoint}`, formData);
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

  useEffect(() => {
    if (activeCatalog) {
      fetchCatalogData(activeCatalog);
      setSearchQuery('');
      if ((activeCatalog === 'manufacturers' || activeCatalog === 'brands') && countries.length === 0) {
        API.get('/catalogs/countries')
          .then(res => setCountries(Array.isArray(res.data) ? res.data : []))
          .catch(e => console.error('Failed to preload countries:', e));
      }
      if ((activeCatalog === 'productsMNN' || activeCatalog === 'mnn') && categories.length === 0) {
        API.get('/catalogs/categories')
          .then(res => setCategories(Array.isArray(res.data) ? res.data : []))
          .catch(e => console.error('Failed to preload categories:', e));
      }
    }
  }, [activeCatalog]);

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
        const res = await API.get('/catalogs/products');
        setProductsMNN(Array.isArray(res.data) ? res.data : []);
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

  const renderActionButtons = (item, allowToggle = true) => (
    <div className="flex items-center justify-center gap-1.5">
      {allowToggle && item.isActive !== undefined && (
        <button
          type="button"
          onClick={() => handleToggleActive(item)}
          title={item.isActive ? t('deactivate', 'Деактивировать') : t('activate', 'Активировать')}
          className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-all cursor-pointer"
        >
          {item.isActive ? <ToggleRight size={18} className="text-emerald-600" /> : <ToggleLeft size={18} className="text-slate-400" />}
        </button>
      )}
      <button
        type="button"
        onClick={() => { setEditingItem(item); setIsModalOpen(true); }}
        title={t('edit', 'Редактировать')}
        className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center justify-center transition-all cursor-pointer"
      >
        <Edit2 size={14} />
      </button>
      <button
        type="button"
        onClick={() => handleDelete(item.id)}
        title={t('delete', 'Удалить')}
        className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 dark:hover:bg-rose-950/40 dark:hover:border-rose-900/60 dark:hover:text-rose-400 flex items-center justify-center transition-all cursor-pointer"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );

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
      { id: 'mnn', title: t('catMnnArchive', 'Архив веществ (МНН)'), subtitle: t('catMnnArchiveSub', 'Действующие вещества и зарегистрированные препараты'), icon: <Pill size={24}/> },
      { id: 'productCategories', title: t('catProductCategories', 'Категории товаров'), subtitle: t('catProductCategoriesSub', 'Фармакотерапевтические группы и направления'), icon: <Layers size={24}/> },
      { id: 'manufacturers', title: t('catManufacturers', 'Производители'), subtitle: t('catManufacturersSub', 'Фармацевтические заводы и фабрики с привязкой к стране'), icon: <Factory size={24}/> },
      { id: 'brands', title: t('catBrands', 'Торговые марки / Бренды'), subtitle: t('catBrandsSub', 'Зарегистрированные международные бренды'), icon: <Tag size={24}/> },
      { id: 'units', title: t('catUnits', 'Единицы измерения'), subtitle: t('catUnitsSub', 'Классификатор единиц (шт, упак, флак, амп, мл, мг)'), icon: <Hash size={24}/> },
      { id: 'variations', title: t('catVariations', 'Вариации и формы выпуска'), subtitle: t('catVariationsSub', 'Формы выпуска, дозировки и фасовки медикаментов'), icon: <SlidersHorizontal size={24}/> }
    ],
    administrasiya: [
      { id: 'logs', title: t('catLogs', 'Журнал аудита'), subtitle: t('catLogsSub', 'Логи всех событий'), icon: <ShieldAlert size={24}/> },
      { id: 'settings', title: t('catSettings', 'Системные настройки'), subtitle: t('catSettingsSub', 'Параметры платформы'), icon: <Settings size={24}/> },
      { id: 'roles', title: t('catRoles', 'Роли и права'), subtitle: t('catRolesSub', 'Модель RBAC'), icon: <Users size={24}/> },
      { id: 'backup', title: t('catBackup', 'Backup'), subtitle: t('catBackupSub', 'Резервные копии'), icon: <Database size={24}/> },
      { id: 'users', title: t('catUsers', 'Пользователи'), subtitle: t('catUsersSub', 'Учетные записи'), icon: <Users size={24}/> }
    ]
  };

  // Рендер конкретной таблицы
  const renderTable = () => {
    if (loading) {
      return <div className="p-8 text-center text-slate-400">{t('loading', 'Загрузка данных...')}</div>;
    }

    const tableHeaderClass = isDarkMode ? "bg-slate-800 text-slate-200 font-semibold" : "bg-slate-100 text-slate-700 font-semibold";
    const q = searchQuery.toLowerCase().trim();

    // 1. КАТЕГОРИИ
    if (activeCatalog === 'categories' || activeCatalog === 'productCategories') {
      const filtered = (categories || []).filter(c => 
        !q || (c.name || '').toLowerCase().includes(q) || (c.code || '').toLowerCase().includes(q)
      );
      const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

      return (
        <div>
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className={tableHeaderClass}>
                <th className="py-3 px-4 w-14 text-center">#</th>
                <th className="py-3 px-4">{t('colName', 'Название категории')}</th>
                <th className="py-3 px-4 text-center w-36">{t('colCode', 'Код')}</th>
                <th className="py-3 px-4 text-center w-32">{t('colAction', 'Действия')}</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-8 text-center text-slate-400">{t('noResults', 'Нет данных')}</td>
                </tr>
              ) : paginated.map((c, i) => (
                <tr key={c.id} className={theme.tableRowHover}>
                  <td className="py-3 px-4 text-center text-slate-400 font-mono">{(currentPage - 1) * pageSize + i + 1}</td>
                  <td className="py-3 px-4 font-bold text-sm text-slate-800 dark:text-slate-100">{c.name}</td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400">{c.code}</td>
                  <td className="py-3 px-4 text-center">{renderActionButtons(c)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-3 border-t border-slate-200 dark:border-slate-800">
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(filtered.length / pageSize) || 1}
              totalItems={filtered.length}
              pageSize={pageSize}
              pageSizeOptions={[10, 25, 50, 100]}
              onPageChange={setCurrentPage}
              onPageSizeChange={(newSize) => { setPageSize(newSize); setCurrentPage(1); }}
              role={role}
              lang={lang}
            />
          </div>
        </div>
      );
    }

    // 2. ВАЛЮТЫ
    if (activeCatalog === 'currencies') {
      const filtered = (currencies || []).filter(c => 
        !q || (c.name || '').toLowerCase().includes(q) || (c.code || '').toLowerCase().includes(q)
      );
      const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

      return (
        <div>
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className={tableHeaderClass}>
                <th className="py-3 px-4 w-14 text-center">#</th>
                <th className="py-3 px-4">{t('colName', 'Название')}</th>
                <th className="py-3 px-4 text-center w-28">{t('colCode', 'Код')}</th>
                <th className="py-3 px-4 text-center w-24">{t('colSymbol', 'Символ')}</th>
                <th className="py-3 px-4 text-center w-20">{t('colFlag', 'Флаг')}</th>
                <th className="py-3 px-4 text-center w-32">{t('colAction', 'Действия')}</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400">{t('noResults', 'Нет данных')}</td>
                </tr>
              ) : paginated.map((c, i) => (
                <tr key={c.id} className={theme.tableRowHover}>
                  <td className="py-3 px-4 text-center text-slate-400 font-mono">{(currentPage - 1) * pageSize + i + 1}</td>
                  <td className="py-3 px-4 font-bold text-sm text-slate-800 dark:text-slate-100">{c.name}</td>
                  <td className="py-3 px-4 text-center font-mono font-bold">{c.code}</td>
                  <td className="py-3 px-4 text-center font-bold text-emerald-600 text-sm">{c.symbol}</td>
                  <td className="py-3 px-4 text-center text-base">{c.flag || '-'}</td>
                  <td className="py-3 px-4 text-center">{renderActionButtons(c)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-3 border-t border-slate-200 dark:border-slate-800">
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(filtered.length / pageSize) || 1}
              totalItems={filtered.length}
              pageSize={pageSize}
              pageSizeOptions={[10, 25, 50, 100]}
              onPageChange={setCurrentPage}
              onPageSizeChange={(newSize) => { setPageSize(newSize); setCurrentPage(1); }}
              role={role}
              lang={lang}
            />
          </div>
        </div>
      );
    }

    // 3. СТРАНЫ МИРА
    if (activeCatalog === 'countries') {
      const filtered = (countries || []).filter(c => 
        !q || (c.name || '').toLowerCase().includes(q) || (c.alpha2 || '').toLowerCase().includes(q) || (c.alpha3 || '').toLowerCase().includes(q)
      );
      const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

      return (
        <div>
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className={tableHeaderClass}>
                <th className="py-3 px-4 w-14 text-center">#</th>
                <th className="py-3 px-4">{t('colName', 'Название страны')}</th>
                <th className="py-3 px-4 text-center w-28">Alpha-2</th>
                <th className="py-3 px-4 text-center w-28">Alpha-3</th>
                <th className="py-3 px-4 text-center w-32">{t('colAction', 'Действия')}</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-slate-400">{t('noResults', 'Нет данных')}</td>
                </tr>
              ) : paginated.map((c, i) => (
                <tr key={c.id} className={theme.tableRowHover}>
                  <td className="py-3 px-4 text-center text-slate-400 font-mono">{(currentPage - 1) * pageSize + i + 1}</td>
                  <td className="py-3 px-4 font-bold text-sm text-slate-800 dark:text-slate-100">{c.name}</td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-emerald-600">{c.alpha2}</td>
                  <td className="py-3 px-4 text-center font-mono">{c.alpha3}</td>
                  <td className="py-3 px-4 text-center">{renderActionButtons(c)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-3 border-t border-slate-200 dark:border-slate-800">
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(filtered.length / pageSize) || 1}
              totalItems={filtered.length}
              pageSize={pageSize}
              pageSizeOptions={[10, 25, 50, 100]}
              onPageChange={setCurrentPage}
              onPageSizeChange={(newSize) => { setPageSize(newSize); setCurrentPage(1); }}
              role={role}
              lang={lang}
            />
          </div>
        </div>
      );
    }

    // 4. УСЛОВИЯ ПОСТАВКИ
    if (activeCatalog === 'delivery') {
      const filtered = (deliveryTerms || []).filter(c => 
        !q || (c.name || '').toLowerCase().includes(q) || (c.shortName || '').toLowerCase().includes(q)
      );
      const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

      return (
        <div>
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className={tableHeaderClass}>
                <th className="py-3 px-4 w-14 text-center">#</th>
                <th className="py-3 px-4">{t('colName', 'Название базиса поставки')}</th>
                <th className="py-3 px-4 text-center w-36">{t('colShortName', 'Краткое название')}</th>
                <th className="py-3 px-4 text-center w-32">{t('colAction', 'Действия')}</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-8 text-center text-slate-400">{t('noResults', 'Нет данных')}</td>
                </tr>
              ) : paginated.map((c, i) => (
                <tr key={c.id} className={theme.tableRowHover}>
                  <td className="py-3 px-4 text-center text-slate-400 font-mono">{(currentPage - 1) * pageSize + i + 1}</td>
                  <td className="py-3 px-4 font-bold text-sm text-slate-800 dark:text-slate-100">{c.name}</td>
                  <td className="py-3 px-4 text-center font-bold font-mono text-emerald-600 dark:text-emerald-400 text-sm">{c.shortName}</td>
                  <td className="py-3 px-4 text-center">{renderActionButtons(c)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-3 border-t border-slate-200 dark:border-slate-800">
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(filtered.length / pageSize) || 1}
              totalItems={filtered.length}
              pageSize={pageSize}
              pageSizeOptions={[10, 25, 50, 100]}
              onPageChange={setCurrentPage}
              onPageSizeChange={(newSize) => { setPageSize(newSize); setCurrentPage(1); }}
              role={role}
              lang={lang}
            />
          </div>
        </div>
      );
    }

    // 5. РЕЕСТР ПРЕПАРАТОВ (МНН / ТОРГОВЫЕ НАИМЕНОВАНИЯ)
    if (activeCatalog === 'productsMNN' || activeCatalog === 'generalProducts') {
      const filtered = (productsMNN || []).filter(p => 
        !q || (p.name || '').toLowerCase().includes(q) || 
        (p.tradeName || '').toLowerCase().includes(q) || 
        (p.code || '').toLowerCase().includes(q) ||
        (p.category?.name || '').toLowerCase().includes(q)
      );
      const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

      return (
        <div>
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className={tableHeaderClass}>
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4 min-w-56">{t('innName', 'Международное непатентованное наименование (МНН)')}</th>
                <th className="py-3 px-4 min-w-44">{t('tradeName', 'Торговое название')}</th>
                <th className="py-3 px-4 min-w-40">{t('category', 'Категория')}</th>
                <th className="py-3 px-4 text-center w-28">{t('colCode', 'Код (АТХ)')}</th>
                <th className="py-3 px-4 min-w-44">{t('colDesc', 'Описание / Дозировка')}</th>
                <th className="py-3 px-4 text-center w-32">{t('colAction', 'Действия')}</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    <Package size={36} className="mx-auto mb-2 opacity-30 text-emerald-500" />
                    <p className="text-sm font-semibold">{t('noProductsFound', 'Препараты не найдены')}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{t('clickAddProductPrompt', 'Нажмите «+ Добавить», чтобы зарегистрировать новый препарат.')}</p>
                  </td>
                </tr>
              ) : paginated.map((p, i) => (
                <tr key={p.id} className={theme.tableRowHover}>
                  <td className="py-3 px-4 text-center text-slate-400 font-mono">{(currentPage - 1) * pageSize + i + 1}</td>
                  <td className="py-3 px-4">
                    <span className="font-bold text-sm text-slate-900 dark:text-white block leading-tight">{p.name}</span>
                  </td>
                  <td className="py-3 px-4">
                    {p.tradeName ? (
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 inline-block">
                        {p.tradeName}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">-</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {p.category?.name ? (
                      <span className="text-xs text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded inline-block">
                        {p.category.name}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">-</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-xs">{p.code || '-'}</td>
                  <td className="py-3 px-4 text-slate-500 text-xs max-w-xs truncate" title={p.description || ''}>
                    {p.description || '-'}
                  </td>
                  <td className="py-3 px-4 text-center">{renderActionButtons(p)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-3 border-t border-slate-200 dark:border-slate-800">
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(filtered.length / pageSize) || 1}
              totalItems={filtered.length}
              pageSize={pageSize}
              pageSizeOptions={[10, 25, 50, 100]}
              onPageChange={setCurrentPage}
              onPageSizeChange={(newSize) => { setPageSize(newSize); setCurrentPage(1); }}
              role={role}
              lang={lang}
            />
          </div>
        </div>
      );
    }

    // 6. АРХИВ МНН (ДЕЙСТВУЮЩИЕ ВЕЩЕСТВА)
    if (activeCatalog === 'mnn') {
      const filtered = (mnnList || []).filter(item => 
        !q || item.name.toLowerCase().includes(q) || item.tradeNames?.some(tn => tn.toLowerCase().includes(q))
      );
      const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

      return (
        <div>
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className={tableHeaderClass}>
                <th className="py-3 px-4 w-14 text-center">#</th>
                <th className="py-3 px-4 min-w-64">{t('mnnSubstance', 'Международное непатентованное наименование (МНН)')}</th>
                <th className="py-3 px-4 text-center w-36">{t('registeredDrugsCount', 'Препаратов в базе')}</th>
                <th className="py-3 px-4">{t('registeredTradeNames', 'Зарегистрированные торговые наименования')}</th>
                <th className="py-3 px-4 text-center w-36">{t('colAction', 'Действия')}</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-slate-400">
                    <Pill size={36} className="mx-auto mb-2 opacity-30 text-emerald-500" />
                    <p className="text-sm font-semibold">{t('noMnnRecords', 'В архиве МНН пока нет записей')}</p>
                  </td>
                </tr>
              ) : paginated.map((item, i) => (
                <tr key={i} className={theme.tableRowHover}>
                  <td className="py-3 px-4 text-center text-slate-400 font-mono">{(currentPage - 1) * pageSize + i + 1}</td>
                  <td className="py-3 px-4">
                    <span className="font-bold text-sm text-slate-900 dark:text-white block leading-tight">{item.name}</span>
                    {item.categories && item.categories.length > 0 && (
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 block">
                        {item.categories.map(c => c.name).join(', ')}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="px-2 py-0.5 font-bold font-mono rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-xs border border-emerald-200 dark:border-emerald-800">
                      {item.count}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {item.tradeNames && item.tradeNames.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {item.tradeNames.map((tn, tIdx) => (
                          <span key={tIdx} className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-xs border border-slate-200 dark:border-slate-700">
                            {tn}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">Торговые названия не указаны</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingItem({ name: item.name, categoryId: item.categories?.[0]?.id });
                        setIsModalOpen(true);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 font-semibold text-xs flex items-center gap-1 mx-auto transition-colors cursor-pointer"
                      title="Добавить новый препарат с этим МНН"
                    >
                      <Plus size={13} />
                      <span>{t('addDrug', 'Препарат')}</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-3 border-t border-slate-200 dark:border-slate-800">
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(filtered.length / pageSize) || 1}
              totalItems={filtered.length}
              pageSize={pageSize}
              pageSizeOptions={[10, 25, 50, 100]}
              onPageChange={setCurrentPage}
              onPageSizeChange={(newSize) => { setPageSize(newSize); setCurrentPage(1); }}
              role={role}
              lang={lang}
            />
          </div>
        </div>
      );
    }

    // 7. ЕДИНИЦЫ ИЗМЕРЕНИЯ
    if (activeCatalog === 'units') {
      const filtered = (units || []).filter(u => 
        !q || (u.name || '').toLowerCase().includes(q) || (u.shortName || '').toLowerCase().includes(q)
      );
      const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

      return (
        <div>
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className={tableHeaderClass}>
                <th className="py-3 px-4 w-14 text-center">#</th>
                <th className="py-3 px-4">{t('colName', 'Полное название')}</th>
                <th className="py-3 px-4 text-center w-36">{t('colShortName', 'Краткое обозначение')}</th>
                <th className="py-3 px-4 text-center w-32">{t('colAction', 'Действия')}</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-8 text-center text-slate-400">{t('noResults', 'Нет данных')}</td>
                </tr>
              ) : paginated.map((u, i) => (
                <tr key={u.id} className={theme.tableRowHover}>
                  <td className="py-3 px-4 text-center text-slate-400 font-mono">{(currentPage - 1) * pageSize + i + 1}</td>
                  <td className="py-3 px-4 font-bold text-sm text-slate-800 dark:text-slate-100">{u.name}</td>
                  <td className="py-3 px-4 text-center font-bold font-mono text-emerald-600 dark:text-emerald-400 text-sm">{u.shortName}</td>
                  <td className="py-3 px-4 text-center">{renderActionButtons(u)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-3 border-t border-slate-200 dark:border-slate-800">
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(filtered.length / pageSize) || 1}
              totalItems={filtered.length}
              pageSize={pageSize}
              pageSizeOptions={[10, 25, 50, 100]}
              onPageChange={setCurrentPage}
              onPageSizeChange={(newSize) => { setPageSize(newSize); setCurrentPage(1); }}
              role={role}
              lang={lang}
            />
          </div>
        </div>
      );
    }

    // 8. ПРОИЗВОДИТЕЛИ (ФАРМЗАВОДЫ И ФАБРИКИ)
    if (activeCatalog === 'manufacturers') {
      const filtered = (manufacturers || []).filter(m => 
        !q || (m.name || '').toLowerCase().includes(q) || (m.code || '').toLowerCase().includes(q) || (m.country?.name || '').toLowerCase().includes(q)
      );
      const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

      return (
        <div>
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className={tableHeaderClass}>
                <th className="py-3 px-4 w-14 text-center">#</th>
                <th className="py-3 px-4">{t('colName', 'Название предприятия / фармзавода')}</th>
                <th className="py-3 px-4 text-center w-36">{t('colCode', 'Код')}</th>
                <th className="py-3 px-4 w-44">{t('colCountry', 'Страна происхождения')}</th>
                <th className="py-3 px-4 text-center w-32">{t('colAction', 'Действия')}</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-slate-400">{t('noResults', 'Нет данных')}</td>
                </tr>
              ) : paginated.map((m, i) => (
                <tr key={m.id} className={theme.tableRowHover}>
                  <td className="py-3 px-4 text-center text-slate-400 font-mono">{(currentPage - 1) * pageSize + i + 1}</td>
                  <td className="py-3 px-4 font-bold text-sm text-slate-800 dark:text-slate-100">{m.name}</td>
                  <td className="py-3 px-4 text-center font-mono font-bold">{m.code || '-'}</td>
                  <td className="py-3 px-4">
                    {m.country?.name ? (
                      <span className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Globe size={13} className="text-emerald-500" />
                        <span>{m.country.name}</span>
                        {m.country.alpha2 && <span className="font-mono text-[10px] text-slate-400">({m.country.alpha2})</span>}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">-</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">{renderActionButtons(m)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-3 border-t border-slate-200 dark:border-slate-800">
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(filtered.length / pageSize) || 1}
              totalItems={filtered.length}
              pageSize={pageSize}
              pageSizeOptions={[10, 25, 50, 100]}
              onPageChange={setCurrentPage}
              onPageSizeChange={(newSize) => { setPageSize(newSize); setCurrentPage(1); }}
              role={role}
              lang={lang}
            />
          </div>
        </div>
      );
    }

    // 9. БРЕНДЫ / ТОРГОВЫЕ МАРКИ
    if (activeCatalog === 'brands') {
      const filtered = (brands || []).filter(b => 
        !q || (b.name || '').toLowerCase().includes(q) || (b.code || '').toLowerCase().includes(q)
      );
      const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

      return (
        <div>
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className={tableHeaderClass}>
                <th className="py-3 px-4 w-14 text-center">#</th>
                <th className="py-3 px-4">{t('colName', 'Название бренда / торговой марки')}</th>
                <th className="py-3 px-4 text-center w-36">{t('colCode', 'Код')}</th>
                <th className="py-3 px-4 text-center w-40">{t('producersLinked', 'Производителей')}</th>
                <th className="py-3 px-4 text-center w-32">{t('colAction', 'Действия')}</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-slate-400">{t('noResults', 'Нет данных')}</td>
                </tr>
              ) : paginated.map((b, i) => (
                <tr key={b.id} className={theme.tableRowHover}>
                  <td className="py-3 px-4 text-center text-slate-400 font-mono">{(currentPage - 1) * pageSize + i + 1}</td>
                  <td className="py-3 px-4 font-bold text-sm text-slate-800 dark:text-slate-100">{b.name}</td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400">{b.code || '-'}</td>
                  <td className="py-3 px-4 text-center font-mono text-slate-500">{b.manufacturers?.length || 0}</td>
                  <td className="py-3 px-4 text-center">{renderActionButtons(b, false)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-3 border-t border-slate-200 dark:border-slate-800">
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(filtered.length / pageSize) || 1}
              totalItems={filtered.length}
              pageSize={pageSize}
              pageSizeOptions={[10, 25, 50, 100]}
              onPageChange={setCurrentPage}
              onPageSizeChange={(newSize) => { setPageSize(newSize); setCurrentPage(1); }}
              role={role}
              lang={lang}
            />
          </div>
        </div>
      );
    }

    // 10. ВАРИАЦИИ И ФОРМЫ ВЫПУСКА
    if (activeCatalog === 'variations') {
      const filtered = (variations || []).filter(v => 
        !q || (v.name || '').toLowerCase().includes(q) || v.values?.some(val => val.value.toLowerCase().includes(q))
      );
      const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

      return (
        <div>
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className={tableHeaderClass}>
                <th className="py-3 px-4 w-14 text-center">#</th>
                <th className="py-3 px-4 w-56">{t('variationGroupName', 'Название группы')}</th>
                <th className="py-3 px-4">{t('variationValues', 'Доступные значения')}</th>
                <th className="py-3 px-4 text-center w-32">{t('colAction', 'Действия')}</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-8 text-center text-slate-400">{t('noResults', 'Нет данных')}</td>
                </tr>
              ) : paginated.map((v, i) => (
                <tr key={v.id} className={theme.tableRowHover}>
                  <td className="py-3 px-4 text-center text-slate-400 font-mono">{(currentPage - 1) * pageSize + i + 1}</td>
                  <td className="py-3 px-4 font-bold text-sm text-slate-800 dark:text-slate-100">{v.name}</td>
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-1.5">
                      {v.values && v.values.length > 0 ? (
                        v.values.map(val => (
                          <span key={val.id} className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-medium text-xs border border-emerald-200 dark:border-emerald-800">
                            {val.value}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400 italic">Значения не заданы</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">{renderActionButtons(v, false)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-3 border-t border-slate-200 dark:border-slate-800">
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(filtered.length / pageSize) || 1}
              totalItems={filtered.length}
              pageSize={pageSize}
              pageSizeOptions={[10, 25, 50, 100]}
              onPageChange={setCurrentPage}
              onPageSizeChange={(newSize) => { setPageSize(newSize); setCurrentPage(1); }}
              role={role}
              lang={lang}
            />
          </div>
        </div>
      );
    }

    // 11. ЗАКАЗЧИКИ
    if (activeCatalog === 'clients') {
      const filtered = (clients || []).filter(c => 
        !q || (c.name || '').toLowerCase().includes(q)
      );
      const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

      return (
        <div>
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className={tableHeaderClass}>
                <th className="py-3 px-4 w-14 text-center">#</th>
                <th className="py-3 px-4">{t('colName', 'Название организации / заказчика')}</th>
                <th className="py-3 px-4 text-center w-32">{t('colAction', 'Действия')}</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan="3" className="py-12 text-center text-slate-400">
                    {t('customersListEmpty', 'Список заказчиков пуст')}
                  </td>
                </tr>
              ) : paginated.map((c, i) => (
                <tr key={c.id} className={theme.tableRowHover}>
                  <td className="py-3 px-4 text-center text-slate-400 font-mono">{(currentPage - 1) * pageSize + i + 1}</td>
                  <td className="py-3 px-4 font-bold text-sm text-slate-800 dark:text-slate-100">{c.name}</td>
                  <td className="py-3 px-4 text-center">{renderActionButtons(c)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-3 border-t border-slate-200 dark:border-slate-800">
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(filtered.length / pageSize) || 1}
              totalItems={filtered.length}
              pageSize={pageSize}
              pageSizeOptions={[10, 25, 50, 100]}
              onPageChange={setCurrentPage}
              onPageSizeChange={(newSize) => { setPageSize(newSize); setCurrentPage(1); }}
              role={role}
              lang={lang}
            />
          </div>
        </div>
      );
    }

    return (
      <div className="p-12 flex items-center justify-center">
        <div className="text-center text-slate-400">
          <Database size={48} className="mx-auto mb-4 opacity-20" />
          <p className="text-lg font-medium">{t('underConstruction', 'Раздел находится в разработке')}</p>
        </div>
      </div>
    );
  };

  const currentSectionItems = sections[activeSection] || sections.umumy;
  const currentCatalogItem = currentSectionItems.find(s => s.id === activeCatalog) 
    || sections.umumy.find(s => s.id === activeCatalog) 
    || sections.haryt.find(s => s.id === activeCatalog);

  return (
    <div className={`flex flex-col min-h-[calc(100vh-100px)] -mx-6 -mt-6 ${isDarkMode ? 'bg-[#0b0f17]' : 'bg-slate-50/50'}`}>
      {/* Основная рабочая область */}
      <div className="flex-1 p-6 overflow-y-auto">
        {!activeCatalog ? (
          // Grid View (Сетка карточек)
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {activeSection === 'haryt' 
                    ? t('sectionProducts', 'Каталог товаров') 
                    : t('sectionDirectories', 'Справочники')}
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {activeSection === 'haryt' 
                    ? t('catProductCatalogSubtitle', 'Единый классификатор номенклатуры товаров, торговых марок, действующих веществ (МНН) и характеристик') 
                    : t('catalogsTitle', 'Общесистемные классификаторы, валюты, условия поставки и заказчики')}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {currentSectionItems.map((item) => (
                <div 
                  key={item.id} 
                  onClick={() => setSearchParams({ catalog: item.id })}
                  className={`p-5 rounded-2xl border flex items-center space-x-4 cursor-pointer transition-all duration-150 ${
                    isDarkMode 
                      ? 'bg-slate-800/90 border-slate-700/80 hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-950/30' 
                      : 'bg-white border-slate-200 hover:border-emerald-400 hover:shadow-md'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${isDarkMode ? 'bg-slate-700/70 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>
                    {item.icon}
                  </div>
                  <div className="overflow-hidden">
                    <h4 className={`font-bold text-sm truncate ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                      {item.title}
                    </h4>
                    <p className={`text-xs text-slate-400 dark:text-slate-500 line-clamp-2 mt-0.5 leading-snug`}>
                      {item.subtitle}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          // Table View (Режим таблицы)
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
                    className={`pl-9 pr-4 py-2 rounded-xl border text-xs w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'}`} 
                  />
                </div>
                
                {/* Кнопка добавления новой записи (скрыта для mnn, так как МНН регистрируются через препараты) */}
                {activeCatalog !== 'mnn' && (
                  <button 
                    onClick={() => { setEditingItem(null); setIsModalOpen(true); }} 
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-sm shadow-emerald-600/20"
                  >
                    <PlusCircle size={15} />
                    <span>{t('addBtn', 'Добавить')}</span>
                  </button>
                )}
                {activeCatalog === 'mnn' && (
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
                {renderTable()}
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

import React, { useState, useEffect } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { 
  PlusCircle, Search, Edit2, ToggleRight, ToggleLeft, Trash2, Database, Package, Settings, 
  Hash, Globe, Truck, DollarSign, Layers, ShieldAlert, 
  Users, FolderTree, ArrowLeft
} from 'lucide-react';
import API from '../services/api';
import { getRoleTheme } from '../utils/themeUtils';
import { getTranslation } from '../utils/translations';
import CatalogFormModal from '../components/CatalogFormModal';
import AdminLogs from './AdminLogs';
import { useAlert } from '../context/AlertContext';

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

  const [categories, setCategories] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [countries, setCountries] = useState([]);
  const [deliveryTerms, setDeliveryTerms] = useState([]);
  const [productsMNN, setProductsMNN] = useState([]);
  const [units, setUnits] = useState([]);
  const [manufacturers, setManufacturers] = useState([]);
  const [clients, setClients] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const getEndpoint = (cat) => {
    if (cat === 'productsMNN' || cat === 'generalProducts') return 'products';
    if (cat === 'categories' || cat === 'productCategories') return 'categories';
    if (cat === 'delivery') return 'delivery-terms';
    if (cat === 'brands') return 'manufacturers';
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
    } catch (e) {
      console.error(e);
      showAlert({
        title: t('errorTitle', 'Ошибка'),
        message: t('profileSaveError', 'Ошибка при сохранении'),
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
      } else if (catalogKey === 'units') {
        const res = await API.get('/catalogs/units');
        setUnits(Array.isArray(res.data) ? res.data : []);
      } else if (catalogKey === 'manufacturers' || catalogKey === 'brands') {
        const res = await API.get('/catalogs/manufacturers');
        setManufacturers(Array.isArray(res.data) ? res.data : []);
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

  const sections = {
    umumy: [
      { id: 'categories', title: t('catTenderCategories', 'Tender kategoriýalar'), subtitle: t('catTenderCategoriesSub', 'Tender kategoriýalar'), icon: <Layers size={24}/> },
      { id: 'currencies', title: t('catCurrencies', 'Walýutalar'), subtitle: t('catCurrenciesSub', 'Walýutalar'), icon: <DollarSign size={24}/> },
      { id: 'countries', title: t('catCountries', 'Döwletler'), subtitle: t('catCountriesSub', 'Döwletler'), icon: <Globe size={24}/> },
      { id: 'clients', title: t('catClients', 'Sargyt edijiler'), subtitle: t('catClientsSub', 'Sargyt edijiler'), icon: <Users size={24}/> },
      { id: 'delivery', title: t('catDelivery', 'Getiriliş şertleri'), subtitle: t('catDeliverySub', 'Getiriliş şertleri'), icon: <Truck size={24}/> }
    ],
    haryt: [
      { id: 'productsMNN', title: t('catProducts', 'Harytlar'), subtitle: t('catProductsSub', 'Harytlar'), icon: <Package size={24}/> },
      { id: 'units', title: t('catUnits', 'Ölçeg birlik topary'), subtitle: t('catUnitsSub', 'Ölçeg birlik topary'), icon: <Hash size={24}/> },
      { id: 'composition', title: t('catComposition', 'Haryt düzümi'), subtitle: t('catCompositionSub', 'Haryt düzümi'), icon: <FolderTree size={24}/> },
      { id: 'brands', title: t('catBrands', 'Brendler'), subtitle: t('catBrandsSub', 'Brendler'), icon: <Database size={24}/> },
      { id: 'manufacturers', title: t('catManufacturers', 'Öndürijiler'), subtitle: t('catManufacturersSub', 'Öndürijiler'), icon: <Database size={24}/> },
      { id: 'generalProducts', title: t('catGeneralProducts', 'Umumy haryt'), subtitle: t('catGeneralProductsSub', 'Halkara patentsiz atlary'), icon: <Database size={24}/> },
      { id: 'productCategories', title: t('catProductCategories', 'Haryt kategoriýalar'), subtitle: t('catProductCategoriesSub', 'Haryt kategoriýalar'), icon: <Layers size={24}/> },
      { id: 'variations', title: t('catVariations', 'Wariasiýa topary'), subtitle: t('catVariationsSub', 'Wariasiýa görnüşleri'), icon: <Database size={24}/> }
    ],
    administrasiya: [
      { id: 'logs', title: t('catLogs', 'Loglar'), subtitle: t('catLogsSub', 'Loglar'), icon: <ShieldAlert size={24}/> },
      { id: 'settings', title: t('catSettings', 'Ulgam sazlamalary'), subtitle: t('catSettingsSub', 'Ulgam sazlamalary'), icon: <Settings size={24}/> },
      { id: 'roles', title: t('catRoles', 'Rollar'), subtitle: t('catRolesSub', 'Rollar'), icon: <Users size={24}/> },
      { id: 'backup', title: t('catBackup', 'Backup'), subtitle: t('catBackupSub', 'Backup'), icon: <Database size={24}/> },
      { id: 'users', title: t('catUsers', 'Ulanyjylar'), subtitle: t('catUsersSub', 'Ulanyjylar'), icon: <Users size={24}/> }
    ]
  };

  const renderTable = () => {
    if (loading) {
      return <div className="p-8 text-center text-slate-400">{t('loading', 'Ýüklenýär...')}</div>;
    }

    const tableHeaderClass = isDarkMode ? "bg-slate-800 text-slate-200 font-medium" : "bg-[#eef6ff] text-slate-800 font-medium";
    const q = searchQuery.toLowerCase().trim();

    if (activeCatalog === 'categories' || activeCatalog === 'productCategories') {
      const filtered = (categories || []).filter(c => 
        !q || (c.name || '').toLowerCase().includes(q) || (c.code || '').toLowerCase().includes(q)
      );
      return (
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className={tableHeaderClass}>
              <th className="py-3 px-4 w-16 text-center">#</th>
              <th className="py-3 px-4">{t('colName', 'Ady')}</th>
              <th className="py-3 px-4 text-center">{t('colCode', 'Kody')}</th>
              <th className="py-3 px-4 text-center w-32">{t('colAction', 'Amal')}</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="4" className="py-8 text-center text-slate-400">
                  {t('noResults', 'Нет данных')}
                </td>
              </tr>
            ) : filtered.map((c, i) => (
              <tr key={c.id} className={theme.tableRowHover}>
                <td className="py-3 px-4 text-center text-slate-400">{i + 1}</td>
                <td className="py-3 px-4 font-bold">{c.name}</td>
                <td className="py-3 px-4 text-center font-mono">{c.code}</td>
                <td className="py-3 px-4 text-center">
                  <div className="flex items-center justify-center gap-3 text-slate-400">
                    {c.isActive ? <ToggleRight size={20} className="text-emerald-600 cursor-pointer" onClick={() => handleToggleActive(c)} /> : <ToggleLeft size={20} className="text-slate-400 cursor-pointer" onClick={() => handleToggleActive(c)} />}
                    <button onClick={() => { setEditingItem(c); setIsModalOpen(true); }} className="p-1.5 rounded-md text-slate-600 dark:text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors cursor-pointer"><Edit2 size={16} /></button>
                    <button onClick={() => handleDelete(c.id)} className="p-1.5 rounded-md text-slate-600 dark:text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors cursor-pointer"><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    if (activeCatalog === 'currencies') {
      const filtered = (currencies || []).filter(c => 
        !q || (c.name || '').toLowerCase().includes(q) || (c.code || '').toLowerCase().includes(q)
      );
      return (
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className={tableHeaderClass}>
              <th className="py-3 px-4 w-16 text-center">#</th>
              <th className="py-3 px-4">{t('colName', 'Ady')}</th>
              <th className="py-3 px-4 text-center">{t('colCode', 'Kody')}</th>
              <th className="py-3 px-4 text-center">{t('colSymbol', 'Nyşan')}</th>
              <th className="py-3 px-4 text-center">{t('colFlag', 'Baýdak')}</th>
              <th className="py-3 px-4 text-center w-32">{t('colAction', 'Amal')}</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-8 text-center text-slate-400">
                  {t('noResults', 'Нет данных')}
                </td>
              </tr>
            ) : filtered.map((c, i) => (
              <tr key={c.id} className={theme.tableRowHover}>
                <td className="py-3 px-4 text-center text-slate-400">{i + 1}</td>
                <td className="py-3 px-4 font-bold">{c.name}</td>
                <td className="py-3 px-4 text-center font-mono">{c.code}</td>
                <td className="py-3 px-4 text-center font-bold text-emerald-600">{c.symbol}</td>
                <td className="py-3 px-4 text-center text-lg">{c.flag || '-'}</td>
                <td className="py-3 px-4 text-center">
                  <div className="flex items-center justify-center gap-3 text-slate-400">
                    {c.isActive ? <ToggleRight size={20} className="text-emerald-600 cursor-pointer" onClick={() => handleToggleActive(c)} /> : <ToggleLeft size={20} className="text-slate-400 cursor-pointer" onClick={() => handleToggleActive(c)} />}
                    <button onClick={() => { setEditingItem(c); setIsModalOpen(true); }} className="p-1.5 rounded-md text-slate-600 dark:text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors cursor-pointer"><Edit2 size={16} /></button>
                    <button onClick={() => handleDelete(c.id)} className="p-1.5 rounded-md text-slate-600 dark:text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors cursor-pointer"><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    if (activeCatalog === 'countries') {
      const filtered = (countries || []).filter(c => 
        !q || (c.name || '').toLowerCase().includes(q) || (c.alpha2 || '').toLowerCase().includes(q) || (c.alpha3 || '').toLowerCase().includes(q)
      );
      return (
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className={tableHeaderClass}>
              <th className="py-3 px-4 w-16 text-center">#</th>
              <th className="py-3 px-4">{t('colName', 'Ady')}</th>
              <th className="py-3 px-4 text-center">Alpha 2</th>
              <th className="py-3 px-4 text-center">Alpha 3</th>
              <th className="py-3 px-4 text-center w-32">{t('colAction', 'Amal')}</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="5" className="py-8 text-center text-slate-400">
                  {t('noResults', 'Нет данных')}
                </td>
              </tr>
            ) : filtered.map((c, i) => (
              <tr key={c.id} className={theme.tableRowHover}>
                <td className="py-3 px-4 text-center text-slate-400">{i + 1}</td>
                <td className="py-3 px-4 font-bold">{c.name}</td>
                <td className="py-3 px-4 text-center font-mono">{c.alpha2}</td>
                <td className="py-3 px-4 text-center font-mono">{c.alpha3}</td>
                <td className="py-3 px-4 text-center">
                  <div className="flex items-center justify-center gap-3 text-slate-400">
                    {c.isActive ? <ToggleRight size={20} className="text-emerald-600 cursor-pointer" onClick={() => handleToggleActive(c)} /> : <ToggleLeft size={20} className="text-slate-400 cursor-pointer" onClick={() => handleToggleActive(c)} />}
                    <button onClick={() => { setEditingItem(c); setIsModalOpen(true); }} className="p-1.5 rounded-md text-slate-600 dark:text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors cursor-pointer"><Edit2 size={16} /></button>
                    <button onClick={() => handleDelete(c.id)} className="p-1.5 rounded-md text-slate-600 dark:text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors cursor-pointer"><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    if (activeCatalog === 'delivery') {
      const filtered = (deliveryTerms || []).filter(c => 
        !q || (c.name || '').toLowerCase().includes(q) || (c.shortName || '').toLowerCase().includes(q)
      );
      return (
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className={tableHeaderClass}>
              <th className="py-3 px-4 w-16 text-center">#</th>
              <th className="py-3 px-4">{t('colName', 'Ady')}</th>
              <th className="py-3 px-4 text-center">{t('colShortName', 'Gysga ady')}</th>
              <th className="py-3 px-4 text-center w-32">{t('colAction', 'Amal')}</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="4" className="py-8 text-center text-slate-400">
                  {t('noResults', 'Нет данных')}
                </td>
              </tr>
            ) : filtered.map((c, i) => (
              <tr key={c.id} className={theme.tableRowHover}>
                <td className="py-3 px-4 text-center text-slate-400">{i + 1}</td>
                <td className="py-3 px-4 font-bold">{c.name}</td>
                <td className="py-3 px-4 text-center font-bold text-emerald-600">{c.shortName}</td>
                <td className="py-3 px-4 text-center">
                  <div className="flex items-center justify-center gap-3 text-slate-400">
                    {c.isActive ? <ToggleRight size={20} className="text-emerald-600 cursor-pointer" onClick={() => handleToggleActive(c)} /> : <ToggleLeft size={20} className="text-slate-400 cursor-pointer" onClick={() => handleToggleActive(c)} />}
                    <button onClick={() => { setEditingItem(c); setIsModalOpen(true); }} className="p-1.5 rounded-md text-slate-600 dark:text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors cursor-pointer"><Edit2 size={16} /></button>
                    <button onClick={() => handleDelete(c.id)} className="p-1.5 rounded-md text-slate-600 dark:text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors cursor-pointer"><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    if (activeCatalog === 'productsMNN' || activeCatalog === 'generalProducts') {
      const filtered = (productsMNN || []).filter(p => 
        !q || (p.name || '').toLowerCase().includes(q) || (p.tradeName || '').toLowerCase().includes(q) || (p.code || '').toLowerCase().includes(q)
      );
      return (
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className={tableHeaderClass}>
              <th className="py-3 px-4 w-16 text-center">#</th>
              <th className="py-3 px-4">{t('innName', 'Международное непатентованное наименование (МНН)')}</th>
              <th className="py-3 px-4">{t('tradeName', 'Торговое (патентованное) название')}</th>
              <th className="py-3 px-4 text-center">{t('colCode', 'Kody')}</th>
              <th className="py-3 px-4">{t('colDesc', 'Mazmuny')}</th>
              <th className="py-3 px-4 text-center w-32">{t('colAction', 'Amal')}</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-8 text-center text-slate-400">
                  {t('noResults', 'Нет данных')}
                </td>
              </tr>
            ) : filtered.map((p, i) => (
              <tr key={p.id} className={theme.tableRowHover}>
                <td className="py-3 px-4 text-center text-slate-400">{i + 1}</td>
                <td className="py-3 px-4 font-bold">{p.name}</td>
                <td className="py-3 px-4">{p.tradeName || '-'}</td>
                <td className="py-3 px-4 text-center font-mono">{p.code || '-'}</td>
                <td className="py-3 px-4 text-slate-500">{p.description || '-'}</td>
                <td className="py-3 px-4 text-center">
                  <div className="flex items-center justify-center gap-3 text-slate-400">
                    {p.isActive ? <ToggleRight size={20} className="text-emerald-600 cursor-pointer" onClick={() => handleToggleActive(p)} /> : <ToggleLeft size={20} className="text-slate-400 cursor-pointer" onClick={() => handleToggleActive(p)} />}
                    <button onClick={() => { setEditingItem(p); setIsModalOpen(true); }} className="p-1.5 rounded-md text-slate-600 dark:text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors cursor-pointer"><Edit2 size={16} /></button>
                    <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-md text-slate-600 dark:text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors cursor-pointer"><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    if (activeCatalog === 'units') {
      const filtered = (units || []).filter(u => 
        !q || (u.name || '').toLowerCase().includes(q) || (u.shortName || '').toLowerCase().includes(q)
      );
      return (
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className={tableHeaderClass}>
              <th className="py-3 px-4 w-16 text-center">#</th>
              <th className="py-3 px-4">{t('colName', 'Ady')}</th>
              <th className="py-3 px-4 text-center">{t('colShortName', 'Gysga ady')}</th>
              <th className="py-3 px-4 text-center w-32">{t('colAction', 'Amal')}</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="4" className="py-8 text-center text-slate-400">
                  {t('noResults', 'Нет данных')}
                </td>
              </tr>
            ) : filtered.map((u, i) => (
              <tr key={u.id} className={theme.tableRowHover}>
                <td className="py-3 px-4 text-center text-slate-400">{i + 1}</td>
                <td className="py-3 px-4 font-bold">{u.name}</td>
                <td className="py-3 px-4 text-center font-bold text-emerald-600">{u.shortName}</td>
                <td className="py-3 px-4 text-center">
                  <div className="flex items-center justify-center gap-3 text-slate-400">
                    {u.isActive ? <ToggleRight size={20} className="text-emerald-600 cursor-pointer" onClick={() => handleToggleActive(u)} /> : <ToggleLeft size={20} className="text-slate-400 cursor-pointer" onClick={() => handleToggleActive(u)} />}
                    <button onClick={() => { setEditingItem(u); setIsModalOpen(true); }} className="p-1.5 rounded-md text-slate-600 dark:text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors cursor-pointer"><Edit2 size={16} /></button>
                    <button onClick={() => handleDelete(u.id)} className="p-1.5 rounded-md text-slate-600 dark:text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors cursor-pointer"><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    if (activeCatalog === 'manufacturers' || activeCatalog === 'brands') {
      const filtered = (manufacturers || []).filter(m => 
        !q || (m.name || '').toLowerCase().includes(q) || (m.code || '').toLowerCase().includes(q)
      );
      return (
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className={tableHeaderClass}>
              <th className="py-3 px-4 w-16 text-center">#</th>
              <th className="py-3 px-4">{t('colName', 'Ady')}</th>
              <th className="py-3 px-4 text-center">{t('colCode', 'Kody')}</th>
              <th className="py-3 px-4 text-center w-32">{t('colAction', 'Amal')}</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="4" className="py-8 text-center text-slate-400">
                  {t('noResults', 'Нет данных')}
                </td>
              </tr>
            ) : filtered.map((m, i) => (
              <tr key={m.id} className={theme.tableRowHover}>
                <td className="py-3 px-4 text-center text-slate-400">{i + 1}</td>
                <td className="py-3 px-4 font-bold">{m.name}</td>
                <td className="py-3 px-4 text-center font-mono">{m.code}</td>
                <td className="py-3 px-4 text-center">
                  <div className="flex items-center justify-center gap-3 text-slate-400">
                    {m.isActive ? <ToggleRight size={20} className="text-emerald-600 cursor-pointer" onClick={() => handleToggleActive(m)} /> : <ToggleLeft size={20} className="text-slate-400 cursor-pointer" onClick={() => handleToggleActive(m)} />}
                    <button onClick={() => { setEditingItem(m); setIsModalOpen(true); }} className="p-1.5 rounded-md text-slate-600 dark:text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors cursor-pointer"><Edit2 size={16} /></button>
                    <button onClick={() => handleDelete(m.id)} className="p-1.5 rounded-md text-slate-600 dark:text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors cursor-pointer"><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    if (activeCatalog === 'clients') {
      const filtered = (clients || []).filter(c => 
        !q || (c.name || '').toLowerCase().includes(q)
      );
      return (
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className={tableHeaderClass}>
              <th className="py-3 px-4 w-16 text-center">#</th>
              <th className="py-3 px-4">{t('colName', 'Ady')}</th>
              <th className="py-3 px-4 text-center w-32">{t('colAction', 'Amal')}</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="3" className="py-12 text-center text-slate-400">
                  {t('customersListEmpty', 'Список заказчиков пуст')}
                </td>
              </tr>
            ) : filtered.map((c, i) => (
              <tr key={c.id} className={theme.tableRowHover}>
                <td className="py-3 px-4 text-center text-slate-400">{i + 1}</td>
                <td className="py-3 px-4 font-bold">{c.name}</td>
                <td className="py-3 px-4 text-center">
                  <div className="flex items-center justify-center gap-3 text-slate-400">
                    {c.isActive ? <ToggleRight size={20} className="text-emerald-600 cursor-pointer" onClick={() => handleToggleActive(c)} /> : <ToggleLeft size={20} className="text-slate-400 cursor-pointer" onClick={() => handleToggleActive(c)} />}
                    <button onClick={() => { setEditingItem(c); setIsModalOpen(true); }} className="p-1.5 rounded-md text-slate-600 dark:text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors cursor-pointer"><Edit2 size={16} /></button>
                    <button onClick={() => handleDelete(c.id)} className="p-1.5 rounded-md text-slate-600 dark:text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors cursor-pointer"><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    // Default table placeholder for non-implemented catalogs
    return (
      <div className="p-12 flex items-center justify-center">
        <div className="text-center text-slate-400">
          <Database size={48} className="mx-auto mb-4 opacity-20" />
          <p className="text-lg font-medium">{t('underConstruction', 'Gurluşygy dowam edýär (Maglumat ýok)')}</p>
          <p className="text-sm mt-1">{t('sectionUnderDevelopment', 'Этот раздел находится в разработке.')}</p>
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
                <h2 className="text-xl font-bold">
                  {activeSection === 'haryt' 
                    ? t('sectionProducts', 'Haryt katalogy') 
                    : t('sectionDirectories', 'Gollanmalar')}
                </h2>
                <p className={`text-xs ${theme.subText} mt-0.5`}>
                  {activeSection === 'haryt' 
                    ? t('catGeneralProductsSub', 'Halkara patentsiz atlary we haryt ugurlary') 
                    : t('catalogsTitle', 'Ulgam gollanmalary we toparlar')}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {currentSectionItems.map((item) => (
                <div 
                  key={item.id} 
                  onClick={() => setSearchParams({ catalog: item.id })}
                  className={`p-4 rounded-xl border flex items-center space-x-4 cursor-pointer transition-all ${
                    isDarkMode 
                      ? 'bg-slate-800 border-slate-700 hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-900/20' 
                      : 'bg-white border-slate-200 hover:border-emerald-400 hover:shadow-md'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${isDarkMode ? 'bg-slate-700 text-emerald-400' : 'bg-slate-50 text-emerald-600'}`}>
                    {item.icon}
                  </div>
                  <div className="overflow-hidden">
                    <h4 className={`font-bold text-sm truncate ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                      {item.title}
                    </h4>
                    <p className={`text-xs truncate ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      {item.subtitle}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          // Table View (Режим таблицы)
          <div className="animate-in slide-in-from-right-4 duration-200">
            <div className="mb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
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
                <h2 className={`text-xl font-bold ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                  {currentCatalogItem?.title || activeCatalog}
                </h2>
              </div>
              
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('searchPlaceholder', 'Gözleg...')} 
                    className={`pl-9 pr-4 py-2 rounded-md border text-sm w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'}`} 
                  />
                </div>
                
                {activeCatalog !== 'composition' && activeCatalog !== 'variations' && (
                  <button 
                    onClick={() => { setEditingItem(null); setIsModalOpen(true); }} 
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-sm font-medium transition-colors cursor-pointer shadow-xs"
                  >
                    <PlusCircle size={16} />
                    <span>{t('addBtn', 'Goş')}</span>
                  </button>
                )}
              </div>
            </div>

            <div className={`rounded-xl border shadow-xs overflow-hidden ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
              <div className="overflow-x-auto">
                {renderTable()}
              </div>
            </div>
          </div>
        )}
      </div>
      <CatalogFormModal
        countries={countries}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveModal}
        catalogId={activeCatalog}
        editingItem={editingItem}
        theme={theme}
        t={t}
        isDarkMode={isDarkMode}
      />
    </div>
  );
}

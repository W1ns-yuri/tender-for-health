import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Plus, PlusCircle, Search, Filter, Edit, ToggleRight, ToggleLeft, Trash2, Database, Package, Settings, ChevronLeft, ChevronRight, 
  Hash, Flag, Globe, Truck, DollarSign, Layers, ShieldAlert, 
  Users, FolderTree, ArrowLeft
} from 'lucide-react';
import API from '../services/api';
import { getRoleTheme } from '../utils/themeUtils';
import { getTranslation } from '../utils/translations';
import CatalogFormModal from '../components/CatalogFormModal';

export default function AdminCatalogs({ section = 'umumy', role, isDarkMode, lang = 'RU' }) {
  const theme = getRoleTheme(role, isDarkMode);
  const t = (key, fallback) => getTranslation(lang, key, fallback);
  
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCatalog = searchParams.get('catalog');

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

  const handleSaveModal = async (formData, itemId) => {
    try {
      const endpoint = activeCatalog === 'productsMNN' ? 'products' : activeCatalog === 'delivery' ? 'delivery-terms' : activeCatalog;
      if (itemId) {
        await API.put(`/catalogs/${endpoint}/${itemId}`, formData);
      } else {
        await API.post(`/catalogs/${endpoint}`, formData);
      }
      setIsModalOpen(false);
      fetchCatalogData(activeCatalog);
    } catch (e) {
      console.error(e);
      alert('Ошибка при сохранении');
    }
  };

  const handleToggleActive = async (item) => {
    try {
      const endpoint = activeCatalog === 'productsMNN' ? 'products' : activeCatalog === 'delivery' ? 'delivery-terms' : activeCatalog;
      await API.put(`/catalogs/${endpoint}/${item.id}`, { isActive: !item.isActive });
      fetchCatalogData(activeCatalog);
    } catch (e) {
      console.error(e);
      alert('Ошибка при изменении статуса');
    }
  };

  const handleDelete = async (itemId) => {
    if (window.confirm('Вы уверены, что хотите удалить эту запись?')) {
      try {
        const endpoint = activeCatalog === 'productsMNN' ? 'products' : activeCatalog === 'delivery' ? 'delivery-terms' : activeCatalog;
        await API.delete(`/catalogs/${endpoint}/${itemId}`);
        fetchCatalogData(activeCatalog);
      } catch (e) {
        console.error(e);
        alert('Ошибка при удалении');
      }
    }
  };

  useEffect(() => {
    if (activeCatalog) {
      fetchCatalogData(activeCatalog);
    }
  }, [activeCatalog]);

  const fetchCatalogData = async (catalogKey) => {
    setLoading(true);
    try {
      if (catalogKey === 'categories') {
        const res = await API.get('/catalogs/categories');
        setCategories(res.data);
      } else if (catalogKey === 'currencies') {
        const res = await API.get('/catalogs/currencies');
        setCurrencies(res.data);
      } else if (catalogKey === 'countries') {
        const res = await API.get('/catalogs/countries');
        setCountries(res.data);
      } else if (catalogKey === 'delivery') {
        const res = await API.get('/catalogs/delivery-terms');
        setDeliveryTerms(res.data);
      } else if (catalogKey === 'productsMNN') {
        const res = await API.get('/catalogs/products');
        setProductsMNN(res.data);
      } else if (catalogKey === 'units') {
        const res = await API.get('/catalogs/units');
        setUnits(res.data);
      } else if (catalogKey === 'manufacturers') {
        const res = await API.get('/catalogs/manufacturers');
        setManufacturers(res.data);
      } else if (catalogKey === 'clients') {
        setClients([]);
      }
    } catch (e) {
      console.error(e);
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

    if (activeCatalog === 'categories') {
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
            {categories.map((c, i) => (
              <tr key={c.id} className={theme.tableRowHover}>
                <td className="py-3 px-4 text-center text-slate-400">{i + 1}</td>
                <td className="py-3 px-4 font-bold">{c.name}</td>
                <td className="py-3 px-4 text-center font-mono">{c.code}</td>
                <td className="py-3 px-4 text-center">
                  <div className="flex items-center justify-center gap-3 text-slate-400">
                    {c.isActive ? <ToggleRight size={20} className="text-teal-600 cursor-pointer" onClick={() => handleToggleActive(c)} /> : <ToggleLeft size={20} className="text-slate-400 cursor-pointer" onClick={() => handleToggleActive(c)} />}
                    <Edit size={16} className="cursor-pointer hover:text-teal-600" onClick={() => { setEditingItem(c); setIsModalOpen(true); }} />
                    <Trash2 size={16} className="cursor-pointer hover:text-rose-500" onClick={() => handleDelete(c.id)} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    if (activeCatalog === 'currencies') {
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
            {currencies.map((c, i) => (
              <tr key={c.id} className={theme.tableRowHover}>
                <td className="py-3 px-4 text-center text-slate-400">{i + 1}</td>
                <td className="py-3 px-4 font-bold">{c.name}</td>
                <td className="py-3 px-4 text-center font-mono">{c.code}</td>
                <td className="py-3 px-4 text-center font-bold text-teal-600">{c.symbol}</td>
                <td className="py-3 px-4 text-center text-lg">{c.flag || '-'}</td>
                <td className="py-3 px-4 text-center">
                  <div className="flex items-center justify-center gap-3 text-slate-400">
                    {c.isActive ? <ToggleRight size={20} className="text-teal-600 cursor-pointer" onClick={() => handleToggleActive(c)} /> : <ToggleLeft size={20} className="text-slate-400 cursor-pointer" onClick={() => handleToggleActive(c)} />}
                    <Edit size={16} className="cursor-pointer hover:text-teal-600" onClick={() => { setEditingItem(c); setIsModalOpen(true); }} />
                    <Trash2 size={16} className="cursor-pointer hover:text-rose-500" onClick={() => handleDelete(c.id)} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    if (activeCatalog === 'countries') {
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
            {countries.map((c, i) => (
              <tr key={c.id} className={theme.tableRowHover}>
                <td className="py-3 px-4 text-center text-slate-400">{i + 1}</td>
                <td className="py-3 px-4 font-bold">{c.name}</td>
                <td className="py-3 px-4 text-center font-mono">{c.alpha2}</td>
                <td className="py-3 px-4 text-center font-mono">{c.alpha3}</td>
                <td className="py-3 px-4 text-center">
                  <div className="flex items-center justify-center gap-3 text-slate-400">
                    {c.isActive ? <ToggleRight size={20} className="text-teal-600 cursor-pointer" onClick={() => handleToggleActive(c)} /> : <ToggleLeft size={20} className="text-slate-400 cursor-pointer" onClick={() => handleToggleActive(c)} />}
                    <Edit size={16} className="cursor-pointer hover:text-teal-600" onClick={() => { setEditingItem(c); setIsModalOpen(true); }} />
                    <Trash2 size={16} className="cursor-pointer hover:text-rose-500" onClick={() => handleDelete(c.id)} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    if (activeCatalog === 'delivery') {
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
            {deliveryTerms.map((c, i) => (
              <tr key={c.id} className={theme.tableRowHover}>
                <td className="py-3 px-4 text-center text-slate-400">{i + 1}</td>
                <td className="py-3 px-4 font-bold">{c.name}</td>
                <td className="py-3 px-4 text-center font-bold text-teal-600">{c.shortName}</td>
                <td className="py-3 px-4 text-center">
                  <div className="flex items-center justify-center gap-3 text-slate-400">
                    {c.isActive ? <ToggleRight size={20} className="text-teal-600 cursor-pointer" onClick={() => handleToggleActive(c)} /> : <ToggleLeft size={20} className="text-slate-400 cursor-pointer" onClick={() => handleToggleActive(c)} />}
                    <Edit size={16} className="cursor-pointer hover:text-teal-600" onClick={() => { setEditingItem(c); setIsModalOpen(true); }} />
                    <Trash2 size={16} className="cursor-pointer hover:text-rose-500" onClick={() => handleDelete(c.id)} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    if (activeCatalog === 'productsMNN') {
      return (
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className={tableHeaderClass}>
              <th className="py-3 px-4 w-16 text-center">#</th>
              <th className="py-3 px-4">{t('colName', 'Ady')}</th>
              <th className="py-3 px-4 text-center">{t('colCode', 'Kody')}</th>
              <th className="py-3 px-4">{t('colDesc', 'Mazmuny')}</th>
              <th className="py-3 px-4 text-center w-32">{t('colAction', 'Amal')}</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
            {productsMNN.map((p, i) => (
              <tr key={p.id} className={theme.tableRowHover}>
                <td className="py-3 px-4 text-center text-slate-400">{i + 1}</td>
                <td className="py-3 px-4 font-bold">{p.name}</td>
                <td className="py-3 px-4 text-center font-mono">{p.code}</td>
                <td className="py-3 px-4 text-slate-500">{p.description}</td>
                <td className="py-3 px-4 text-center">
                  <div className="flex items-center justify-center gap-3 text-slate-400">
                    {p.isActive ? <ToggleRight size={20} className="text-teal-600 cursor-pointer" onClick={() => handleToggleActive(p)} /> : <ToggleLeft size={20} className="text-slate-400 cursor-pointer" onClick={() => handleToggleActive(p)} />}
                    <Edit size={16} className="cursor-pointer hover:text-teal-600" onClick={() => { setEditingItem(p); setIsModalOpen(true); }} />
                    <Trash2 size={16} className="cursor-pointer hover:text-rose-500" onClick={() => handleDelete(p.id)} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    if (activeCatalog === 'units') {
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
            {units.map((u, i) => (
              <tr key={u.id} className={theme.tableRowHover}>
                <td className="py-3 px-4 text-center text-slate-400">{i + 1}</td>
                <td className="py-3 px-4 font-bold">{u.name}</td>
                <td className="py-3 px-4 text-center font-bold text-teal-600">{u.shortName}</td>
                <td className="py-3 px-4 text-center">
                  <div className="flex items-center justify-center gap-3 text-slate-400">
                    {u.isActive ? <ToggleRight size={20} className="text-teal-600 cursor-pointer" onClick={() => handleToggleActive(u)} /> : <ToggleLeft size={20} className="text-slate-400 cursor-pointer" onClick={() => handleToggleActive(u)} />}
                    <Edit size={16} className="cursor-pointer hover:text-teal-600" onClick={() => { setEditingItem(u); setIsModalOpen(true); }} />
                    <Trash2 size={16} className="cursor-pointer hover:text-rose-500" onClick={() => handleDelete(u.id)} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    if (activeCatalog === 'manufacturers') {
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
            {manufacturers.map((m, i) => (
              <tr key={m.id} className={theme.tableRowHover}>
                <td className="py-3 px-4 text-center text-slate-400">{i + 1}</td>
                <td className="py-3 px-4 font-bold">{m.name}</td>
                <td className="py-3 px-4 text-center font-mono">{m.code}</td>
                <td className="py-3 px-4 text-center">
                  <div className="flex items-center justify-center gap-3 text-slate-400">
                    {m.isActive ? <ToggleRight size={20} className="text-teal-600 cursor-pointer" onClick={() => handleToggleActive(m)} /> : <ToggleLeft size={20} className="text-slate-400 cursor-pointer" onClick={() => handleToggleActive(m)} />}
                    <Edit size={16} className="cursor-pointer hover:text-teal-600" onClick={() => { setEditingItem(m); setIsModalOpen(true); }} />
                    <Trash2 size={16} className="cursor-pointer hover:text-rose-500" onClick={() => handleDelete(m.id)} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    if (activeCatalog === 'clients') {
      return (
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className={tableHeaderClass}>
              <th className="py-3 px-4 w-16 text-center">#</th>
              <th className="py-3 px-4">{t('colName', 'Ady')}</th>
              <th className="py-3 px-4 text-center">ИИН / Email</th>
              <th className="py-3 px-4 text-center w-32">{t('colAction', 'Amal')}</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
            {clients.length === 0 ? (
              <tr>
                <td colSpan="4" className="py-12 text-center text-slate-400">
                  {lang === 'RU' ? 'Список заказчиков пуст (в разработке)' : 'Sargyt edijiler sanawy boş (gurluşykda)'}
                </td>
              </tr>
            ) : clients.map((c, i) => (
              <tr key={c.id} className={theme.tableRowHover}>
                <td className="py-3 px-4 text-center text-slate-400">{i + 1}</td>
                <td className="py-3 px-4 font-bold">{c.name}</td>
                <td className="py-3 px-4 text-center font-mono">{c.email}</td>
                <td className="py-3 px-4 text-center">
                  <div className="flex items-center justify-center gap-3 text-slate-400">
                    <Edit size={16} className="cursor-pointer hover:text-teal-600" />
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
          <p className="text-sm mt-1">{lang === 'RU' ? 'Этот раздел находится в разработке.' : 'Bu bölüm gurluşykda.'}</p>
        </div>
      </div>
    );
  };

  return (
    <div className={`flex flex-col min-h-[calc(100vh-100px)] -mx-6 -mt-6 ${isDarkMode ? 'bg-[#0b0f17]' : 'bg-slate-50/50'}`}>
      {/* Основная рабочая область */}
      <div className="flex-1 p-6 overflow-y-auto">
        {!activeCatalog ? (
          // Grid View (Сетка карточек)
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in duration-200">
            {sections[section] && sections[section].map((item) => (
              <div 
                key={item.id} 
                onClick={() => setSearchParams({ catalog: item.id })}
                className={`p-4 rounded-xl border flex items-center space-x-4 cursor-pointer transition-all ${
                  isDarkMode 
                    ? 'bg-slate-800 border-slate-700 hover:border-teal-500 hover:shadow-lg hover:shadow-teal-900/20' 
                    : 'bg-white border-slate-200 hover:border-teal-400 hover:shadow-md'
                }`}
              >
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${isDarkMode ? 'bg-slate-700 text-teal-400' : 'bg-slate-50 text-teal-600'}`}>
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
        ) : (
          // Table View (Режим таблицы)
          <div className="animate-in slide-in-from-right-4 duration-200">
            <div className="mb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-teal-400' : 'text-teal-600'}`}>
                {sections[section]?.find(s => s.id === activeCatalog)?.title || activeCatalog}
              </h2>
              
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder={t('searchPlaceholder', 'Gözleg...')} 
                    className={`pl-9 pr-4 py-2 rounded-md border text-sm w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-teal-500/50 ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'}`} 
                  />
                </div>
                
                <button className="flex items-center gap-2 px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-md text-sm font-medium transition-colors">
                  <Filter size={16} />
                  <span>{t('filter', 'Filter')}</span>
                </button>
                
                <button onClick={() => { setEditingItem(null); setIsModalOpen(true); }} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors">
                  <PlusCircle size={16} />
                  <span>{t('addBtn', 'Goş')}</span>
                </button>
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

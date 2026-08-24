import React, { useState, useEffect } from 'react';
import { 
  Plus, Database, Package, Settings, ChevronLeft, ChevronRight, 
  Hash, Flag, Globe, Truck, DollarSign, Layers, ShieldAlert, 
  Users, FolderTree, ArrowLeft
} from 'lucide-react';
import API from '../services/api';
import { getRoleTheme } from '../utils/themeUtils';
import { getTranslation } from '../utils/translations';

export default function AdminCatalogs({ section = 'umumy', role, isDarkMode, lang = 'RU' }) {
  const theme = getRoleTheme(role, isDarkMode);
  const t = (key, fallback) => getTranslation(lang, key, fallback);
  
  const [activeCatalog, setActiveCatalog] = useState(null); // null means grid view, string means table view

  const [categories, setCategories] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [countries, setCountries] = useState([]);
  const [deliveryTerms, setDeliveryTerms] = useState([]);
  const [productsMNN, setProductsMNN] = useState([]);
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setActiveCatalog(null);
  }, [section]);

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

    const tableHeaderClass = "bg-teal-600 text-white font-medium";

    if (activeCatalog === 'categories') {
      return (
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className={tableHeaderClass}>
              <th className="py-3 px-4 w-16 text-center">#</th>
              <th className="py-3 px-4">{t('colName', 'Ady')}</th>
              <th className="py-3 px-4 text-center">{t('colCode', 'Kody')}</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
            {categories.map((c, i) => (
              <tr key={c.id} className={theme.tableRowHover}>
                <td className="py-3 px-4 text-center text-slate-400">{i + 1}</td>
                <td className="py-3 px-4 font-bold">{c.name}</td>
                <td className="py-3 px-4 text-center font-mono">{c.code}</td>
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
            </tr>
          </thead>
          <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
            {countries.map((c, i) => (
              <tr key={c.id} className={theme.tableRowHover}>
                <td className="py-3 px-4 text-center text-slate-400">{i + 1}</td>
                <td className="py-3 px-4 font-bold">{c.name}</td>
                <td className="py-3 px-4 text-center font-mono">{c.alpha2}</td>
                <td className="py-3 px-4 text-center font-mono">{c.alpha3}</td>
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
            </tr>
          </thead>
          <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
            {deliveryTerms.map((c, i) => (
              <tr key={c.id} className={theme.tableRowHover}>
                <td className="py-3 px-4 text-center text-slate-400">{i + 1}</td>
                <td className="py-3 px-4 font-bold">{c.name}</td>
                <td className="py-3 px-4 text-center font-bold text-teal-600">{c.shortName}</td>
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
            </tr>
          </thead>
          <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
            {productsMNN.map((p, i) => (
              <tr key={p.id} className={theme.tableRowHover}>
                <td className="py-3 px-4 text-center text-slate-400">{i + 1}</td>
                <td className="py-3 px-4 font-bold">{p.name}</td>
                <td className="py-3 px-4 text-center font-mono">{p.code}</td>
                <td className="py-3 px-4 text-slate-500">{p.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    // Default table placeholder for non-implemented catalogs
    return (
      <div className="p-8 text-center text-slate-400">
        {t('underConstruction', 'Gurluşygy dowam edýär (Maglumat ýok)')}
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
                onClick={() => setActiveCatalog(item.id)}
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
            <div className="mb-4 flex items-center justify-between">
              <div>
                <button 
                  onClick={() => setActiveCatalog(null)}
                  className={`flex items-center text-xs font-semibold hover:text-teal-600 transition-colors ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}
                >
                  <ArrowLeft size={14} className="mr-1" />
                  {t('back', 'Yza')}
                </button>
                <h2 className={`text-lg font-bold mt-2 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                  {sections[section]?.find(s => s.id === activeCatalog)?.title || activeCatalog}
                </h2>
              </div>
              <button className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold flex items-center shadow-md">
                <Plus size={16} className="mr-1.5" />
                <span>{t('add', 'Goşmak')}</span>
              </button>
            </div>

            <div className={`rounded-xl border shadow-xs overflow-hidden ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
              <div className="overflow-x-auto">
                {renderTable()}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

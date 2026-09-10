import React, { useState, useEffect } from 'react';
import { Search, Plus, Eye, Edit2, Trash2, Shield, CheckCircle, XCircle } from 'lucide-react';
import API from '../services/api';
import { getRoleTheme, safeString } from '../utils/themeUtils';
import { getTranslation } from '../utils/translations';
import AddSupplierModal from '../components/AddSupplierModal';
import EditSupplierModal from '../components/EditSupplierModal';
import { useNavigate } from 'react-router-dom';

export default function SuppliersList({ role, isDarkMode, lang = 'RU' }) {
  const theme = getRoleTheme(role, isDarkMode);
  const t = (key, fallback) => getTranslation(lang, key, fallback);

  const [suppliers, setSuppliers] = useState([]);
  const [pendingSuppliers, setPendingSuppliers] = useState([]);
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [supplierToEdit, setSupplierToEdit] = useState(null);
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('all'); // 'all' or 'pending'

  useEffect(() => {
    fetchSuppliers();
    fetchPendingSuppliers();
    API.get('/catalogs/countries').then(r => setCountries(r.data.filter(c => c.isActive))).catch(() => {});
  }, []);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const res = await API.get('/companies');
      if (res.data && Array.isArray(res.data)) {
        setSuppliers(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch companies', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingSuppliers = async () => {
    if (role !== 'ADMIN') return;
    try {
        const res = await API.get('/suppliers/pending');
        if (res.data && Array.isArray(res.data)) {
            setPendingSuppliers(res.data);
        }
    } catch (err) {
        console.error('Failed to fetch pending suppliers', err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm(t('deleteConfirm', 'Вы действительно хотите удалить этого поставщика?'))) {
      try {
        await API.delete(`/companies/${id}`);
        fetchSuppliers();
      } catch (err) {
        console.error('Failed to delete company', err);
        alert(t('errorCreateSupplier', 'Ошибка при удалении'));
      }
    }
  };

  const handleApprove = async (id) => {
      if (window.confirm(lang === 'RU' ? 'Одобрить верификацию?' : 'Tassyklamak?')) {
          try {
              await API.post(`/suppliers/${id}/approve`);
              fetchPendingSuppliers();
          } catch (err) {
              console.error(err);
          }
      }
  };

  const handleReject = async (id) => {
      const reason = window.prompt(lang === 'RU' ? 'Причина отклонения:' : 'Ret etmegiň sebäbi:');
      if (reason) {
          try {
              await API.post(`/suppliers/${id}/reject`, { rejectionReason: reason });
              fetchPendingSuppliers();
          } catch (err) {
              console.error(err);
          }
      }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">
            {t('suppliersListTitle', 'Üpjün edijiler')}
          </h2>
          <p className={`text-xs ${theme.subText} mt-0.5`}>
            {t('suppliersListDesc', 'Ulgamda hasaba alnan üpjün edijiler')}
          </p>
        </div>

        <button 
          onClick={() => setShowAddModal(true)}
          className={`px-4 py-2 rounded-lg font-bold text-xs shadow-md transition-all flex items-center space-x-2 ${theme.primaryBtn}`}
        >
          <Plus size={16} />
          <span>{t('addSupplier', 'Üpjün ediji goşmak')}</span>
        </button>
      </div>

      {role === 'ADMIN' && (
          <div className="flex space-x-4 mb-4 border-b border-slate-200 dark:border-slate-800">
              <button 
                  onClick={() => setActiveTab('all')}
                  className={`py-2 px-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'all' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              >
                  {lang === 'RU' ? 'Все поставщики' : 'Ähli üpjün edijiler'}
              </button>
              <button 
                  onClick={() => setActiveTab('pending')}
                  className={`py-2 px-4 text-sm font-bold border-b-2 transition-colors flex items-center space-x-2 ${activeTab === 'pending' ? 'border-amber-500 text-amber-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              >
                  <span>{lang === 'RU' ? 'На модерации' : 'Barlagda'}</span>
                  {pendingSuppliers.length > 0 && (
                      <span className="bg-amber-100 text-amber-700 py-0.5 px-2 rounded-full text-[10px]">
                          {pendingSuppliers.length}
                      </span>
                  )}
              </button>
          </div>
      )}

      {activeTab === 'all' ? (
        <div className={`rounded-xl border shadow-xs overflow-hidden ${theme.cardBg}`}>
            <div className={`p-3 border-b grid grid-cols-1 md:grid-cols-4 gap-3 ${theme.cardHeaderBg}`}>
            <div className="col-span-2 relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                type="text"
                placeholder={t('searchPlaceholder', 'Gözleg...')}
                className={`w-full pl-9 pr-3 py-1.5 rounded-lg text-xs ${theme.inputBg}`}
                />
            </div>
            </div>

            <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
                <thead>
                <tr className={theme.tableHeaderBg}>
                    <th className="py-3.5 px-4 w-12 text-center">#</th>
                    <th className="py-3.5 px-4 text-center">{t('supplierName', 'Ady')}</th>
                    <th className="py-3.5 px-4 text-center">{t('regNo', 'Reg. nomer')}</th>
                    <th className="py-3.5 px-4 text-center">{t('license', 'Lisenziýa')}</th>
                    <th className="py-3.5 px-4 text-center">Email</th>
                    <th className="py-3.5 px-4 text-center">{t('contacts', 'Kontaktlar')}</th>
                    <th className="py-3.5 px-4 text-center">{t('active', 'Aktiw')}</th>
                    <th className="py-3.5 px-4 text-center">{t('action', 'Amal')}</th>
                </tr>
                </thead>
                <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
                {loading ? (
                    <tr>
                    <td colSpan="8" className="py-8 text-center text-slate-500">{t('loading', 'Загрузка...')}</td>
                    </tr>
                ) : suppliers.length === 0 ? (
                    <tr>
                    <td colSpan="8" className="py-8 text-center text-slate-500">{t('noData', 'Нет данных')}</td>
                    </tr>
                ) : (
                    suppliers.map((s, idx) => (
                    <tr key={s.id || idx} className={theme.tableRowHover}>
                        <td className="py-3.5 px-4 text-center font-medium text-slate-400">{idx + 1}</td>
                        <td className="py-3.5 px-4 text-center font-bold">{safeString(s.name)}</td>
                        <td className="py-3.5 px-4 text-center font-mono">{safeString(s.inn || s.reg)}</td>
                        <td className="py-3.5 px-4 text-center font-mono">{safeString(s.license || '-')}</td>
                        <td className="py-3.5 px-4 text-center font-semibold text-teal-600">{safeString(s.email || '-')}</td>
                        <td className="py-3.5 px-4 text-center">
                        <p className="font-medium">{safeString(s.phone)}</p>
                        <p className={`text-[11px] ${theme.subText}`}>{safeString(s.address)}</p>
                        </td>
                        <td className="py-3.5 px-4 text-center text-emerald-500 font-bold">{t('statusActive', 'Hawa')}</td>
                        <td className="py-3.5 px-4 text-center space-x-1">
                        <button onClick={() => navigate(`/suppliers/${s.id}`)} className="p-1.5 rounded-md text-slate-600 dark:text-slate-400 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors">
                            <Eye size={16} />
                        </button>
                        <button onClick={() => setSupplierToEdit(s)} className="p-1.5 rounded-md text-slate-600 dark:text-slate-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/30 transition-colors">
                            <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(s.id)} className="p-1.5 rounded-md text-slate-600 dark:text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors">
                            <Trash2 size={16} />
                        </button>
                        </td>
                    </tr>
                    ))
                )}
                </tbody>
            </table>
            </div>
        </div>
      ) : (
          /* Вкладка Модерации */
          <div className={`rounded-xl border shadow-xs overflow-hidden ${theme.cardBg}`}>
            <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
                <thead>
                <tr className={theme.tableHeaderBg}>
                    <th className="py-3.5 px-4 text-center">{lang === 'RU' ? 'Компания' : 'Kompaniýa'}</th>
                    <th className="py-3.5 px-4 text-center">{lang === 'RU' ? 'Тип / ИНН' : 'Görnüşi / STŞK'}</th>
                    <th className="py-3.5 px-4 text-center">{lang === 'RU' ? 'Контакты' : 'Kontaktlar'}</th>
                    <th className="py-3.5 px-4 text-center">{lang === 'RU' ? 'Банк' : 'Bank'}</th>
                    <th className="py-3.5 px-4 text-center">{lang === 'RU' ? 'Статус' : 'Status'}</th>
                    <th className="py-3.5 px-4 text-center">{lang === 'RU' ? 'Действия' : 'Amallar'}</th>
                </tr>
                </thead>
                <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
                {pendingSuppliers.length === 0 ? (
                    <tr>
                    <td colSpan="6" className="py-8 text-center text-slate-500">{lang === 'RU' ? 'Нет заявок на модерацию' : 'Barlagda arza ýok'}</td>
                    </tr>
                ) : (
                    pendingSuppliers.map((s, idx) => (
                    <tr key={s.id || idx} className={theme.tableRowHover}>
                        <td className="py-3.5 px-4 text-center">
                            <p className="font-bold">{safeString(s.name)}</p>
                            <a href={`/suppliers/${s.id}`} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline text-[11px]">{lang === 'RU' ? 'Посмотреть профиль' : 'Profili görmek'}</a>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                            <span className="font-medium px-2 py-0.5 bg-slate-100 text-slate-600 rounded">{s.type}</span>
                            <p className="font-mono mt-1">{safeString(s.taxId)}</p>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                            <p className="font-medium">{safeString(s.phone)}</p>
                            <p className="font-medium text-teal-600">{safeString(s.email)}</p>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                            <p className="font-semibold">{safeString(s.bankName)}</p>
                            <p className="font-mono text-[11px]">{safeString(s.bankAccount)}</p>
                        </td>
                        <td className="py-3.5 px-4 text-center text-amber-500 font-bold flex items-center justify-center gap-1">
                            <Shield size={14} /> PENDING
                        </td>
                        <td className="py-3.5 px-4 text-center">
                            <div className="flex justify-center space-x-2">
                                <button onClick={() => handleApprove(s.id)} className="px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-md font-bold transition-colors flex items-center space-x-1">
                                    <CheckCircle size={14} /> <span>{lang === 'RU' ? 'Одобрить' : 'Tassykla'}</span>
                                </button>
                                <button onClick={() => handleReject(s.id)} className="px-3 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-md font-bold transition-colors flex items-center space-x-1">
                                    <XCircle size={14} /> <span>{lang === 'RU' ? 'Отклонить' : 'Ret et'}</span>
                                </button>
                            </div>
                        </td>
                    </tr>
                    ))
                )}
                </tbody>
            </table>
            </div>
        </div>
      )}

      {showAddModal && (
        <AddSupplierModal countries={countries} 
          lang={lang}
          isDarkMode={isDarkMode}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            fetchSuppliers();
            setShowAddModal(false);
          }}
        />
      )}

      {supplierToEdit && (
        <EditSupplierModal countries={countries} 
          supplier={supplierToEdit}
          lang={lang}
          isDarkMode={isDarkMode}
          onClose={() => setSupplierToEdit(null)}
          onSuccess={() => {
            fetchSuppliers();
            setSupplierToEdit(null);
          }}
        />
      )}
    </div>
  );
}

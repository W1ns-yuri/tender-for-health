import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Eye, Filter, RefreshCw, Send, Building2 } from 'lucide-react';
import { getStatusBadge, getTypeBadge } from '../utils/statusUtils';
import API from '../services/api';
import { getTranslation } from '../utils/translations';
import { useNavigate } from 'react-router-dom';
import { getRoleTheme, safeString } from '../utils/themeUtils';

export default function MyOffers({ role, isDarkMode, lang = 'RU' }) {
  const theme = getRoleTheme(role, isDarkMode);
  const isAdmin = role === 'ADMIN';
  const t = (key, fallback) => getTranslation(lang, key, fallback);
  const navigate = useNavigate();
  
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Фильтры
  const [filterLot, setFilterLot] = useState('');
  const [filterCurrency, setFilterCurrency] = useState('');
  const [filterCode, setFilterCode] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchMyOffers();
  }, [role]);

  const fetchMyOffers = async () => {
    setLoading(true);
    try {
      const endpoint = isAdmin ? '/offers' : '/offers/my';
      const res = await API.get(endpoint);
      if (res.data) setOffers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to fetch offers', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOffer = async (offerId) => {
    if (!window.confirm(lang === 'RU' ? 'Вы действительно хотите отозвать/удалить это коммерческое предложение?' : 'Siz hakykatdan hem bu teklibi pozmak isleýärsiňizmi?')) {
      return;
    }
    try {
      await API.delete(`/offers/${offerId}`);
      setOffers(prev => prev.filter(o => o.id !== offerId));
      alert(lang === 'RU' ? 'Коммерческое предложение успешно удалено' : 'Teklip üstünlikli pozuldy');
    } catch (err) {
      console.error('Error deleting offer', err);
      alert(err.response?.data?.error || (lang === 'RU' ? 'Ошибка при удалении предложения' : 'Teklip pozulanda ýalňyşlyk ýüze çykdy'));
    }
  };

  // Фильтрация списка предложений
  const filteredOffers = offers.filter(item => {
    if (filterLot) {
      const tenderNum = item.tender?.tenderNumber || '';
      if (!tenderNum.toLowerCase().includes(filterLot.toLowerCase())) return false;
    }
    if (filterCurrency) {
      const curr = item.baseCurrency?.code || item.currency || '';
      if (curr !== filterCurrency) return false;
    }
    if (filterCode) {
      const num = item.number || item.code || '';
      if (!num.toLowerCase().includes(filterCode.toLowerCase())) return false;
    }
    if (filterStatus) {
      if (item.status !== filterStatus) return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTender = (item.tender?.title || '').toLowerCase().includes(q);
      const matchSupplier = (item.supplier?.name || '').toLowerCase().includes(q);
      const matchClient = (item.tender?.client?.name || '').toLowerCase().includes(q);
      const matchNumber = (item.number || '').toLowerCase().includes(q);
      const matchComment = (item.comment || '').toLowerCase().includes(q);
      if (!matchTender && !matchSupplier && !matchClient && !matchNumber && !matchComment) return false;
    }
    return true;
  });

  return (
    <div className="space-y-5 animate-in fade-in duration-300 pb-12">
      {/* 1. Заголовок страницы и действия */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-xl font-bold ${theme.primaryText}`}>
            {isAdmin 
              ? (lang === 'RU' ? 'Поданные предложения' : 'Gowşurylan teklipler')
              : t('myOffers', 'Tekliplerim')
            }
          </h2>
          <p className={`text-xs font-medium ${theme.subText}`}>
            {isAdmin 
              ? (lang === 'RU' ? 'Администратор / Поданные коммерческие предложения поставщиков' : 'Admin / Gowşurylan teklipler')
              : t('supplierMyOffers', 'Üpjün ediji / Tekliplerim')
            }
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={fetchMyOffers}
            disabled={loading}
            className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 transition-colors"
            title="Обновить"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>

          {/* Кнопка "Подать предложение" видна ТОЛЬКО поставщику */}
          {!isAdmin && (
            <button
              onClick={() => navigate('/tenders')}
              className={`px-4 py-2 font-semibold text-xs shadow-md transition-all flex items-center space-x-2 rounded-lg ${theme.primaryBtn}`}
            >
              <Plus size={16} />
              <span>{t('submitOfferBtn', 'Teklip ber')}</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Таблица коммерческих предложений */}
      <div className={`${theme.cardBg} rounded-xl border shadow-xs overflow-hidden`}>
        {/* Интерактивные фильтры */}
        <div className={`p-3 border-b grid grid-cols-2 md:grid-cols-5 gap-2 text-xs ${isDarkMode ? 'bg-[#0f172a] border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
          <input
            type="text"
            placeholder={`${t('lotNo', 'Tender №')}: ...`}
            value={filterLot}
            onChange={(e) => setFilterLot(e.target.value)}
            className={`px-2.5 py-1.5 border rounded text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 ${theme.inputBg}`}
          />
          <select
            value={filterCurrency}
            onChange={(e) => setFilterCurrency(e.target.value)}
            className={`px-2.5 py-1.5 border rounded text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 ${theme.inputBg}`}
          >
            <option value="">{t('currency', 'Walýuta')}: {lang === 'RU' ? 'Все' : 'Ählisi'}</option>
            <option value="TMT">TMT (Манат)</option>
            <option value="USD">USD ($ Доллар)</option>
            <option value="EUR">EUR (€ Евро)</option>
          </select>
          <input
            type="text"
            placeholder={`${t('code', 'Belgisi')}: ...`}
            value={filterCode}
            onChange={(e) => setFilterCode(e.target.value)}
            className={`px-2.5 py-1.5 border rounded text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 ${theme.inputBg}`}
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className={`px-2.5 py-1.5 border rounded text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 ${theme.inputBg}`}
          >
            <option value="">{t('status', 'Status')}: {lang === 'RU' ? 'Все' : 'Ählisi'}</option>
            <option value="TABSARYLDY">{t('statusTabsyryldy', 'Подано')}</option>
            <option value="YENIJI">{t('statusYeniji', 'Победитель')}</option>
            <option value="RET_EDILDI">{t('statusRet', 'Отклонено')}</option>
            <option value="TASLAMA">{t('statusTaslama', 'Черновик')}</option>
          </select>
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={t('searchPlaceholder', 'Gözleg...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-8 pr-3 py-1.5 border rounded text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 ${theme.inputBg}`}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className={theme.tableHeaderBg}>
                <th className="py-3 px-3 w-28 text-center">Tender</th>
                <th className="py-3 px-3 text-center">{t('type', 'Görnüşi')}</th>
                {isAdmin && <th className="py-3 px-3 text-left">{lang === 'RU' ? 'Поставщик' : 'Üpjün ediji'}</th>}
                <th className="py-3 px-3 text-center">{t('client', 'Заказчик')}</th>
                <th className="py-3 px-3 text-center">{t('currency', 'Walýuta')}</th>
                <th className="py-3 px-3 text-center">{t('code', 'Номер заявки')}</th>
                <th className="py-3 px-3 text-center">{t('status', 'Status')}</th>
                <th className="py-3 px-3 text-center">{t('paymentTerms', 'Условия оплаты')}</th>
                <th className="py-3 px-3 text-center">{lang === 'RU' ? 'Сумма' : 'Baha'}</th>
                <th className="py-3 px-3 text-center">{t('uploadDate', 'Дата подачи')}</th>
                <th className="py-3 px-3 text-center w-20">{t('action', 'Действие')}</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
              {loading ? (
                <tr>
                  <td colSpan={isAdmin ? "11" : "10"} className="py-8 text-center text-slate-500">{t('loading', 'Загрузка...')}</td>
                </tr>
              ) : filteredOffers.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? "11" : "10"} className="py-8 text-center text-slate-500">
                    {offers.length === 0 ? (lang === 'RU' ? 'Предложений пока не поступало' : 'Entek teklip ýok') : (lang === 'RU' ? 'По заданным фильтрам ничего не найдено' : 'Gözleg boýunça maglumat tapylmady')}
                  </td>
                </tr>
              ) : (
                filteredOffers.map((item, idx) => {
                  const supplierName = item.supplier?.name || item.supplier?.user?.username || '-';
                  const currency = item.baseCurrency?.code || item.currency || 'TMT';
                  const offerPrice = item.offeredPrice || 0;

                  return (
                    <tr key={item.id || idx} className={theme.tableRowHover}>
                      {/* Номер и название тендера */}
                      <td className="py-3 px-3 text-center font-semibold">
                        <span className={`font-bold ${theme.primaryText}`}>{safeString(item.tender?.tenderNumber || item.lot)}</span>
                        {item.tender?.title && <span className="block text-[11px] font-normal text-slate-500 truncate max-w-[160px]">{item.tender.title}</span>}
                      </td>

                      {/* Вид закупки */}
                      <td className="py-3 px-3 text-center">{getTypeBadge(item.tender?.type || item.type, lang, isDarkMode)}</td>

                      {/* Поставщик (виден администратору) */}
                      {isAdmin && (
                        <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-200">
                          <span className="truncate max-w-[180px] block">{supplierName}</span>
                        </td>
                      )}

                      {/* Заказчик */}
                      <td className="py-3 px-3 text-center font-medium">{safeString(item.tender?.client?.name || item.tender?.createdBy?.firstName || "-")}</td>

                      {/* Валюта */}
                      <td className={`py-3 px-3 text-center font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{currency}</td>

                      {/* Номер заявки */}
                      <td className="py-3 px-3 text-center text-slate-500 font-mono">{item.number || item.code}</td>

                      {/* Статус */}
                      <td className="py-3 px-3 text-center">{getStatusBadge(item.status, lang, isDarkMode)}</td>

                      {/* Условия оплаты */}
                      <td className="py-3 px-3 text-center text-slate-500 text-[11px] max-w-xs truncate">{item.paymentTerms || item.terms || '-'}</td>

                      {/* Сумма */}
                      <td className={`py-3 px-3 text-center font-bold ${theme.primaryText}`}>
                        {offerPrice > 0 ? `${offerPrice.toLocaleString('ru-RU')} ${currency}` : '-'}
                      </td>

                      {/* Дата подачи */}
                      <td className="py-3 px-3 text-center text-slate-500">{new Date(item.createdAt || item.date).toLocaleDateString('ru-RU')}</td>

                      {/* Действия */}
                      <td className="py-3 px-3 text-center space-x-1">
                        <button 
                          onClick={() => navigate(`/offers/${item.id}`)} 
                          className="p-1.5 rounded-md text-slate-600 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors inline-flex items-center justify-center" 
                          title={t('viewDetails', 'Просмотр')}
                        >
                          <Eye size={16} />
                        </button>

                        {/* Кнопка удаления только для поставщика */}
                        {!isAdmin && (
                          <button 
                            onClick={() => handleDeleteOffer(item.id)}
                            className="p-1.5 rounded-md text-slate-600 dark:text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors inline-flex items-center justify-center" 
                            title={lang === 'RU' ? 'Удалить / Отозвать' : 'Pozmak'}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

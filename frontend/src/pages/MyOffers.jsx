import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Eye } from 'lucide-react';
import { getStatusBadge, getTypeBadge } from '../utils/statusUtils';
import API from '../services/api';
import { getTranslation } from '../utils/translations';

import { useNavigate } from 'react-router-dom';
import { getRoleTheme, safeString } from '../utils/themeUtils';

export default function MyOffers({ role, isDarkMode, lang = 'RU' }) {
  const theme = getRoleTheme(role, isDarkMode);
  const t = (key, fallback) => getTranslation(lang, key, fallback);
  const navigate = useNavigate();
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyOffers();
  }, []);

  const fetchMyOffers = async () => {
    try {
      const endpoint = role === 'ADMIN' ? '/offers' : '/offers/my';
      const res = await API.get(endpoint);
      if (res.data) setOffers(res.data);
    } catch (err) {
      console.error('Failed to fetch offers', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* 1. Заголовок и кнопка "Teklip ber" (Слайд 4) */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-xl font-bold ${theme.primaryText}`}>{t('myOffers', 'Tekliplerim')}</h2>
          <p className={`text-xs font-medium ${theme.subText}`}>{t('supplierMyOffers', 'Üpjün ediji / Tekliplerim')}</p>
        </div>

        <button
          onClick={() => navigate('/tenders')}
          className="px-4 py-2 bg-[#1e3a8a] hover:bg-blue-900 text-white rounded-lg font-semibold text-xs shadow-md transition-all flex items-center space-x-2"
        >
          <Plus size={16} />
          <span>{t('submitOfferBtn', 'Teklip ber')}</span>
        </button>
      </div>

      {/* 2. Таблица коммерческих предложений по Слайду 4 */}
      <div className={`${theme.cardBg} rounded-xl border shadow-xs overflow-hidden`}>
        {/* Фильтры */}
        <div className={`p-3 border-b grid grid-cols-2 md:grid-cols-5 gap-2 text-xs ${isDarkMode ? 'bg-[#0f172a] border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
          <input type="text" placeholder={`${t('lotNo', 'Lot №')}: ...`} className={`px-2.5 py-1.5 border rounded text-xs ${theme.inputBg}`} />
          <select className={`px-2.5 py-1.5 border rounded text-xs ${theme.inputBg}`}>
            <option>{t('currency', 'Walýuta')}: ...</option>
            <option>TMT</option>
            <option>USD</option>
            <option>EUR</option>
          </select>
          <input type="text" placeholder={`${t('code', 'Belgisi')}: ...`} className={`px-2.5 py-1.5 border rounded text-xs ${theme.inputBg}`} />
          <select className={`px-2.5 py-1.5 border rounded text-xs ${theme.inputBg}`}>
            <option>{t('status', 'Status')}: ...</option>
            <option>{t('statusTaslama', 'Taslama')}</option>
            <option>{t('statusTabsyryldy', 'Tabşyryldy')}</option>
          </select>
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder={t('searchPlaceholder', 'Gözleg...')} className={`w-full pl-8 pr-3 py-1.5 border rounded text-xs ${theme.inputBg}`} />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className={theme.tableHeaderBg}>
                <th className="py-3.5 px-4 w-28 text-center">Tender</th>
                <th className="py-3.5 px-4 text-center">{t('type', 'Görnüşi')}</th>
                <th className="py-3.5 px-4 text-center">{t('client', 'Поставщик')}</th>
                <th className="py-3.5 px-4 text-center">{t('currency', 'Walýuta')}</th>
                <th className="py-3.5 px-4 text-center">{t('code', 'Belgisi')}</th>
                <th className="py-3.5 px-4 text-center">{t('status', 'Status')}</th>
                <th className="py-3.5 px-4 text-center">{t('paymentTerms', 'Töleg şertleri')}</th>
                <th className="py-3.5 px-4 text-center">{t('offerDate', 'Дата подачи заявки')}</th>
                <th className="py-3.5 px-4 text-center">{t('action', 'Amal')}</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
              {loading ? (
                <tr>
                  <td colSpan="9" className="py-8 text-center text-slate-500">{t('loading', 'Загрузка...')}</td>
                </tr>
              ) : offers.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-8 text-center text-slate-500">{t('noData', 'Нет данных')}</td>
                </tr>
              ) : (
                offers.map((item, idx) => (
                  <tr key={item.id || idx} className={theme.tableRowHover}>
                    <td className="py-3.5 px-4 text-center font-semibold">
                      {safeString(item.tender?.lotNumber || item.lot)}
                      {item.tender?.title && <span className="block text-xs font-normal text-slate-500">{item.tender.title}</span>}
                    </td>
                    <td className="py-3.5 px-4 text-center">{getTypeBadge(item.tender?.type || item.type, lang, isDarkMode)}</td>
                    <td className="py-3.5 px-4 text-center font-bold text-teal-600">{safeString(item.supplier?.name || item.client)}</td>
                    <td className={`py-3.5 px-4 text-center font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{item.baseCurrency?.code || item.currency}</td>
                    <td className="py-3.5 px-4 text-center text-slate-500 font-mono">{item.number || item.code}</td>
                    <td className="py-3.5 px-4 text-center">{getStatusBadge(item.status, lang, isDarkMode)}</td>
                    <td className="py-3.5 px-4 text-center text-slate-500 text-[11px] max-w-xs">{item.paymentTerms || item.terms}</td>
                    <td className="py-3.5 px-4 text-center text-slate-500">{new Date(item.createdAt || item.date).toLocaleDateString('ru-RU')}</td>
                    <td className="py-3.5 px-4 text-center space-x-1">
                      <button onClick={() => navigate(`/offers/${item.id}`)} className="p-1 hover:bg-slate-200/50 rounded text-teal-600" title={t('viewDetails', 'Просмотр')}>
                        <Eye size={14} />
                      </button>
                      {role !== 'ADMIN' && (
                        <>
                          <button className="p-1 hover:bg-slate-200/50 rounded" title={t('edit', 'Редактировать')}>
                            <Edit2 size={14} />
                          </button>
                          <button className="p-1 hover:bg-rose-500/10 text-rose-500 rounded" title={t('delete', 'Удалить')}>
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

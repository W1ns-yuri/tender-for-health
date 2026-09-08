import React, { useState, useEffect } from 'react';
import { Trophy, CheckCircle, ExternalLink, Calendar, Package } from 'lucide-react';
import { Link } from 'react-router-dom';
import API from '../services/api';
import { getRoleTheme } from '../utils/themeUtils';
import { getTranslation } from '../utils/translations';

export default function SupplierWins({ role, isDarkMode, lang = 'RU' }) {
  const theme = getRoleTheme(role, isDarkMode);
  const t = (key, fallback) => getTranslation(lang, key, fallback);
  
  const [wins, setWins] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWins();
  }, []);

  const fetchWins = async () => {
    try {
      setLoading(true);
      const res = await API.get('/offers/my-wins');
      setWins(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 font-medium flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-3 border-blue-900 border-t-transparent rounded-full animate-spin" />
        <span>{t('loading', 'Загрузка данных...')}</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className={`p-2.5 rounded-xl ${theme.lightBg} ${theme.primaryText}`}>
          <Trophy size={24} />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
          {lang === 'RU' ? 'Мои победы' : 'Ýeňişlerim'}
        </h2>
      </div>

      {wins.length === 0 ? (
        <div className={`p-16 rounded-2xl border text-center ${isDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'}`}>
          <Trophy size={48} className="mx-auto text-slate-300 dark:text-slate-700 mb-4" />
          <p className="text-slate-500 font-medium">{lang === 'RU' ? 'У вас пока нет выигранных тендеров' : 'Sizde häzirlikçe ýeňen tenderiňiz ýok'}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {wins.map((offer) => {
            const tender = offer.tender;
            return (
              <div key={offer.id} className={`rounded-2xl border shadow-sm overflow-hidden ${isDarkMode ? 'bg-[#0f172a] border-slate-800' : 'bg-white border-slate-200'}`}>
                {/* Header */}
                <div className={`p-5 border-b ${isDarkMode ? 'border-slate-800 bg-slate-900/50' : 'border-slate-100 bg-slate-50/50'}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${theme.primaryBg} text-white`}>
                          {tender.tenderNumber}
                        </span>
                        <span className="text-slate-400 text-xs font-medium flex items-center gap-1">
                          <Calendar size={12} />
                          {new Date(tender.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{tender.title}</h3>
                      <p className="text-sm text-slate-500 mt-1">{lang === 'RU' ? 'Заказчик:' : 'Sargyt ediji:'} {tender.client?.name}</p>
                    </div>
                    
                    <Link
                      to={`/tenders/${tender.id}`}
                      target="_blank"
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${theme.lightBg} ${theme.primaryText} hover:brightness-95`}
                    >
                      <ExternalLink size={14} />
                      {lang === 'RU' ? 'Открыть тендер' : 'Tenderi aç'}
                    </Link>
                  </div>
                </div>

                {/* Won Items List */}
                <div className="p-0 overflow-x-auto">
                  <table className="w-full text-left text-sm min-w-[600px]">
                    <thead className={`text-xs uppercase font-bold text-slate-500 ${isDarkMode ? 'bg-slate-800/50' : 'bg-slate-50'} border-b ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                      <tr>
                        <th className="p-4">{lang === 'RU' ? 'Товар (Ваше предложение)' : 'Haryt'}</th>
                        <th className="p-4 text-center">{lang === 'RU' ? 'Кол-во' : 'Mukdar'}</th>
                        <th className="p-4 text-right">{lang === 'RU' ? 'Цена за ед.' : 'Birlik bahasy'}</th>
                        <th className="p-4 text-right">{lang === 'RU' ? 'Сумма' : 'Jemi'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {offer.specs.map(spec => (
                        <tr key={spec.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="p-4">
                            <div className="flex items-start gap-3">
                              <div className={`mt-1 p-1.5 rounded-full ${theme.lightBg} ${theme.primaryText}`}>
                                <CheckCircle size={14} />
                              </div>
                              <div>
                                <div className="font-bold text-slate-800 dark:text-slate-200">
                                  {spec.generalProduct?.name || spec.name}
                                </div>
                                <div className="text-xs text-slate-500 mt-1">
                                  {lang === 'RU' ? 'Запрос по тендеру:' : 'Tender talaby:'} {spec.tenderSpec?.generalProduct?.name || spec.tenderSpec?.name}
                                </div>
                                {spec.tenderSpec?.lot?.name && (
                                  <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                                    <Package size={10} />
                                    {spec.tenderSpec.lot.name}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-center font-medium">
                            {spec.quantity} <span className="text-xs text-slate-400">{spec.unit?.name || 'шт'}</span>
                          </td>
                          <td className="p-4 text-right font-mono font-medium text-slate-600 dark:text-slate-300">
                            {spec.unitPrice.toLocaleString('ru-RU', {minimumFractionDigits: 2})}
                          </td>
                          <td className="p-4 text-right font-mono font-bold text-slate-800 dark:text-slate-100">
                            {(spec.quantity * spec.unitPrice).toLocaleString('ru-RU', {minimumFractionDigits: 2})}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Total Won for this Tender */}
                <div className={`p-4 border-t flex justify-end items-center gap-4 ${isDarkMode ? 'border-slate-800 bg-slate-900/30' : 'border-slate-200 bg-slate-50'}`}>
                  <span className="text-sm font-semibold text-slate-500">{lang === 'RU' ? 'Итого по вашим позициям:' : 'Jemi:'}</span>
                  <span className={`text-xl font-black ${theme.primaryText}`}>
                    {offer.specs.reduce((sum, spec) => sum + (spec.quantity * spec.unitPrice), 0).toLocaleString('ru-RU', {minimumFractionDigits: 2})}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

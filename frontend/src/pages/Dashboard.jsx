import React, { useState, useEffect } from 'react';
import { FileText, Send, Trophy, Eye, Plus, Edit2, Trash2, Search } from 'lucide-react';
import API from '../services/api';
import { getStatusBadge, getTypeBadge } from '../utils/statusUtils';
import { getRoleTheme, safeString } from '../utils/themeUtils';
import { getTranslation } from '../utils/translations';

export default function Dashboard({ role, onNavigate, onOpenCreateTender, isDarkMode, lang = 'RU' }) {
  const [tenders, setTenders] = useState([]);
  const [myOffers, setMyOffers] = useState([]);
  const [stats, setStats] = useState({ openTenders: 0, totalOffers: 0, winnersCount: 0, totalSuppliers: 0 });
  const [loadingTenders, setLoadingTenders] = useState(true);
  const [loadingOffers, setLoadingOffers] = useState(true);
  const theme = getRoleTheme(role, isDarkMode);
  const t = (key, fallback) => getTranslation(lang, key, fallback);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoadingTenders(true);
      setLoadingOffers(true);

      const [tendersRes, statsRes, offersRes] = await Promise.all([
        API.get('/tenders').catch((e) => { console.error('Tenders Err', e); return null; }),
        API.get('/dashboard/stats').catch((e) => { console.error('Stats Err', e); return null; }),
        API.get(role === 'ADMIN' ? '/offers' : '/offers/my').catch((e) => { console.error('Offers Err', e); return null; })
      ]);

      console.log('Role:', role);
      console.log('Offers Res:', offersRes?.data);

      if (tendersRes?.data && Array.isArray(tendersRes.data)) {
        setTenders(tendersRes.data);
      }
      
      if (offersRes?.data && Array.isArray(offersRes.data)) {
        setMyOffers(offersRes.data);
      }

      if (statsRes?.data?.counters) {
        setStats({
          openTenders: statsRes.data.counters.totalOpenTenders || 0,
          totalOffers: statsRes.data.counters.totalOffers || 0,
          winnersCount: statsRes.data.counters.totalWinners || 0,
          totalSuppliers: statsRes.data.counters.totalSuppliers || 0,
        });
      }
    } catch (e) {
      console.error('Error fetching dashboard data', e);
    } finally {
      setLoadingTenders(false);
      setLoadingOffers(false);
    }
  };

  const renderTechSpecs = (item) => {
    if (typeof item.technicalSpecs === 'string') return item.technicalSpecs;
    if (typeof item.specs === 'string') return item.specs;
    if (Array.isArray(item.specs)) {
      return item.specs.map(s => s.description || s.generalProduct?.name).filter(Boolean).join(', ') || 'TDS standartly...';
    }
    return 'TDS standartly...';
  };

  const formatDate = (dateVal) => {
    if (!dateVal) return '30.01.2026';
    if (typeof dateVal === 'string' && /^\d{2}\.\d{2}\.\d{4}/.test(dateVal)) return dateVal;
    try {
      return new Date(dateVal).toLocaleDateString('ru-RU');
    } catch {
      return '30.01.2026';
    }
  };

  return (
    <div className="space-y-6">
      {/* Заголовок страницы */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">
          {role === 'ADMIN' ? t('adminDashboardTitle', 'Tender Ulgamy / Admin Baş sahypa') : t('supplierDashboardTitle', 'Üpjün ediji / Baş sahypa')}
        </h2>
      </div>

      {/* Метрики */}
      {role === 'ADMIN' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div
            onClick={onOpenCreateTender}
            className={`p-5 rounded-xl border shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center space-x-4 group ${theme.cardBg}`}
          >
            <div className="w-12 h-12 rounded-lg bg-teal-600 text-white flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
              <Plus size={24} />
            </div>
            <div>
              <p className="text-sm font-semibold text-teal-500">{t('createTenderBtn', 'Täze tender döretmek')}</p>
              <p className={`text-xs ${theme.subText}`}>{t('createTenderDesc', 'Создать новый лот тендера')}</p>
            </div>
          </div>

          <div className={`p-5 rounded-xl border shadow-xs flex items-center space-x-4 ${theme.cardBg}`}>
            <div className="w-12 h-12 rounded-lg bg-slate-500/10 text-slate-400 flex items-center justify-center">
              <FileText size={24} />
            </div>
            <div>
              <h3 className="text-2xl font-bold">{stats.openTenders}</h3>
              <p className={`text-xs font-medium ${theme.subText}`}>{t('allTenders', 'Ähli tenderler')}</p>
            </div>
          </div>

          <div className={`p-5 rounded-xl border shadow-xs flex items-center space-x-4 ${theme.cardBg}`}>
            <div className="w-12 h-12 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Send size={24} />
            </div>
            <div>
              <h3 className="text-2xl font-bold">{stats.totalSuppliers}</h3>
              <p className={`text-xs font-medium ${theme.subText}`}>{t('allSuppliers', 'Ähli üpjün edijiler')}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className={`p-5 rounded-xl border shadow-xs flex items-center justify-between ${theme.cardBg}`}>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
                <FileText size={20} />
              </div>
              <span className="text-sm font-medium">{t('tenders', 'Tenders')}</span>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold">{stats.openTenders}</span>
              <span className={`text-xs block font-medium ${theme.subText}`}>{t('totalOpenTenders', 'Jemi açyk tenderler')}</span>
            </div>
          </div>

          <div className={`p-5 rounded-xl border shadow-xs flex items-center justify-between ${theme.cardBg}`}>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
                <Send size={20} />
              </div>
              <span className="text-sm font-medium">{t('myOffers', 'Teklipler')}</span>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold">{stats.totalOffers}</span>
              <span className={`text-xs block font-medium ${theme.subText}`}>{t('totalOffersSubmitted', 'Jemi tabşyrylan teklipler')}</span>
            </div>
          </div>

          <div className={`p-5 rounded-xl border shadow-xs flex items-center justify-between ${theme.cardBg}`}>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
                <Trophy size={20} />
              </div>
              <span className="text-sm font-medium">{t('winners', 'Ýeňijilik')}</span>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold">{stats.winnersCount}</span>
              <span className={`text-xs block font-medium ${theme.subText}`}>{t('totalWinners', 'Jemi ýeňiji bolunan tenderler')}</span>
            </div>
          </div>
        </div>
      )}

      {/* Таблица 1 */}
      <div className={`rounded-xl border shadow-xs overflow-hidden ${theme.cardBg}`}>
        <div className={`p-4 border-b flex items-center justify-between ${theme.cardHeaderBg}`}>
          <h3 className="font-bold text-base">{t('recentTenders', 'Soňky açyk tenderler')}</h3>
          <button onClick={() => onNavigate('tenders')} className={`text-xs font-semibold hover:underline ${theme.primaryText}`}>
            {t('allBtn', 'Ähli')}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className={theme.tableHeaderBg}>
                <th className="py-3.5 px-4 w-24 text-center">{t('lotNo', 'Lot №')}</th>
                <th className="py-3.5 px-4 w-48 text-center">{t('title', 'Ady')}</th>
                <th className="py-3.5 px-4 text-center">{t('description', 'Mazmuny')}</th>
                <th className="py-3.5 px-4 text-center">{t('type', 'Görnüşi')}</th>
                <th className="py-3.5 px-4 text-center">{t('status', 'Status')}</th>
                <th className="py-3.5 px-4 text-center">{t('announcementDate', 'Yglan edilen senesi')}</th>
                <th className="py-3.5 px-4 text-center">{t('deadline', 'Soňky möhleti')}</th>
                <th className="py-3.5 px-4 text-center">{t('visibility', 'Açyklygy')}</th>
                <th className="py-3.5 px-4 text-center">{t('technicalSpecs', 'Tehniki şartler')}</th>
                <th className="py-3.5 px-4 text-center">{t('action', 'Amal')}</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
              {loadingTenders ? (
                <tr>
                  <td colSpan="10" className="py-8 text-center text-slate-500">{t('loading', 'Загрузка...')}</td>
                </tr>
              ) : tenders.length === 0 ? (
                <tr>
                  <td colSpan="10" className="py-8 text-center text-slate-500">{t('noData', 'Нет данных')}</td>
                </tr>
              ) : (
                tenders.map((item, idx) => (
                  <tr key={item.id || idx} className={theme.tableRowHover}>
                    <td className="py-3.5 px-4 text-center font-semibold">{safeString(item.tenderNumber)}</td>
                    <td className="py-3.5 px-4 text-center font-medium">{safeString(item.title)}</td>
                    <td className={`py-3.5 px-4 text-center w-auto min-w-[220px] whitespace-normal break-words ${theme.subText}`}>
                      {safeString(item.description)}
                    </td>
                    <td className="py-3.5 px-4 text-center">{getTypeBadge(item.type, lang, isDarkMode)}</td>
                    <td className="py-3.5 px-4 text-center">{getStatusBadge(item.status, lang, isDarkMode)}</td>
                    <td className={`py-3.5 px-4 text-center ${theme.subText}`}>{formatDate(item.announcementDate || item.date)}</td>
                    <td className={`py-3.5 px-4 text-center ${theme.subText}`}>{formatDate(item.deadline)}</td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`${isDarkMode ? 'text-emerald-400' : 'text-emerald-500'} font-semibold text-xs`}>
                        {item.visibility === 'YAPYK' ? (lang === 'RU' ? 'Закрытый' : 'Ýapyk') : (lang === 'RU' ? 'Открытый' : 'Açyk')}
                      </span>
                    </td>
                    <td className={`py-3.5 px-4 text-center w-auto min-w-[180px] whitespace-normal break-words ${theme.subText}`}>
                      {renderTechSpecs(item)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => onNavigate('tender-details', item.id)}
                        className="p-1.5 rounded-full hover:bg-slate-200/50 transition-colors"
                        title={t('viewDetails', 'Детальнее')}
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Таблица 2 */}
      <div className={`rounded-xl border shadow-xs overflow-hidden ${theme.cardBg}`}>
        <div className={`p-4 border-b flex items-center justify-between ${theme.cardHeaderBg}`}>
          <h3 className="font-bold text-base">{t('recentOffers', 'Soňky tekliplerim')}</h3>
          <button onClick={() => onNavigate('offers')} className={`text-xs font-semibold hover:underline ${theme.primaryText}`}>
            {t('allBtn', 'Ähli')}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className={theme.tableHeaderBg}>
                <th className="py-3.5 px-4 text-center">Tender</th>
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
              {loadingOffers ? (
                <tr>
                  <td colSpan="9" className="py-8 text-center text-slate-500">{t('loading', 'Загрузка...')}</td>
                </tr>
              ) : myOffers.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-8 text-center text-slate-500">{t('noData', 'Нет данных')}</td>
                </tr>
              ) : (
                myOffers.map((item, idx) => (
                  <tr key={item.id || idx} className={theme.tableRowHover}>
                    <td className="py-3.5 px-4 text-center font-semibold">
                      {safeString(item.tender?.tenderNumber || item.lot)}
                      {item.tender?.title && <span className="block text-xs font-normal text-slate-500">{item.tender.title}</span>}
                    </td>
                    <td className="py-3.5 px-4 text-center">{getTypeBadge(item.tender?.type || item.type, lang, isDarkMode)}</td>
                    <td className="py-3.5 px-4 text-center font-bold text-teal-600">{safeString(item.tender?.client?.name || item.tender?.createdBy?.firstName || "-")}</td>
                    <td className="py-3.5 px-4 text-center font-medium">{safeString(item.baseCurrency?.code || item.currency)}</td>
                    <td className={`py-3.5 px-4 text-center font-mono ${theme.subText}`}>{safeString(item.number || item.code)}</td>
                    <td className="py-3.5 px-4 text-center">{getStatusBadge(item.status, lang, isDarkMode)}</td>
                    <td className={`py-3.5 px-4 text-center w-auto min-w-[200px] whitespace-normal break-words ${theme.subText}`}>{safeString(item.paymentTerms || item.terms)}</td>
                    <td className={`py-3.5 px-4 text-center ${theme.subText}`}>{formatDate(item.createdAt || item.date)}</td>
                    <td className="py-3.5 px-4 text-center space-x-1">
                      <button onClick={() => onNavigate('offers', item.id)} className="p-1 hover:bg-slate-200/50 rounded text-teal-600" title={t('viewDetails', 'Просмотр')}>
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

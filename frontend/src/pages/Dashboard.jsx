import React, { useState, useEffect } from 'react';
import { FileText, Send, Trophy, Eye, Plus, Edit2, Trash2, Users, ChevronRight } from 'lucide-react';
import API from '../services/api';
import { getStatusBadge, getTypeBadge } from '../utils/statusUtils';
import { getRoleTheme, safeString } from '../utils/themeUtils';
import { getTranslation } from '../utils/translations';

export default function Dashboard({ role, onNavigate, onOpenCreateTender, isDarkMode, lang = 'RU' }) {
  const [tenders, setTenders] = useState([]);
  const [myOffers, setMyOffers] = useState([]);
  const [stats, setStats] = useState({ openTenders: 0, totalOffers: 0, winnersCount: 0, totalSuppliers: 0 });
  const [supplierProfile, setSupplierProfile] = useState(null);
  const [loadingTenders, setLoadingTenders] = useState(true);
  const [loadingOffers, setLoadingOffers] = useState(true);
  const theme = getRoleTheme(role, isDarkMode);
  const t = (key, fallback) => getTranslation(lang, key, fallback);

  useEffect(() => {
    fetchDashboardData();
    if (role === 'SUPPLIER') {
      API.get('/suppliers/profile')
        .then(res => { if (res.data) setSupplierProfile(res.data); })
        .catch(err => console.error('Dashboard profile fetch err', err));
    }
  }, [role]);

  const fetchDashboardData = async (retryCount = 1) => {
    try {
      setLoadingTenders(true);
      setLoadingOffers(true);

      const [tendersRes, statsRes, offersRes] = await Promise.all([
        API.get('/tenders').catch((e) => {
          if (e.response?.status !== 502 && e.response?.status !== 503) console.error('Tenders Err', e);
          return null;
        }),
        API.get('/dashboard/stats').catch((e) => {
          if (e.response?.status !== 502 && e.response?.status !== 503) console.error('Stats Err', e);
          return null;
        }),
        API.get(role === 'ADMIN' ? '/offers' : '/offers/my').catch((e) => {
          if (e.response?.status !== 502 && e.response?.status !== 503) console.error('Offers Err', e);
          return null;
        })
      ]);

      // Если все запросы вернули null из-за временного 502 (сервер еще прогревается/перезапускается)
      if (!tendersRes && !statsRes && !offersRes && retryCount > 0) {
        setTimeout(() => {
          fetchDashboardData(retryCount - 1);
        }, 1200);
        return;
      }

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {role === 'ADMIN' ? t('adminDashboardTitle', 'Tender Ulgam / Admin Baş sahypa') : t('supplierDashboardTitle', 'Üpjün ediji / Baş sahypa')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {role === 'ADMIN' 
              ? t('adminDashboardSubtitle', 'Сводная аналитика процедур, статус заявок и ключевые индикаторы') 
              : t('supplierDashboardSubtitle', 'Обзор доступных закупок, статус поданных предложений и побед')}
          </p>
        </div>

        {role === 'ADMIN' && (
          <button
            onClick={onOpenCreateTender}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-sm shadow-emerald-500/20 active:scale-95 transition-all text-xs cursor-pointer self-start sm:self-auto"
          >
            <Plus size={16} />
            <span>{t('createTenderBtn', 'Создать новый тендер')}</span>
          </button>
        )}
      </div>

      {/* Приветственный баннер онбординга для поставщиков со статусом PENDING */}
      {role === 'SUPPLIER' && supplierProfile?.verificationStatus === 'PENDING' && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-blue-500/5 border border-blue-500/20 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in duration-300">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/25">
              <Users size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                {t('onboardingPendingTitle', 'Профиль ожидает заполнения')}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-0.5 max-w-2xl">
                {t('onboardingPendingBanner', 'Добро пожаловать в Tender Ulgam! Заполните реквизиты компании, банковские данные и прикрепите документы в профиле для прохождения верификации.')}
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('profile')}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-500/20 transition-all shrink-0 active:scale-95 flex items-center gap-1.5 cursor-pointer"
          >
            <span>{t('goToProfileBtn', 'Перейти в профиль')}</span>
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Метрики */}
      {role === 'ADMIN' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className={`p-5 rounded-2xl border shadow-xs flex items-center space-x-4 ${theme.cardBg}`}>
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <FileText size={24} />
            </div>
            <div>
              <h3 className="text-2xl font-bold tabular-nums">{stats.openTenders}</h3>
              <p className={`text-xs font-medium ${theme.subText}`}>{t('totalOpenTenders', 'Открытых тендеров')}</p>
            </div>
          </div>

          <div className={`p-5 rounded-2xl border shadow-xs flex items-center space-x-4 ${theme.cardBg}`}>
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Send size={24} />
            </div>
            <div>
              <h3 className="text-2xl font-bold tabular-nums">{stats.totalOffers}</h3>
              <p className={`text-xs font-medium ${theme.subText}`}>{t('totalOffersSubmitted', 'Поданных предложений')}</p>
            </div>
          </div>

          <div className={`p-5 rounded-2xl border shadow-xs flex items-center space-x-4 ${theme.cardBg}`}>
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
              <Users size={24} />
            </div>
            <div>
              <h3 className="text-2xl font-bold tabular-nums">{stats.totalSuppliers}</h3>
              <p className={`text-xs font-medium ${theme.subText}`}>{t('allSuppliers', 'Всех поставщиков')}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className={`p-5 rounded-2xl border shadow-xs flex items-center justify-between ${theme.cardBg}`}>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
                <FileText size={20} />
              </div>
              <span className="text-sm font-medium">{t('tenders', 'Tenders')}</span>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold tabular-nums">{stats.openTenders}</span>
              <span className={`text-xs block font-medium ${theme.subText}`}>{t('totalOpenTenders', 'Jemi açyk tenderler')}</span>
            </div>
          </div>

          <div className={`p-5 rounded-2xl border shadow-xs flex items-center justify-between ${theme.cardBg}`}>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
                <Send size={20} />
              </div>
              <span className="text-sm font-medium">{t('myOffers', 'Teklipler')}</span>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold tabular-nums">{stats.totalOffers}</span>
              <span className={`text-xs block font-medium ${theme.subText}`}>{t('totalOffersSubmitted', 'Jemi tabşyrylan teklipler')}</span>
            </div>
          </div>

          <div className={`p-5 rounded-2xl border shadow-xs flex items-center justify-between ${theme.cardBg}`}>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
                <Trophy size={20} />
              </div>
              <span className="text-sm font-medium">{t('winners', 'Ýeňijilik')}</span>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold tabular-nums">{stats.winnersCount}</span>
              <span className={`text-xs block font-medium ${theme.subText}`}>{t('totalWinners', 'Jemi ýeňiji bolunan tenderler')}</span>
            </div>
          </div>
        </div>
      )}

      {/* Секция 1: Последние открытые тендеры */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">{t('recentTenders', 'Soňky açyk tenderler')}</h3>
          <button onClick={() => onNavigate('tenders')} className={`text-xs font-semibold hover:underline ${theme.primaryText}`}>
            {t('allBtn', 'Ähli')}
          </button>
        </div>

        <div className={`bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden ${theme.tableCardBorderTop}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className={theme.tableHeaderBg}>
                <tr className="border-b border-slate-200 dark:border-slate-800">
                  <th className="py-3.5 px-4 w-28 text-center">{t('lotNo', 'Lot №')}</th>
                  <th className="py-3.5 px-4 w-48 text-center">{t('title', 'Ady')}</th>
                  <th className="py-3.5 px-4 text-center">{t('description', 'Mazmuny')}</th>
                  <th className="py-3.5 px-4 text-center">{t('type', 'Görnüşi')}</th>
                  <th className="py-3.5 px-4 text-center">{t('status', 'Status')}</th>
                  <th className="py-3.5 px-4 text-center">{t('announcementDate', 'Yglan edilen senesi')}</th>
                  <th className="py-3.5 px-4 text-center">{t('deadline', 'Soňky möhleti')}</th>
                  <th className="py-3.5 px-4 text-center">{t('technicalSpecs', 'Tehniki şartler')}</th>
                  <th className="py-3.5 px-4 text-center">{t('action', 'Amal')}</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
                {loadingTenders ? (
                  <tr>
                    <td colSpan="9" className="py-8 text-center text-slate-500">{t('loading', 'Загрузка...')}</td>
                  </tr>
                ) : tenders.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="py-8 text-center text-slate-500">{t('noData', 'Нет данных')}</td>
                  </tr>
                ) : (
                  tenders.map((item, idx) => (
                    <tr key={item.id || idx} className={`${theme.tableRowHover} transition-colors`}>
                      <td className="py-3.5 px-4 text-center font-semibold font-mono tabular-nums">{safeString(item.tenderNumber)}</td>
                      <td className="py-3.5 px-4 text-center font-medium">{safeString(item.title)}</td>
                      <td className={`py-3.5 px-4 text-center w-auto min-w-55 whitespace-normal text-wrap ${theme.subText}`}>{safeString(item.description)}</td>
                      <td className="py-3.5 px-4 text-center">{getTypeBadge(item.type, lang, isDarkMode)}</td>
                      <td className="py-3.5 px-4 text-center">{getStatusBadge(item.status, lang, isDarkMode)}</td>
                      <td className={`py-3.5 px-4 text-center tabular-nums ${theme.subText}`}>{formatDate(item.announcementDate || item.date)}</td>
                      <td className={`py-3.5 px-4 text-center tabular-nums ${theme.subText}`}>{formatDate(item.deadline)}</td>
                      <td className={`py-3.5 px-4 text-center w-auto min-w-45 whitespace-normal text-wrap ${theme.subText}`}>{renderTechSpecs(item)}</td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center">
                          <button
                            onClick={() => onNavigate('tender-details', item.id)}
                            className={theme.actionBtn}
                            title={t('viewDetails', 'Детальнее')}
                          >
                            <Eye size={16} />
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
      </div>

      {/* Секция 2: Последние предложения (увеличенный внешний отступ для четкого разделения блоков) */}
      <div className="!mt-10">
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">{t('recentOffers', 'Soňky tekliplerim')}</h3>
          <button onClick={() => onNavigate('offers')} className={`text-xs font-semibold hover:underline ${theme.primaryText}`}>
            {t('allBtn', 'Ähli')}
          </button>
        </div>

        <div className={`bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden ${theme.tableCardBorderTop}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className={theme.tableHeaderBg}>
                <tr className="border-b border-slate-200 dark:border-slate-800">
                  <th className="py-3 px-4 text-left">{t('tenderOrName', 'Тендер / Наименование')}</th>
                  <th className="py-3 px-3 text-center">{t('type', 'Görnüşi')}</th>
                  <th className="py-3 px-4 text-center">{t('client', 'Заказчик')}</th>
                  <th className="py-3 px-3 text-center">{t('currency', 'Walýuta')}</th>
                  <th className="py-3 px-4 text-center">{t('code', 'Belgisi')}</th>
                  <th className="py-3 px-3 text-center">{t('status', 'Status')}</th>
                  <th className="py-3 px-4 text-center">{t('paymentTerms', 'Töleg şertleri')}</th>
                  <th className="py-3 px-3 text-center">{t('offerDate', 'Дата подачи заявки')}</th>
                  <th className="py-3 px-4 text-center">{t('action', 'Amal')}</th>
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
                    <tr key={item.id || idx} className={`${theme.tableRowHover} transition-colors`}>
                      <td className="py-3.5 px-4 text-left font-semibold">
                        <span className="font-mono tabular-nums">{safeString(item.tender?.tenderNumber || item.lot)}</span>
                        {item.tender?.title && (
                          <span className="block text-xs font-normal text-slate-500 line-clamp-1 max-w-[200px]" title={item.tender.title}>
                            {item.tender.title}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-center">{getTypeBadge(item.tender?.type || item.type, lang, isDarkMode)}</td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="text-slate-800 dark:text-slate-200 font-medium hover:text-emerald-600 dark:hover:text-emerald-400 hover:underline transition-colors">
                          {safeString(item.tender?.client?.name || item.tender?.createdBy?.firstName || "-")}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-center font-medium tabular-nums">{safeString(item.baseCurrency?.code || item.currency)}</td>
                      <td className={`py-3.5 px-4 text-center font-mono tabular-nums ${theme.subText}`}>{safeString(item.number || item.code)}</td>
                      <td className="py-3.5 px-3 text-center">{getStatusBadge(item.status, lang, isDarkMode)}</td>
                      <td className="py-3.5 px-4 text-center max-w-[180px]">
                        <div className={`line-clamp-2 text-xs ${theme.subText}`} title={safeString(item.paymentTerms || item.terms)}>
                          {safeString(item.paymentTerms || item.terms)}
                        </div>
                      </td>
                      <td className={`py-3.5 px-3 text-center tabular-nums ${theme.subText}`}>{formatDate(item.createdAt || item.date)}</td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onNavigate('offers', item.id)}
                            className={theme.actionBtn}
                            title={t('viewDetails', 'Просмотр')}
                          >
                            <Eye size={16} />
                          </button>
                          {role !== 'ADMIN' && (
                            <>
                              <button
                                className="w-8 h-8 rounded-lg border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-800 shadow-2xs flex items-center justify-center text-slate-400 hover:text-amber-600 hover:bg-amber-50 hover:border-amber-300 dark:hover:bg-amber-950/50 dark:hover:text-amber-400 transition-all active:scale-95"
                                title={t('edit', 'Редактировать')}
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                className="w-8 h-8 rounded-lg border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-800 shadow-2xs flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-300 dark:hover:bg-rose-950/50 dark:hover:text-rose-400 transition-all active:scale-95"
                                title={t('delete', 'Удалить')}
                              >
                                <Trash2 size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

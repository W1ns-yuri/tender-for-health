import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Search, Bell, Settings, ChevronLeft, ChevronRight, Globe, ChevronDown, User, 
  X, Loader2, Trophy, ShieldCheck, FileText, Clock, Building2, CheckCheck, 
  ArrowRight, AlertCircle, Inbox, Trash2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import { getRoleTheme, getAvatarInitials, resolveFileUrl } from '../utils/themeUtils';
import { getTranslation } from '../utils/translations';

export default function Header({ user, role, isDarkMode, lang, setLang, onNavigate }) {
  const theme = getRoleTheme(role, isDarkMode);
  const isAdmin = role === 'ADMIN';
  const navigate = useNavigate();
  const t = (key, fallback) => getTranslation(lang, key, fallback);

  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [imgError, setImgError] = useState(false);

  // --- 1. ГЛОБАЛЬНЫЙ ПОИСК ---
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ tenders: [], suppliers: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchContainerRef = useRef(null);

  // --- 2. ЦЕНТР УВЕДОМЛЕНИЙ ---
  // --- 2. ЦЕНТР УВЕДОМЛЕНИЙ (ЖИВОЙ API) ---
  const [showNotifications, setShowNotifications] = useState(false);
  const notifContainerRef = useRef(null);
  const [notificationsList, setNotificationsList] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifFilter, setNotifFilter] = useState('all');
  const prevUnreadRef = useRef(null);

  const playNotificationSound = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.22);
    } catch {
      // AudioContext could be suspended until gesture
    }
  };

  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return '';
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return t('justNow', 'Только что');
    if (diffMins < 60) return `${diffMins} ${t('minsAgo', 'мин. назад')}`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} ${t('hoursAgo', 'ч. назад')}`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return t('yesterday', 'Вчера');
    if (diffDays < 7) return `${diffDays} ${t('daysAgo', 'дн. назад')}`;
    return new Date(dateStr).toLocaleDateString();
  };

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await API.get('/notifications');
      if (res.data) {
        const nextList = res.data.notifications || [];
        const nextUnread = res.data.unreadCount || 0;
        
        if (prevUnreadRef.current !== null && nextUnread > prevUnreadRef.current) {
          playNotificationSound();
        }
        prevUnreadRef.current = nextUnread;

        setNotificationsList(nextList);
        setUnreadCount(nextUnread);
      }
    } catch (e) {
      console.warn('Failed to load notifications from API:', e);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const timer = setInterval(fetchNotifications, 40000);
    return () => clearInterval(timer);
  }, [fetchNotifications]);

  const markAllAsRead = async () => {
    try {
      await API.put('/notifications/read-all');
      setNotificationsList(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      prevUnreadRef.current = 0;
    } catch (e) {
      console.error('Error marking all as read:', e);
    }
  };

  const deleteNotification = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await API.delete(`/notifications/${id}`);
      setNotificationsList(prev => {
        const item = prev.find(n => n.id === id);
        if (item && !item.isRead) {
          setUnreadCount(c => {
            const next = Math.max(0, c - 1);
            prevUnreadRef.current = next;
            return next;
          });
        }
        return prev.filter(n => n.id !== id);
      });
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.isRead) {
      try {
        await API.put(`/notifications/${notif.id}/read`);
        setNotificationsList(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n));
        setUnreadCount(prev => {
          const next = Math.max(0, prev - 1);
          prevUnreadRef.current = next;
          return next;
        });
      } catch (e) {
        console.error('Error marking notification as read:', e);
      }
    }
    setShowNotifications(false);
    if (notif.link && notif.link.startsWith('/')) {
      navigate(notif.link);
    }
  };

  const languages = [
    { code: 'TM', name: 'Türkmençe', flag: '🇹🇲' },
    { code: 'RU', name: 'Русский', flag: '🇷🇺' },
    { code: 'EN', name: 'English', flag: '🇬🇧' },
  ];

  const currentLang = languages.find(l => l.code === (lang || 'TM')) || languages[0];
  const logoSrc = user?.logoUrl || user?.supplier?.logoUrl || (user?.companies?.[0] || user?.suppliers?.[0])?.logoUrl;

  // Дебаунс живого поиска при вводе запроса
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (trimmed.length < 2) {
      setSearchResults({ tenders: [], suppliers: [] });
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const promises = [
          API.get(`/tenders?search=${encodeURIComponent(trimmed)}`).catch(() => ({ data: [] })),
        ];
        if (isAdmin) {
          promises.push(
            API.get(`/suppliers?search=${encodeURIComponent(trimmed)}`).catch(() => ({ data: [] }))
          );
        }

        const [tendersRes, suppliersRes] = await Promise.all(promises);
        setSearchResults({
          tenders: Array.isArray(tendersRes.data) ? tendersRes.data.slice(0, 5) : [],
          suppliers: suppliersRes && Array.isArray(suppliersRes.data) ? suppliersRes.data.slice(0, 4) : [],
        });
        setShowSearchDropdown(true);
      } catch (err) {
        console.error('Global search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [searchQuery, isAdmin]);

  const profileContainerRef = useRef(null);
  const langContainerRef = useRef(null);

  // Закрытие выпадающих списков при клике вне контейнеров
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setShowSearchDropdown(false);
      }
      if (notifContainerRef.current && !notifContainerRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
      if (profileContainerRef.current && !profileContainerRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
      if (langContainerRef.current && !langContainerRef.current.contains(e.target)) {
        setShowLangMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className={`h-16 px-6 flex items-center justify-between sticky top-0 z-20 border-b shadow-xs transition-colors ${
      isDarkMode ? 'bg-[#111827] border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
    }`}>
      
      {/* 1. Навигация и интерактивный живой поиск */}
      <div className="flex items-center space-x-3 flex-1 mr-4 max-w-2xl" ref={searchContainerRef}>
        <div className="flex items-center space-x-1 shrink-0">
          <button 
            onClick={() => navigate(-1)} 
            className={`p-1.5 rounded-lg border transition-colors ${
              isDarkMode ? 'border-slate-800 hover:bg-slate-800 text-slate-400' : 'border-slate-200 hover:bg-slate-50 text-slate-400'
            }`}
          >
            <ChevronLeft size={16} />
          </button>
          <button 
            onClick={() => navigate(1)} 
            className={`p-1.5 rounded-lg border transition-colors ${
              isDarkMode ? 'border-slate-800 hover:bg-slate-800 text-slate-400' : 'border-slate-200 hover:bg-slate-50 text-slate-400'
            }`}
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Поле поиска с автокомплитом */}
        <div className="relative w-full">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (!showSearchDropdown && e.target.value.trim().length >= 2) {
                setShowSearchDropdown(true);
              }
            }}
            onFocus={() => {
              if (searchQuery.trim().length >= 2) setShowSearchDropdown(true);
            }}
            placeholder={t('searchPlaceholder', 'Поиск по тендерам, номерам лотов, товарам или поставщикам...')}
            className={`w-full pl-10 pr-9 py-2 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 ${theme.inputBg}`}
          />
          
          {/* Индикатор загрузки или кнопка сброса */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
            {isSearching ? (
              <Loader2 size={15} className="animate-spin text-emerald-500" />
            ) : searchQuery ? (
              <button 
                onClick={() => { setSearchQuery(''); setShowSearchDropdown(false); }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={15} />
              </button>
            ) : null}
          </div>

          {/* Выпадающий список результатов глобального поиска */}
          {showSearchDropdown && searchQuery.trim().length >= 2 && (
            <div className={`absolute left-0 right-0 mt-2 rounded-2xl border shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100 ${
              isDarkMode ? 'bg-[#0f172a] border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
            }`}>
              
              {searchResults.tenders.length === 0 && searchResults.suppliers.length === 0 && !isSearching ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  По запросу «<span className="font-semibold text-slate-700 dark:text-slate-200">{searchQuery}</span>» ничего не найдено
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
                  
                  {/* Группа: Тендеры */}
                  {searchResults.tenders.length > 0 && (
                    <div className="p-2">
                      <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                        <span>{t('tenders', 'Тендеры')}</span>
                        <span className="text-[10px] font-medium lowercase">найдено {searchResults.tenders.length}</span>
                      </div>
                      <div className="space-y-1">
                        {searchResults.tenders.map((tender) => (
                          <div
                            key={tender.id}
                            onClick={() => {
                              setShowSearchDropdown(false);
                              setSearchQuery('');
                              navigate(`/tenders/${tender.id}`);
                            }}
                            className={`p-2.5 rounded-xl cursor-pointer transition-colors flex items-center justify-between ${
                              isDarkMode ? 'hover:bg-slate-800/80' : 'hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                                <FileText size={16} />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center space-x-2">
                                  <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                    {tender.tenderNumber}
                                  </span>
                                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                                    tender.status === 'ACYK'
                                      ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                                      : tender.status === 'YENIJI_YGLAN_EDILDI'
                                      ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400'
                                      : 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400'
                                  }`}>
                                    {tender.status}
                                  </span>
                                </div>
                                <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate mt-0.5">
                                  {tender.title}
                                </p>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-xs font-bold text-slate-900 dark:text-white tabular-nums">
                                {Number(tender.price || 0).toLocaleString()} TMT
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Группа: Поставщики (для Администратора) */}
                  {isAdmin && searchResults.suppliers.length > 0 && (
                    <div className="p-2">
                      <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                        <span>{t('suppliersListTitle', 'Поставщики')}</span>
                        <span className="text-[10px] font-medium lowercase">найдено {searchResults.suppliers.length}</span>
                      </div>
                      <div className="space-y-1">
                        {searchResults.suppliers.map((supplier) => (
                          <div
                            key={supplier.id}
                            onClick={() => {
                              setShowSearchDropdown(false);
                              setSearchQuery('');
                              navigate(`/suppliers/${supplier.id}`);
                            }}
                            className={`p-2.5 rounded-xl cursor-pointer transition-colors flex items-center justify-between ${
                              isDarkMode ? 'hover:bg-slate-800/80' : 'hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                                <Building2 size={16} />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                                  {supplier.name}
                                </p>
                                <p className="text-[11px] text-slate-400 truncate">
                                  {supplier.region || 'г. Ашхабад'} • {supplier.taxId ? `ИНН: ${supplier.taxId}` : 'Верифицирован'}
                                </p>
                              </div>
                            </div>
                            <ArrowRight size={14} className="text-slate-400 shrink-0" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 2. Правые инструменты (Язык + Центр уведомлений + Настройки + Профиль) */}
      <div className="flex items-center space-x-3">
        
        {/* Выбор языка */}
        <div className="relative" ref={langContainerRef}>
          <button
            onClick={() => setShowLangMenu(!showLangMenu)}
            className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold ${
              isDarkMode ? 'border-slate-800 hover:bg-slate-800' : 'border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Globe size={15} className="text-slate-400" />
            <span>{currentLang.name}</span>
          </button>

          {showLangMenu && (
            <div className={`absolute right-0 mt-2 w-36 rounded-xl border shadow-xl p-1 z-50 text-xs animate-in zoom-in-95 ${
              isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
            }`}>
              {languages.map((l) => (
                <button
                  key={l.code}
                  onClick={() => {
                    if (setLang) setLang(l.code);
                    setShowLangMenu(false);
                  }}
                  className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-left transition-colors ${
                    currentLang.code === l.code ? (isDarkMode ? 'bg-slate-800 font-bold' : 'bg-slate-100 font-bold') : 'hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <span>{l.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 🔔 Интерактивный Центр уведомлений */}
        <div className="relative" ref={notifContainerRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className={`p-2 rounded-xl relative transition-all ${
              showNotifications 
                ? isDarkMode ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-900' 
                : isDarkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'
            }`} 
            title="Центр уведомлений"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className={`absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center text-white ring-2 ${
                isDarkMode ? 'ring-[#111827]' : 'ring-white'
              } ${isAdmin ? 'bg-emerald-600' : 'bg-blue-600'} animate-pulse`}>
                {unreadCount}
              </span>
            )}
          </button>

          {/* Выпадающая панель уведомлений */}
          {showNotifications && (
            <div className={`absolute right-0 mt-2 w-84 sm:w-96 rounded-2xl border shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100 ${
              isDarkMode ? 'bg-[#0f172a] border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
            }`}>
              
              {/* Шапка уведомлений */}
              <div className={`px-4 py-3 border-b flex items-center justify-between ${
                isDarkMode ? 'border-slate-800 bg-slate-900/70' : 'border-slate-100 bg-slate-50/80'
              }`}>
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
                    {t('notificationsTitle', 'Уведомления')}
                  </h3>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      {unreadCount} новых
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center space-x-1"
                  >
                    <CheckCheck size={13} />
                    <span>{t('markAllAsRead', 'Прочитать все')}</span>
                  </button>
                )}
              </div>

              {/* Табы фильтрации: Все / Непрочитанные */}
              <div className={`px-3 py-1.5 border-b flex items-center space-x-1 text-xs font-semibold ${
                isDarkMode ? 'border-slate-800/80 bg-slate-900/40' : 'border-slate-100 bg-slate-50/50'
              }`}>
                <button
                  type="button"
                  onClick={() => setNotifFilter('all')}
                  className={`px-2.5 py-1 rounded-lg transition-colors flex items-center space-x-1.5 ${
                    notifFilter === 'all'
                      ? isDarkMode ? 'bg-slate-800 text-white font-bold' : 'bg-white shadow-sm text-slate-900 font-bold'
                      : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                  }`}
                >
                  <span>Все</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                    {notificationsList.length}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setNotifFilter('unread')}
                  className={`px-2.5 py-1 rounded-lg transition-colors flex items-center space-x-1.5 ${
                    notifFilter === 'unread'
                      ? isDarkMode ? 'bg-slate-800 text-emerald-400 font-bold' : 'bg-white shadow-sm text-emerald-600 font-bold'
                      : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                  }`}
                >
                  <span>Непрочитанные</span>
                  {unreadCount > 0 && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
                      {unreadCount}
                    </span>
                  )}
                </button>
              </div>

              {/* Список уведомлений */}
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
                {(() => {
                  const filteredList = notifFilter === 'unread' 
                    ? notificationsList.filter(n => !n.isRead) 
                    : notificationsList;

                  if (filteredList.length === 0) {
                    return (
                      <div className="p-8 text-center text-slate-400 space-y-1">
                        <Inbox size={28} className="mx-auto opacity-30 text-emerald-500 mb-2" />
                        <p className="text-xs font-semibold">
                          {notifFilter === 'unread' ? 'Нет непрочитанных уведомлений' : t('noNotificationsTitle', 'Нет новых уведомлений')}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {notifFilter === 'unread' ? 'Все уведомления прочитаны' : t('noNotificationsHint', 'Все важные события по закупкам и предложениям появятся здесь')}
                        </p>
                      </div>
                    );
                  }

                  return filteredList.map((notif) => {
                    const isRead = Boolean(notif.isRead);
                    return (
                      <div
                        key={notif.id}
                        onClick={() => handleNotificationClick(notif)}
                        className={`group p-3.5 cursor-pointer transition-colors flex items-start space-x-3 ${
                          isRead 
                            ? isDarkMode ? 'opacity-70 hover:bg-slate-800/40' : 'opacity-75 hover:bg-slate-50/70' 
                            : isDarkMode ? 'bg-slate-850 hover:bg-slate-800 font-medium' : 'bg-emerald-50/30 hover:bg-emerald-50/50'
                        }`}
                      >
                        {/* Иконка типа */}
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                          notif.type === 'winner' 
                            ? 'bg-amber-500/10 text-amber-500' 
                            : notif.type === 'supplier'
                            ? 'bg-blue-500/10 text-blue-500'
                            : notif.type === 'offer'
                            ? 'bg-emerald-500/10 text-emerald-500'
                            : notif.type === 'warning'
                            ? 'bg-rose-500/10 text-rose-500'
                            : 'bg-purple-500/10 text-purple-500'
                        }`}>
                          {notif.type === 'winner' ? <Trophy size={16} /> :
                           notif.type === 'supplier' ? <ShieldCheck size={16} /> :
                           notif.type === 'offer' ? <FileText size={16} /> :
                           notif.type === 'warning' ? <AlertCircle size={16} /> :
                           <Clock size={16} />}
                        </div>

                        {/* Текст уведомления */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <p className={`text-xs ${isRead ? 'text-slate-800 dark:text-slate-200' : 'font-bold text-slate-900 dark:text-white'}`}>
                              {notif.title}
                            </p>
                            <div className="flex items-center space-x-1 shrink-0">
                              {!isRead && (
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              )}
                              <button
                                type="button"
                                onClick={(e) => deleteNotification(notif.id, e)}
                                className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-all"
                                title="Удалить"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed line-clamp-2">
                            {notif.message || notif.description}
                          </p>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 inline-block">
                            {formatTimeAgo(notif.createdAt || notif.time)}
                          </span>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>

              {/* Подвал */}
              <div className={`p-2.5 text-center border-t text-[11px] font-semibold text-slate-500 dark:text-slate-400 ${
                isDarkMode ? 'border-slate-800 bg-slate-900/60' : 'border-slate-100 bg-slate-50/70'
              }`}>
                Центр оперативных уведомлений тендерной платформы
              </div>

            </div>
          )}
        </div>

        {/* 🟢 Кнопка Настройки */}
        <button
          onClick={() => { if (onNavigate) onNavigate('settings'); }}
          className={`p-2 rounded-xl transition-colors ${
            isDarkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'
          }`}
          title="Настройки"
        >
          <Settings size={18} />
        </button>

        <div className={`h-6 w-px ${isDarkMode ? 'bg-slate-800' : 'bg-slate-200'}`}></div>

        {/* 🟢 Профиль */}
        <div className="relative" ref={profileContainerRef}>
          <div
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className={`flex items-center space-x-1 cursor-pointer p-1 rounded-full transition-colors ${
              isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'
            }`}
          >
            {logoSrc && !imgError ? (
              <img
                src={resolveFileUrl(logoSrc)}
                alt="Logo"
                onError={() => setImgError(true)}
                className="w-9 h-9 rounded-full object-cover border border-slate-200 shadow-xs"
              />
            ) : (
              <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs tracking-wider text-white ${
                isAdmin ? 'bg-emerald-600 shadow-sm shadow-emerald-500/30' : 'bg-blue-600 shadow-sm shadow-blue-500/30'
              }`}>
                {getAvatarInitials(user, role)}
              </div>
            )}
            <ChevronDown size={16} className="text-slate-500" />
          </div>

          {showProfileMenu && (
            <div className={`absolute right-0 mt-2 w-56 rounded-xl border shadow-xl p-3 z-50 animate-in zoom-in-95 ${
              isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-100 text-slate-800'
            }`}>
              <div className="border-b pb-3 mb-2 border-slate-200 dark:border-slate-700">
                <p className="font-bold text-sm">
                  {((user?.companies?.[0] || user?.suppliers?.[0])?.name && role !== 'ADMIN') 
                    ? (user?.companies?.[0] || user?.suppliers?.[0])?.name 
                    : (user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : (role === 'ADMIN' ? 'Admin Admin' : 'Supplier Supplier'))}
                </p>
                <p className={`text-xs capitalize ${theme.subText}`}>
                  {role === 'ADMIN' ? t('adminStr', 'Admin') : t('supplierStr', 'Üpjün ediji')}
                </p>
              </div>
              <div className="space-y-1">
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    if (onNavigate) onNavigate('profile');
                  }}
                  className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-left text-xs font-semibold transition-colors ${
                    isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-50'
                  }`}
                >
                  <User size={14} />
                  <span>{t('profile', 'Profil')}</span>
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}

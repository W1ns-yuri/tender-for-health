import React, { useState } from 'react';
import { Search, Bell, Settings, ChevronLeft, ChevronRight, Globe, ChevronDown, User, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getRoleTheme } from '../utils/themeUtils';
import { getTranslation } from '../utils/translations';

export default function Header({ user, role, setRole, isDarkMode, lang, setLang, onNavigate }) {
  const theme = getRoleTheme(role, isDarkMode);
  const isAdmin = role === 'ADMIN';
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const navigate = useNavigate();
  const t = (key, fallback) => getTranslation(lang, key, fallback);

  const languages = [
    { code: 'TM', name: 'Türkmençe', flag: '🇹🇲' },
    { code: 'RU', name: 'Русский', flag: '🇷🇺' },
    { code: 'EN', name: 'English', flag: '🇬🇧' },
  ];

  const currentLang = languages.find(l => l.code === (lang || 'TM')) || languages[0];

  return (
    <header className={`h-16 px-6 flex items-center justify-between sticky top-0 z-20 border-b shadow-xs transition-colors ${isDarkMode ? 'bg-[#111827] border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'}`}>
      {/* 1. Навигация и поиск */}
      <div className="flex items-center space-x-3 flex-1 mr-4">
        <div className="flex items-center space-x-1">
          <button onClick={() => navigate(-1)} className={`p-1.5 rounded-lg border ${isDarkMode ? 'border-slate-800 hover:bg-slate-800 text-slate-400' : 'border-slate-200 hover:bg-slate-50 text-slate-400'} transition-colors`}>
            <ChevronLeft size={16} />
          </button>
          <button onClick={() => navigate(1)} className={`p-1.5 rounded-lg border ${isDarkMode ? 'border-slate-800 hover:bg-slate-800 text-slate-400' : 'border-slate-200 hover:bg-slate-50 text-slate-400'} transition-colors`}>
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="relative w-full">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={t('searchPlaceholder', 'Gözleg...')}
            className={`w-full pl-10 pr-4 py-2 rounded-lg text-sm transition-all focus:outline-none focus:ring-2 ${theme.inputBg}`}
          />
        </div>
      </div>

      {/* 2. Правые инструменты */}
      <div className="flex items-center space-x-3">
        {/* Переключатель роли */}
        <div className={`flex items-center p-1 rounded-lg text-xs font-medium ${isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
          <button
            onClick={() => setRole('SUPPLIER')}
            className={`px-3 py-1 rounded-md transition-all ${role === 'SUPPLIER' ? 'bg-blue-700 text-white shadow-xs font-bold' : 'hover:text-slate-900'}`}
          >
            {t('supplierStr', 'Üpjün ediji')}
          </button>
          <button
            onClick={() => setRole('ADMIN')}
            className={`px-3 py-1 rounded-md transition-all ${role === 'ADMIN' ? 'bg-teal-600 text-white shadow-xs font-bold' : 'hover:text-slate-900'}`}
          >
            {t('adminStr', 'Admin')}
          </button>
        </div>

        {/* Выбор языка */}
        <div className="relative">
          <button
            onClick={() => setShowLangMenu(!showLangMenu)}
            className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold ${isDarkMode ? 'border-slate-800 hover:bg-slate-800' : 'border-slate-200 hover:bg-slate-50'}`}
          >
            <Globe size={15} className="text-slate-400" />
            <span>{currentLang.flag} {currentLang.code}</span>
          </button>

          {showLangMenu && (
            <div className={`absolute right-0 mt-2 w-36 rounded-xl border shadow-xl p-1 z-50 text-xs animate-in zoom-in-95 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
              {languages.map((l) => (
                <button
                  key={l.code}
                  onClick={() => {
                    if (setLang) setLang(l.code);
                    setShowLangMenu(false);
                  }}
                  className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-left transition-colors ${currentLang.code === l.code ? (isDarkMode ? 'bg-slate-800 font-bold' : 'bg-slate-100 font-bold') : 'hover:bg-slate-50 hover:text-slate-900'}`}
                >
                  <span className="text-sm">{l.flag}</span>
                  <span>{l.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <button className={`p-2 rounded-lg relative transition-colors ${isDarkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`} title="Уведомления">
          <Bell size={18} />
          <span className={`absolute top-1.5 right-1.5 w-2 h-2 rounded-full ring-2 ${isAdmin ? 'bg-teal-500' : 'bg-blue-600'} ring-white`}></span>
        </button>

        {/* 🟢 Кнопка Настройки переводит на страницу Настройки */}
        <button
          onClick={() => { if (onNavigate) onNavigate('settings'); }}
          className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}
          title="Настройки"
        >
          <Settings size={18} />
        </button>

        <div className={`h-6 w-px ${isDarkMode ? 'bg-slate-800' : 'bg-slate-200'}`}></div>

        {/* 🟢 Клик по профилю открывает дропдаун с инфой */}
        <div className="relative">
          <div
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className={`flex items-center space-x-1 cursor-pointer p-1 rounded-full hover:bg-slate-100 ${isDarkMode ? 'hover:bg-slate-800' : ''}`}
          >
            <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-white ${isAdmin ? 'bg-teal-600' : 'bg-blue-700'}`}>
              {((user?.companies?.[0] || user?.suppliers?.[0])?.name && role !== 'ADMIN') ? (user.companies?.[0] || user.suppliers?.[0]).name[0].toUpperCase() : (user?.firstName ? user.firstName[0].toUpperCase() : (role === 'ADMIN' ? 'A' : 'Ü'))}
            </div>
            <ChevronDown size={16} className="text-slate-500" />
          </div>

          {showProfileMenu && (
            <div className={`absolute right-0 mt-2 w-56 rounded-xl border shadow-xl p-3 z-50 animate-in zoom-in-95 ${isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-100 text-slate-800'}`}>
              <div className="border-b pb-3 mb-2 border-slate-200 dark:border-slate-700">
                <p className="font-bold text-sm">
                  {((user?.companies?.[0] || user?.suppliers?.[0])?.name && role !== 'ADMIN') ? (user.companies?.[0] || user.suppliers?.[0]).name : (user?.firstName ? `${user.firstName} ${user.lastName || ''}` : (role === 'ADMIN' ? 'Admin Admin' : 'Supplier Supplier'))}
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
                  className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-left text-xs font-semibold transition-colors ${isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-50'}`}
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

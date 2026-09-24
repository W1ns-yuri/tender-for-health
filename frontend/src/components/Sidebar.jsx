import React from 'react';
import {
  Home,
  FileText,
  Send,
  Trophy,
  User,
  Settings,
  Sun,
  Moon,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Database,
  ShieldAlert,
  PlusCircle,
  Users,
  Package,
  BarChart3
} from 'lucide-react';
import { getRoleTheme } from '../utils/themeUtils';
import { getTranslation } from '../utils/translations';

export default function Sidebar({
  activeTab,
  setActiveTab,
  role,
  isCollapsed,
  setIsCollapsed,
  isDarkMode,
  setIsDarkMode,
  lang = 'RU',
  onLogout
}) {
  const theme = getRoleTheme(role, isDarkMode);
  const isAdmin = role === 'ADMIN';
  const t = (key, fallback) => getTranslation(lang, key, fallback);

  return (
    <aside
      className={`${
        isCollapsed ? 'w-20' : 'w-64'
      } ${isDarkMode ? 'bg-[#0f172a] border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'} border-r flex flex-col justify-between transition-all duration-300 h-screen sticky top-0 z-30 shadow-xs select-none`}
    >
      {/* 1. Верхняя часть: Логотип */}
      <div className="flex-1 overflow-y-auto">
        <div className={`p-5 border-b ${isDarkMode ? 'border-slate-800' : 'border-slate-100'} flex items-center justify-between`}>
          {!isCollapsed && (
            <div>
              <h1 className="font-bold text-lg tracking-tight">Tender ulgamy</h1>
              <p className={`text-xs ${theme.subText} font-medium`}>{isAdmin ? t('adminStr', 'Admin') : t('supplierStr', 'Üpjün ediji')}</p>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`p-1.5 rounded-lg ${isDarkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-400'} transition-colors`}
            title="Свернуть меню"
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* 2. Навигация ESASY */}
        <div className="p-3">
          {!isCollapsed && <p className={`px-3 text-[11px] font-semibold ${theme.subText} uppercase tracking-wider mb-2`}>{t('mainSection', 'Esasy')}</p>}

          <nav className="space-y-1">
            {/* 1. Главная */}
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'px-3'} py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'dashboard'
                  ? theme.primaryBg + ' font-semibold shadow-sm'
                  : isDarkMode ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Home size={19} />
              {!isCollapsed && <span className="ml-3">{t('home', 'Baş sahypa')}</span>}
            </button>

            {/* ДЛЯ АДМИНА */}
            {isAdmin ? (
              <>
                <button
                  onClick={() => setActiveTab('analytics')}
                  className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'px-3'} py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'analytics'
                      ? theme.primaryBg + ' font-semibold shadow-sm'
                      : isDarkMode ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <BarChart3 size={19} />
                  {!isCollapsed && <span className="ml-3">{t('analyticsNav', 'Аналитика')}</span>}
                </button>

                <button
                  onClick={() => setActiveTab('create-tender')}
                  className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'px-3'} py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'create-tender'
                      ? theme.primaryBg + ' font-semibold shadow-sm'
                      : isDarkMode ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <PlusCircle size={19} />
                  {!isCollapsed && <span className="ml-3">{t('createTenderBtn', 'Täze tender döretmek')}</span>}
                </button>

                <button
                  onClick={() => setActiveTab('tenders')}
                  className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'px-3'} py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'tenders'
                      ? theme.primaryBg + ' font-semibold shadow-sm'
                      : isDarkMode ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <FileText size={19} />
                  {!isCollapsed && <span className="ml-3">{t('allTenders', 'Ähli tenderler')}</span>}
                </button>

                <button
                  onClick={() => setActiveTab('offers')}
                  className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'px-3'} py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'offers'
                      ? theme.primaryBg + ' font-semibold shadow-sm'
                      : isDarkMode ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Send size={19} />
                  {!isCollapsed && <span className="ml-3">{t('submittedOffers', 'Поданные предложения')}</span>}
                </button>

                <button
                  onClick={() => setActiveTab('suppliers')}
                  className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'px-3'} py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'suppliers'
                      ? theme.primaryBg + ' font-semibold shadow-sm'
                      : isDarkMode ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Users size={19} />
                  {!isCollapsed && <span className="ml-3">{t('suppliersListTitle', 'Üpjün edijiler')}</span>}
                </button>

                <button
                  onClick={() => setActiveTab('evaluation')}
                  className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'px-3'} py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'evaluation'
                      ? theme.primaryBg + ' font-semibold shadow-sm'
                      : isDarkMode ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Trophy size={19} />
                  {!isCollapsed && <span className="ml-3">{t('evaluationTab', 'Оценка заявок')}</span>}
                </button>

                <button
                  onClick={() => setActiveTab('settings')}
                  className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'px-3'} py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'settings'
                      ? theme.primaryBg + ' font-semibold shadow-sm'
                      : isDarkMode ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Settings size={19} />
                  {!isCollapsed && <span className="ml-3">{t('settings', 'Sazlamalar')}</span>}
                </button>
              </>
            ) : (
              /* ДЛЯ ПОСТАВЩИКА */
              <>
                <button
                  onClick={() => setActiveTab('tenders')}
                  className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'px-3'} py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'tenders'
                      ? theme.primaryBg + ' font-semibold shadow-sm'
                      : isDarkMode ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <FileText size={19} />
                  {!isCollapsed && <span className="ml-3">{t('tenders', 'Tenderler')}</span>}
                </button>

                <button
                  onClick={() => setActiveTab('offers')}
                  className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'px-3'} py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'offers'
                      ? theme.primaryBg + ' font-semibold shadow-sm'
                      : isDarkMode ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Send size={19} />
                  {!isCollapsed && <span className="ml-3">{t('myOffers', 'Tekliplerim')}</span>}
                </button>

                <button
                  onClick={() => setActiveTab('evaluation')}
                  className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'px-3'} py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'evaluation'
                      ? theme.primaryBg + ' font-semibold shadow-sm'
                      : isDarkMode ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Trophy size={19} />
                  {!isCollapsed && <span className="ml-3">{t('winners', 'Ýeňijilik')}</span>}
                </button>


                <button
                  onClick={() => setActiveTab('profile')}
                  className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'px-3'} py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'profile'
                      ? theme.primaryBg + ' font-semibold shadow-sm'
                      : isDarkMode ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <User size={19} />
                  {!isCollapsed && <span className="ml-3">{t('profile', 'Profil')}</span>}
                </button>

                <button
                  onClick={() => setActiveTab('settings')}
                  className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'px-3'} py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'settings'
                      ? theme.primaryBg + ' font-semibold shadow-sm'
                      : isDarkMode ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Settings size={19} />
                  {!isCollapsed && <span className="ml-3">{t('settings', 'Sazlamalar')}</span>}
                </button>
              </>
            )}
          </nav>
        </div>

        {/* 3. Секция Управления */}
        {isAdmin && (
          <div className={`p-3 border-t ${isDarkMode ? 'border-slate-800' : 'border-slate-100'} mt-2`}>
            {!isCollapsed && <p className={`px-3 text-[11px] font-semibold ${theme.subText} uppercase tracking-wider mb-2`}>{t('managementSection', 'Dolandyryş')}</p>}
            <nav className="space-y-1">
              <button
                onClick={() => setActiveTab('umumy')}
                className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'px-3'} py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'umumy'
                    ? theme.primaryBg + ' font-semibold shadow-sm'
                    : isDarkMode ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Database size={19} />
                {!isCollapsed && <span className="ml-3">{t('sectionDirectories', 'Gollanmalar')}</span>}
              </button>

              <button
                onClick={() => setActiveTab('haryt')}
                className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'px-3'} py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'haryt'
                    ? theme.primaryBg + ' font-semibold shadow-sm'
                    : isDarkMode ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Package size={19} />
                {!isCollapsed && <span className="ml-3">{t('sectionProducts', 'Haryt katalogy')}</span>}
              </button>

              <button
                onClick={() => setActiveTab('administrasiya')}
                className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'px-3'} py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'administrasiya'
                    ? theme.primaryBg + ' font-semibold shadow-sm'
                    : isDarkMode ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <ShieldAlert size={19} />
                {!isCollapsed && <span className="ml-3">{t('sectionActivityLogs', 'Hereketler gündeligi')}</span>}
              </button>
            </nav>
          </div>
        )}
      </div>

      {/* 4. Футер */}
      <div className={`p-3 border-t ${isDarkMode ? 'border-slate-800 bg-[#0b0f17]' : 'border-slate-100 bg-slate-50/50'} space-y-2 shrink-0`}>
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} px-3 py-2 text-sm`}>
          <div className="flex items-center space-x-2">
            {isDarkMode ? <Moon size={18} className="text-indigo-400" /> : <Sun size={18} className="text-amber-500" />}
            {!isCollapsed && <span className="font-medium">{isDarkMode ? t('darkMode', 'Garaňky') : t('lightMode', 'Ýagty')}</span>}
          </div>
          {!isCollapsed && (
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`w-10 h-5 flex items-center rounded-full p-1 transition-colors ${isDarkMode ? 'bg-indigo-600' : 'bg-slate-300'}`}
            >
              <div className={`bg-white w-3.5 h-3.5 rounded-full shadow-md transform transition-transform ${isDarkMode ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          )}
        </div>

        <button
          onClick={onLogout}
          className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'px-3'} py-2.5 rounded-lg text-sm font-medium text-rose-500 hover:bg-rose-500/10 transition-colors`}
        >
          <LogOut size={18} />
          {!isCollapsed && <span className="ml-3">{t('logout', 'Ulgamdan çykmak')}</span>}
        </button>
      </div>
    </aside>
  );
}

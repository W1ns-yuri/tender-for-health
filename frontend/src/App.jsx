import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ErrorBoundary from './components/ErrorBoundary';
import API from './services/api';

import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import Tenders from './pages/Tenders';
import TenderDetails from './pages/TenderDetails';
import MyOffers from './pages/MyOffers';
import Evaluation from './pages/Evaluation';
import SupplierWins from './pages/SupplierWins';
import AdminCatalogs from './pages/AdminCatalogs';
import AdminLogs from './pages/AdminLogs';
import CreateTenderPage from './pages/CreateTenderPage';
import SuppliersList from './pages/SuppliersList';
import SupplierProfilePage from './pages/SupplierProfilePage';
import CreateOfferPage from './pages/CreateOfferPage';
import OfferDetailsPage from './pages/OfferDetailsPage';
import { getRoleTheme } from './utils/themeUtils';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('tender_token') || '');
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('tender_user')) || null;
    } catch {
      return null;
    }
  });

  const [role, setRole] = useState(user?.roleType || 'SUPPLIER');
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const pathParts = location.pathname.split('/').filter(Boolean);
  const activeTab = pathParts.length > 0 ? pathParts[0] : 'dashboard';

  const setActiveTab = (tab) => {
    navigate(`/${tab}`);
  };

  // Язык по умолчанию — RU
  const [lang, setLang] = useState('RU');

  const theme = getRoleTheme(role, isDarkMode);

  // Синхронизация сессии при монтировании
  useEffect(() => {
    const fetchUser = async () => {
      if (token) {
        try {
          const res = await API.get('/auth/me');
          setUser(res.data);
          localStorage.setItem('tender_user', JSON.stringify(res.data));
        } catch (error) {
          console.warn('Session expired or user not found, logging out...');
          handleLogout();
        }
      }
    };
    fetchUser();
  }, [token]); // Запускаем при изменении токена или первом рендере

  useEffect(() => {
    if (user?.roleType) {
      setRole(user.roleType);
    }
  }, [user]);

  const handleLoginSuccess = (userData, userToken) => {
    setUser(userData);
    setToken(userToken);
    setRole(userData.roleType || 'SUPPLIER');
    navigate('/dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('tender_token');
    localStorage.removeItem('tender_user');
    setToken('');
    setUser(null);
  };

  const handleNavigate = (tab, tenderId = null) => {
    if (tenderId) {
      navigate(`/${tab}/${tenderId}`);
    } else {
      navigate(`/${tab}`);
    }
  };

  if (!token) {
    return (
    <Routes>
      <Route path="/login" element={<LoginPage onLoginSuccess={handleLoginSuccess} lang={lang} setLang={setLang} />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
  }

  return (
    <div className={`h-screen w-screen overflow-hidden flex font-sans ${isDarkMode ? 'bg-[#0b0f17] text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
      {/* 1. Боковое меню */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        role={role}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        lang={lang}
        onLogout={handleLogout}
      />

      {/* 2. Главная область приложения */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Header
          user={user}
          role={role}
          setRole={setRole}
          isDarkMode={isDarkMode}
          lang={lang}
          setLang={setLang}
          onNavigate={handleNavigate}
        />

        {/* 🟢 ЦЕНТРАЛЬНОЕ ОКНО С ЗАЩИТОЙ ERROR BOUNDARY */}
        <main className={`p-6 flex-1 overflow-y-auto ${isDarkMode ? 'bg-[#0b0f17]' : 'bg-slate-50'}`}>
          <ErrorBoundary onReset={() => navigate('/dashboard')}>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={
                <Dashboard
                  role={role}
                  onNavigate={handleNavigate}
                  onOpenCreateTender={() => navigate('/create-tender')}
                  isDarkMode={isDarkMode}
                  lang={lang}
                />
              } />
              
              <Route path="/create-tender" element={<CreateTenderPage onNavigate={handleNavigate} role={role} isDarkMode={isDarkMode} lang={lang} />} />
              <Route path="/suppliers" element={<SuppliersList role={role} isDarkMode={isDarkMode} lang={lang} />} />
              <Route path="/suppliers/:id" element={<SupplierProfilePage role={role} isDarkMode={isDarkMode} lang={lang} />} />
              <Route path="/tenders" element={<Tenders onNavigate={handleNavigate} role={role} isDarkMode={isDarkMode} lang={lang} />} />
              <Route path="/tenders/:id" element={<TenderDetails onNavigate={handleNavigate} role={role} isDarkMode={isDarkMode} lang={lang} />} />
              <Route path="/tender-details/:id" element={<TenderDetails onNavigate={handleNavigate} role={role} isDarkMode={isDarkMode} lang={lang} />} />
              <Route path="/create-offer/:id" element={<CreateOfferPage role={role} isDarkMode={isDarkMode} lang={lang} />} />
              <Route path="/offers" element={<MyOffers role={role} isDarkMode={isDarkMode} lang={lang} />} />
              <Route path="/offers/:id" element={<OfferDetailsPage role={role} isDarkMode={isDarkMode} lang={lang} />} />
              <Route path="/evaluation" element={role === 'SUPPLIER' ? <SupplierWins role={role} isDarkMode={isDarkMode} lang={lang} /> : <Evaluation role={role} isDarkMode={isDarkMode} lang={lang} />} />
              <Route path="/umumy" element={role === 'ADMIN' ? <AdminCatalogs section="umumy" role={role} isDarkMode={isDarkMode} lang={lang} /> : <Navigate to="/dashboard" replace />} />
              <Route path="/haryt" element={role === 'ADMIN' ? <AdminCatalogs section="haryt" role={role} isDarkMode={isDarkMode} lang={lang} /> : <Navigate to="/dashboard" replace />} />
              <Route path="/administrasiya" element={role === 'ADMIN' ? <AdminCatalogs section="administrasiya" role={role} isDarkMode={isDarkMode} lang={lang} /> : <Navigate to="/dashboard" replace />} />
              <Route path="/logs" element={role === 'ADMIN' ? <AdminLogs role={role} isDarkMode={isDarkMode} lang={lang} /> : <Navigate to="/dashboard" replace />} />
              <Route path="/admin-logs" element={role === 'ADMIN' ? <AdminLogs role={role} isDarkMode={isDarkMode} lang={lang} /> : <Navigate to="/dashboard" replace />} />
              
              <Route path="/profile" element={<SupplierProfilePage role={role} isDarkMode={isDarkMode} lang={lang} isOwner={true} />} />
              
              <Route path="/settings" element={
                <div className={`p-6 rounded-xl border shadow-xs max-w-xl ${theme.cardBg}`}>
                  <h2 className="text-lg font-bold mb-4">{lang === 'RU' ? 'Системные настройки' : 'Ulgam sazlamalary'}</h2>
                  <div className="space-y-4 text-xs">
                    <div>
                      <label className={`block font-semibold mb-1 ${theme.subText}`}>
                        {lang === 'RU' ? 'Язык интерфейса приложения' : 'Выбор языка интерфейса'}
                      </label>
                      <select
                        value={lang}
                        onChange={(e) => setLang(e.target.value)}
                        className={`w-full p-2.5 rounded-lg border text-xs ${theme.inputBg}`}
                      >
                        <option value="RU">Русский (По умолчанию)</option>
                        <option value="TM">Türkmençe</option>
                        <option value="EN">English</option>
                      </select>
                    </div>
                  </div>
                </div>
              } />
            </Routes>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}

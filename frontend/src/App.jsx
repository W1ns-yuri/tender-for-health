import React, { useState, useEffect, useRef } from 'react';
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
import EvaluationDetailsPage from './pages/EvaluationDetailsPage';
import SupplierWins from './pages/SupplierWins';
import AdminCatalogs from './pages/AdminCatalogs';
import AdminLogs from './pages/AdminLogs';
import CreateTenderPage from './pages/CreateTenderPage';
import SuppliersList from './pages/SuppliersList';
import SupplierProfilePage from './pages/SupplierProfilePage';
import CreateOfferPage from './pages/CreateOfferPage';
import OfferDetailsPage from './pages/OfferDetailsPage';
import UiKitGallery from './pages/UiKitGallery';
import { AlertProvider } from './context/AlertContext';
import SettingsPage from './pages/SettingsPage';
import AnalyticsPage from './pages/AnalyticsPage';

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
  const autoCollapsedRef = useRef(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('tender_theme') === 'dark';
  });

  // Автоматически сворачивать сайдбар ТОЛЬКО для администратора при детальной оценке заявок тендера
  useEffect(() => {
    const isAdminReviewingBids = role === 'ADMIN' && (
      location.pathname.startsWith('/evaluation/') || 
      location.pathname.startsWith('/admin/evaluations/')
    );

    if (isAdminReviewingBids) {
      if (!isCollapsed && !autoCollapsedRef.current) {
        autoCollapsedRef.current = true;
        setIsCollapsed(true);
      }
    } else if (autoCollapsedRef.current) {
      autoCollapsedRef.current = false;
      setIsCollapsed(false);
    }
  }, [location.pathname, isCollapsed, role]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('tender_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('tender_theme', 'light');
    }
  }, [isDarkMode]);

  // Интеллектуальное определение активной вкладки сайдбара по текущему URL
  const getActiveTab = (pathname) => {
    if (!pathname || pathname === '/') return 'dashboard';
    if (pathname.startsWith('/create-tender')) return 'create-tender';
    if (
      pathname.startsWith('/tenders') ||
      pathname.startsWith('/tender-details') ||
      pathname.startsWith('/create-offer')
    ) {
      return 'tenders';
    }
    if (pathname.startsWith('/suppliers')) return 'suppliers';
    if (pathname.startsWith('/offers') || pathname.startsWith('/my-offers')) return 'offers';
    if (pathname.startsWith('/evaluation') || pathname.startsWith('/admin/evaluations')) return 'evaluation';
    if (pathname.startsWith('/analytics')) return 'analytics';
    if (pathname.startsWith('/settings')) return 'settings';
    if (pathname.startsWith('/profile')) return 'profile';
    if (pathname.startsWith('/umumy') || pathname.startsWith('/catalogs') || pathname.startsWith('/catalog')) return 'umumy';
    if (pathname.startsWith('/haryt') || pathname.startsWith('/products')) return 'haryt';
    if (pathname.startsWith('/administrasiya') || pathname.startsWith('/logs') || pathname.startsWith('/admin-logs')) return 'administrasiya';
    if (pathname.startsWith('/dashboard')) return 'dashboard';

    const pathParts = pathname.split('/').filter(Boolean);
    return pathParts.length > 0 ? pathParts[0] : 'dashboard';
  };

  const activeTab = getActiveTab(location.pathname);

  const setActiveTab = (tab) => {
    navigate(`/${tab}`);
  };

  // Язык по умолчанию — RU
  const [lang, setLang] = useState('RU');

  // Синхронизация сессии при монтировании
  useEffect(() => {
    let isMounted = true;
    let retryTimeout = null;

    const fetchUser = async (retriesLeft = 2) => {
      if (!token) return;

      try {
        const res = await API.get('/auth/me');
        if (isMounted) {
          setUser(res.data);
          localStorage.setItem('tender_user', JSON.stringify(res.data));
        }
      } catch (error) {
        // Вылогиниваем ТОЛЬКО если сервер подтвердил недействительность токена (401 или 404 пользователя)
        if (error.response?.status === 401 || (error.response?.status === 404 && error.config?.url?.includes('/auth/me'))) {
          console.warn('Session expired or user not found, logging out...');
          if (isMounted) handleLogout();
        } else if (!error.response || error.response.status === 502 || error.response.status === 503) {
          // Если сервер еще запускается (502/503), не сбрасываем сессию, а повторяем запрос через 1.5 сек
          if (retriesLeft > 0) {
            retryTimeout = setTimeout(() => {
              if (isMounted) fetchUser(retriesLeft - 1);
            }, 1500);
          }
        }
      }
    };

    fetchUser();

    return () => {
      isMounted = false;
      if (retryTimeout) clearTimeout(retryTimeout);
    };
  }, [token]);

  useEffect(() => {
    if (user?.roleType) {
      setRole(user.roleType);
    }
  }, [user]);

  const handleLoginSuccess = (userData, userToken) => {
    setUser(userData);
    setToken(userToken);
    setRole(userData.roleType || 'SUPPLIER');
    navigate('/dashboard', { replace: true });
  };

  const handleLogout = () => {
    localStorage.removeItem('tender_token');
    localStorage.removeItem('tender_user');
    setToken('');
    setUser(null);
  };

  const handleNavigate = (tab, tenderId = null) => {
    if (tab === 'edit-tender' && tenderId) {
      navigate(`/tenders/${tenderId}/edit`);
    } else if ((tab === 'tender-details' || tab === 'tenders') && tenderId) {
      navigate(`/tenders/${tenderId}`);
    } else if (tenderId) {
      navigate(`/${tab}/${tenderId}`);
    } else {
      navigate(`/${tab}`);
    }
  };

  if (!token) {
    return (
      <AlertProvider isDarkMode={isDarkMode} lang={lang}>
        <Routes>
          <Route path="/login" element={<LoginPage onLoginSuccess={handleLoginSuccess} lang={lang} setLang={setLang} />} />
          <Route
            path="/ui-kit"
            element={
              <div className={`min-h-screen p-6 overflow-y-auto ${isDarkMode ? 'bg-[#0b0f17] text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
                <UiKitGallery role="ADMIN" isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} lang={lang} />
              </div>
            }
          />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AlertProvider>
    );
  }

  return (
    <AlertProvider isDarkMode={isDarkMode} lang={lang} role={role}>
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
          <ErrorBoundary key={location.pathname} resetKey={location.pathname} onReset={() => navigate('/dashboard')}>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/login" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={
                <Dashboard
                  role={role}
                  onNavigate={handleNavigate}
                  onOpenCreateTender={() => navigate('/create-tender')}
                  isDarkMode={isDarkMode}
                  lang={lang}
                />
              } />
              <Route path="/analytics" element={<AnalyticsPage role={role} isDarkMode={isDarkMode} lang={lang} />} />
              
              <Route path="/create-tender" element={role === 'ADMIN' ? <CreateTenderPage onNavigate={handleNavigate} role={role} isDarkMode={isDarkMode} lang={lang} /> : <Navigate to="/dashboard" replace />} />
              <Route path="/tenders/:id/edit" element={role === 'ADMIN' ? <CreateTenderPage onNavigate={handleNavigate} role={role} isDarkMode={isDarkMode} lang={lang} isEdit={true} /> : <Navigate to="/dashboard" replace />} />
              <Route path="/suppliers" element={role === 'ADMIN' ? <SuppliersList role={role} isDarkMode={isDarkMode} lang={lang} /> : <Navigate to="/dashboard" replace />} />
              <Route path="/suppliers/:id" element={<SupplierProfilePage role={role} isDarkMode={isDarkMode} lang={lang} />} />
              <Route path="/tenders" element={<Tenders onNavigate={handleNavigate} role={role} isDarkMode={isDarkMode} lang={lang} />} />
              <Route path="/tenders/:id" element={<TenderDetails onNavigate={handleNavigate} role={role} isDarkMode={isDarkMode} lang={lang} />} />
              <Route path="/tender-details/:id" element={<TenderDetails onNavigate={handleNavigate} role={role} isDarkMode={isDarkMode} lang={lang} />} />
              <Route path="/create-offer/:id" element={<CreateOfferPage role={role} isDarkMode={isDarkMode} lang={lang} />} />
              <Route path="/offers" element={<MyOffers role={role} isDarkMode={isDarkMode} lang={lang} />} />
              <Route path="/my-offers" element={<Navigate to="/offers" replace />} />
              <Route path="/offers/:id" element={<OfferDetailsPage role={role} isDarkMode={isDarkMode} lang={lang} />} />
              <Route path="/evaluation" element={role === 'SUPPLIER' ? <SupplierWins role={role} isDarkMode={isDarkMode} lang={lang} /> : <Evaluation role={role} isDarkMode={isDarkMode} lang={lang} />} />
              <Route path="/evaluation/:id" element={role === 'SUPPLIER' ? <SupplierWins role={role} isDarkMode={isDarkMode} lang={lang} /> : <EvaluationDetailsPage role={role} isDarkMode={isDarkMode} lang={lang} />} />
              <Route path="/admin/evaluations/:id" element={role === 'SUPPLIER' ? <SupplierWins role={role} isDarkMode={isDarkMode} lang={lang} /> : <EvaluationDetailsPage role={role} isDarkMode={isDarkMode} lang={lang} />} />
              <Route path="/umumy" element={role === 'ADMIN' ? <AdminCatalogs section="umumy" role={role} isDarkMode={isDarkMode} lang={lang} /> : <Navigate to="/dashboard" replace />} />
              <Route path="/haryt" element={role === 'ADMIN' ? <AdminCatalogs section="haryt" role={role} isDarkMode={isDarkMode} lang={lang} /> : <Navigate to="/dashboard" replace />} />
              <Route path="/catalogs" element={<Navigate to="/umumy" replace />} />
              <Route path="/catalog" element={<Navigate to="/umumy" replace />} />
              <Route path="/products" element={<Navigate to="/haryt" replace />} />
              <Route path="/administrasiya" element={role === 'ADMIN' ? <AdminCatalogs section="administrasiya" role={role} isDarkMode={isDarkMode} lang={lang} /> : <Navigate to="/dashboard" replace />} />
              <Route path="/logs" element={role === 'ADMIN' ? <AdminLogs role={role} isDarkMode={isDarkMode} lang={lang} /> : <Navigate to="/dashboard" replace />} />
              <Route path="/admin-logs" element={role === 'ADMIN' ? <AdminLogs role={role} isDarkMode={isDarkMode} lang={lang} /> : <Navigate to="/dashboard" replace />} />
              <Route path="/ui-kit" element={<UiKitGallery role={role} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} lang={lang} />} />
              
              <Route path="/profile" element={<SupplierProfilePage role={role} isDarkMode={isDarkMode} lang={lang} isOwner={true} />} />
              
              <Route 
                path="/settings" 
                element={
                  <SettingsPage 
                    role={role} 
                    isDarkMode={isDarkMode} 
                    setIsDarkMode={setIsDarkMode} 
                    lang={lang} 
                    setLang={setLang}
                    user={user}
                  />
                } 
              />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </ErrorBoundary>
        </main>
      </div>
      </div>
    </AlertProvider>
  );
}

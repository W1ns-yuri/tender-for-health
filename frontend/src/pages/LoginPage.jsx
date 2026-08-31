import React, { useState } from 'react';
import { Lock, User, LogIn, AlertCircle, Globe, Building2, Briefcase, ChevronRight, UserPlus } from 'lucide-react';
import { getTranslation } from '../utils/translations';
import API from '../services/api';

export default function LoginPage({ onLoginSuccess, lang = 'RU', setLang }) {
  const t = (key, fallback) => getTranslation(lang, key, fallback);
  
  const [isRegister, setIsRegister] = useState(false);
  
  // Login states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // Register states
  const [regData, setRegData] = useState({
    username: '',
    password: '',
    firstName: '',
    lastName: '',
    companyName: '',
    roleType: 'SUPPLIER',
    supplierType: 'ENTREPRENEUR'
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await API.post('/auth/login', { username, password });
      if (res.data?.token) {
        localStorage.setItem('tender_token', res.data.token);
        localStorage.setItem('tender_user', JSON.stringify(res.data.user));
        onLoginSuccess(res.data.user, res.data.token);
      }
    } catch (err) {
      setError(err.response?.data?.error || t('invalidLogin', 'Неверный логин или пароль'));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await API.post('/auth/register', regData);
      if (res.data?.token) {
        localStorage.setItem('tender_token', res.data.token);
        localStorage.setItem('tender_user', JSON.stringify(res.data.user));
        onLoginSuccess(res.data.user, res.data.token);
      }
    } catch (err) {
      setError(err.response?.data?.error || t('registerError', 'Ошибка регистрации'));
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (demoUser, demoPass) => {
    setIsRegister(false);
    setUsername(demoUser);
    setPassword(demoPass);
  };

  return (
    <div className="relative min-h-screen w-full bg-[#3d98fb] md:bg-gradient-to-br md:from-[#2e88ed] md:to-[#64b5f6] flex items-center justify-center p-4 sm:p-8">

      {/* Переключатель языка */}
      <div className="absolute top-6 right-6 z-50">
        <button
          type="button"
          onClick={() => setIsLangOpen(!isLangOpen)}
          className="flex items-center bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full px-4 py-2 shadow-sm border border-white/30 text-white text-sm font-semibold transition-all"
        >
          <Globe size={16} className="mr-2 opacity-80" />
          <span>{lang === 'RU' ? 'Русский' : lang === 'TM' ? 'Türkmençe' : 'English'}</span>
        </button>

        {isLangOpen && (
          <div className="absolute top-full right-0 mt-2 w-full bg-white rounded-xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {[
              { code: 'RU', label: 'Русский', short: 'RU' },
              { code: 'TM', label: 'Türkmençe', short: 'TM' },
              { code: 'EN', label: 'English', short: 'EN' }
            ].map(l => (
              <button
                key={l.code}
                type="button"
                onClick={() => { setLang(l.code); setIsLangOpen(false); }}
                className={`w-full text-left px-3 py-2.5 text-sm font-semibold transition-colors flex items-center space-x-2 ${lang === l.code ? 'text-blue-600 bg-blue-50/80' : 'text-slate-700 hover:bg-slate-50'}`}
              >
                <span className="font-bold text-[10px] uppercase opacity-50 w-5">{l.short}</span>
                <span>{l.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Главная карточка логина */}
      <div className="max-w-5xl w-full bg-white rounded-3xl shadow-2xl flex overflow-hidden min-h-[600px] animate-in zoom-in-95 duration-500">

        {/* ЛЕВАЯ ЧАСТЬ (ФОРМА) */}
        <div className="w-full md:w-[45%] lg:w-[40%] p-8 sm:p-12 flex flex-col justify-center bg-white relative z-10 overflow-y-auto max-h-[90vh]">

          <div className="flex flex-col items-center mb-6">
            <div className="w-16 h-16 rounded-full bg-blue-50 border border-blue-100 shadow-sm flex items-center justify-center mb-3">
              {isRegister ? <UserPlus size={28} className="text-blue-500" /> : <User size={28} className="text-blue-500" />}
            </div>
            <h1 className="text-xl font-bold text-slate-800 tracking-wide uppercase">{t('logoTitle', 'Система Тендеров')}</h1>
            <p className="text-[10px] font-semibold text-slate-400 mt-1 tracking-widest uppercase">{t('logoSubtitle', 'Цифровая Платформа')}</p>
          </div>

          {/* Табы */}
          <div className="flex p-1 bg-slate-100 rounded-lg mb-6">
            <button
              type="button"
              onClick={() => { setIsRegister(false); setError(''); }}
              className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${!isRegister ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {lang === 'RU' ? 'Вход' : 'Giriş'}
            </button>
            <button
              type="button"
              onClick={() => { setIsRegister(true); setError(''); }}
              className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${isRegister ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {lang === 'RU' ? 'Регистрация' : 'Hasaba alyş'}
            </button>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-lg flex items-center space-x-2">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {!isRegister ? (
            // ФОРМА ЛОГИНА
            <form onSubmit={handleLogin} className="space-y-5 text-sm animate-in fade-in slide-in-from-left-4">
              <div>
                <div className="relative">
                  <User size={16} className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-400 ml-1" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={t('emailOrLogin', "Логин / Email")}
                    className="w-full pl-8 pr-4 py-3 bg-transparent border-b border-slate-200 focus:border-blue-500 text-slate-800 placeholder-slate-400 transition-colors focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="relative">
                  <Lock size={16} className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-400 ml-1" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    placeholder={t('password', "Пароль")}
                    className="w-full pl-8 pr-4 py-3 bg-transparent border-b border-slate-200 focus:border-blue-500 text-slate-800 placeholder-slate-400 transition-colors focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 flex flex-col items-center space-y-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-48 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-full font-bold shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center space-x-2 active:scale-95 disabled:opacity-70 disabled:active:scale-100"
                >
                  <span>{loading ? t('loggingIn', 'Вход...') : t('loginBtn', 'Вход')}</span>
                </button>

                <button type="button" className="text-xs text-slate-400 hover:text-blue-500 font-medium transition-colors">
                  {t('forgotPassword', 'Забыли пароль?')}
                </button>
              </div>
            </form>
          ) : (
            // ФОРМА РЕГИСТРАЦИИ
            <form onSubmit={handleRegister} className="space-y-4 text-sm animate-in fade-in slide-in-from-right-4">
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">{lang === 'RU' ? 'Имя' : 'Ady'}*</label>
                  <input
                    type="text"
                    required
                    value={regData.firstName}
                    onChange={(e) => setRegData({...regData, firstName: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:border-blue-500 focus:bg-white text-slate-800 transition-colors focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">{lang === 'RU' ? 'Фамилия' : 'Familiýasy'}*</label>
                  <input
                    type="text"
                    required
                    value={regData.lastName}
                    onChange={(e) => setRegData({...regData, lastName: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:border-blue-500 focus:bg-white text-slate-800 transition-colors focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">{lang === 'RU' ? 'Логин' : 'Loginy'}*</label>
                <div className="relative">
                  <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={regData.username}
                    onChange={(e) => setRegData({...regData, username: e.target.value})}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:border-blue-500 focus:bg-white text-slate-800 transition-colors focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">{lang === 'RU' ? 'Пароль' : 'Açar sözi'}*</label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={regData.password}
                    onChange={(e) => setRegData({...regData, password: e.target.value})}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:border-blue-500 focus:bg-white text-slate-800 transition-colors focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">{lang === 'RU' ? 'Роль' : 'Roly'}*</label>
                <select
                  value={regData.roleType}
                  onChange={(e) => setRegData({...regData, roleType: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:border-blue-500 focus:bg-white text-slate-800 transition-colors focus:outline-none"
                >
                  <option value="SUPPLIER">{lang === 'RU' ? 'Поставщик' : 'Üpjünçi'}</option>
                  <option value="CLIENT">{lang === 'RU' ? 'Заказчик' : 'Sargytçy'}</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">{lang === 'RU' ? 'Название компании' : 'Kompaniýanyň ady'}*</label>
                <div className="relative">
                  <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={regData.companyName}
                    onChange={(e) => setRegData({...regData, companyName: e.target.value})}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:border-blue-500 focus:bg-white text-slate-800 transition-colors focus:outline-none"
                  />
                </div>
              </div>

              {regData.roleType === 'SUPPLIER' && (
                <div className="animate-in fade-in slide-in-from-top-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">{lang === 'RU' ? 'Организационно-правовая форма' : 'Kärhana görnüşi'}*</label>
                  <div className="relative">
                    <Briefcase size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <select
                      value={regData.supplierType}
                      onChange={(e) => setRegData({...regData, supplierType: e.target.value})}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:border-blue-500 focus:bg-white text-slate-800 transition-colors focus:outline-none"
                    >
                      <option value="ENTREPRENEUR">{lang === 'RU' ? 'Индивидуальный предприниматель' : 'Hususy telekeçi'}</option>
                      <option value="BUSINESS_SOCIETY">{lang === 'RU' ? 'Хозяйственное общество' : 'Hojalyk jemgyýeti'}</option>
                      <option value="BUSINESS_COMPANY">{lang === 'RU' ? 'Индивидуальное предприятие' : 'Hususy kärhana'}</option>
                      <option value="GOVERNMENT">{lang === 'RU' ? 'Государственное учреждение' : 'Döwlet edarasy'}</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="pt-2 flex justify-center">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-48 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-full font-bold shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center space-x-2 active:scale-95 disabled:opacity-70 disabled:active:scale-100"
                >
                  <span>{loading ? (lang === 'RU' ? 'Регистрация...' : 'Hasaba alynýar...') : (lang === 'RU' ? 'Зарегистрироваться' : 'Hasaba alynmak')}</span>
                </button>
              </div>
            </form>
          )}

          {/* Быстрые ссылки снизу */}
          {!isRegister && (
            <div className="mt-8 pt-4 border-t border-slate-100">
              <p className="text-[10px] font-semibold text-slate-400 text-center uppercase tracking-wider mb-3">
                {t('quickLogin', 'Быстрый вход (Demo)')}
              </p>
              <div className="flex flex-row justify-center gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('admin', 'password123')}
                  className="flex-1 py-2 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold transition-all shadow-sm"
                >
                  {t('admin', 'Администратор')}
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('supplier1', 'password123')}
                  className="flex-1 py-2 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold transition-all shadow-sm"
                >
                  {t('supplier', 'Поставщик')}
                </button>
              </div>
            </div>
          )}

        </div>

        {/* ПРАВАЯ ЧАСТЬ (ИЛЛЮСТРАЦИЯ) */}
        <div className="hidden md:flex md:w-[55%] lg:w-[60%] bg-[#81ccff] relative overflow-hidden items-center justify-center">
          <img
            src="/assets/login-illustration.jpg"
            alt="Corporate 3D Isometric illustration"
            className="w-full h-full object-cover object-center absolute inset-0 opacity-95"
            style={{ mixBlendMode: 'normal' }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white via-transparent to-transparent opacity-30 pointer-events-none"></div>
        </div>

      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { Lock, User, LogIn, AlertCircle, Globe, Building2, Eye, EyeOff, ChevronRight, Mail, Phone, FileText } from 'lucide-react';
import { getTranslation } from '../utils/translations';
import API from '../services/api';

export default function LoginPage({ onLoginSuccess, lang = 'RU', setLang }) {
  const t = (key, fallback) => getTranslation(lang, key, fallback);

  const formatPhone = (val) => {
    const v = val.replace(/\D/g, '').slice(0, 8);
    if (v.length > 6) return `${v.slice(0, 2)} ${v.slice(2, 4)}-${v.slice(4, 6)}-${v.slice(6)}`;
    if (v.length > 4) return `${v.slice(0, 2)} ${v.slice(2, 4)}-${v.slice(4)}`;
    if (v.length > 2) return `${v.slice(0, 2)} ${v.slice(2)}`;
    return v;
  };

  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Login states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Register states
  const [regData, setRegData] = useState({
    username: '', // Рабочий Email
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    companyName: '',
    companyType: 'ENTREPRENEUR',
    taxId: '',
    termsAccepted: false
  });
  const [regStep, setRegStep] = useState(1);

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
      const cleanedName = regData.companyName.trim()
        .replace(/^(ип|хо|ооо|чп|hj|dh|hk|telekeçi|hojalyk\s+jemgyýeti|hususy\s+telekeçi|hususy\s+kärhana)\s*["«'”]?\s*/i, '')
        .replace(/["»'”]$/, '').trim() || regData.companyName.trim();

      const res = await API.post('/auth/register', { ...regData, companyName: cleanedName });
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

  const handleNextStep = (e) => {
    e.preventDefault();
    if (!regData.firstName || !regData.lastName || !regData.username || !regData.password || !regData.phone) {
      setError(lang === 'RU' ? 'Заполните все поля первого шага' : 'Ähli meýdançalary dolduryň');
      return;
    }
    setError('');
    setRegStep(2);
  };

  const handleQuickLogin = async (demoUser, demoPass) => {
    setIsRegister(false);
    setUsername(demoUser);
    setPassword(demoPass);
    setError('');
    setLoading(true);
    try {
      const res = await API.post('/auth/login', { username: demoUser, password: demoPass });
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

  return (
    <div className="min-h-screen w-full flex bg-[#f8fbff] text-slate-800 font-sans">

      {/* Левая часть: Иллюстрация и Брендинг (скрыта на мобильных) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-blue-50/50 flex-col items-center justify-center p-12 overflow-hidden">
        {/* Логотип в верхнем левом углу */}
        <div className="absolute top-8 left-8 sm:top-8 sm:left-12 flex items-center gap-3 select-none z-50">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-black flex items-center justify-center text-xl shadow-lg shadow-blue-600/30">
            TU
          </div>
          <span className="font-extrabold text-slate-800 text-xl tracking-tight">Tender Ulgam</span>
        </div>

        {/* Декоративные элементы фона */}
        <div className="absolute top-0 left-0 w-full h-full bg-linear-to-br from-blue-100/40 to-transparent pointer-events-none" />

        <div className="relative z-10 w-full max-w-[500px] mx-auto flex flex-col items-center animate-in fade-in zoom-in-95 duration-700 mt-8">
          {/* Оформление картинки под постер */}
          <div className="w-full bg-white p-2 rounded-[2rem] shadow-xl shadow-slate-200/60 border border-white mb-10 relative overflow-hidden flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-tr from-orange-100/20 to-teal-100/20 rounded-[1.8rem] pointer-events-none z-10"></div>
            <img
              src="/assets/login-page-ullustration.jpg"
              alt="Platform Collaboration"
              className="w-full h-auto object-cover rounded-[1.5rem] mix-blend-multiply relative z-0"
            />
          </div>

          <div className="text-center space-y-4">
            <h2 className="text-3xl xl:text-4xl font-black text-slate-800 tracking-tight leading-tight">
              {lang === 'RU' ? 'Упростите взаимодействие' : 'Işleriňizi aňsatlaşdyryň'}<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-500">
                {lang === 'RU' ? 'в сфере закупок' : 'satyn alyş ulgamynda'}
              </span>
            </h2>
            <p className="text-slate-500 font-medium max-w-md mx-auto text-lg leading-relaxed">
              {lang === 'RU'
                ? 'Единая цифровая платформа для заказчиков и поставщиков. Эффективно, прозрачно, безопасно.'
                : 'Sargyt edijiler we üpjün edijiler üçin ýeke-täk sanly platforma. Netijeli, aýdyň, howpsuz.'}
            </p>
          </div>
        </div>
      </div>

      {/* Правая часть: Форма авторизации */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 sm:p-12 xl:p-20 relative bg-transparent lg:bg-white shadow-none lg:shadow-[-20px_0_40px_rgba(0,0,0,0.03)] z-10">

        {/* Переключатель языка */}
        <div className="absolute top-8 right-8 sm:top-8 sm:right-12 z-50">
          <button
            type="button"
            onClick={() => setIsLangOpen(!isLangOpen)}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 transition-colors text-sm font-semibold text-slate-600 shadow-sm"
          >
            <Globe size={16} className="text-blue-500" />
            <span>{lang === 'RU' ? 'Русский' : lang === 'TM' ? 'Türkmençe' : 'English'}</span>
          </button>

          {isLangOpen && (
            <div className="absolute top-full right-0 mt-2 w-36 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              {[
                { code: 'RU', label: 'Русский', short: 'RU' },
                { code: 'TM', label: 'Türkmençe', short: 'TM' },
                { code: 'EN', label: 'English', short: 'EN' }
              ].map(l => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => { setLang(l.code); setIsLangOpen(false); }}
                  className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${lang === l.code ? 'text-blue-600 bg-blue-50/50' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="w-full max-w-[500px] p-8 sm:p-12 border border-slate-200/60 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 bg-white animate-in fade-in slide-in-from-bottom-4 duration-500">

          {/* Header Формы */}
          <div className="mb-10 text-center">
            {/* Мини-логотип TU */}
            <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/30 mx-auto">
              <span className="text-white font-black text-2xl">TU</span>
            </div>
            <h1 className="text-3xl font-black text-slate-800 mb-4 tracking-tight">
              {isRegister
                ? (lang === 'RU' ? 'Создать аккаунт' : 'Hasap döretmek')
                : (lang === 'RU' ? 'С возвращением!' : 'Hoş geldiňiz!')}
            </h1>
            <p className="text-slate-500 text-sm font-medium">
              {isRegister
                ? (lang === 'RU' ? 'Заполните данные для регистрации' : 'Hasaba alynmak üçin maglumatlary dolduryň')
                : (lang === 'RU' ? 'Пожалуйста, введите ваши данные для входа' : 'Girmek üçin maglumatlaryňyzy giriziň')}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-rose-50/80 border border-rose-100 text-rose-600 text-sm font-semibold rounded-2xl flex items-start space-x-3 animate-in slide-in-from-top-2">
              <AlertCircle size={20} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {!isRegister ? (
            // ФОРМА ЛОГИНА
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-5">
                <div>
                  <label className="block text-[13px] font-bold text-slate-700 mb-1.5 ml-1">
                    {lang === 'RU' ? 'Логин или Email' : 'Loginy ýa-da Email'}
                  </label>
                  <div className="relative flex items-center">
                    <User size={18} className="absolute left-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder={lang === 'RU' ? "corp@company.ru" : "corp@company.tm"}
                      className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-300 rounded-2xl text-slate-800 transition-all focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 placeholder:text-slate-400 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5 px-1">
                    <label className="block text-[13px] font-bold text-slate-700">
                      {lang === 'RU' ? 'Пароль' : 'Açar sözi'}
                    </label>
                    <button type="button" className="text-[13px] font-bold text-blue-600 hover:text-blue-700 transition-colors">
                      {lang === 'RU' ? 'Забыли пароль?' : 'Açar sözüni unutdyňyzmy?'}
                    </button>
                  </div>
                  <div className="relative flex items-center">
                    <Lock size={18} className="absolute left-4 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-11 pr-12 py-3.5 bg-white border border-slate-300 rounded-2xl text-slate-800 transition-all focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 placeholder:text-slate-400 font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 text-slate-400 hover:text-slate-600 transition-colors flex items-center justify-center h-full"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl font-black shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center space-x-2 active:scale-[0.98] disabled:opacity-70 mt-8 text-[15px]"
              >
                <span>{loading ? t('loggingIn', 'Вход...') : t('loginBtn', 'Войти в систему')}</span>
              </button>

              <div className="pt-6 mt-8">
                <div className="relative flex items-center justify-center mb-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200"></div>
                  </div>
                  <span className="relative bg-white px-4 text-xs font-bold text-slate-500">
                    {lang === 'RU' ? 'Демо-доступ' : 'Demo giriş'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('admin', 'password123')}
                    className="flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-bold transition-all hover:border-blue-300 hover:text-blue-600 active:scale-95 shadow-xs"
                  >
                    <User size={18} className="text-slate-400" /> Admin
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('supplier@1.com', 'password123')}
                    className="flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-bold transition-all hover:border-blue-300 hover:text-blue-600 active:scale-95 shadow-xs"
                  >
                    <Building2 size={18} className="text-slate-400" /> Supplier
                  </button>
                </div>
              </div>

              <div className="text-center mt-8 text-sm font-medium text-slate-500">
                {lang === 'RU' ? 'Нет аккаунта?' : 'Hasabyňyz ýokmy?'} {' '}
                <button
                  type="button"
                  onClick={() => { setIsRegister(true); setError(''); }}
                  className="text-blue-600 hover:text-blue-800 font-bold transition-colors underline decoration-2 underline-offset-4 decoration-blue-200 hover:decoration-blue-400 ml-1"
                >
                  {lang === 'RU' ? 'Зарегистрируйтесь' : 'Hasap dörediň'}
                </button>
              </div>
            </form>
          ) : (
            // ФОРМА РЕГИСТРАЦИИ (Выглядит как отдельный экран)
            <form onSubmit={regStep === 1 ? handleNextStep : handleRegister} className="space-y-4 animate-in slide-in-from-right-8 duration-300">

              {/* Прогресс шагов */}
              <div className="flex items-center justify-center mb-6 space-x-2">
                <div className={`h-2 flex-1 rounded-full transition-all duration-300 ${regStep === 1 ? 'bg-blue-600 shadow-sm shadow-blue-500/40' : regStep > 1 ? 'bg-teal-500' : 'bg-slate-200'}`}></div>
                <div className={`h-2 flex-1 rounded-full transition-all duration-300 ${regStep === 2 ? 'bg-blue-600 shadow-sm shadow-blue-500/40' : 'bg-slate-200'}`}></div>
              </div>

              {regStep === 1 ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[13px] font-bold text-slate-700 mb-1.5 ml-1">
                        {lang === 'RU' ? 'Имя' : 'Ady'}*
                      </label>
                      <div className="relative flex items-center">
                        <User size={18} className="absolute left-4 text-slate-400" />
                        <input
                          type="text"
                          required
                          value={regData.firstName}
                          onChange={(e) => setRegData({ ...regData, firstName: e.target.value })}
                          placeholder="Maksat"
                          className="w-full pl-11 pr-4 py-3 bg-white border border-slate-300 rounded-2xl text-slate-800 text-sm transition-all focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 font-medium"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[13px] font-bold text-slate-700 mb-1.5 ml-1">
                        {lang === 'RU' ? 'Фамилия' : 'Familiýasy'}*
                      </label>
                      <div className="relative flex items-center">
                        <User size={18} className="absolute left-4 text-slate-400" />
                        <input
                          type="text"
                          required
                          value={regData.lastName}
                          onChange={(e) => setRegData({ ...regData, lastName: e.target.value })}
                          placeholder="Orazow"
                          className="w-full pl-11 pr-4 py-3 bg-white border border-slate-300 rounded-2xl text-slate-800 text-sm transition-all focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 font-medium"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[13px] font-bold text-slate-700 mb-1.5 ml-1">
                      {lang === 'RU' ? 'Рабочий Email (Логин)' : 'Iş Email (Loginy)'}*
                    </label>
                    <div className="relative flex items-center">
                      <Mail size={18} className="absolute left-4 text-slate-400" />
                      <input
                        type="email"
                        required
                        value={regData.username}
                        onChange={(e) => setRegData({ ...regData, username: e.target.value })}
                        placeholder="corp@company.ru"
                        className="w-full pl-11 pr-4 py-3 bg-white border border-slate-300 rounded-2xl text-slate-800 text-sm transition-all focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[13px] font-bold text-slate-700 mb-1.5 ml-1">
                      {lang === 'RU' ? 'Номер телефона' : 'Telefon belgisi'}*
                    </label>
                    <div className="relative flex items-center">
                      <Phone size={18} className="absolute left-4 text-slate-400" />
                      <span className="absolute left-11 text-slate-800 font-medium text-sm">+993</span>
                      <input
                        type="text"
                        required
                        value={regData.phone}
                        onChange={(e) => setRegData({ ...regData, phone: formatPhone(e.target.value) })}
                        placeholder="65 12-34-56"
                        maxLength={11}
                        className="w-full pl-[5.3rem] pr-4 py-3 bg-white border border-slate-300 rounded-2xl text-slate-800 text-sm transition-all focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[13px] font-bold text-slate-700 mb-1.5 ml-1">
                      {lang === 'RU' ? 'Пароль' : 'Açar sözi'}*
                    </label>
                    <div className="relative flex items-center">
                      <Lock size={18} className="absolute left-4 text-slate-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={regData.password}
                        onChange={(e) => setRegData({ ...regData, password: e.target.value })}
                        placeholder="••••••••"
                        className="w-full pl-11 pr-12 py-3 bg-white border border-slate-300 rounded-2xl text-slate-800 text-sm transition-all focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 text-slate-400 hover:text-slate-600 transition-colors flex items-center justify-center h-full"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center space-x-2 active:scale-[0.98] mt-6 text-[15px]"
                  >
                    <span>{lang === 'RU' ? 'Далее' : 'Indiki'}</span>
                    <ChevronRight size={18} />
                  </button>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-[13px] font-bold text-slate-700 mb-1.5 ml-1">
                      {lang === 'RU' ? 'Тип участника' : 'Gatnaşyjy görnüşi'}*
                    </label>
                    <div className="relative flex items-center">
                      <select
                        value={regData.companyType}
                        onChange={(e) => setRegData({ ...regData, companyType: e.target.value })}
                        className="w-full pl-4 pr-10 py-3 bg-white border border-slate-300 rounded-2xl text-slate-800 text-sm transition-all focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 appearance-none font-medium"
                      >
                        <option value="ENTREPRENEUR">{lang === 'RU' ? 'ИП (Hususy telekeçi)' : 'Hususy telekeçi'}</option>
                        <option value="BUSINESS_SOCIETY">{lang === 'RU' ? 'ХО / HJ (Hojalyk jemgyýeti)' : 'Hojalyk jemgyýeti'}</option>
                        <option value="BUSINESS_COMPANY">{lang === 'RU' ? 'ЧП / HK (Hususy kärhana)' : 'Hususy kärhana'}</option>
                        <option value="FARMER_ASSOCIATION">{lang === 'RU' ? 'ДХ / DH (Daýhan hojalygy)' : 'Daýhan hojalygy'}</option>
                        <option value="GOVERNMENT">{lang === 'RU' ? 'Гос. предприятие (Döwlet kärhanasy)' : 'Döwlet kärhanasy'}</option>
                      </select>
                      <ChevronRight size={18} className="absolute right-4 text-slate-400 rotate-90 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[13px] font-bold text-slate-700 mb-1.5 ml-1">
                      {lang === 'RU' ? 'Наименование компании / бренда' : 'Kärhananyň / brendiň ady'}*
                    </label>
                    <div className="relative flex items-center">
                      <Building2 size={18} className="absolute left-4 text-slate-400" />
                      <input
                        type="text"
                        required
                        value={regData.companyName}
                        onChange={(e) => setRegData({ ...regData, companyName: e.target.value })}
                        placeholder={lang === 'RU' ? "например, Медик-Фарм" : "mysal üçin, Medik-Farm"}
                        className="w-full pl-11 pr-4 py-3 bg-white border border-slate-300 rounded-2xl text-slate-800 text-sm transition-all focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 font-medium"
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 ml-1">
                      {lang === 'RU' ? 'Указывайте только название бренда без организационной формы (ИП, ХО, ЧП)' : 'Diňe brendiň adyny ýazyň (HJ, HK, Telekeçi goşmazdan)'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-[13px] font-bold text-slate-700 mb-1.5 ml-1">
                      STŞK (ИНН)*
                    </label>
                    <div className="relative flex items-center">
                      <FileText size={18} className="absolute left-4 text-slate-400" />
                      <input
                        type="text"
                        required
                        maxLength={8}
                        value={regData.taxId}
                        onChange={(e) => setRegData({ ...regData, taxId: e.target.value.replace(/\D/g, '').slice(0, 8) })}
                        placeholder="12345678"
                        className="w-full pl-11 pr-4 py-3 bg-white border border-slate-300 rounded-2xl text-slate-800 text-sm transition-all focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 font-medium tracking-widest font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex items-start mt-4">
                    <input
                      type="checkbox"
                      id="termsAccepted"
                      required
                      checked={regData.termsAccepted}
                      onChange={(e) => setRegData({ ...regData, termsAccepted: e.target.checked })}
                      className="mt-1 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="termsAccepted" className="ml-2 text-xs text-slate-500 leading-tight">
                      {lang === 'RU'
                        ? 'Я согласен с регламентом проведения электронных торгов и обработкой персональных данных.'
                        : 'Men elektron söwdalarynyň düzgünleri we şahsy maglumatlaryň işlenilmegi bilen ylalaşýaryn.'}
                    </label>
                  </div>

                  <div className="flex space-x-3 mt-6">
                    <button
                      type="button"
                      onClick={() => setRegStep(1)}
                      className="w-1/3 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold transition-all"
                    >
                      {lang === 'RU' ? 'Назад' : 'Yza'}
                    </button>
                    <button
                      type="submit"
                      disabled={loading || !regData.termsAccepted}
                      className="w-2/3 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center space-x-2 active:scale-[0.98] disabled:opacity-70 text-[15px]"
                    >
                      <span>{loading ? t('registering', 'Создание...') : t('registerBtn', 'Зарегистрироваться')}</span>
                    </button>
                  </div>
                </>
              )}

              <div className="text-center mt-6 text-sm font-medium text-slate-500">
                {lang === 'RU' ? 'Уже есть аккаунт?' : 'Eýýäm hasabyňyz barmy?'} {' '}
                <button
                  type="button"
                  onClick={() => { setIsRegister(false); setError(''); }}
                  className="text-slate-800 hover:text-black font-bold transition-colors underline decoration-2 underline-offset-4 decoration-slate-200 hover:decoration-slate-400 ml-1"
                >
                  {lang === 'RU' ? 'Войти' : 'Giriň'}
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}

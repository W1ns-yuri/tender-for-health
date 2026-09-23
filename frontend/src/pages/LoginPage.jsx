import React, { useState } from 'react';
import { Lock, User, AlertCircle, Globe, Building2, Eye, EyeOff, ChevronRight, Mail, Phone, FileText } from 'lucide-react';
import { getTranslation } from '../utils/translations';
import API from '../services/api';
import CustomSelect from '../components/CustomSelect';

export default function LoginPage({ onLoginSuccess, lang = 'RU', setLang }) {
  const t = (key, fallback) => getTranslation(lang, key, fallback);

  const COUNTRIES = [
    { id: 'TM', name: t('countryTM', 'Туркменистан (+993)'), prefix: '+993' },
    { id: 'RU', name: t('countryRU', 'Россия (+7)'), prefix: '+7' },
    { id: 'TR', name: t('countryTR', 'Турция (+90)'), prefix: '+90' },
    { id: 'DE', name: t('countryDE', 'Германия (+49)'), prefix: '+49' },
    { id: 'CN', name: t('countryCN', 'Китай (+86)'), prefix: '+86' },
    { id: 'IN', name: t('countryIN', 'Индия (+91)'), prefix: '+91' },
    { id: 'AE', name: t('countryAE', 'ОАЭ (+971)'), prefix: '+971' },
    { id: 'KZ', name: t('countryKZ', 'Казахстан (+7)'), prefix: '+7' },
    { id: 'UZ', name: t('countryUZ', 'Узбекистан (+998)'), prefix: '+998' },
    { id: 'OTHER', name: t('countryOther', 'Другая страна (Международный)'), prefix: '+' },
  ];

  const formatPhoneTM = (val) => {
    const v = val.replace(/\D/g, '').slice(0, 8);
    if (v.length > 6) return `${v.slice(0, 2)} ${v.slice(2, 4)}-${v.slice(4, 6)}-${v.slice(6)}`;
    if (v.length > 4) return `${v.slice(0, 2)} ${v.slice(2, 4)}-${v.slice(4)}`;
    if (v.length > 2) return `${v.slice(0, 2)} ${v.slice(2)}`;
    return v;
  };

  const formatPhoneRU = (val) => {
    const v = val.replace(/\D/g, '').slice(0, 10);
    if (v.length > 7) return `(${v.slice(0, 3)}) ${v.slice(3, 6)}-${v.slice(6, 8)}-${v.slice(8)}`;
    if (v.length > 5) return `(${v.slice(0, 3)}) ${v.slice(3, 6)}-${v.slice(6)}`;
    if (v.length > 3) return `(${v.slice(0, 3)}) ${v.slice(3)}`;
    if (v.length > 0) return `(${v}`;
    return v;
  };

  const formatPhoneTR = (val) => {
    const v = val.replace(/\D/g, '').slice(0, 10);
    if (v.length > 6) return `${v.slice(0, 3)} ${v.slice(3, 6)} ${v.slice(6, 8)} ${v.slice(8)}`;
    if (v.length > 3) return `${v.slice(0, 3)} ${v.slice(3, 6)} ${v.slice(6)}`;
    if (v.length > 0) return `${v.slice(0, 3)} ${v.slice(3)}`;
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
    countryCode: 'TM',
    phone: '',
    companyName: '',
    companyType: 'BUSINESS_SOCIETY',
    taxId: '',
    categoryIds: [],
    termsAccepted: false
  });
  const [regStep, setRegStep] = useState(1);
  const [categoriesList, setCategoriesList] = useState([]);

  const selectedCountryObj = COUNTRIES.find(c => c.id === regData.countryCode) || COUNTRIES[0];

  const companyTypeOptions = regData.countryCode === 'TM' ? [
    { id: 'BUSINESS_SOCIETY', name: t('typeBusinessSociety', 'ХО (Хозяйственное общество)') },
    { id: 'ENTREPRENEUR', name: t('typeEntrepreneur', 'ИП (Индивидуальный предприниматель)') },
    { id: 'BUSINESS_COMPANY', name: t('typeBusinessCompany', 'ЧП / ХП (Частное предприятие)') },
    { id: 'GOVERNMENT', name: t('typeGovernment', 'ГП (Государственное предприятие)') },
    { id: 'FARMER_ASSOCIATION', name: t('typeFarmer', 'ДО (Дочернее общество / Daýhan hojalygy)') }
  ] : [
    { id: 'FOREIGN_ENTITY', name: t('foreignEntity', 'Иностранное юридическое лицо (Foreign Entity)') },
    { id: 'FOREIGN_BRANCH', name: t('foreignBranch', 'Представительство / Филиал (Branch / Office)') },
    { id: 'FOREIGN_SOLE_TRADER', name: t('foreignSoleTrader', 'Индивидуальный предприниматель (Sole Proprietor)') }
  ];

  const handlePhoneChange = (val) => {
    if (regData.countryCode === 'TM') {
      setRegData(p => ({ ...p, phone: formatPhoneTM(val) }));
    } else if (regData.countryCode === 'RU' || regData.countryCode === 'KZ') {
      setRegData(p => ({ ...p, phone: formatPhoneRU(val) }));
    } else if (regData.countryCode === 'TR') {
      setRegData(p => ({ ...p, phone: formatPhoneTR(val) }));
    } else if (regData.countryCode === 'OTHER') {
      setRegData(p => ({ ...p, phone: val.replace(/[^\d+\s-]/g, '').slice(0, 20) }));
    } else {
      setRegData(p => ({ ...p, phone: val.replace(/[^\d\s-]/g, '').slice(0, 16) }));
    }
  };

  const handleCountryChange = (cCode) => {
    setRegData(p => ({
      ...p,
      countryCode: cCode,
      phone: '',
      companyType: cCode === 'TM' ? 'BUSINESS_SOCIETY' : 'FOREIGN_ENTITY'
    }));
  };

  React.useEffect(() => {
    API.get('/catalogs/categories')
      .then(res => {
        if (Array.isArray(res.data)) {
          setCategoriesList(res.data.filter(c => c.isActive));
        }
      })
      .catch(err => console.error('Failed to load categories', err));
  }, []);

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
      const isColdStart = !err.response || err.response.status === 502 || err.response.status === 503 || err.code === 'ERR_NETWORK';
      if (isColdStart) {
        setError(t('coldStartWaitMsg', 'Сервер подключается, пожалуйста, подождите 2-3 секунды и повторите...'));
      } else {
        setError(err.response?.data?.error || t('invalidLogin', 'Неверный логин или пароль'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    if (!regData.categoryIds || regData.categoryIds.length === 0) {
      setError(t('selectAtLeastOneCategoryWarning', 'Для завершения регистрации выберите хотя бы одну категорию деятельности'));
      return;
    }

    setLoading(true);

    try {
      const cleanedName = regData.companyName.trim()
        .replace(/^(ип|хо|ооо|чп|hj|dh|hk|telekeçi|hojalyk\s+jemgyýeti|hususy\s+telekeçi|hususy\s+kärhana)\s*["«'”]?\s*/i, '')
        .replace(/["»'”]$/, '').trim() || regData.companyName.trim();

      const fullPhone = regData.countryCode === 'OTHER'
        ? (regData.phone.startsWith('+') ? regData.phone : `+${regData.phone}`.trim())
        : `${selectedCountryObj.prefix} ${regData.phone}`.trim();

      const payload = {
        ...regData,
        phone: fullPhone,
        companyName: cleanedName,
        okpoCode: regData.countryCode === 'TM' ? regData.taxId : null,
      };

      const res = await API.post('/auth/register', payload);
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

  const phoneDigits = regData.phone?.replace(/\D/g, '') || '';
  const isPhoneValid = regData.countryCode === 'TM'
    ? phoneDigits.length === 8
    : (regData.countryCode === 'RU' || regData.countryCode === 'KZ' || regData.countryCode === 'TR')
    ? phoneDigits.length >= 10
    : regData.countryCode === 'OTHER'
    ? phoneDigits.length >= 7
    : phoneDigits.length >= 6;

  const isStep1Valid = Boolean(
    regData.firstName?.trim() &&
    regData.lastName?.trim() &&
    regData.countryCode &&
    regData.username?.trim() &&
    regData.username.includes('@') &&
    isPhoneValid &&
    regData.password?.length >= 6
  );

  const isStep2Valid = Boolean(
    regData.companyType &&
    regData.companyName?.trim().length >= 2 &&
    (regData.countryCode === 'TM'
      ? regData.taxId?.replace(/\D/g, '').length === 8
      : regData.taxId?.trim().length >= 4)
  );

  const isStep3Valid = Boolean(
    regData.categoryIds &&
    regData.categoryIds.length > 0 &&
    regData.termsAccepted
  );

  const handleNextStep = (e) => {
    if (e) e.preventDefault();
    if (regStep === 1) {
      if (!isStep1Valid) {
        setError(t('fillStep1FieldsNotice', 'Заполните все обязательные поля первого шага'));
        return;
      }
      setError('');
      setRegStep(2);
    } else if (regStep === 2) {
      if (!isStep2Valid) {
        setError(t('fillStep2FieldsNotice', 'Заполните реквизиты компании и ИНН'));
        return;
      }
      setError('');
      setRegStep(3);
    }
  };

  const handleQuickLogin = async (demoUser, demoPass, retryCount = 1) => {
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
      const isColdStart = !err.response || err.response.status === 502 || err.response.status === 503 || err.code === 'ERR_NETWORK';
      if (isColdStart && retryCount > 0) {
        // Если сервер еще стартует, автоматически повторяем через 1 секунду без ошибки пользователю
        setTimeout(() => {
          handleQuickLogin(demoUser, demoPass, retryCount - 1);
        }, 1000);
        return;
      }

      if (isColdStart) {
        setError(t('coldStartClickAgainMsg', 'Сервер подключается, пожалуйста, нажмите еще раз через пару секунд...'));
      } else {
        setError(err.response?.data?.error || t('invalidLogin', 'Неверный логин или пароль'));
      }
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
            <div className="absolute inset-0 bg-gradient-to-tr from-orange-100/20 to-emerald-100/20 rounded-[1.8rem] pointer-events-none z-10"></div>
            <img
              src="/assets/login-page-ullustration.jpg"
              alt="Platform Collaboration"
              className="w-full h-auto object-cover rounded-[1.5rem] mix-blend-multiply relative z-0"
            />
          </div>

          <div className="text-center space-y-4">
            <h2 className="text-3xl xl:text-4xl font-black text-slate-800 tracking-tight leading-tight">
              {t('loginHeadline1', 'Упростите взаимодействие')}<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-500">
                {t('loginHeadline2', 'в сфере закупок')}
              </span>
            </h2>
            <p className="text-slate-500 font-medium max-w-md mx-auto text-lg leading-relaxed">
              {t('loginTagline', 'Единая цифровая платформа для заказчиков и поставщиков. Эффективно, прозрачно, безопасно.')}
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
                ? (t('createAccountTab', 'Создать аккаунт'))
                : (t('welcomeBackTitle', 'С возвращением!'))}
            </h1>
            <p className="text-slate-500 text-sm font-medium">
              {isRegister
                ? (t('registerSubtitle', 'Заполните данные для регистрации'))
                : (t('loginSubtitle', 'Пожалуйста, введите ваши данные для входа'))}
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
                    {t('loginOrEmailPlaceholder', 'Логин или Email')}
                  </label>
                  <div className="relative flex items-center">
                    <User size={18} className="absolute left-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder={t('emailPlaceholderDemo', 'corp@company.ru')}
                      className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-300 rounded-2xl text-slate-800 transition-all focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 placeholder:text-slate-400 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5 px-1">
                    <label className="block text-[13px] font-bold text-slate-700">
                      {t('password', 'Пароль')}
                    </label>
                    <button type="button" className="text-[13px] font-bold text-blue-600 hover:text-blue-700 transition-colors">
                      {t('forgotPassword', 'Забыли пароль?')}
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
                    {t('demoAccessTitle', 'Демо-доступ')}
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
                {t('dontHaveAccountPrompt', 'Нет аккаунта?')} {' '}
                <button
                  type="button"
                  onClick={() => { setIsRegister(true); setError(''); }}
                  className="text-blue-600 hover:text-blue-800 font-bold transition-colors underline decoration-2 underline-offset-4 decoration-blue-200 hover:decoration-blue-400 ml-1"
                >
                  {t('signUpLink', 'Зарегистрируйтесь')}
                </button>
              </div>
            </form>
          ) : (
            // ФОРМА РЕГИСТРАЦИИ (3 шага без скролла)
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (regStep === 1 || regStep === 2) {
                  handleNextStep(e);
                } else {
                  handleRegister(e);
                }
              }}
              className="space-y-4 animate-in slide-in-from-right-8 duration-300"
            >
              {/* Индикатор 3-х шагов регистрации (строго синий брендинг поставщика) */}
              <div className="flex items-center justify-between mb-6 px-1">
                {[
                  { num: 1, label: t('regStep1Title', 'Учётная запись') },
                  { num: 2, label: t('regStep2Title', 'Организация') },
                  { num: 3, label: t('regStep3Title', 'Направления') },
                ].map((s, idx) => (
                  <React.Fragment key={s.num}>
                    <div className="flex flex-col items-center gap-1.5">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all duration-300 ${
                          regStep === s.num
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/40 ring-4 ring-blue-100'
                            : regStep > s.num
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-400 border border-slate-200'
                        }`}
                      >
                        {regStep > s.num ? '✓' : s.num}
                      </div>
                      <span
                        className={`text-[11px] font-bold transition-colors ${
                          regStep === s.num ? 'text-blue-600' : regStep > s.num ? 'text-slate-700' : 'text-slate-400'
                        }`}
                      >
                        {s.label}
                      </span>
                    </div>
                    {idx < 2 && (
                      <div
                        className={`h-0.5 flex-1 mx-2 -mt-5 transition-all duration-300 ${
                          regStep > s.num ? 'bg-blue-600' : 'bg-slate-200'
                        }`}
                      />
                    )}
                  </React.Fragment>
                ))}
              </div>

              {regStep === 1 && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[13px] font-bold text-slate-700 mb-1.5 ml-1">
                        {t('firstNameLabel', 'Имя')}*
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
                        {t('lastNameLabel', 'Фамилия')}*
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

                  {/* 🌍 ВЫБОР СТРАНЫ СРАЗУ ПОСЛЕ ФАМИЛИИ */}
                  <div>
                    <label className="block text-[13px] font-bold text-slate-700 mb-1.5 ml-1">
                      {t('countryLabel', 'Страна')}*
                    </label>
                    <CustomSelect
                      role="SUPPLIER"
                      value={regData.countryCode}
                      onChange={handleCountryChange}
                      options={COUNTRIES}
                      size="md"
                    />
                  </div>

                  <div>
                    <label className="block text-[13px] font-bold text-slate-700 mb-1.5 ml-1">
                      {t('emailLabel', 'Почта')}*
                    </label>
                    <div className="relative flex items-center">
                      <Mail size={18} className="absolute left-4 text-slate-400" />
                      <input
                        type="email"
                        required
                        value={regData.username}
                        onChange={(e) => setRegData({ ...regData, username: e.target.value })}
                        placeholder="corp@company.tm"
                        className="w-full pl-11 pr-4 py-3 bg-white border border-slate-300 rounded-2xl text-slate-800 text-sm transition-all focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 font-medium"
                      />
                    </div>
                  </div>

                  {/* 📞 ДИНАМИЧЕСКИЙ ТЕЛЕФОН С УЧЕТОМ СТРАНЫ */}
                  <div>
                    <label className="block text-[13px] font-bold text-slate-700 mb-1.5 ml-1">
                      {t('phoneLabel', 'Номер телефона')}*
                    </label>
                    <div className="relative flex items-center">
                      <Phone size={18} className="absolute left-4 text-slate-400" />
                      {regData.countryCode !== 'OTHER' && (
                        <span className="absolute left-11 text-slate-800 font-bold text-sm tracking-tight select-none pointer-events-none">
                          {selectedCountryObj.prefix}
                        </span>
                      )}
                      <input
                        type="tel"
                        required
                        value={regData.phone}
                        onChange={(e) => handlePhoneChange(e.target.value)}
                        placeholder={
                          regData.countryCode === 'TM' ? '65 12-34-56' :
                          (regData.countryCode === 'RU' || regData.countryCode === 'KZ') ? '(999) 123-45-67' :
                          regData.countryCode === 'TR' ? '555 123 45 67' :
                          regData.countryCode === 'OTHER' ? '+49 151 2345678' :
                          '123456789'
                        }
                        className={`w-full ${
                          regData.countryCode !== 'OTHER' 
                            ? (selectedCountryObj.prefix.length > 3 ? 'pl-[5.5rem]' : 'pl-[4.5rem]') 
                            : 'pl-11'
                        } pr-4 py-3 bg-white border border-slate-300 rounded-2xl text-slate-800 text-sm transition-all focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 font-medium`}
                      />
                    </div>
                    {regData.countryCode === 'OTHER' && (
                      <p className="text-[11px] text-slate-400 mt-1 ml-1">
                        {t('phoneFormatInternationalHint', 'Формат: +[код страны] [номер], например: +49 151 2345678')}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[13px] font-bold text-slate-700 mb-1.5 ml-1">
                      {t('password', 'Пароль')}*
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
                    type="button"
                    onClick={handleNextStep}
                    disabled={!isStep1Valid}
                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl font-black shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center space-x-2 active:scale-[0.98] mt-6 text-[15px]"
                  >
                    <span>{t('nextStepBtn', 'Далее')}</span>
                    <ChevronRight size={18} />
                  </button>
                </>
              )}

              {regStep === 2 && (
                <>
                  <div>
                    <label className="block text-[13px] font-bold text-slate-700 mb-1.5 ml-1">
                      {t('participantTypeLabel', 'Форма собственности / Тип участника')}*
                    </label>
                    <CustomSelect
                      role="SUPPLIER"
                      value={regData.companyType}
                      onChange={(val) => setRegData(prev => ({ ...prev, companyType: val }))}
                      options={companyTypeOptions}
                      size="md"
                    />
                  </div>

                  <div>
                    <label className="block text-[13px] font-bold text-slate-700 mb-1.5 ml-1">
                      {t('companyBrandName', 'Наименование компании / бренда')}*
                    </label>
                    <div className="relative flex items-center">
                      <Building2 size={18} className="absolute left-4 text-slate-400" />
                      <input
                        type="text"
                        required
                        value={regData.companyName}
                        onChange={(e) => setRegData({ ...regData, companyName: e.target.value })}
                        placeholder={t('companyBrandPlaceholder', 'например, Медик-Фарм')}
                        className="w-full pl-11 pr-4 py-3 bg-white border border-slate-300 rounded-2xl text-slate-800 text-sm transition-all focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 font-medium"
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 ml-1">
                      {t('companyBrandHint', 'Указывайте только название бренда без организационной формы (ИП, ХО, ЧП)')}
                    </p>
                  </div>

                  <div>
                    <label className="block text-[13px] font-bold text-slate-700 mb-1.5 ml-1">
                      {regData.countryCode === 'TM'
                        ? t('taxIdLabelTM', 'Код предприятия (ХОПО / ОКПО) / ИНН')
                        : t('taxIdLabelForeign', 'Регистрационный номер / Tax ID / TIN')
                      }*
                    </label>
                    <div className="relative flex items-center">
                      <FileText size={18} className="absolute left-4 text-slate-400" />
                      <input
                        type="text"
                        required
                        maxLength={regData.countryCode === 'TM' ? 8 : 24}
                        value={regData.taxId}
                        onChange={(e) => {
                          const val = regData.countryCode === 'TM' 
                            ? e.target.value.replace(/\D/g, '').slice(0, 8)
                            : e.target.value.slice(0, 24);
                          setRegData({ ...regData, taxId: val });
                        }}
                        placeholder={
                          regData.countryCode === 'TM'
                            ? t('taxIdPlaceholderTM', '8-значный код (например: 12345678)')
                            : t('taxIdPlaceholderForeign', 'Введите налоговый номер или TIN')
                        }
                        className="w-full pl-11 pr-4 py-3 bg-white border border-slate-300 rounded-2xl text-slate-800 text-sm transition-all focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 font-medium tracking-wider font-mono"
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 ml-1">
                      {regData.countryCode === 'TM'
                        ? 'Основной идентификатор юридического лица в Туркменистане (8 цифр)'
                        : 'Международный налоговый или регистрационный номер компании'
                      }
                    </p>
                  </div>

                  <div className="flex space-x-3 mt-6">
                    <button
                      type="button"
                      onClick={() => { setError(''); setRegStep(1); }}
                      className="w-1/3 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold transition-all text-sm cursor-pointer"
                    >
                      {t('backToList', 'Назад')}
                    </button>
                    <button
                      type="button"
                      onClick={handleNextStep}
                      disabled={!isStep2Valid}
                      className="w-2/3 py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl font-black shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center space-x-2 active:scale-[0.98] text-[15px] cursor-pointer"
                    >
                      <span>{t('nextStepBtn', 'Далее')}</span>
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </>
              )}

              {regStep === 3 && (
                <>
                  <div>
                    <div className="flex items-center justify-between mb-1.5 ml-1">
                      <label className="block text-[13px] font-bold text-slate-700">
                        {t('supplierCategories', 'Категории деятельности')}*
                      </label>
                      <span className={`text-[11px] font-bold ${regData.categoryIds.length > 0 ? 'text-blue-600' : 'text-rose-500'}`}>
                        {t('categoriesSelected', 'Выбрано')}: {regData.categoryIds.length}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mb-2 ml-1">
                      {t('selectCategoriesHint', 'Выберите направления деятельности вашей компании')}
                    </p>
                    <div className="grid grid-cols-1 gap-1.5 max-h-48 overflow-y-auto overscroll-contain p-2 bg-slate-50 border border-slate-200 rounded-2xl">
                      {categoriesList.length === 0 ? (
                        <div className="text-xs text-slate-400 text-center py-4">
                          {t('loading', 'Загрузка категорий...')}
                        </div>
                      ) : (
                        categoriesList.map((cat) => {
                          const isChecked = regData.categoryIds.includes(cat.id);
                          return (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => {
                                setRegData(prev => ({
                                  ...prev,
                                  categoryIds: isChecked
                                    ? prev.categoryIds.filter(id => id !== cat.id)
                                    : [...prev.categoryIds, cat.id]
                                }));
                              }}
                              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer border ${
                                isChecked
                                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                  : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300 hover:bg-blue-50/40'
                              }`}
                            >
                              <div
                                className={`w-4 h-4 rounded-md flex items-center justify-center border text-[10px] shrink-0 font-bold ${
                                  isChecked ? 'bg-white text-blue-600 border-white' : 'border-slate-300 bg-white'
                                }`}
                              >
                                {isChecked ? '✓' : ''}
                              </div>
                              <span className="truncate">{cat.name}</span>
                            </button>
                          );
                        })
                      )}
                    </div>

                    {/* ПРЕДУПРЕЖДЕНИЕ ПРИ 0 ВЫБРАННЫХ КАТЕГОРИЯХ */}
                    {regData.categoryIds.length === 0 && (
                      <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium flex items-center gap-2 animate-in fade-in">
                        <AlertCircle size={16} className="text-amber-600 shrink-0" />
                        <span>{t('selectAtLeastOneCategoryWarning', 'Для завершения регистрации выберите хотя бы одну категорию деятельности')}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-start mt-4">
                    <input
                      type="checkbox"
                      id="termsAccepted"
                      required
                      checked={regData.termsAccepted}
                      onChange={(e) => setRegData({ ...regData, termsAccepted: e.target.checked })}
                      className="mt-1 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                    />
                    <label htmlFor="termsAccepted" className="ml-2 text-xs text-slate-500 leading-tight cursor-pointer select-none">
                      {t('termsAcceptedAgreementText', 'Я согласен с регламентом проведения электронных торгов и обработкой персональных данных.')}
                    </label>
                  </div>

                  <div className="flex space-x-3 mt-6">
                    <button
                      type="button"
                      onClick={() => { setError(''); setRegStep(2); }}
                      className="w-1/3 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold transition-all text-sm cursor-pointer"
                    >
                      {t('backToList', 'Назад')}
                    </button>
                    <button
                      type="submit"
                      disabled={loading || !isStep3Valid}
                      className="w-2/3 py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl font-black shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center space-x-2 active:scale-[0.98] text-[15px] cursor-pointer"
                    >
                      <span>{loading ? t('registering', 'Создание...') : t('registerBtn', 'Зарегистрироваться')}</span>
                    </button>
                  </div>
                </>
              )}

              <div className="text-center mt-6 text-sm font-medium text-slate-500">
                {t('alreadyHaveAccountPrompt', 'Уже есть аккаунт?')} {' '}
                <button
                  type="button"
                  onClick={() => { setIsRegister(false); setError(''); }}
                  className="text-slate-800 hover:text-black font-bold transition-colors underline decoration-2 underline-offset-4 decoration-slate-200 hover:decoration-slate-400 ml-1"
                >
                  {t('signInLink', 'Войти')}
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}

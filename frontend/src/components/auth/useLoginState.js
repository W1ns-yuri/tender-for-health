import { useState, useMemo } from 'react';
import API from '../../services/api';
import {
  COUNTRIES,
  TENDER_ILLUSTRATIONS,
  formatPhoneByCountry,
  isPhoneValidForCountry,
  cleanCompanyName,
} from './authConstants';

export function useLoginState({ onLoginSuccess, t }) {
  // Выбранная иллюстрация постера (сохраняется в localStorage)
  const [activeIllustrationIndex, setActiveIllustrationIndex] = useState(() => {
    try {
      const saved = localStorage.getItem('tender_active_illustration_idx');
      return saved !== null ? Number(saved) : 0;
    } catch {
      return 0;
    }
  });

  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);

  // Состояния логина
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Состояния регистрации
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
    termsAccepted: false,
  });
  const [regStep, setRegStep] = useState(1);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Список стран с локализованными наименованиями
  const countriesList = useMemo(() => {
    return COUNTRIES.map((c) => ({
      id: c.id,
      name: t(c.nameKey, c.defaultName),
      prefix: c.prefix,
    }));
  }, [t]);

  const selectedCountryObj = useMemo(() => {
    return countriesList.find((c) => c.id === regData.countryCode) || countriesList[0];
  }, [countriesList, regData.countryCode]);

  // Варианты форм собственности в зависимости от выбранной страны
  const companyTypeOptions = useMemo(() => {
    if (regData.countryCode === 'TM') {
      return [
        { id: 'BUSINESS_SOCIETY', name: t('typeBusinessSociety', 'ХО (Хозяйственное общество)') },
        { id: 'ENTREPRENEUR', name: t('typeEntrepreneur', 'ИП (Индивидуальный предприниматель)') },
        { id: 'BUSINESS_COMPANY', name: t('typeBusinessCompany', 'ЧП / ХП (Частное предприятие)') },
        { id: 'GOVERNMENT', name: t('typeGovernment', 'ГП (Государственное предприятие)') },
        { id: 'FARMER_ASSOCIATION', name: t('typeFarmer', 'ДО (Дочернее общество / Daýhan hojalygy)') },
      ];
    }
    return [
      { id: 'FOREIGN_ENTITY', name: t('foreignEntity', 'Иностранное юридическое лицо (Foreign Entity)') },
      { id: 'FOREIGN_BRANCH', name: t('foreignBranch', 'Представительство / Филиал (Branch / Office)') },
      { id: 'FOREIGN_SOLE_TRADER', name: t('foreignSoleTrader', 'Индивидуальный предприниматель (Sole Proprietor)') },
    ];
  }, [regData.countryCode, t]);

  // Валидация телефона
  const isPhoneValid = useMemo(() => {
    return isPhoneValidForCountry(regData.countryCode, regData.phone);
  }, [regData.countryCode, regData.phone]);

  // Валидация шагов регистрации
  const isStep1Valid = Boolean(
    regData.firstName?.trim() &&
    regData.lastName?.trim() &&
    regData.countryCode &&
    isPhoneValid
  );

  const isStep2Valid = Boolean(
    regData.companyType &&
    regData.companyName?.trim().length >= 2 &&
    (regData.countryCode === 'TM'
      ? regData.taxId?.replace(/\D/g, '').length === 8
      : regData.taxId?.trim().length >= 4)
  );

  const isStep3Valid = Boolean(
    regData.username?.trim() &&
    regData.username.includes('@') &&
    regData.password?.length >= 6 &&
    regData.termsAccepted
  );

  const handlePhoneChange = (val) => {
    const formatted = formatPhoneByCountry(regData.countryCode, val);
    setRegData((prev) => ({ ...prev, phone: formatted }));
  };

  const handleCountryChange = (cCode) => {
    setRegData((prev) => ({
      ...prev,
      countryCode: cCode,
      phone: '',
      companyType: cCode === 'TM' ? 'BUSINESS_SOCIETY' : 'FOREIGN_ENTITY',
      taxId: '',
    }));
  };

  const handleSelectIllustration = (index) => {
    setActiveIllustrationIndex(index);
    try {
      localStorage.setItem('tender_active_illustration_idx', String(index));
    } catch {}
  };

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

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await API.post('/auth/login', { username, password });
      if (res.data?.token) {
        localStorage.setItem('tender_token', res.data.token);
        localStorage.setItem('tender_user', JSON.stringify(res.data.user));
        if (onLoginSuccess) {
          onLoginSuccess(res.data.user, res.data.token);
        }
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
    if (e) e.preventDefault();
    setError('');
    if (!isStep3Valid) {
      setError(t('fillStep3FieldsNotice', 'Заполните email, пароль и подтвердите согласие с условиями'));
      return;
    }

    setLoading(true);

    try {
      const cleaned = cleanCompanyName(regData.companyName);
      const fullPhone = regData.countryCode === 'OTHER'
        ? (regData.phone.startsWith('+') ? regData.phone : `+${regData.phone}`.trim())
        : `${selectedCountryObj.prefix} ${regData.phone}`.trim();

      const payload = {
        ...regData,
        phone: fullPhone,
        companyName: cleaned,
        okpoCode: regData.countryCode === 'TM' ? regData.taxId : null,
      };

      const res = await API.post('/auth/register', payload);
      if (res.data?.token) {
        localStorage.setItem('tender_token', res.data.token);
        localStorage.setItem('tender_user', JSON.stringify(res.data.user));
        if (onLoginSuccess) {
          onLoginSuccess(res.data.user, res.data.token);
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || t('registerError', 'Ошибка регистрации'));
    } finally {
      setLoading(false);
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
        if (onLoginSuccess) {
          onLoginSuccess(res.data.user, res.data.token);
        }
      }
    } catch (err) {
      const isColdStart = !err.response || err.response.status === 502 || err.response.status === 503 || err.code === 'ERR_NETWORK';
      if (isColdStart && retryCount > 0) {
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

  return {
    // Состояния
    isRegister,
    setIsRegister,
    showPassword,
    setShowPassword,
    username,
    setUsername,
    password,
    setPassword,
    regData,
    setRegData,
    regStep,
    setRegStep,
    error,
    setError,
    loading,
    demoModalOpen,
    setDemoModalOpen,
    forgotModalOpen,
    setForgotModalOpen,
    isLangOpen,
    setIsLangOpen,
    activeIllustrationIndex,

    // Списки и вычисляемые
    countriesList,
    selectedCountryObj,
    companyTypeOptions,
    isStep1Valid,
    isStep2Valid,
    isStep3Valid,
    illustrations: TENDER_ILLUSTRATIONS,

    // Обработчики
    handleSelectIllustration,
    handlePhoneChange,
    handleCountryChange,
    handleNextStep,
    handleLogin,
    handleRegister,
    handleQuickLogin,
  };
}

import React, { useState } from 'react';
import { 
  Palette, 
  Bell, 
  Shield, 
  Database, 
  Sun, 
  Moon, 
  Laptop, 
  Check, 
  Eye, 
  EyeOff, 
  Volume2, 
  VolumeX, 
  Lock, 
  Download, 
  Server,
  KeyRound,
  ChevronRight
} from 'lucide-react';
import { 
  Button, 
  Badge, 
  CustomSelect
} from '../components/ui';
import API from '../services/api';
import { useAlert } from '../context/AlertContext';
import { getRoleTheme, getAvatarInitials } from '../utils/themeUtils';
import { getTranslation } from '../utils/translations';

export default function SettingsPage({
  role = 'ADMIN',
  isDarkMode = false,
  setIsDarkMode,
  lang = 'RU',
  setLang,
  user = null
}) {
  const theme = getRoleTheme(role, isDarkMode);
  const isSupplier = role === 'SUPPLIER';
  const { showToast } = useAlert();
  const t = (k, f) => getTranslation(lang, k, f);

  const [activeTab, setActiveTab] = useState('general');

  // 1. Внешний вид и UX
  const [themeMode, setThemeMode] = useState(() => {
    return localStorage.getItem('tender_theme_mode') || (isDarkMode ? 'dark' : 'light');
  });

  const [density, setDensity] = useState(() => {
    return localStorage.getItem('tender_density') || 'comfortable';
  });

  // 2. Уведомления
  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem('tender_sound_enabled') !== 'false';
  });

  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem('tender_notifications_config');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return {
      deadlineReminder24h: true,
      newTendersAlert: true,
      evaluationResults: true,
      verificationStatus: true,
      newOfferSubmitted: true,
      supplierPendingReview: true,
      tendersOpeningDue: true,
      securityAlerts: true,
    };
  });

  // 3. Безопасность
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [sessionTimeout, setSessionTimeout] = useState(() => {
    return localStorage.getItem('tender_session_timeout') || '30';
  });

  // 4. Экспорт логов
  const [isExportingLogs, setIsExportingLogs] = useState(false);

  // Переключение темы (Светлая / Темная / Системная)
  const handleThemeModeChange = (mode) => {
    setThemeMode(mode);
    localStorage.setItem('tender_theme_mode', mode);

    if (mode === 'system') {
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(systemDark);
      localStorage.setItem('tender_theme', systemDark ? 'dark' : 'light');
      showToast({
        type: 'info',
        title: t('themeSystem', 'Системная тема'),
        message: t('themeSystemApplied', 'Оформление синхронизировано с параметрами ОС'),
      });
    } else if (mode === 'dark') {
      setIsDarkMode(true);
      localStorage.setItem('tender_theme', 'dark');
      showToast({
        type: 'success',
        title: t('themeDark', 'Тёмная тема'),
        message: t('themeDarkApplied', 'Тёмный режим успешно активирован'),
      });
    } else {
      setIsDarkMode(false);
      localStorage.setItem('tender_theme', 'light');
      showToast({
        type: 'success',
        title: t('themeLight', 'Светлая тема'),
        message: t('themeLightApplied', 'Светлый режим успешно активирован'),
      });
    }
  };

  // Переключение плотности таблиц
  const handleDensityChange = (newDensity) => {
    setDensity(newDensity);
    localStorage.setItem('tender_density', newDensity);
    showToast({
      type: 'success',
      title: t('densityTitle', 'Плотность таблиц'),
      message: newDensity === 'compact' 
        ? t('densityCompactApplied', 'Включен компактный режим отображения строк') 
        : t('densityComfortApplied', 'Включен стандартный комфортный режим'),
    });
  };

  // Переключение языка
  const handleLanguageChange = (newLang) => {
    if (newLang === lang) return;
    setLang(newLang);
    showToast({
      type: 'success',
      title: t('languageUpdated', 'Dil üýtgedildi'),
      message: newLang === 'RU' ? 'Выбран русский язык' : newLang === 'TM' ? 'Türkmen dili saýlandy' : 'English language selected',
    });
  };

  // Сохранение уведомлений
  const handleSaveNotifications = () => {
    localStorage.setItem('tender_sound_enabled', String(soundEnabled));
    localStorage.setItem('tender_notifications_config', JSON.stringify(notifications));
    showToast({
      type: 'success',
      title: t('settingsSaved', 'Настройки сохранены'),
      message: t('notificationsUpdatedMsg', 'Параметры уведомлений успешно обновлены'),
    });
  };

  // Сохранение таймаута сессии
  const handleSessionTimeoutChange = (val) => {
    setSessionTimeout(val);
    localStorage.setItem('tender_session_timeout', val);
    showToast({
      type: 'success',
      title: t('sessionTimeoutTitle', 'Автовыход из системы'),
      message: val === 'never'
        ? t('sessionTimeoutDisabled', 'Автоматический выход отключен')
        : `${t('sessionTimeoutSet', 'Автовыход установлен на')} ${val} ${t('minutes', 'мин.')}`,
    });
  };

  // Смена пароля
  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (!currentPassword || !newPassword) {
      showToast({
        type: 'error',
        title: t('error', 'Ошибка'),
        message: t('fillRequiredFields', 'Заполните текущий и новый пароль'),
      });
      return;
    }

    if (newPassword.length < 6) {
      showToast({
        type: 'warning',
        title: t('weakPassword', 'Слабый пароль'),
        message: t('passwordMinLength', 'Новый пароль должен содержать не менее 6 символов'),
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast({
        type: 'error',
        title: t('error', 'Ошибка'),
        message: t('passwordMismatch', 'Введенные новые пароли не совпадают'),
      });
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await API.post('/auth/change-password', {
        currentPassword,
        newPassword,
      });

      showToast({
        type: 'success',
        title: t('passwordSuccessTitle', 'Пароль обновлен'),
        message: res.data?.message || t('passwordChangedSuccess', 'Ваш пароль успешно изменен'),
      });

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      showToast({
        type: 'error',
        title: t('passwordChangeError', 'Ошибка смены пароля'),
        message: err.response?.data?.error || t('checkCurrentPassword', 'Проверьте правильность текущего пароля'),
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Экспорт системного журнала в JSON
  const handleExportAuditLogs = async () => {
    setIsExportingLogs(true);
    try {
      const res = await API.get('/dashboard/logs?limit=500');
      const data = res.data || [];
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tender_audit_logs_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast({
        type: 'success',
        title: t('exportSuccess', 'Экспорт завершен'),
        message: `${t('exportedRecords', 'Выгружено записей журнала')}: ${data.length}`,
      });
    } catch {
      showToast({
        type: 'error',
        title: t('exportError', 'Ошибка экспорта'),
        message: t('exportFailedMsg', 'Не удалось выгрузить системный журнал'),
      });
    } finally {
      setIsExportingLogs(false);
    }
  };

  const tabs = [
    { 
      id: 'general', 
      label: t('tabGeneral', 'Внешний вид и язык'), 
      icon: <Palette size={16} /> 
    },
    { 
      id: 'notifications', 
      label: t('tabNotifications', 'Уведомления'), 
      icon: <Bell size={16} /> 
    },
    { 
      id: 'security', 
      label: t('tabSecurity', 'Безопасность и аккаунт'), 
      icon: <Shield size={16} /> 
    },
    ...(role === 'ADMIN' ? [{
      id: 'system',
      label: t('tabSystemExport', 'Система и экспорт'),
      icon: <Database size={16} />
    }] : [])
  ];

  const userInitials = getAvatarInitials(user, role);

  return (
    <div className="w-full space-y-6 pb-16 animate-in fade-in duration-200">
      {/* 1. Заголовок страницы в строгом стиле B2B GovTech */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {t('settings', 'Настройки системы')}
            </h1>
            <Badge
              variant={isSupplier ? 'blue' : 'emerald'}
              status="ACTIVE"
              size="sm"
            >
              {isSupplier ? t('supplierStr', 'Поставщик') : t('adminStr', 'Администратор')}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t('settingsSubtitle', 'Управление параметрами интерфейса, уведомлений и безопасности')}
          </p>
        </div>

        {/* Индикатор текущей учетной записи в шапке */}
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-2xs self-start sm:self-auto">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
            isSupplier 
              ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300' 
              : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
          }`}>
            {userInitials}
          </div>
          <div className="text-left text-xs leading-tight">
            <div className="font-bold text-slate-900 dark:text-white">
              {user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Пользователь'}
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              @{user?.username || 'user'}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Двухколоночный современный макет: вертикальное меню слева + карточки настроек справа */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Левая навигационная колонка */}
        <div className="lg:col-span-3 space-y-3">
          <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-2 shadow-2xs space-y-1">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    w-full px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer select-none text-left
                    ${
                      isActive
                        ? isSupplier
                          ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 shadow-2xs border border-blue-200/60 dark:border-blue-800/60'
                          : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 shadow-2xs border border-emerald-200/60 dark:border-emerald-800/60'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200 border border-transparent'
                    }
                  `}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={isActive ? (isSupplier ? 'text-blue-600 dark:text-blue-400' : 'text-emerald-600 dark:text-emerald-400') : 'text-slate-400'}>
                      {tab.icon}
                    </span>
                    <span>{tab.label}</span>
                  </div>
                  {isActive && <ChevronRight size={14} className={isSupplier ? 'text-blue-600' : 'text-emerald-600'} />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Правая контентная колонка */}
        <div className="lg:col-span-9 space-y-6">

      {/* 3.1. ВКЛАДКА: ВНЕШНИЙ ВИД И ЯЗЫК */}
      {activeTab === 'general' && (
        <div className="space-y-5">
          {/* Группа настроек отображения */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-2xs divide-y divide-slate-100 dark:divide-slate-800/80 overflow-hidden">
            
            {/* Язык платформы */}
            <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="max-w-md">
                <div className="font-bold text-sm text-slate-900 dark:text-white">
                  {t('interfaceLanguage', 'Язык платформы')}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {t('interfaceLanguageDesc', 'Основной язык отображения форм, таблиц, меню и системных уведомлений')}
                </div>
              </div>

              {/* Сегментированный переключатель языка */}
              <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shrink-0">
                {[
                  { id: 'RU', label: 'Русский', code: 'RU' },
                  { id: 'TM', label: 'Türkmençe', code: 'TM' },
                  { id: 'EN', label: 'English', code: 'EN' },
                ].map((item) => {
                  const isSelected = lang === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleLanguageChange(item.id)}
                      className={`
                        px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5
                        ${
                          isSelected
                            ? 'bg-white dark:bg-[#111827] text-slate-900 dark:text-white shadow-2xs border border-slate-200/60 dark:border-slate-700/60'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                        }
                      `}
                    >
                      <span className="font-mono text-[10px] px-1 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-black">
                        {item.code}
                      </span>
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Тема интерфейса */}
            <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="max-w-md">
                <div className="font-bold text-sm text-slate-900 dark:text-white">
                  {t('colorThemeTitle', 'Тема оформления')}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {t('colorThemeDesc', 'Настройте цветовую схему для комфортной работы в дневное или ночное время')}
                </div>
              </div>

              {/* Сегментированный переключатель темы */}
              <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shrink-0">
                {[
                  { id: 'light', label: t('themeLight', 'Светлая'), icon: <Sun size={14} className="text-amber-500" /> },
                  { id: 'dark', label: t('themeDark', 'Тёмная'), icon: <Moon size={14} className="text-indigo-400" /> },
                  { id: 'system', label: t('themeSystem', 'Системная'), icon: <Laptop size={14} className="text-slate-400" /> },
                ].map((item) => {
                  const isSelected = themeMode === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleThemeModeChange(item.id)}
                      className={`
                        px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5
                        ${
                          isSelected
                            ? 'bg-white dark:bg-[#111827] text-slate-900 dark:text-white shadow-2xs border border-slate-200/60 dark:border-slate-700/60'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                        }
                      `}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Плотность строк в таблицах */}
            <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="max-w-md">
                <div className="font-bold text-sm text-slate-900 dark:text-white">
                  {t('densityTitle', 'Плотность табличных данных')}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {t('densityDesc', 'Режим отступов для работы с большими перечнями спецификаций и реестрами')}
                </div>
              </div>

              {/* Сегментированный переключатель плотности */}
              <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shrink-0">
                {[
                  { id: 'comfortable', label: t('densityComfortable', 'Стандартная'), sub: '48px' },
                  { id: 'compact', label: t('densityCompact', 'Компактная'), sub: '36px' },
                ].map((item) => {
                  const isSelected = density === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleDensityChange(item.id)}
                      className={`
                        px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5
                        ${
                          isSelected
                            ? 'bg-white dark:bg-[#111827] text-slate-900 dark:text-white shadow-2xs border border-slate-200/60 dark:border-slate-700/60'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                        }
                      `}
                    >
                      <span>{item.label}</span>
                      <span className="font-mono text-[10px] text-slate-400 font-normal">
                        ({item.sub})
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 3.2. ВКЛАДКА: ЦЕНТР УВЕДОМЛЕНИЙ */}
      {activeTab === 'notifications' && (
        <div className="space-y-5">
          {/* Каналы оповещений */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-2xs overflow-hidden">
            <div className="px-5 py-4 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200/80 dark:border-slate-800">
              <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider">
                Каналы оповещений
              </h3>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {/* Toast уведомления */}
              <div className="p-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    isSupplier 
                      ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-900/40' 
                      : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/40'
                  }`}>
                    <Bell size={18} />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-slate-900 dark:text-white">
                      {t('pushNotificationsActive', 'Всплывающие уведомления (Toasts)')}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {t('toastConfiguredStandard', 'Стандартное время показа уведомлений установлено на 3 секунды с возможностью паузы при наведении мыши')}
                    </div>
                  </div>
                </div>

                <Badge variant={isSupplier ? 'blue' : 'emerald'} size="sm">
                  3 сек
                </Badge>
              </div>

              {/* Звуковые оповещения */}
              <div className="p-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    soundEnabled
                      ? (isSupplier ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600' : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600')
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                  } border border-slate-200/60 dark:border-slate-800`}>
                    {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                  </div>
                  <div>
                    <div className="font-bold text-sm text-slate-900 dark:text-white">
                      {t('soundAlertsTitle', 'Звуковые сигналы')}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {t('soundAlertsDesc', 'Воспроизводить мягкий звуковой индикатор при получении системных оповещений')}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={`
                    w-11 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer shrink-0
                    ${soundEnabled ? (isSupplier ? 'bg-blue-600' : 'bg-emerald-600') : 'bg-slate-300 dark:bg-slate-700'}
                  `}
                >
                  <div
                    className={`
                      w-5 h-5 rounded-full bg-white transition-transform shadow-xs
                      ${soundEnabled ? 'translate-x-5' : 'translate-x-0'}
                    `}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Событийные триггеры */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-2xs overflow-hidden">
            <div className="px-5 py-4 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200/80 dark:border-slate-800">
              <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider">
                {isSupplier ? 'События закупок поставщика' : 'События мониторинга организатора'}
              </h3>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {(isSupplier ? [
                {
                  key: 'deadlineReminder24h',
                  title: t('notifyDeadline24h', 'Напоминание о дедлайне за 24 часа'),
                  desc: t('notifyDeadline24hDesc', 'Предупреждать до наступления крайнего срока подачи заявок по открытым процедурам'),
                },
                {
                  key: 'newTendersAlert',
                  title: t('notifyNewTenders', 'Новые тендеры по моим категориям'),
                  desc: t('notifyNewTendersDesc', 'Оповещать при публикации процедур по профилю вашей медицинской деятельности'),
                },
                {
                  key: 'evaluationResults',
                  title: t('notifyEvalResults', 'Итоги оценки и объявление победителя'),
                  desc: t('notifyEvalResultsDesc', 'Мгновенное уведомление о результатах рассмотрения ваших поданных предложений'),
                },
                {
                  key: 'verificationStatus',
                  title: t('notifyVerification', 'Статус верификации компании'),
                  desc: t('notifyVerificationDesc', 'Оповещения об одобрении модератором или замечаниях к документам организации'),
                },
              ] : [
                {
                  key: 'newOfferSubmitted',
                  title: t('notifyNewOffer', 'Подача нового предложения'),
                  desc: t('notifyNewOfferDesc', 'Оповещать организатора, когда поставщик отправляет конверт с предложением'),
                },
                {
                  key: 'supplierPendingReview',
                  title: t('notifyPendingSupplier', 'Новый поставщик на модерацию'),
                  desc: t('notifyPendingSupplierDesc', 'Уведомлять при регистрации компании, требующей проверки документов'),
                },
                {
                  key: 'tendersOpeningDue',
                  title: t('notifyOpeningDue', 'Наступление дедлайна тендера'),
                  desc: t('notifyOpeningDueDesc', 'Оповещать о закрытии приема предложений и готовности процедуры к вскрытию конвертов'),
                },
                {
                  key: 'securityAlerts',
                  title: t('notifySecurityAlerts', 'Критические системные события'),
                  desc: t('notifySecurityAlertsDesc', 'Оповещения об ошибках авторизации и модификации ключевых справочников'),
                },
              ]).map((item) => {
                const isChecked = Boolean(notifications[item.key]);
                return (
                  <div key={item.key} className="p-5 flex items-center justify-between gap-4">
                    <div className="max-w-2xl">
                      <div className="font-bold text-sm text-slate-800 dark:text-slate-200">{item.title}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{item.desc}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setNotifications({ ...notifications, [item.key]: !isChecked })}
                      className={`
                        w-11 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer shrink-0
                        ${isChecked ? (isSupplier ? 'bg-blue-600' : 'bg-emerald-600') : 'bg-slate-300 dark:bg-slate-700'}
                      `}
                    >
                      <div
                        className={`
                          w-5 h-5 rounded-full bg-white transition-transform shadow-xs
                          ${isChecked ? 'translate-x-5' : 'translate-x-0'}
                        `}
                      />
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="p-4 bg-slate-50/70 dark:bg-slate-800/40 border-t border-slate-200/80 dark:border-slate-800 flex justify-end">
              <Button
                type="button"
                variant={isSupplier ? 'primary' : 'success'}
                size="sm"
                onClick={handleSaveNotifications}
              >
                <Check size={14} className="mr-1.5" />
                <span>{t('saveSettings', 'Сохранить настройки')}</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 3.3. ВКЛАДКА: БЕЗОПАСНОСТЬ И АККАУНТ */}
      {activeTab === 'security' && (
        <div className="space-y-5">
          {/* Профиль пользователя */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-2xs p-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-base shadow-xs shrink-0 ${
                  isSupplier 
                    ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800' 
                    : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                }`}>
                  {userInitials}
                </div>
                <div>
                  <div className="font-bold text-base text-slate-900 dark:text-white">
                    {user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Авторизованный пользователь'}
                  </div>
                  <div className="text-xs text-slate-400 font-mono mt-0.5">
                    @{user?.username || 'user'} {user?.email ? `• ${user.email}` : ''}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant={isSupplier ? 'blue' : 'emerald'} size="sm">
                  {user?.roleType || role}
                </Badge>
                <Badge variant="outline" size="sm">
                  {t('accountActive', 'Активен')}
                </Badge>
              </div>
            </div>
          </div>

          {/* Форма смены пароля */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-2xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center gap-2.5">
                <KeyRound size={17} className={isSupplier ? 'text-blue-500' : 'text-emerald-500'} />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  {t('changePasswordTitle', 'Смена пароля учетной записи')}
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {t('changePasswordDesc', 'Регулярно обновляйте пароль для надежной защиты закупочных данных')}
              </p>
            </div>

            <form onSubmit={handleChangePassword}>
              <div className="p-5 space-y-4">
                {/* Текущий пароль */}
                <div className="max-w-md">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    {t('currentPassword', 'Текущий пароль')} <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrent ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      className={`w-full pl-3.5 pr-10 py-2 rounded-xl text-xs ${theme.inputBg}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrent(!showCurrent)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                {/* Новый пароль и подтверждение */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      {t('newPassword', 'Новый пароль')} <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showNew ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder={t('passwordMinLengthHint', 'Минимум 6 символов')}
                        className={`w-full pl-3.5 pr-10 py-2 rounded-xl text-xs ${theme.inputBg}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNew(!showNew)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                      >
                        {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      {t('confirmPassword', 'Подтверждение пароля')} <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirm ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder={t('repeatNewPassword', 'Повторите новый пароль')}
                        className={`w-full pl-3.5 pr-10 py-2 rounded-xl text-xs ${theme.inputBg}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                      >
                        {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                </div>

                {newPassword && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-500 dark:text-slate-400">{t('passwordStrength', 'Сложность пароля')}:</span>
                    <span className={`font-bold ${newPassword.length >= 8 ? 'text-emerald-600' : newPassword.length >= 6 ? 'text-amber-500' : 'text-rose-500'}`}>
                      {newPassword.length >= 8 ? t('strong', 'Надежный') : newPassword.length >= 6 ? t('medium', 'Средний') : t('weak', 'Слабый')}
                    </span>
                  </div>
                )}
              </div>

              <div className="p-4 bg-slate-50/70 dark:bg-slate-800/40 border-t border-slate-200/80 dark:border-slate-800 flex justify-end">
                <Button
                  type="submit"
                  variant={isSupplier ? 'primary' : 'success'}
                  size="sm"
                  isLoading={isChangingPassword}
                >
                  <Lock size={14} className="mr-1.5" />
                  <span>{t('updatePasswordBtn', 'Обновить пароль')}</span>
                </Button>
              </div>
            </form>
          </div>

          {/* Таймаут неактивности / Автовыход */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-2xs p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="max-w-md">
              <div className="font-bold text-sm text-slate-900 dark:text-white">
                {t('sessionAutoLockTitle', 'Таймаут неактивности (Автовыход)')}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {t('sessionAutoLockDesc', 'Автоматическое завершение сеанса при отсутствии действий для защиты рабочего места')}
              </div>
            </div>

            <div className="w-full md:w-64 shrink-0">
              <CustomSelect
                role={role}
                size="sm"
                value={sessionTimeout}
                onChange={handleSessionTimeoutChange}
                options={[
                  { id: '15', name: `15 ${t('minutes', 'минут')}` },
                  { id: '30', name: `30 ${t('minutes', 'минут (Рекомендуется)')}` },
                  { id: '60', name: `1 ${t('hour', 'час')}` },
                  { id: 'never', name: t('neverTimeout', 'Не блокировать сеанс') },
                ]}
                isDarkMode={isDarkMode}
                theme={theme}
                t={t}
              />
            </div>
          </div>
        </div>
      )}

      {/* 3.4. ВКЛАДКА: СИСТЕМА И ЭКСПОРТ (ДЛЯ АДМИНИСТРАТОРА) */}
      {activeTab === 'system' && role === 'ADMIN' && (
        <div className="space-y-5">
          {/* Экспорт системного журнала */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-2xs p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="font-bold text-sm text-slate-900 dark:text-white">
                {t('exportAuditLogsTitle', 'Выгрузка системного журнала аудита')}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {t('exportAuditLogsDesc', 'Выгрузка последних 500 записей действий пользователей, изменений статусов и транзакций в JSON-файл')}
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              isLoading={isExportingLogs}
              onClick={handleExportAuditLogs}
            >
              <Download size={14} className="mr-1.5" />
              <span>{t('downloadJson', 'Скачать JSON')}</span>
            </Button>
          </div>

          {/* Сведения о платформе */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-2xs p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Server size={16} className="text-emerald-600 dark:text-emerald-400" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {t('systemInfoTitle', 'Информация об инфраструктуре')}
              </h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800">
                <span className="text-slate-400 text-[11px] block">Платформа</span>
                <span className="font-bold text-slate-900 dark:text-white mt-0.5 block">Tender Ulgam</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800">
                <span className="text-slate-400 text-[11px] block">Версия сборки</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white mt-0.5 block">v1.2.4-prod</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800">
                <span className="text-slate-400 text-[11px] block">База данных</span>
                <span className="font-bold text-slate-900 dark:text-white mt-0.5 block">PostgreSQL (Prisma)</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800">
                <span className="text-slate-400 text-[11px] block">Среда запуска</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 block">Production</span>
              </div>
            </div>
          </div>
        </div>
      )}
        </div>
      </div>
    </div>
  );
}

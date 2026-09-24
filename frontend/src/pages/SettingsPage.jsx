import React, { useState } from 'react';
import { 
  Settings, 
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
  User, 
  Download, 
  Activity,
  Layers,
  Clock,
  Sparkles
} from 'lucide-react';
import { 
  Button, 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter,
  Badge, 
  IconBox, 
  Tabs,
  CustomSelect
} from '../components/ui';
import API from '../services/api';
import { useAlert } from '../context/AlertContext';
import { getRoleTheme } from '../utils/themeUtils';
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

  // Проверка звукового оповещения (Web Audio API)
  const playTestChime = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.28);

      showToast({
        type: 'info',
        title: t('soundTestTitle', 'Звуковой сигнал'),
        message: t('soundTestMsg', 'Тестовый звуковой сигнал успешно воспроизведен'),
      });
    } catch {
      showToast({
        type: 'warning',
        title: t('soundError', 'Аудио недоступно'),
        message: t('soundErrorMsg', 'Браузер ограничил воспроизведение звука'),
      });
    }
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

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-in fade-in duration-200">
      {/* Шапка страницы */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <IconBox
            icon={<Settings size={22} />}
            variant={isSupplier ? 'blue' : 'emerald'}
            size="lg"
            className="shadow-xs"
          />
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                {t('settings', 'Настройки')}
              </h1>
              <Badge
                variant={isSupplier ? 'blue' : 'emerald'}
                status={isSupplier ? 'PENDING' : 'ACTIVE'}
                size="sm"
              >
                {isSupplier ? t('supplierStr', 'Поставщик') : t('adminStr', 'Администратор')}
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {t('settingsSubtitle', 'Управление параметрами интерфейса, уведомлений и безопасности')}
            </p>
          </div>
        </div>
      </div>

      {/* Навигационные табы */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
        <Tabs
          tabs={tabs}
          activeTab={activeTab}
          onChange={setActiveTab}
          role={role}
          variant="pills"
          size="md"
        />
      </div>

      {/* 1. ВКЛАДКА: ВНЕШНИЙ ВИД И ЯЗЫК */}
      {activeTab === 'general' && (
        <div className="space-y-6">
          {/* Язык интерфейса */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle icon={<Sparkles size={18} className={isSupplier ? 'text-blue-500' : 'text-emerald-500'} />}>
                  {t('interfaceLanguage', 'Язык интерфейса')}
                </CardTitle>
                <CardDescription>
                  {t('interfaceLanguageDesc', 'Выберите основной язык системы для всех форм, меню и системных уведомлений')}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: 'RU', name: 'Русский', sub: 'По умолчанию', flag: '🇷🇺' },
                  { id: 'TM', name: 'Türkmençe', sub: 'Döwlet dili', flag: '🇹🇲' },
                  { id: 'EN', name: 'English', sub: 'International', flag: '🇬🇧' },
                ].map((item) => {
                  const isSelected = lang === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleLanguageChange(item.id)}
                      className={`
                        p-4 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer
                        ${
                          isSelected
                            ? isSupplier
                              ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 text-blue-950 dark:text-blue-100 shadow-xs ring-2 ring-blue-500/20'
                              : 'border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100 shadow-xs ring-2 ring-emerald-500/20'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700 text-slate-800 dark:text-slate-200'
                        }
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{item.flag}</span>
                        <div>
                          <div className="font-bold text-sm leading-tight">{item.name}</div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{item.sub}</div>
                        </div>
                      </div>
                      {isSelected && (
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-white ${isSupplier ? 'bg-blue-600' : 'bg-emerald-600'}`}>
                          <Check size={12} strokeWidth={3} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Тема оформления */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle icon={<Palette size={18} className={isSupplier ? 'text-blue-500' : 'text-emerald-500'} />}>
                  {t('colorThemeTitle', 'Тема оформления')}
                </CardTitle>
                <CardDescription>
                  {t('colorThemeDesc', 'Настройте цветовую схему для комфортной работы в дневное или ночное время')}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: 'light', label: t('themeLight', 'Светлая тема'), icon: <Sun size={20} className="text-amber-500" />, sub: 'Классический светлый фон' },
                  { id: 'dark', label: t('themeDark', 'Тёмная тема'), icon: <Moon size={20} className="text-indigo-400" />, sub: 'Снижает нагрузку на глаза' },
                  { id: 'system', label: t('themeSystem', 'Системная (Авто)'), icon: <Laptop size={20} className="text-slate-400" />, sub: 'Синхронизация с настройками ОС' },
                ].map((item) => {
                  const isSelected = themeMode === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleThemeModeChange(item.id)}
                      className={`
                        p-4 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer
                        ${
                          isSelected
                            ? isSupplier
                              ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 text-blue-950 dark:text-blue-100 shadow-xs ring-2 ring-blue-500/20'
                              : 'border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100 shadow-xs ring-2 ring-emerald-500/20'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700 text-slate-800 dark:text-slate-200'
                        }
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
                          {item.icon}
                        </div>
                        <div>
                          <div className="font-bold text-sm leading-tight">{item.label}</div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{item.sub}</div>
                        </div>
                      </div>
                      {isSelected && (
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-white ${isSupplier ? 'bg-blue-600' : 'bg-emerald-600'}`}>
                          <Check size={12} strokeWidth={3} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Плотность интерфейса таблиц */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle icon={<Layers size={18} className={isSupplier ? 'text-blue-500' : 'text-emerald-500'} />}>
                  {t('densityTitle', 'Плотность отображения таблиц')}
                </CardTitle>
                <CardDescription>
                  {t('densityDesc', 'Режим отступов для работы с большими перечнями спецификаций и реестрами')}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { 
                    id: 'comfortable', 
                    name: t('densityComfortable', 'Комфортная (По умолчанию)'), 
                    desc: 'Стандартные отступы строк (12-14px), просторный просмотр',
                    previewRows: [14, 14, 14]
                  },
                  { 
                    id: 'compact', 
                    name: t('densityCompact', 'Компактная'), 
                    desc: 'Сжатая высота строк (6-8px), помещается до 40% больше позиций',
                    previewRows: [8, 8, 8]
                  },
                ].map((item) => {
                  const isSelected = density === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleDensityChange(item.id)}
                      className={`
                        p-4 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer
                        ${
                          isSelected
                            ? isSupplier
                              ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 text-blue-950 dark:text-blue-100 shadow-xs ring-2 ring-blue-500/20'
                              : 'border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100 shadow-xs ring-2 ring-emerald-500/20'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700 text-slate-800 dark:text-slate-200'
                        }
                      `}
                    >
                      <div className="flex items-start justify-between w-full mb-3">
                        <div>
                          <div className="font-bold text-sm">{item.name}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{item.desc}</div>
                        </div>
                        {isSelected && (
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-white shrink-0 ml-2 ${isSupplier ? 'bg-blue-600' : 'bg-emerald-600'}`}>
                            <Check size={12} strokeWidth={3} />
                          </div>
                        )}
                      </div>

                      {/* Мини-превью структуры строк */}
                      <div className="w-full space-y-1.5 p-2 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60">
                        {item.previewRows.map((h, idx) => (
                          <div 
                            key={idx} 
                            style={{ height: `${h}px` }} 
                            className="w-full bg-slate-200 dark:bg-slate-700/80 rounded-sm flex items-center px-2"
                          >
                            <div className="w-1/3 h-1.5 bg-slate-300 dark:bg-slate-600 rounded-full" />
                          </div>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 2. ВКЛАДКА: ЦЕНТР УВЕДОМЛЕНИЙ */}
      {activeTab === 'notifications' && (
        <div className="space-y-6">
          {/* Информационный баннер про Toast-уведомления */}
          <div className={`p-4 rounded-xl border flex items-center justify-between gap-4 ${isSupplier ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/50' : 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50'}`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg text-white ${isSupplier ? 'bg-blue-600' : 'bg-emerald-600'}`}>
                <Bell size={18} />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  {t('pushNotificationsActive', 'Системные всплывающие уведомления (Toasts)')}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  {t('toastConfiguredStandard', 'Стандартное время показа уведомлений установлено на 3 секунды с возможностью паузы при наведении мыши')}
                </p>
              </div>
            </div>
            <Badge variant={isSupplier ? 'blue' : 'emerald'} size="sm">
              3 сек
            </Badge>
          </div>

          {/* Звуковые оповещения */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle icon={<Volume2 size={18} className={isSupplier ? 'text-blue-500' : 'text-emerald-500'} />}>
                  {t('soundAlertsTitle', 'Звуковые сигналы')}
                </CardTitle>
                <CardDescription>
                  {t('soundAlertsDesc', 'Воспроизводить легкий аудио-сигнал при получении системных сообщений')}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${soundEnabled ? (isSupplier ? 'bg-blue-100 dark:bg-blue-950 text-blue-600' : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600') : 'bg-slate-200 dark:bg-slate-800 text-slate-400'}`}>
                    {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                  </div>
                  <div>
                    <div className="font-bold text-sm text-slate-800 dark:text-slate-200">
                      {soundEnabled ? t('soundEnabled', 'Звук включен') : t('soundDisabled', 'Звук выключен')}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {t('soundDescription', 'Мягкий сигнал при появлении Toasts и результатов оценки')}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {soundEnabled && (
                    <Button 
                      type="button"
                      variant="outline" 
                      size="sm" 
                      onClick={playTestChime}
                    >
                      {t('testSound', 'Проверить звук')}
                    </Button>
                  )}
                  <button
                    type="button"
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className={`
                      w-12 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer
                      ${soundEnabled ? (isSupplier ? 'bg-blue-600' : 'bg-emerald-600') : 'bg-slate-300 dark:bg-slate-700'}
                    `}
                  >
                    <div
                      className={`
                        w-5 h-5 rounded-full bg-white transition-transform
                        ${soundEnabled ? 'translate-x-6' : 'translate-x-0'}
                      `}
                    />
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Событийные триггеры */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle icon={<Activity size={18} className={isSupplier ? 'text-blue-500' : 'text-emerald-500'} />}>
                  {t('eventNotificationsTitle', 'Событийные уведомления')}
                </CardTitle>
                <CardDescription>
                  {isSupplier
                    ? t('supplierEventDesc', 'Выберите события закупочного процесса, по которым вы хотите получать оповещения')
                    : t('adminEventDesc', 'Параметры оповещения организатора торгов о действиях участников')}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {isSupplier ? (
                  // Опции для Поставщика
                  [
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
                  ].map((item) => {
                    const isChecked = Boolean(notifications[item.key]);
                    return (
                      <div key={item.key} className="py-3.5 flex items-center justify-between gap-4">
                        <div>
                          <div className="font-bold text-sm text-slate-800 dark:text-slate-200">{item.title}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{item.desc}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setNotifications({ ...notifications, [item.key]: !isChecked })}
                          className={`
                            w-11 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer shrink-0
                            ${isChecked ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'}
                          `}
                        >
                          <div
                            className={`
                              w-5 h-5 rounded-full bg-white transition-transform
                              ${isChecked ? 'translate-x-5' : 'translate-x-0'}
                            `}
                          />
                        </button>
                      </div>
                    );
                  })
                ) : (
                  // Опции для Администратора
                  [
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
                  ].map((item) => {
                    const isChecked = Boolean(notifications[item.key]);
                    return (
                      <div key={item.key} className="py-3.5 flex items-center justify-between gap-4">
                        <div>
                          <div className="font-bold text-sm text-slate-800 dark:text-slate-200">{item.title}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{item.desc}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setNotifications({ ...notifications, [item.key]: !isChecked })}
                          className={`
                            w-11 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer shrink-0
                            ${isChecked ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'}
                          `}
                        >
                          <div
                            className={`
                              w-5 h-5 rounded-full bg-white transition-transform
                              ${isChecked ? 'translate-x-5' : 'translate-x-0'}
                            `}
                          />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button
                type="button"
                variant="primary"
                role={role}
                onClick={handleSaveNotifications}
              >
                {t('saveSettings', 'Сохранить настройки')}
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}

      {/* 3. ВКЛАДКА: БЕЗОПАСНОСТЬ И АККАУНТ */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          {/* Карточка учетной записи */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle icon={<User size={18} className={isSupplier ? 'text-blue-500' : 'text-emerald-500'} />}>
                  {t('accountInfoTitle', 'Информация об учетной записи')}
                </CardTitle>
                <CardDescription>
                  {t('accountInfoDesc', 'Данные авторизованного профиля в системе «Tender Ulgamy»')}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
                <div className="flex items-center gap-3.5">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg ${isSupplier ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300' : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'}`}>
                    {user?.firstName ? user.firstName.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div>
                    <div className="font-bold text-base text-slate-900 dark:text-slate-100">
                      {user?.firstName} {user?.lastName}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                      @{user?.username || 'user'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant={isSupplier ? 'blue' : 'emerald'} status="ACTIVE">
                    {user?.roleType || role}
                  </Badge>
                  <Badge variant="outline" status="ACTIVE">
                    {t('accountActive', 'Активен')}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Форма смены пароля */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle icon={<Lock size={18} className={isSupplier ? 'text-blue-500' : 'text-emerald-500'} />}>
                  {t('changePasswordTitle', 'Смена пароля')}
                </CardTitle>
                <CardDescription>
                  {t('changePasswordDesc', 'Регулярно обновляйте пароль для надежной защиты закупочных данных')}
                </CardDescription>
              </div>
            </CardHeader>
            <form onSubmit={handleChangePassword}>
              <CardContent className="space-y-4">
                {/* Текущий пароль */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    {t('currentPassword', 'Текущий пароль')} <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrent ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-3.5 pr-10 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrent(!showCurrent)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                    >
                      {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Новый пароль */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                        className="w-full pl-3.5 pr-10 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNew(!showNew)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                      >
                        {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
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
                        className="w-full pl-3.5 pr-10 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                      >
                        {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </div>

                {newPassword && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-500 dark:text-slate-400">{t('passwordStrength', 'Надежность')}:</span>
                    <span className={`font-bold ${newPassword.length >= 8 ? 'text-emerald-600' : newPassword.length >= 6 ? 'text-amber-500' : 'text-rose-500'}`}>
                      {newPassword.length >= 8 ? t('strong', 'Надежный') : newPassword.length >= 6 ? t('medium', 'Средний') : t('weak', 'Слабый')}
                    </span>
                  </div>
                )}
              </CardContent>

              <CardFooter className="flex justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  role={role}
                  isLoading={isChangingPassword}
                >
                  {t('updatePasswordBtn', 'Обновить пароль')}
                </Button>
              </CardFooter>
            </form>
          </Card>

          {/* Таймаут неактивности / Автовыход */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle icon={<Clock size={18} className={isSupplier ? 'text-blue-500' : 'text-emerald-500'} />}>
                  {t('sessionAutoLockTitle', 'Таймаут неактивности (Автовыход)')}
                </CardTitle>
                <CardDescription>
                  {t('sessionAutoLockDesc', 'Автоматическое завершение сеанса при отсутствии действий для защиты рабочего места')}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="max-w-md">
                <CustomSelect
                  role={role}
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
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 4. ВКЛАДКА: СИСТЕМА И ЭКСПОРТ (ДЛЯ АДМИНА) */}
      {activeTab === 'system' && role === 'ADMIN' && (
        <div className="space-y-6">
          {/* Экспорт системного журнала */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle icon={<Download size={18} className="text-emerald-500" />}>
                  {t('exportAuditLogsTitle', 'Экспорт системного журнала аудита')}
                </CardTitle>
                <CardDescription>
                  {t('exportAuditLogsDesc', 'Выгрузка последних 500 записей действий пользователей, изменений статусов и транзакций в JSON-файл')}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
                <div>
                  <div className="font-bold text-sm text-slate-800 dark:text-slate-200">
                    {t('auditLogsDump', 'Журнал операций (Audit Logs)')}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {t('auditLogsFormatDesc', 'Формат: JSON с временными метками, IP-адресами, пользователями и деталями запросов')}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="primary"
                  role="ADMIN"
                  icon={<Download size={16} />}
                  isLoading={isExportingLogs}
                  onClick={handleExportAuditLogs}
                >
                  {t('downloadJson', 'Скачать JSON')}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Сведения о платформе */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle icon={<Database size={18} className="text-emerald-500" />}>
                  {t('systemInfoTitle', 'Информация о платформе')}
                </CardTitle>
                <CardDescription>
                  {t('systemInfoDesc', 'Архитектурные и системные параметры инсталляции «Tender Ulgamy»')}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { label: 'Платформа', value: 'Tender Ulgamy' },
                  { label: 'Версия ПО', value: '1.0.0 (Production)' },
                  { label: 'База данных', value: 'PostgreSQL + Prisma' },
                  { label: 'UI Стек', value: 'React 19 + Tailwind v4' },
                ].map((item, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
                    <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{item.label}</div>
                    <div className="font-bold text-sm text-slate-900 dark:text-slate-100 mt-1">{item.value}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

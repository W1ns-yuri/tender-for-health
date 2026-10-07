import { useState, useCallback } from 'react';
import { Palette, Bell, Shield, Database } from 'lucide-react';
import API from '../../services/api';
import { useAlert } from '../../context/AlertContext';
import { getRoleTheme, getAvatarInitials } from '../../utils/themeUtils';
import { getTranslation } from '../../utils/translations';

/**
 * Хук инкапсулирует состояние и бизнес-логику страницы настроек:
 * - Управление темой оформления, языком и плотностью таблиц
 * - Параметры оповещений и звуковых сигналов
 * - Безопасность: смена пароля и таймаут автоблокировки
 * - Выгрузка системного журнала аудита (для администраторов)
 */
export function useSettingsState({
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
  const t = useCallback((k, f) => getTranslation(lang, k, f), [lang]);

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
      if (setIsDarkMode) setIsDarkMode(systemDark);
      localStorage.setItem('tender_theme', systemDark ? 'dark' : 'light');
      showToast({
        type: 'info',
        title: t('themeSystem', 'Системная тема'),
        message: t('themeSystemApplied', 'Оформление синхронизировано с параметрами ОС'),
      });
    } else if (mode === 'dark') {
      if (setIsDarkMode) setIsDarkMode(true);
      localStorage.setItem('tender_theme', 'dark');
      showToast({
        type: 'success',
        title: t('themeDark', 'Тёмная тема'),
        message: t('themeDarkApplied', 'Тёмный режим успешно активирован'),
      });
    } else {
      if (setIsDarkMode) setIsDarkMode(false);
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
    if (setLang) setLang(newLang);
    showToast({
      type: 'success',
      title: t('languageUpdated', 'Язык изменен'),
      message: newLang === 'RU' ? 'Выбран русский язык' : newLang === 'TM' ? 'Türkmen dili saýlandy' : 'English language selected',
    });
  };

  // Переключение звука
  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem('tender_sound_enabled', String(next));
    showToast({
      type: 'info',
      title: t('soundAlertsTitle', 'Звуковые сигналы'),
      message: next ? t('soundEnabledMsg', 'Звуковые оповещения включены') : t('soundDisabledMsg', 'Звуковые оповещения выключены'),
    });
  };

  // Переключение триггера уведомлений
  const handleToggleNotification = (key) => {
    setNotifications(prev => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem('tender_notifications_config', JSON.stringify(next));
      return next;
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
    // Диспатчим кастомное событие, чтобы таймер активности обновился на лету
    window.dispatchEvent(new CustomEvent('tender:session_timeout_changed', { detail: val }));
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
    if (e && e.preventDefault) e.preventDefault();

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
      icon: Palette 
    },
    { 
      id: 'notifications', 
      label: t('tabNotifications', 'Уведомления'), 
      icon: Bell 
    },
    { 
      id: 'security', 
      label: t('tabSecurity', 'Безопасность и аккаунт'), 
      icon: Shield 
    },
    ...(role === 'ADMIN' ? [{
      id: 'system',
      label: t('tabSystemExport', 'Система и экспорт'),
      icon: Database
    }] : [])
  ];

  const userInitials = getAvatarInitials(user, role);

  return {
    theme,
    isSupplier,
    t,
    tabs,
    activeTab,
    setActiveTab,
    userInitials,
    themeMode,
    density,
    soundEnabled,
    notifications,
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    showCurrent,
    setShowCurrent,
    showNew,
    setShowNew,
    showConfirm,
    setShowConfirm,
    isChangingPassword,
    sessionTimeout,
    isExportingLogs,
    handleThemeModeChange,
    handleDensityChange,
    handleLanguageChange,
    handleToggleSound,
    handleToggleNotification,
    handleSaveNotifications,
    handleSessionTimeoutChange,
    handleChangePassword,
    handleExportAuditLogs
  };
}

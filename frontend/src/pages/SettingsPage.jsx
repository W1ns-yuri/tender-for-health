import React from 'react';
import { useSettingsState } from '../components/settings/useSettingsState';
import SettingsHeader from '../components/settings/SettingsHeader';
import SettingsSidebar from '../components/settings/SettingsSidebar';
import SettingsGeneralTab from '../components/settings/SettingsGeneralTab';
import SettingsNotificationsTab from '../components/settings/SettingsNotificationsTab';
import SettingsSecurityTab from '../components/settings/SettingsSecurityTab';
import SettingsSystemTab from '../components/settings/SettingsSystemTab';

/**
 * Страница настроек платформы (оркестратор компонентов)
 * Декомпозирована на модульные блоки:
 * - useSettingsState: управление состоянием и обработчиками
 * - SettingsHeader: заголовок, бейдж роли, статус пользователя
 * - SettingsSidebar: адаптивное меню табов (десктоп/мобильный)
 * - SettingsGeneralTab: тема оформления, язык, плотность строк
 * - SettingsNotificationsTab: каналы пушей, звуки и триггеры
 * - SettingsSecurityTab: профиль, смена пароля, автовыход
 * - SettingsSystemTab: аудит-лог и параметры инфраструктуры (ADMIN)
 */
export default function SettingsPage({
  role = 'ADMIN',
  isDarkMode = false,
  setIsDarkMode,
  lang = 'RU',
  setLang,
  user = null
}) {
  const state = useSettingsState({
    role,
    isDarkMode,
    setIsDarkMode,
    lang,
    setLang,
    user
  });

  const { activeTab, isSupplier, t } = state;

  return (
    <div className="w-full space-y-6 pb-6 animate-in fade-in duration-200">
      {/* 1. Заголовок страницы с бейджем роли и чипом пользователя */}
      <SettingsHeader
        role={role}
        isSupplier={isSupplier}
        user={user}
        userInitials={state.userInitials}
        t={t}
      />

      {/* 2. Двухколоночный макет: адаптивная навигация + контент вкладки */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Левая навигационная колонка */}
        <div className="lg:col-span-3">
          <SettingsSidebar
            tabs={state.tabs}
            activeTab={activeTab}
            setActiveTab={state.setActiveTab}
            isSupplier={isSupplier}
          />
        </div>

        {/* Правая контентная колонка с активным табом */}
        <div className="lg:col-span-9 space-y-6">
          {activeTab === 'general' && (
            <SettingsGeneralTab
              lang={lang}
              handleLanguageChange={state.handleLanguageChange}
              themeMode={state.themeMode}
              handleThemeModeChange={state.handleThemeModeChange}
              density={state.density}
              handleDensityChange={state.handleDensityChange}
              t={t}
            />
          )}

          {activeTab === 'notifications' && (
            <SettingsNotificationsTab
              isSupplier={isSupplier}
              soundEnabled={state.soundEnabled}
              handleToggleSound={state.handleToggleSound}
              notifications={state.notifications}
              handleToggleNotification={state.handleToggleNotification}
              handleSaveNotifications={state.handleSaveNotifications}
              t={t}
            />
          )}

          {activeTab === 'security' && (
            <SettingsSecurityTab
              role={role}
              isSupplier={isSupplier}
              user={user}
              userInitials={state.userInitials}
              theme={state.theme}
              isDarkMode={isDarkMode}
              currentPassword={state.currentPassword}
              setCurrentPassword={state.setCurrentPassword}
              newPassword={state.newPassword}
              setNewPassword={state.setNewPassword}
              confirmPassword={state.confirmPassword}
              setConfirmPassword={state.setConfirmPassword}
              showCurrent={state.showCurrent}
              setShowCurrent={state.setShowCurrent}
              showNew={state.showNew}
              setShowNew={state.setShowNew}
              showConfirm={state.showConfirm}
              setShowConfirm={state.setShowConfirm}
              isChangingPassword={state.isChangingPassword}
              handleChangePassword={state.handleChangePassword}
              sessionTimeout={state.sessionTimeout}
              handleSessionTimeoutChange={state.handleSessionTimeoutChange}
              t={t}
            />
          )}

          {activeTab === 'system' && role === 'ADMIN' && (
            <SettingsSystemTab
              isExportingLogs={state.isExportingLogs}
              handleExportAuditLogs={state.handleExportAuditLogs}
              t={t}
            />
          )}
        </div>
      </div>
    </div>
  );
}

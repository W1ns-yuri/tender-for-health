import React from 'react';
import { AlertCircle } from 'lucide-react';
import { getTranslation } from '../utils/translations';
import { useLoginState } from '../components/auth/useLoginState';
import AuthShowcase from '../components/auth/AuthShowcase';
import AuthLanguageSelector from '../components/auth/AuthLanguageSelector';
import LoginForm from '../components/auth/LoginForm';
import RegisterForm from '../components/auth/RegisterForm';
import AuthDemoModal from '../components/auth/AuthDemoModal';
import AuthForgotPasswordModal from '../components/auth/AuthForgotPasswordModal';

export default function LoginPage({ onLoginSuccess, lang = 'RU', setLang }) {
  const t = (key, fallback) => getTranslation(lang, key, fallback);

  const {
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
    countriesList,
    selectedCountryObj,
    companyTypeOptions,
    isStep1Valid,
    isStep2Valid,
    isStep3Valid,
    illustrations,
    handleSelectIllustration,
    handlePhoneChange,
    handleCountryChange,
    handleNextStep,
    handleLogin,
    handleRegister,
    handleQuickLogin,
  } = useLoginState({ onLoginSuccess, t });

  return (
    <div className="min-h-screen w-full flex bg-[#f8fbff] text-slate-800 font-sans">
      {/* Левая часть: Презентационный блок с постером и брендингом (скрыт на мобильных) */}
      <AuthShowcase
        illustrations={illustrations}
        activeIndex={activeIllustrationIndex}
        onSelectIndex={handleSelectIllustration}
        t={t}
      />

      {/* Правая часть: Форма входа / регистрации */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-4 sm:p-8 md:p-12 xl:p-16 relative bg-transparent lg:bg-white shadow-none lg:shadow-[-20px_0_40px_rgba(0,0,0,0.03)] z-10">
        {/* Переключатель языка интерфейса */}
        <AuthLanguageSelector
          lang={lang}
          setLang={setLang}
          isOpen={isLangOpen}
          setIsOpen={setIsLangOpen}
        />

        {/* Карточка формы */}
        <div className="w-full max-w-125 p-6 sm:p-10 border border-slate-200/60 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 bg-white animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Шапка формы */}
          <div className="mb-8 text-center select-none">
            <div className="w-14 h-14 bg-linear-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mb-5 shadow-lg shadow-blue-500/30 mx-auto">
              <span className="text-white font-black text-2xl tracking-tight">TU</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-800 mb-2.5 tracking-tight">
              {isRegister ? t('createAccountTab', 'Создать аккаунт') : t('welcomeBackTitle', 'С возвращением!')}
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm font-medium">
              {isRegister
                ? t('registerSubtitle', 'Заполните данные для регистрации')
                : t('loginSubtitle', 'Пожалуйста, введите ваши данные для входа')}
            </p>
          </div>

          {/* Сообщение об ошибке */}
          {error && (
            <div className="mb-5 p-4 bg-rose-50/90 border border-rose-100 text-rose-600 text-xs sm:text-sm font-semibold rounded-2xl flex items-start space-x-3 animate-in slide-in-from-top-2">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          {/* Форма авторизации либо регистрации */}
          {!isRegister ? (
            <LoginForm
              username={username}
              setUsername={setUsername}
              password={password}
              setPassword={setPassword}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              loading={loading}
              onSubmit={handleLogin}
              onQuickLogin={handleQuickLogin}
              onOpenForgotModal={() => setForgotModalOpen(true)}
              onOpenDemoModal={() => setDemoModalOpen(true)}
              onSwitchToRegister={() => {
                setIsRegister(true);
                setError('');
              }}
              t={t}
            />
          ) : (
            <RegisterForm
              regStep={regStep}
              setRegStep={setRegStep}
              regData={regData}
              setRegData={setRegData}
              selectedCountryObj={selectedCountryObj}
              countriesList={countriesList}
              companyTypeOptions={companyTypeOptions}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              loading={loading}
              isStep1Valid={isStep1Valid}
              isStep2Valid={isStep2Valid}
              isStep3Valid={isStep3Valid}
              onPhoneChange={handlePhoneChange}
              onCountryChange={handleCountryChange}
              onNextStep={handleNextStep}
              onRegisterSubmit={handleRegister}
              onSwitchToLogin={() => {
                setIsRegister(false);
                setError('');
              }}
              onResetError={() => setError('')}
              t={t}
            />
          )}
        </div>
      </div>

      {/* Модальное окно восстановления доступа */}
      <AuthForgotPasswordModal
        isOpen={forgotModalOpen}
        onClose={() => setForgotModalOpen(false)}
        t={t}
      />

      {/* Модальное окно демонстрационных аккаунтов */}
      <AuthDemoModal
        isOpen={demoModalOpen}
        onClose={() => setDemoModalOpen(false)}
        onQuickLogin={handleQuickLogin}
        loading={loading}
        t={t}
      />
    </div>
  );
}

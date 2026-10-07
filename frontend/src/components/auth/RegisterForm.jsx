import React from 'react';
import {
  User,
  Phone,
  Building2,
  FileText,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';
import CustomSelect from '../CustomSelect';

export default function RegisterForm({
  regStep,
  setRegStep,
  regData,
  setRegData,
  selectedCountryObj,
  countriesList,
  companyTypeOptions,
  showPassword,
  setShowPassword,
  loading,
  isStep1Valid,
  isStep2Valid,
  isStep3Valid,
  onPhoneChange,
  onCountryChange,
  onNextStep,
  onRegisterSubmit,
  onSwitchToLogin,
  onResetError,
  t,
}) {
  const steps = [
    { num: 1, label: t('regStep1Title', 'Учётная запись') },
    { num: 2, label: t('regStep2Title', 'Организация') },
    { num: 3, label: t('regStep3Title', 'Вход и условия') },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (regStep === 1 || regStep === 2) {
      onNextStep(e);
    } else {
      onRegisterSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 animate-in slide-in-from-right-8 duration-300">
      {/* Надежный адаптивный индикатор 3 шагов */}
      <div className="mb-6 px-1">
        <div className="flex items-center justify-between">
          {steps.map((s, idx) => (
            <React.Fragment key={s.num}>
              <div className="flex flex-col items-center">
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
                  className={`text-[11px] font-bold mt-1.5 text-center transition-colors ${
                    regStep === s.num
                      ? 'text-blue-600'
                      : regStep > s.num
                      ? 'text-slate-700'
                      : 'text-slate-400'
                  }`}
                >
                  {s.label}
                </span>
              </div>

              {idx < steps.length - 1 && (
                <div
                  className={`h-0.5 flex-1 mx-2 -mt-5 transition-all duration-300 ${
                    regStep > s.num ? 'bg-blue-600' : 'bg-slate-200'
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* ШАГ 1: Личные данные и контакт */}
      {regStep === 1 && (
        <div className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[13px] font-bold text-slate-700 mb-1.5 ml-1">
                {t('firstNameLabel', 'Имя')}*
              </label>
              <div className="relative flex items-center">
                <User size={18} className="absolute left-4 text-slate-400 pointer-events-none" />
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
                <User size={18} className="absolute left-4 text-slate-400 pointer-events-none" />
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

          {/* Выбор страны */}
          <div>
            <label className="block text-[13px] font-bold text-slate-700 mb-1.5 ml-1">
              {t('countryLabel', 'Страна')}*
            </label>
            <CustomSelect
              role="SUPPLIER"
              value={regData.countryCode}
              onChange={onCountryChange}
              options={countriesList}
              size="md"
            />
          </div>

          {/* Телефон с префиксом */}
          <div>
            <label className="block text-[13px] font-bold text-slate-700 mb-1.5 ml-1">
              {t('phoneLabel', 'Номер телефона')}*
            </label>
            <div className="relative flex items-center">
              <Phone size={18} className="absolute left-4 text-slate-400 pointer-events-none" />
              {regData.countryCode !== 'OTHER' && (
                <span className="absolute left-11 text-slate-800 font-bold text-sm tracking-tight select-none pointer-events-none">
                  {selectedCountryObj.prefix}
                </span>
              )}
              <input
                type="tel"
                required
                value={regData.phone}
                onChange={(e) => onPhoneChange(e.target.value)}
                placeholder={
                  regData.countryCode === 'TM'
                    ? '65 12-34-56'
                    : regData.countryCode === 'RU' || regData.countryCode === 'KZ'
                    ? '(999) 123-45-67'
                    : regData.countryCode === 'TR'
                    ? '555 123 45 67'
                    : regData.countryCode === 'OTHER'
                    ? '+49 151 2345678'
                    : '123456789'
                }
                className={`w-full ${
                  regData.countryCode !== 'OTHER'
                    ? selectedCountryObj.prefix.length > 3
                      ? 'pl-22'
                      : 'pl-18'
                    : 'pl-11'
                } pr-4 py-3 bg-white border border-slate-300 rounded-2xl text-slate-800 text-sm transition-all focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 font-medium`}
              />
            </div>
            {regData.countryCode === 'OTHER' && (
              <p className="text-[11px] text-slate-400 mt-1 ml-1">
                {t(
                  'phoneFormatInternationalHint',
                  'Формат: +[код страны] [номер], например: +49 151 2345678'
                )}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onNextStep}
            disabled={!isStep1Valid}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl font-black shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center space-x-2 active:scale-[0.98] mt-6 text-[15px] cursor-pointer"
          >
            <span>{t('nextStepBtn', 'Далее')}</span>
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      {/* ШАГ 2: Организация и ИНН */}
      {regStep === 2 && (
        <div className="space-y-3.5">
          <div>
            <label className="block text-[13px] font-bold text-slate-700 mb-1.5 ml-1">
              {t('participantTypeLabel', 'Форма собственности / Тип участника')}*
            </label>
            <CustomSelect
              role="SUPPLIER"
              value={regData.companyType}
              onChange={(val) => setRegData((prev) => ({ ...prev, companyType: val }))}
              options={companyTypeOptions}
              size="md"
            />
          </div>

          <div>
            <label className="block text-[13px] font-bold text-slate-700 mb-1.5 ml-1">
              {t('companyBrandName', 'Наименование компании / бренда')}*
            </label>
            <div className="relative flex items-center">
              <Building2 size={18} className="absolute left-4 text-slate-400 pointer-events-none" />
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
              {t(
                'companyBrandHint',
                'Указывайте только название бренда без организационной формы (ИП, ХО, ЧП)'
              )}
            </p>
          </div>

          <div>
            <label className="block text-[13px] font-bold text-slate-700 mb-1.5 ml-1">
              {regData.countryCode === 'TM'
                ? t('taxIdLabelTM', 'STŞK (налоговый номер) / ÝŞÝDS')
                : t('taxIdLabelForeign', 'Регистрационный номер / Tax ID / TIN')}*
            </label>
            <div className="relative flex items-center">
              <FileText size={18} className="absolute left-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                required
                maxLength={regData.countryCode === 'TM' ? 8 : 24}
                value={regData.taxId}
                onChange={(e) => {
                  const val =
                    regData.countryCode === 'TM'
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
                ? t('taxIdHintTM', 'Основной идентификатор юридического лица в Туркменистане (8 цифр)')
                : t('taxIdHintForeign', 'Международный налоговый или регистрационный номер компании')}
            </p>
          </div>

          <div className="flex space-x-3 mt-6">
            <button
              type="button"
              onClick={() => {
                onResetError();
                setRegStep(1);
              }}
              className="w-1/3 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold transition-all text-sm cursor-pointer"
            >
              {t('backToList', 'Назад')}
            </button>
            <button
              type="button"
              onClick={onNextStep}
              disabled={!isStep2Valid}
              className="w-2/3 py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl font-black shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center space-x-2 active:scale-[0.98] text-[15px] cursor-pointer"
            >
              <span>{t('nextStepBtn', 'Далее')}</span>
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* ШАГ 3: Логин, пароль и подтверждение */}
      {regStep === 3 && (
        <div className="space-y-3.5">
          <div>
            <label className="block text-[13px] font-bold text-slate-700 mb-1.5 ml-1">
              {t('corpEmail', 'Корпоративная почта (Логин)')}*
            </label>
            <div className="relative flex items-center">
              <Mail size={18} className="absolute left-4 text-slate-400 pointer-events-none" />
              <input
                type="email"
                required
                autoComplete="email"
                value={regData.username}
                onChange={(e) => setRegData({ ...regData, username: e.target.value })}
                placeholder="corp@company.tm"
                className="w-full pl-11 pr-4 py-3 bg-white border border-slate-300 rounded-2xl text-slate-800 text-sm transition-all focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-bold text-slate-700 mb-1.5 ml-1">
              {t('password', 'Пароль для входа')}*
            </label>
            <div className="relative flex items-center">
              <Lock size={18} className="absolute left-4 text-slate-400 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="new-password"
                value={regData.password}
                onChange={(e) => setRegData({ ...regData, password: e.target.value })}
                placeholder="••••••••"
                className="w-full pl-11 pr-12 py-3 bg-white border border-slate-300 rounded-2xl text-slate-800 text-sm transition-all focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 text-slate-400 hover:text-slate-600 transition-colors flex items-center justify-center h-full cursor-pointer"
                aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Информационная плашка об аккредитации */}
          <div className="p-3.5 bg-blue-50/70 border border-blue-100 rounded-2xl flex items-start gap-2.5 text-xs text-blue-900">
            <CheckCircle2 size={18} className="text-blue-600 shrink-0 mt-0.5" />
            <span className="leading-relaxed">
              {t(
                'profileAccreditationNotice',
                'После создания учетной записи в личном кабинете вы сможете выбрать направления деятельности, указать банковские реквизиты и прикрепить документы для допуска к торгам.'
              )}
            </span>
          </div>

          {/* Согласие с регламентом */}
          <div className="flex items-start pt-1">
            <input
              type="checkbox"
              id="termsAccepted"
              required
              checked={regData.termsAccepted}
              onChange={(e) => setRegData({ ...regData, termsAccepted: e.target.checked })}
              className="mt-0.5 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
            />
            <label
              htmlFor="termsAccepted"
              className="ml-2.5 text-xs text-slate-600 font-medium leading-tight cursor-pointer select-none hover:text-slate-900 transition-colors"
            >
              {t(
                'termsAcceptedAgreementText',
                'Я согласен с регламентом проведения электронных торгов и обработкой персональных данных.'
              )}
            </label>
          </div>

          <div className="flex space-x-3 mt-6">
            <button
              type="button"
              onClick={() => {
                onResetError();
                setRegStep(2);
              }}
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
        </div>
      )}

      {/* Переход к входу */}
      <div className="text-center mt-6 text-sm font-medium text-slate-500">
        {t('alreadyHaveAccountPrompt', 'Уже есть аккаунт?')}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-slate-800 hover:text-black font-bold transition-colors underline decoration-2 underline-offset-4 decoration-slate-200 hover:decoration-slate-400 ml-1.5 cursor-pointer"
        >
          {t('signInLink', 'Войти')}
        </button>
      </div>
    </form>
  );
}

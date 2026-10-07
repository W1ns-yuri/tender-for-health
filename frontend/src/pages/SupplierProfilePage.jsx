import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAlert } from '../context/AlertContext';
import { getTranslation } from '../utils/translations';
import {
  useSupplierProfileState,
  SupplierStatusBanner,
  SupplierHeader,
  SupplierRepresentativeCard,
  SupplierBasicInfoCard,
  SupplierCategoriesCard,
  SupplierAddressCard,
  SupplierLicenseCard,
  SupplierBankCard,
  SupplierDirectorCard,
  SupplierDocumentsCard,
  SupplierActionButtons,
  SupplierAdminPanel,
  SupplierSidebar,
  SupplierCompanyCardModal,
  RejectSupplierModal,
} from '../components/supplier';

export default function SupplierProfilePage({
  role,
  lang = 'RU',
  isDarkMode = false,
  isOwner,
}) {
  const { id } = useParams();
  const navigate = useNavigate();
  const t = (key, fallback) => getTranslation(lang, key, fallback);
  const { showAlert, showConfirm } = useAlert();

  const {
    isAdmin,
    effectiveIsOwner,
    supplier,
    stats,
    documents,
    setDocuments,
    categoriesList,
    selectedCategoryIds,
    setSelectedCategoryIds,
    loading,
    saving,
    bankTab,
    setBankTab,
    isCustomBank,
    setIsCustomBank,
    formData,
    setFormData,
    phoneDigits,
    setPhoneDigits,
    isEditing,
    showCompanyCard,
    setShowCompanyCard,
    passportError,
    setPassportError,
    personalCodeError,
    setPersonalCodeError,
    isRejectModalOpen,
    setIsRejectModalOpen,
    isModerating,
    isBannerDismissed,
    handleDismissBanner,
    isForeignCompany,
    isLicenseExpired,
    hasChanges,
    readiness,
    hasDocuments,
    isCategoriesSelected,
    isVerified,
    isEditable,
    isSubmitDisabled,
    changedFieldKeys,
    regionLabel,
    bgClass,
    cardBg,
    inputBg,
    handleStartEdit,
    handleCancelEdit,
    handleLogoUpload,
    handleDeleteDocument,
    handleSubmit,
    handleAdminApprove,
    handleAdminRejectConfirm,
  } = useSupplierProfileState({
    id,
    role,
    isOwner,
    lang,
    isDarkMode,
    t,
    showAlert,
    showConfirm,
    navigate,
  });

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-20 ${bgClass}`}>
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className={`p-6 flex-1 ${bgClass}`}>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center text-slate-500 hover:text-blue-600 mb-6 transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} className="mr-2" /> {t('back', 'Назад')}
        </button>
        <div className="text-center py-10 text-slate-500 text-lg font-bold">
          {t('profileNotFoundTitle', 'Профиль не найден')}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${bgClass}`}>
      {/* Кнопка возврата для Администратора */}
      {isAdmin && (
        <button
          type="button"
          onClick={() => navigate('/suppliers')}
          className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer mb-2"
        >
          <ArrowLeft size={16} />
          <span>{t('backToSuppliersListBtn', 'Назад к списку поставщиков')}</span>
        </button>
      )}

      {/* Баннер статуса верификации / модерации */}
      <SupplierStatusBanner
        supplier={supplier}
        effectiveIsOwner={effectiveIsOwner}
        isAdmin={isAdmin}
        isBannerDismissed={isBannerDismissed}
        onDismissBanner={handleDismissBanner}
        isEditing={isEditing}
        onStartEdit={handleStartEdit}
        t={t}
      />

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Левая колонка: Профиль и формы */}
        <div className={`flex-1 min-w-0 rounded-[2rem] p-6 sm:p-8 space-y-8 ${cardBg}`}>
          {/* Шапка профиля компании */}
          <SupplierHeader
            supplier={supplier}
            formData={formData}
            isEditable={isEditable}
            isForeignCompany={isForeignCompany}
            isLogoModified={changedFieldKeys.includes('logoUrl')}
            onLogoUpload={handleLogoUpload}
            t={t}
          />

          {/* Карточка представителя аккаунта */}
          <SupplierRepresentativeCard
            supplier={supplier}
            formData={formData}
            t={t}
          />

          {effectiveIsOwner || isAdmin ? (
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Основные данные компании и категории */}
              <div className="space-y-4">
                <SupplierBasicInfoCard
                  formData={formData}
                  setFormData={setFormData}
                  isEditable={isEditable}
                  isForeignCompany={isForeignCompany}
                  role={role}
                  isDarkMode={isDarkMode}
                  inputBg={inputBg}
                  t={t}
                />

                <SupplierCategoriesCard
                  categoriesList={categoriesList}
                  selectedCategoryIds={selectedCategoryIds}
                  setSelectedCategoryIds={setSelectedCategoryIds}
                  isEditable={isEditable}
                  isCategoriesModified={changedFieldKeys.includes('categories')}
                  supplier={supplier}
                  t={t}
                />
              </div>

              {/* Адреса и контакты */}
              <SupplierAddressCard
                formData={formData}
                setFormData={setFormData}
                phoneDigits={phoneDigits}
                setPhoneDigits={setPhoneDigits}
                isEditable={isEditable}
                isForeignCompany={isForeignCompany}
                isAddressModified={changedFieldKeys.includes('address')}
                supplier={supplier}
                inputBg={inputBg}
                isDarkMode={isDarkMode}
                t={t}
              />

              {/* Лицензии Минздрава */}
              <SupplierLicenseCard
                formData={formData}
                setFormData={setFormData}
                isEditable={isEditable}
                isLicenseModified={changedFieldKeys.includes('license')}
                inputBg={inputBg}
                t={t}
              />

              {/* Банковские реквизиты */}
              <SupplierBankCard
                formData={formData}
                setFormData={setFormData}
                bankTab={bankTab}
                setBankTab={setBankTab}
                isEditable={isEditable}
                isCustomBank={isCustomBank}
                setIsCustomBank={setIsCustomBank}
                isBankModified={changedFieldKeys.includes('bank')}
                role={role}
                isDarkMode={isDarkMode}
                inputBg={inputBg}
                t={t}
              />

              {/* Данные руководителя */}
              <SupplierDirectorCard
                formData={formData}
                setFormData={setFormData}
                isEditable={isEditable}
                isForeignCompany={isForeignCompany}
                isDirectorModified={changedFieldKeys.includes('director')}
                passportError={passportError}
                setPassportError={setPassportError}
                personalCodeError={personalCodeError}
                setPersonalCodeError={setPersonalCodeError}
                inputBg={inputBg}
                t={t}
              />

              {/* Документы компании (5 слотов) */}
              <SupplierDocumentsCard
                supplier={supplier}
                documents={documents}
                setDocuments={setDocuments}
                isEditable={isEditable}
                onDeleteDocument={handleDeleteDocument}
                t={t}
              />

              {/* Кнопки действий (Редактировать / Сохранить / Отправить на проверку) */}
              <SupplierActionButtons
                effectiveIsOwner={effectiveIsOwner}
                isVerified={isVerified}
                isEditing={isEditing}
                hasChanges={hasChanges}
                saving={saving}
                hasDocuments={hasDocuments}
                isCategoriesSelected={isCategoriesSelected}
                isLicenseExpired={isLicenseExpired}
                isSubmitDisabled={isSubmitDisabled}
                supplier={supplier}
                onStartEdit={handleStartEdit}
                onCancelEdit={handleCancelEdit}
                onShowCompanyCard={() => setShowCompanyCard(true)}
                isDarkMode={isDarkMode}
                t={t}
              />

              {/* Панель модерации администратора */}
              <SupplierAdminPanel
                supplier={supplier}
                isAdmin={isAdmin}
                isModerating={isModerating}
                onOpenRejectModal={() => setIsRejectModalOpen(true)}
                onApprove={handleAdminApprove}
                t={t}
              />
            </form>
          ) : (
            <div className="text-center py-6 text-slate-400 text-xs">
              {t(
                'guestProfileViewMode',
                'Просмотр информации об участнике электронных торгов'
              )}
            </div>
          )}
        </div>

        {/* Правая колонка: Виджет готовности профиля / Статистика */}
        <SupplierSidebar
          supplier={supplier}
          formData={formData}
          documents={documents}
          readiness={readiness}
          stats={stats}
          isAdmin={isAdmin}
          isModerating={isModerating}
          isForeignCompany={isForeignCompany}
          isLicenseExpired={isLicenseExpired}
          onApprove={handleAdminApprove}
          onOpenRejectModal={() => setIsRejectModalOpen(true)}
          cardBg={cardBg}
          t={t}
        />
      </div>

      {/* Модальное окно "Карточка предприятия (PDF / Печать)" */}
      <SupplierCompanyCardModal
        isOpen={showCompanyCard}
        onClose={() => setShowCompanyCard(false)}
        supplier={supplier}
        formData={formData}
        documents={documents}
        isForeignCompany={isForeignCompany}
        regionLabel={regionLabel}
        t={t}
      />

      {/* Модальное окно отклонения заявки администратором */}
      {isAdmin && (
        <RejectSupplierModal
          isOpen={isRejectModalOpen}
          supplierName={supplier?.name}
          lang={lang}
          isDarkMode={isDarkMode}
          onClose={() => setIsRejectModalOpen(false)}
          onConfirm={handleAdminRejectConfirm}
        />
      )}
    </div>
  );
}

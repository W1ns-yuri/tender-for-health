import { useState, useEffect, useMemo } from 'react';
import API from '../../services/api';
import { TURKMEN_REGIONS } from './supplierConstants';
import {
  cleanAddressString,
  formatPhoneString,
  getCleanCompanyName,
  calculateReadiness,
  parseSupplierChanges,
} from './supplierUtils';

export function useSupplierProfileState({
  id,
  role,
  isOwner,
  lang = 'RU',
  isDarkMode = false,
  t,
  showAlert,
  showConfirm,
  navigate,
}) {
  const isAdmin = role === 'ADMIN';
  const effectiveIsOwner = Boolean(isOwner || (role === 'SUPPLIER' && !id));

  const [supplier, setSupplier] = useState(null);
  const [stats, setStats] = useState({ totalOffers: 0, wonOffers: 0 });
  const [documents, setDocuments] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
  const [initialCategoryIds, setInitialCategoryIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Вкладка банковских реквизитов ('local' | 'foreign')
  const [bankTab, setBankTab] = useState('local');
  const [isCustomBank, setIsCustomBank] = useState(false);

  // Форма профиля
  const [formData, setFormData] = useState({
    name: '',
    type: 'ENTREPRENEUR',
    countryCode: 'TM',
    countryName: '',
    region: '',
    address: '',
    legalAddress: '',
    okpoCode: '',
    directorPersonalCode: '',
    isMedicalLicensed: false,
    licenseNumber: '',
    licenseIssuedBy: '',
    licenseExpiryDate: '',
    bankName: '',
    bankAccount: '',
    bankMfo: '',
    bankCorrAccount: '',
    bankSwift: '',
    bankIban: '',
    bankCurrency: 'USD',
    passportSeries: '',
    passportIssuedBy: '',
    email: '',
    phone: '',
    directorName: '',
    logoUrl: '',
  });

  // Локальное отображение номера телефона (для TM: 8 цифр без +993; для других стран: полный ввод)
  const [phoneDigits, setPhoneDigits] = useState('');

  // Режим редактирования
  const [isEditing, setIsEditing] = useState(false);
  const [initialFormData, setInitialFormData] = useState(null);
  const [initialPhoneDigits, setInitialPhoneDigits] = useState('');
  const [showCompanyCard, setShowCompanyCard] = useState(false);
  const [passportError, setPassportError] = useState('');
  const [personalCodeError, setPersonalCodeError] = useState('');

  // Безопасное удаление документов (стейджинг изменений при редактировании)
  const [pendingDeleteDocIds, setPendingDeleteDocIds] = useState([]);
  const [initialDocuments, setInitialDocuments] = useState([]);

  // Модерация администратором
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isModerating, setIsModerating] = useState(false);

  // Состояние скрытия верхнего баннера верификации
  const [isBannerDismissed, setIsBannerDismissed] = useState(() => {
    try {
      return localStorage.getItem('tender_verified_banner_dismissed') === 'true';
    } catch {
      return false;
    }
  });

  const handleDismissBanner = () => {
    try {
      localStorage.setItem('tender_verified_banner_dismissed', 'true');
    } catch {}
    setIsBannerDismissed(true);
  };

  // Определение: является ли компания иностранной
  const isForeignCompany = useMemo(() => {
    return Boolean(
      (supplier?.country?.alpha2 && supplier.country.alpha2 !== 'TM') ||
      (formData.countryCode && formData.countryCode !== 'TM')
    );
  }, [supplier?.country?.alpha2, formData.countryCode]);

  // Проверка: просрочена ли лицензия Минздрава
  const isLicenseExpired = useMemo(() => {
    return Boolean(
      formData.isMedicalLicensed &&
      formData.licenseExpiryDate &&
      new Date(formData.licenseExpiryDate) < new Date().setHours(0, 0, 0, 0)
    );
  }, [formData.isMedicalLicensed, formData.licenseExpiryDate]);

  // Загрузка данных профиля
  useEffect(() => {
    let isCancelled = false;

    const fetchData = async () => {
      try {
        setLoading(true);
        let currentSupplier = null;
        let userEmail = '';
        let userPhone = '';

        if (effectiveIsOwner && !id) {
          const meRes = await API.get('/auth/me');
          userEmail = meRes.data?.email || (meRes.data?.username?.includes('@') ? meRes.data.username : '');
          userPhone = meRes.data?.phone || '';
          currentSupplier = meRes.data?.suppliers?.[0];

          if (currentSupplier) {
            currentSupplier.phone = userPhone || currentSupplier.phone;
            currentSupplier.email = currentSupplier.email || userEmail;
          }
        } else if (id) {
          try {
            const compRes = await API.get(`/suppliers/${id}`);
            currentSupplier = compRes.data;
          } catch (fetchErr) {
            console.warn('Direct supplier fetch fallback:', fetchErr);
            const fallbackRes = await API.get('/offers/suppliers');
            currentSupplier = fallbackRes.data?.find((c) => String(c.id) === String(id));
          }
        }

        if (isCancelled) return;
        setSupplier(currentSupplier);

        if (currentSupplier) {
          const loadedCatIds = currentSupplier.categories
            ? currentSupplier.categories.map((c) => c.categoryId)
            : [];
          setSelectedCategoryIds(loadedCatIds);
          setInitialCategoryIds(loadedCatIds);

          API.get('/catalogs/categories')
            .then((r) => {
              if (Array.isArray(r.data) && !isCancelled) {
                setCategoriesList(r.data.filter((c) => c.isActive));
              }
            })
            .catch(() => {});

          // Извлечение паспортных данных
          let pSeries = currentSupplier.passportSeries || '';
          let pIssued = currentSupplier.passportIssuedBy || '';
          if (!pSeries && !pIssued && currentSupplier.passportInfo) {
            const parts = currentSupplier.passportInfo.split(',');
            if (parts.length > 1) {
              pSeries = parts[0].trim();
              pIssued = parts.slice(1).join(',').trim();
            } else {
              pIssued = currentSupplier.passportInfo;
            }
          }

          // Страна поставщика
          const cCode =
            currentSupplier.country?.alpha2 ||
            (currentSupplier.phone?.startsWith('+993') ? 'TM' : currentSupplier.phone ? 'OTHER' : 'TM');
          const cName =
            currentSupplier.country?.nameRu || currentSupplier.country?.name || 'Туркменистан';
          const isForeign = cCode !== 'TM';

          // Нормализация региона под официальный список
          let reg = currentSupplier.region || '';
          let addr = currentSupplier.address || '';
          if (!isForeign) {
            if (reg) {
              const matched = TURKMEN_REGIONS.find(
                (r) =>
                  r.id.toLowerCase() === reg.toLowerCase() ||
                  r.id.toLowerCase().startsWith(reg.toLowerCase()) ||
                  reg.toLowerCase().startsWith(r.id.toLowerCase().slice(0, 4))
              );
              if (matched) reg = matched.id;
            } else if (addr) {
              const foundRegion = TURKMEN_REGIONS.find((r) =>
                addr.toLowerCase().includes(r.id.toLowerCase().slice(0, 4))
              );
              if (foundRegion) {
                reg = foundRegion.id;
              }
            }
          }

          // Обработка телефона
          const fullPhone = currentSupplier.phone || currentSupplier.user?.phone || userPhone || '';
          let formattedPhoneDisplay = fullPhone;
          let phoneToStore = fullPhone;

          if (!isForeign) {
            const rawP = fullPhone.replace(/\D/g, '');
            let pureDigits = rawP;
            if (pureDigits.startsWith('993')) {
              pureDigits = pureDigits.slice(3);
            }
            pureDigits = pureDigits.slice(0, 8);
            formattedPhoneDisplay = formatPhoneString(pureDigits);
            phoneToStore = pureDigits ? `+993 ${formattedPhoneDisplay}` : '';
          }

          setPhoneDigits(formattedPhoneDisplay);
          setInitialPhoneDigits(formattedPhoneDisplay);

          const cleanName = getCleanCompanyName(currentSupplier.name);
          const userFullName = currentSupplier.user?.firstName
            ? `${currentSupplier.user.firstName} ${currentSupplier.user.lastName || ''}`.trim()
            : '';

          const hasForeignBankData = Boolean(
            currentSupplier.bankSwift ||
            currentSupplier.bankIban ||
            (isForeign && !currentSupplier.bankAccount)
          );
          setBankTab(hasForeignBankData ? 'foreign' : 'local');

          let lExpDate = '';
          if (currentSupplier.licenseExpiryDate) {
            try {
              lExpDate = new Date(currentSupplier.licenseExpiryDate).toISOString().split('T')[0];
            } catch {
              lExpDate = currentSupplier.licenseExpiryDate;
            }
          }

          const initialData = {
            name: cleanName,
            type: currentSupplier.type || (isForeign ? 'FOREIGN_ENTITY' : 'ENTREPRENEUR'),
            countryCode: cCode,
            countryName: cName,
            region: reg,
            address: addr,
            legalAddress: currentSupplier.legalAddress || '',
            okpoCode: currentSupplier.okpoCode || '',
            directorPersonalCode: currentSupplier.directorPersonalCode || '',
            isMedicalLicensed: Boolean(currentSupplier.isMedicalLicensed),
            licenseNumber: currentSupplier.licenseNumber || '',
            licenseIssuedBy: currentSupplier.licenseIssuedBy || '',
            licenseExpiryDate: lExpDate,
            bankName: currentSupplier.bankName || '',
            bankAccount: currentSupplier.bankAccount || '',
            bankMfo: currentSupplier.bankMfo || '',
            bankCorrAccount: currentSupplier.bankCorrAccount || '',
            bankSwift: currentSupplier.bankSwift || '',
            bankIban: currentSupplier.bankIban || '',
            bankCurrency: currentSupplier.bankCurrency || 'USD',
            passportSeries: pSeries,
            passportIssuedBy: pIssued,
            email: currentSupplier.email || userEmail || '',
            phone: phoneToStore,
            directorName: currentSupplier.directorName || userFullName || '',
            logoUrl: currentSupplier.logoUrl || '',
          };

          setFormData(initialData);
          setInitialFormData(initialData);

          if (
            currentSupplier.verificationStatus === 'VERIFIED' ||
            !effectiveIsOwner ||
            currentSupplier.verificationStatus === 'REJECTED'
          ) {
            setIsEditing(false);
          } else {
            setIsEditing(true);
          }

          // Статистика
          try {
            const statsRes = await API.get(`/suppliers/${currentSupplier.id}/stats`).catch(() => ({
              data: { totalOffers: 0, wonOffers: 0 },
            }));
            if (!isCancelled) {
              setStats(statsRes.data || { totalOffers: 0, wonOffers: 0 });
            }
          } catch (statsErr) {
            console.error('Не удалось загрузить статистику:', statsErr);
          }

          // Документы
          try {
            const docsRes = await API.get(`/documents?supplierId=${currentSupplier.id}`);
            const fetchedDocs = docsRes.data || [];
            if (!isCancelled) {
              setDocuments(fetchedDocs);
              setInitialDocuments(fetchedDocs);
            }
          } catch (docsErr) {
            console.error('Не удалось загрузить документы:', docsErr);
          }
        }
      } catch (err) {
        console.error('Ошибка загрузки профиля:', err);
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isCancelled = true;
    };
  }, [id, effectiveIsOwner]);

  // Вычисление наличия изменений в форме
  const hasChanges = useMemo(() => {
    if (!initialFormData) return false;
    return Boolean(
      formData.name !== initialFormData.name ||
      formData.type !== initialFormData.type ||
      formData.region !== initialFormData.region ||
      formData.address !== initialFormData.address ||
      formData.legalAddress !== initialFormData.legalAddress ||
      formData.okpoCode !== initialFormData.okpoCode ||
      formData.directorPersonalCode !== initialFormData.directorPersonalCode ||
      formData.isMedicalLicensed !== initialFormData.isMedicalLicensed ||
      formData.licenseNumber !== initialFormData.licenseNumber ||
      formData.licenseIssuedBy !== initialFormData.licenseIssuedBy ||
      formData.licenseExpiryDate !== initialFormData.licenseExpiryDate ||
      formData.bankName !== initialFormData.bankName ||
      formData.bankAccount !== initialFormData.bankAccount ||
      formData.bankMfo !== initialFormData.bankMfo ||
      formData.bankCorrAccount !== initialFormData.bankCorrAccount ||
      formData.bankSwift !== initialFormData.bankSwift ||
      formData.bankIban !== initialFormData.bankIban ||
      formData.bankCurrency !== initialFormData.bankCurrency ||
      formData.passportSeries !== initialFormData.passportSeries ||
      formData.passportIssuedBy !== initialFormData.passportIssuedBy ||
      formData.phone !== initialFormData.phone ||
      formData.email !== initialFormData.email ||
      formData.directorName !== initialFormData.directorName ||
      formData.logoUrl !== initialFormData.logoUrl ||
      JSON.stringify([...selectedCategoryIds].sort()) !==
        JSON.stringify([...initialCategoryIds].sort()) ||
      pendingDeleteDocIds.length > 0 ||
      documents.length !== initialDocuments.length
    );
  }, [
    initialFormData,
    formData,
    selectedCategoryIds,
    initialCategoryIds,
    pendingDeleteDocIds.length,
    documents.length,
    initialDocuments.length,
  ]);

  // Управление редактированием
  const handleStartEdit = () => {
    setInitialDocuments([...documents]);
    setPendingDeleteDocIds([]);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    if (initialFormData) {
      setFormData({ ...initialFormData });
      setPhoneDigits(initialPhoneDigits);
    }
    if (initialDocuments && initialDocuments.length > 0) {
      setDocuments([...initialDocuments]);
    }
    setPendingDeleteDocIds([]);
    setPassportError('');
    setPersonalCodeError('');
    setIsEditing(false);
  };

  // Загрузка логотипа
  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !supplier?.id) return;
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['png', 'jpg', 'jpeg', 'webp'].includes(ext)) {
      showAlert({
        title: t('validationError', 'Ошибка валидации'),
        message: t('onlyImagesAllowed', 'Для логотипа поддерживаются только изображения JPG, PNG и WEBP'),
        type: 'warning',
      });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showAlert({
        title: t('validationError', 'Ошибка валидации'),
        message: t('logoTooLarge', 'Размер логотипа не должен превышать 5 МБ'),
        type: 'warning',
      });
      return;
    }
    try {
      const uploadData = new FormData();
      uploadData.append('file', file);
      uploadData.append('supplierId', supplier.id);
      uploadData.append('name', `logo_${file.name}`);

      const res = await API.post('/documents/upload', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data) {
        const logoPath = res.data.url || res.data.filePath || '';
        setFormData((prev) => ({ ...prev, logoUrl: logoPath }));
        setSupplier((prev) => ({ ...prev, logoUrl: logoPath }));
        showAlert({
          title: t('success', 'Успешно'),
          message: t('logoUploadedSuccess', 'Логотип успешно загружен'),
          type: 'success',
        });
      }
    } catch (err) {
      console.error('Logo upload error', err);
      showAlert({
        title: t('error', 'Ошибка'),
        message: t('uploadError', 'Ошибка при загрузке логотипа'),
        type: 'error',
      });
    }
  };

  // Удаление документа
  const handleDeleteDocument = (docId) => {
    setDocuments((prev) => prev.filter((d) => d.id !== docId));
    setPendingDeleteDocIds((prev) => [...prev, docId]);
  };

  // Отправка формы профиля
  const handleSubmit = async (e, shouldSubmitForReview = true) => {
    if (e) e.preventDefault();
    if (!documents || documents.length === 0) {
      showAlert({
        title: t('attention', 'Внимание'),
        message: t('attachDocsToSubmit', 'Прикрепите хотя бы один документ для отправки на проверку'),
        type: 'warning',
      });
      return;
    }

    if (formData.isMedicalLicensed) {
      if (!formData.licenseNumber?.trim()) {
        showAlert({
          title: t('validationError', 'Ошибка валидации'),
          message: t('licenseNumberRequired', 'Укажите номер медицинской лицензии Минздрава'),
          type: 'warning',
        });
        return;
      }
      if (formData.licenseExpiryDate) {
        const expiry = new Date(formData.licenseExpiryDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (expiry < today) {
          showAlert({
            title: t('validationError', 'Ошибка валидации'),
            message: t('licenseExpiredError', 'Внимание: срок действия вашей медицинской лицензии истек!'),
            type: 'error',
          });
          return;
        }
      }
    }

    if (formData.directorPersonalCode) {
      const cleanPersonal = formData.directorPersonalCode.replace(/\D/g, '');
      if (cleanPersonal.length !== 14) {
        const pErr = t(
          'directorPersonalCodeInvalid',
          'Личный код руководителя (Şahsy kod) должен содержать строго 14 цифр'
        );
        setPersonalCodeError(pErr);
        showAlert({
          title: t('validationError', 'Ошибка валидации'),
          message: pErr,
          type: 'warning',
        });
        return;
      }
    }

    if (supplier?.verificationStatus === 'REJECTED' && !hasChanges) {
      showAlert({
        title: t('attention', 'Внимание'),
        message: t('noChangesResubmitError', 'Внесите изменения в реквизиты перед повторной отправкой на проверку'),
        type: 'warning',
      });
      return;
    }

    if (formData.passportSeries && !isForeignCompany) {
      const passportRegex = /^([I|V|X]+-[A-ZА-Я]{2}\s\d{6})$/i;
      if (!passportRegex.test(formData.passportSeries.trim())) {
        const pErr = t('passportInvalid', 'Некорректный номер паспорта (формат: I-XX 123456)');
        setPassportError(pErr);
        showAlert({
          title: t('validationError', 'Ошибка валидации'),
          message: pErr,
          type: 'warning',
        });
        return;
      }
    }

    if (!selectedCategoryIds || selectedCategoryIds.length === 0) {
      showAlert({
        title: t('attention', 'Внимание'),
        message: t('atLeastOneCategoryRequired', 'Выберите хотя бы одну категорию деятельности'),
        type: 'warning',
      });
      return;
    }

    const isVerifiedSupplier = supplier?.verificationStatus === 'VERIFIED';
    if (isVerifiedSupplier && hasChanges) {
      const confirmed = await showConfirm({
        title: t('resubmitWarningTitle', 'Повторная модерация'),
        message: t(
          'resubmitWarning',
          'При изменении юридических или банковских реквизитов статус верификации будет временно приостановлен до проверки администратором. Продолжить?'
        ),
        type: 'warning',
        confirmText: t('continue', 'Продолжить'),
        cancelText: t('cancel', 'Отмена'),
      });
      if (!confirmed) return;
    }

    setSaving(true);
    try {
      if (pendingDeleteDocIds.length > 0) {
        for (const docId of pendingDeleteDocIds) {
          try {
            await API.delete(`/documents/${docId}`);
          } catch (delErr) {
            console.error('Ошибка удаления файла:', delErr);
          }
        }
        setPendingDeleteDocIds([]);
      }

      const cleanedAddr = !isForeignCompany
        ? cleanAddressString(formData.address, formData.region)
        : formData.address;
      const cleanedName = getCleanCompanyName(formData.name);

      const payload = {
        ...formData,
        name: cleanedName,
        address: cleanedAddr,
        legalAddress: formData.legalAddress?.trim() || null,
        okpoCode: formData.okpoCode?.trim() || null,
        directorPersonalCode: formData.directorPersonalCode?.trim() || null,
        isMedicalLicensed: Boolean(formData.isMedicalLicensed),
        licenseNumber: formData.licenseNumber?.trim() || null,
        licenseIssuedBy: formData.licenseIssuedBy?.trim() || null,
        licenseExpiryDate: formData.licenseExpiryDate
          ? new Date(formData.licenseExpiryDate).toISOString()
          : null,
        bankCorrAccount: formData.bankCorrAccount?.trim() || null,
        bankSwift: formData.bankSwift?.trim() || null,
        bankIban: formData.bankIban?.trim() || null,
        bankCurrency: formData.bankCurrency || 'USD',
        directorName: formData.directorName?.trim() || null,
        logoUrl: formData.logoUrl || null,
        categoryIds: selectedCategoryIds,
        passportInfo: [formData.passportSeries, formData.passportIssuedBy].filter(Boolean).join(', '),
        submitForReview: shouldSubmitForReview,
      };

      const res = await API.put('/suppliers/profile', payload);
      setSupplier(res.data);
      const updatedCatIds = res.data.categories
        ? res.data.categories.map((c) => c.categoryId)
        : selectedCategoryIds;
      setSelectedCategoryIds(updatedCatIds);
      setInitialCategoryIds(updatedCatIds);

      const newSavedData = {
        ...formData,
        name: cleanedName,
        address: cleanedAddr,
        directorName: formData.directorName?.trim() || '',
        logoUrl: formData.logoUrl || '',
        phone: res.data?.phone || formData.phone,
      };
      setFormData(newSavedData);
      setInitialFormData(newSavedData);
      setInitialPhoneDigits(phoneDigits);
      setInitialDocuments([...documents]);
      setIsEditing(false);
      showAlert({
        title: t('success', 'Успешно'),
        message: t(
          'submittedForReviewSuccess',
          'Анкета успешно отправлена на модерацию! Ожидайте проверки специалистами Минздрава.'
        ),
        type: 'success',
      });
    } catch (error) {
      console.error(error);
      showAlert({
        title: t('error', 'Ошибка'),
        message: error.response?.data?.error || t('profileSaveError', 'Ошибка при сохранении профиля'),
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  // Административные действия
  const handleAdminApprove = async () => {
    if (!supplier) return;
    const confirmText = t(
      'approveConfirmText',
      'Вы уверены, что хотите одобрить верификацию компании «{name}»?'
    ).replace('{name}', supplier.name || '');
    const isConfirmed = await showConfirm({
      title: t('approveVerificationTitle', 'Одобрение верификации'),
      message: confirmText,
      type: 'success',
      confirmText: t('approve', 'Одобрить'),
      cancelText: t('cancel', 'Отмена'),
    });
    if (!isConfirmed) return;

    try {
      setIsModerating(true);
      await API.post(`/suppliers/${supplier.id}/approve`, {});
      setSupplier((prev) => ({ ...prev, verificationStatus: 'VERIFIED', rejectionReason: null }));
      await showAlert({
        title: t('success', 'Успешно'),
        message: t('companyVerifiedSuccess', 'Верификация компании успешно одобрена!'),
        type: 'success',
      });
      navigate('/suppliers', { state: { activeTab: 'pending' } });
    } catch (err) {
      console.error('Ошибка при одобрении:', err);
      showAlert({
        title: t('error', 'Ошибка'),
        message: err?.response?.data?.error || t('approveError', 'Ошибка при одобрении'),
        type: 'error',
      });
    } finally {
      setIsModerating(false);
    }
  };

  const handleAdminRejectConfirm = async (reason) => {
    if (!supplier) return;
    try {
      setIsModerating(true);
      await API.post(`/suppliers/${supplier.id}/reject`, { rejectionReason: reason });
      setSupplier((prev) => ({ ...prev, verificationStatus: 'REJECTED', rejectionReason: reason }));
      setIsRejectModalOpen(false);
      await showAlert({
        title: t('rejected', 'Отклонено'),
        message: t('applicationRejectedSuccess', 'Заявка отклонена. Замечания переданы поставщику.'),
        type: 'info',
      });
      navigate('/suppliers', { state: { activeTab: 'pending' } });
    } catch (err) {
      console.error('Ошибка при отклонении:', err);
      showAlert({
        title: t('error', 'Ошибка'),
        message: err?.response?.data?.error || t('rejectError', 'Ошибка при отклонении'),
        type: 'error',
      });
    } finally {
      setIsModerating(false);
    }
  };

  // Расчет готовности и доступности отправки
  const readiness = useMemo(() => {
    return calculateReadiness(formData, documents, selectedCategoryIds, supplier, bankTab, t);
  }, [formData, documents, selectedCategoryIds, supplier, bankTab, t]);

  const hasDocuments = Boolean(documents && documents.length > 0);
  const isCategoriesSelected = Boolean(selectedCategoryIds && selectedCategoryIds.length > 0);
  const isVerified = supplier?.verificationStatus === 'VERIFIED';
  const isEditable = Boolean(
    effectiveIsOwner && (isVerified ? isEditing : supplier?.verificationStatus !== 'PENDING_REVIEW')
  );
  const isSubmitDisabled = Boolean(
    !isEditable ||
    !hasDocuments ||
    !isCategoriesSelected ||
    saving ||
    isLicenseExpired ||
    (supplier?.verificationStatus === 'REJECTED' && !hasChanges)
  );

  // Изменения, отправленные поставщиком на проверку администратором
  const moderationChanges = useMemo(() => {
    return parseSupplierChanges(supplier?.notes);
  }, [supplier?.notes]);

  const changedFieldKeys = useMemo(() => {
    return moderationChanges?.changes?.map((c) => c.field) || [];
  }, [moderationChanges]);

  const regionLabel = useMemo(() => {
    return TURKMEN_REGIONS.find((r) => r.id === formData.region)?.defaultName || formData.region;
  }, [formData.region]);

  // Стили темы
  const bgClass = isDarkMode ? 'text-slate-100' : 'text-slate-800';
  const cardBg = isDarkMode
    ? 'bg-slate-900 border-slate-800 shadow-none'
    : 'bg-white border-slate-200/60 shadow-xl shadow-slate-200/40';
  const inputBg = isDarkMode
    ? isEditable
      ? 'bg-slate-800/80 border-slate-700/80 text-white placeholder-slate-500 focus:border-blue-500'
      : 'bg-slate-800/40 border-slate-700/50 text-slate-300 cursor-default select-text'
    : isEditable
    ? 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-blue-500 shadow-2xs'
    : 'bg-slate-50 border-slate-200 text-slate-700 cursor-default select-text';

  return {
    isAdmin,
    effectiveIsOwner,
    supplier,
    setSupplier,
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
  };
}

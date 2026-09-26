import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAlert } from '../context/AlertContext';
import { getTranslation } from '../utils/translations';
import API from '../services/api';
import RejectSupplierModal from '../components/RejectSupplierModal';

// Импорт модульных компонентов секций профиля поставщика
import { TURKMEN_REGIONS } from '../components/supplier/supplierConstants';
import { cleanAddressString, formatPhoneString, getCleanCompanyName, calculateReadiness } from '../components/supplier/supplierUtils';
import SupplierCompanyCardModal from '../components/supplier/SupplierCompanyCardModal';
import SupplierStatusBanner from '../components/supplier/SupplierStatusBanner';
import SupplierHeader from '../components/supplier/SupplierHeader';
import SupplierRepresentativeCard from '../components/supplier/SupplierRepresentativeCard';
import SupplierBasicInfoCard from '../components/supplier/SupplierBasicInfoCard';
import SupplierCategoriesCard from '../components/supplier/SupplierCategoriesCard';
import SupplierAddressCard from '../components/supplier/SupplierAddressCard';
import SupplierLicenseCard from '../components/supplier/SupplierLicenseCard';
import SupplierBankCard from '../components/supplier/SupplierBankCard';
import SupplierDirectorCard from '../components/supplier/SupplierDirectorCard';
import SupplierDocumentsCard from '../components/supplier/SupplierDocumentsCard';
import SupplierActionButtons from '../components/supplier/SupplierActionButtons';
import SupplierAdminPanel from '../components/supplier/SupplierAdminPanel';
import SupplierSidebar from '../components/supplier/SupplierSidebar';

export default function SupplierProfilePage({ role, lang = 'RU', isDarkMode, isOwner }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const t = (key, fallback) => getTranslation(lang, key, fallback);
  const { showAlert, showConfirm } = useAlert();

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
    logoUrl: ''
  });

  // Локальное отображение номера телефона (для TM: 8 цифр без +993; для других стран: полный ввод)
  const [phoneDigits, setPhoneDigits] = useState('');

  // Режим редактирования (для верифицированных компаний по умолчанию false)
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
  const isAdmin = role === 'ADMIN';
  const effectiveIsOwner = Boolean(isOwner || (role === 'SUPPLIER' && !id));
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isModerating, setIsModerating] = useState(false);

  // Состояние скрытия верхнего баннера верификации (сохраняется в localStorage)
  const [isBannerDismissed, setIsBannerDismissed] = useState(() => {
    return localStorage.getItem('tender_verified_banner_dismissed') === 'true';
  });

  const handleDismissBanner = () => {
    localStorage.setItem('tender_verified_banner_dismissed', 'true');
    setIsBannerDismissed(true);
  };

  // Определение: является ли компания иностранной
  const isForeignCompany = Boolean(
    (supplier?.country?.alpha2 && supplier.country.alpha2 !== 'TM') ||
    (formData.countryCode && formData.countryCode !== 'TM')
  );

  // Проверка: просрочена ли лицензия Минздрава
  const isLicenseExpired = Boolean(
    formData.isMedicalLicensed &&
    formData.licenseExpiryDate &&
    new Date(formData.licenseExpiryDate) < new Date().setHours(0, 0, 0, 0)
  );

  // Загрузка данных профиля
  useEffect(() => {
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
        } else {
          try {
            const compRes = await API.get(`/suppliers/${id}`);
            currentSupplier = compRes.data;
          } catch (fetchErr) {
            console.warn('Direct supplier fetch fallback:', fetchErr);
            const fallbackRes = await API.get('/offers/suppliers');
            currentSupplier = fallbackRes.data.find(c => String(c.id) === String(id));
          }
        }

        setSupplier(currentSupplier);

        if (currentSupplier) {
          const loadedCatIds = currentSupplier.categories ? currentSupplier.categories.map(c => c.categoryId) : [];
          setSelectedCategoryIds(loadedCatIds);
          setInitialCategoryIds(loadedCatIds);

          API.get('/catalogs/categories').then(r => {
            if (Array.isArray(r.data)) setCategoriesList(r.data.filter(c => c.isActive));
          }).catch(() => {});

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
          const cCode = currentSupplier.country?.alpha2 || (currentSupplier.phone?.startsWith('+993') ? 'TM' : (currentSupplier.phone ? 'OTHER' : 'TM'));
          const cName = currentSupplier.country?.nameRu || currentSupplier.country?.name || 'Туркменистан';
          const isForeign = cCode !== 'TM';

          // Нормализация региона под официальный список (если Туркменистан)
          let reg = currentSupplier.region || '';
          let addr = currentSupplier.address || '';
          if (!isForeign) {
            if (reg) {
              const matched = TURKMEN_REGIONS.find(r => 
                r.id.toLowerCase() === reg.toLowerCase() || 
                r.id.toLowerCase().startsWith(reg.toLowerCase()) ||
                reg.toLowerCase().startsWith(r.id.toLowerCase().slice(0, 4))
              );
              if (matched) reg = matched.id;
            } else if (addr) {
              const foundRegion = TURKMEN_REGIONS.find(r => addr.toLowerCase().includes(r.id.toLowerCase().slice(0, 4)));
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

          // Выбор вкладки банка (если есть SWIFT или IBAN - сразу открываем иностранную вкладку)
          const hasForeignBankData = Boolean(currentSupplier.bankSwift || currentSupplier.bankIban || (isForeign && !currentSupplier.bankAccount));
          setBankTab(hasForeignBankData ? 'foreign' : 'local');

          // Форматирование даты лицензии Минздрава (YYYY-MM-DD)
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
            logoUrl: currentSupplier.logoUrl || ''
          };

          setFormData(initialData);
          setInitialFormData(initialData);

          // Для подтвержденного профиля или при инспекции админом режим по умолчанию - просмотр
          if (currentSupplier.verificationStatus === 'VERIFIED' || !effectiveIsOwner || currentSupplier.verificationStatus === 'REJECTED') {
            setIsEditing(false);
          } else {
            setIsEditing(true);
          }

          // Загрузка статистики
          try {
            const statsRes = await API.get(`/suppliers/${currentSupplier.id}/stats`).catch(() => ({ data: { totalOffers: 0, wonOffers: 0 } }));
            setStats(statsRes.data || { totalOffers: 0, wonOffers: 0 });
          } catch (statsErr) {
            console.error('Не удалось загрузить статистику:', statsErr);
          }

          // Загрузка документов поставщика
          try {
            const docsRes = await API.get(`/documents?supplierId=${currentSupplier.id}`);
            const fetchedDocs = docsRes.data || [];
            setDocuments(fetchedDocs);
            setInitialDocuments(fetchedDocs);
          } catch (docsErr) {
            console.error('Не удалось загрузить документы:', docsErr);
          }
        }
      } catch (err) {
        console.error('Ошибка загрузки профиля:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, isOwner]);

  // Вычисление наличия изменений в форме
  const hasChanges = Boolean(
    initialFormData && (
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
      JSON.stringify([...selectedCategoryIds].sort()) !== JSON.stringify([...initialCategoryIds].sort()) ||
      pendingDeleteDocIds.length > 0 ||
      documents.length !== initialDocuments.length
    )
  );

  // Режим редактирования
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
    if (!['png', 'jpg', 'jpeg'].includes(ext)) {
      showAlert({
        title: t('validationError', 'Ошибка валидации'),
        message: t('onlyImagesAllowed', 'Для логотипа поддерживаются только изображения JPG и PNG'),
        type: 'warning'
      });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showAlert({
        title: t('validationError', 'Ошибка валидации'),
        message: t('logoTooLarge', 'Размер логотипа не должен превышать 5 МБ'),
        type: 'warning'
      });
      return;
    }
    try {
      const uploadData = new FormData();
      uploadData.append('file', file);
      uploadData.append('supplierId', supplier.id);
      uploadData.append('name', `logo_${file.name}`);

      const res = await API.post('/documents/upload', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data) {
        const logoPath = res.data.filePath 
          ? (res.data.filePath.startsWith('http') ? res.data.filePath : `http://localhost:5000/${res.data.filePath.replace(/\\/g, '/')}`) 
          : (res.data.url || '');
        setFormData(prev => ({ ...prev, logoUrl: logoPath }));
        showAlert({
          title: t('success', 'Успешно'),
          message: t('logoUploadedSuccess', 'Логотип успешно загружен'),
          type: 'success'
        });
      }
    } catch (err) {
      console.error('Logo upload error', err);
      showAlert({
        title: t('error', 'Ошибка'),
        message: t('uploadError', 'Ошибка при загрузке логотипа'),
        type: 'error'
      });
    }
  };

  // Удаление документа
  const handleDeleteDocument = (docId) => {
    setDocuments(prev => prev.filter(d => d.id !== docId));
    setPendingDeleteDocIds(prev => [...prev, docId]);
  };

  // Отправка формы профиля
  const handleSubmit = async (e, shouldSubmitForReview = true) => {
    if (e) e.preventDefault();
    if (!documents || documents.length === 0) {
      showAlert({
        title: t('attention', 'Внимание'),
        message: t('attachDocsToSubmit', 'Прикрепите хотя бы один документ для отправки на проверку'),
        type: 'warning'
      });
      return;
    }

    if (formData.isMedicalLicensed) {
      if (!formData.licenseNumber?.trim()) {
        showAlert({
          title: t('validationError', 'Ошибка валидации'),
          message: t('licenseNumberRequired', 'Укажите номер медицинской лицензии Минздрава'),
          type: 'warning'
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
            type: 'error'
          });
          return;
        }
      }
    }

    if (formData.directorPersonalCode) {
      const cleanPersonal = formData.directorPersonalCode.replace(/\D/g, '');
      if (cleanPersonal.length !== 14) {
        const pErr = t('directorPersonalCodeInvalid', 'Личный код руководителя (Şahsy kod) должен содержать строго 14 цифр');
        setPersonalCodeError(pErr);
        showAlert({
          title: t('validationError', 'Ошибка валидации'),
          message: pErr,
          type: 'warning'
        });
        return;
      }
    }

    if (supplier?.verificationStatus === 'REJECTED' && !hasChanges) {
      showAlert({
        title: t('attention', 'Внимание'),
        message: t('noChangesResubmitError', 'Внесите изменения в реквизиты перед повторной отправкой на проверку'),
        type: 'warning'
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
          type: 'warning'
        });
        return;
      }
    }

    if (!selectedCategoryIds || selectedCategoryIds.length === 0) {
      showAlert({
        title: t('attention', 'Внимание'),
        message: t('atLeastOneCategoryRequired', 'Выберите хотя бы одну категорию деятельности'),
        type: 'warning'
      });
      return;
    }

    const isVerifiedSupplier = supplier?.verificationStatus === 'VERIFIED';
    if (isVerifiedSupplier && hasChanges) {
      const confirmed = await showConfirm({
        title: t('resubmitWarningTitle', 'Повторная модерация'),
        message: t('resubmitWarning', 'При изменении юридических или банковских реквизитов статус верификации будет временно приостановлен до проверки администратором. Продолжить?'),
        type: 'warning',
        confirmText: t('continue', 'Продолжить'),
        cancelText: t('cancel', 'Отмена')
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

      const cleanedAddr = !isForeignCompany ? cleanAddressString(formData.address, formData.region) : formData.address;
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
        licenseExpiryDate: formData.licenseExpiryDate ? new Date(formData.licenseExpiryDate).toISOString() : null,
        bankCorrAccount: formData.bankCorrAccount?.trim() || null,
        bankSwift: formData.bankSwift?.trim() || null,
        bankIban: formData.bankIban?.trim() || null,
        bankCurrency: formData.bankCurrency || 'USD',
        directorName: formData.directorName?.trim() || null,
        logoUrl: formData.logoUrl || null,
        categoryIds: selectedCategoryIds,
        passportInfo: [formData.passportSeries, formData.passportIssuedBy].filter(Boolean).join(', '),
        submitForReview: shouldSubmitForReview
      };

      const res = await API.put('/suppliers/profile', payload);
      setSupplier(res.data);
      const updatedCatIds = res.data.categories ? res.data.categories.map(c => c.categoryId) : selectedCategoryIds;
      setSelectedCategoryIds(updatedCatIds);
      setInitialCategoryIds(updatedCatIds);

      const newSavedData = { 
        ...formData, 
        name: cleanedName, 
        address: cleanedAddr,
        directorName: formData.directorName?.trim() || '',
        logoUrl: formData.logoUrl || '',
        phone: res.data?.phone || formData.phone 
      };
      setFormData(newSavedData);
      setInitialFormData(newSavedData);
      setInitialPhoneDigits(phoneDigits);
      setInitialDocuments([...documents]);
      setIsEditing(false);
      showAlert({
        title: t('success', 'Успешно'),
        message: t('submittedForReviewSuccess', 'Анкета успешно отправлена на модерацию! Ожидайте проверки специалистами Минздрава.'),
        type: 'success'
      });
    } catch (error) {
      console.error(error);
      showAlert({
        title: t('error', 'Ошибка'),
        message: error.response?.data?.error || t('profileSaveError', 'Ошибка при сохранении профиля'),
        type: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  // Административные действия
  const handleAdminApprove = async () => {
    if (!supplier) return;
    const confirmText = t('approveConfirmText', 'Вы уверены, что хотите одобрить верификацию компании «{name}»?')
      .replace('{name}', supplier.name || '');
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
      setSupplier(prev => ({ ...prev, verificationStatus: 'VERIFIED', rejectionReason: null }));
      await showAlert({
        title: t('success', 'Успешно'),
        message: t('companyVerifiedSuccess', 'Верификация компании успешно одобрена!'),
        type: 'success'
      });
      navigate('/suppliers', { state: { activeTab: 'pending' } });
    } catch (err) {
      console.error('Ошибка при одобрении:', err);
      showAlert({
        title: t('error', 'Ошибка'),
        message: err?.response?.data?.error || 'Ошибка при одобрении',
        type: 'error'
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
      setSupplier(prev => ({ ...prev, verificationStatus: 'REJECTED', rejectionReason: reason }));
      setIsRejectModalOpen(false);
      await showAlert({
        title: t('rejected', 'Отклонено'),
        message: t('applicationRejectedSuccess', 'Заявка отклонена. Замечания переданы поставщику.'),
        type: 'info'
      });
      navigate('/suppliers', { state: { activeTab: 'pending' } });
    } catch (err) {
      console.error('Ошибка при отклонении:', err);
      showAlert({
        title: t('error', 'Ошибка'),
        message: err?.response?.data?.error || 'Ошибка при отклонении',
        type: 'error'
      });
    } finally {
      setIsModerating(false);
    }
  };

  // Расчет готовности и доступности отправки
  const readiness = calculateReadiness(formData, documents, selectedCategoryIds, supplier, bankTab, t);
  const hasDocuments = documents && documents.length > 0;
  const isCategoriesSelected = Boolean(selectedCategoryIds && selectedCategoryIds.length > 0);
  const isVerified = supplier?.verificationStatus === 'VERIFIED';
  const isEditable = effectiveIsOwner && (isVerified ? isEditing : supplier?.verificationStatus !== 'PENDING_REVIEW');
  const isSubmitDisabled = !isEditable || !hasDocuments || !isCategoriesSelected || saving || isLicenseExpired || (supplier?.verificationStatus === 'REJECTED' && !hasChanges);

  // Стили темы
  const bgClass = isDarkMode ? 'text-slate-100' : 'text-slate-800';
  const cardBg = isDarkMode ? 'bg-slate-900 border-slate-800 shadow-none' : 'bg-white border-slate-200/60 shadow-xl shadow-slate-200/40';
  const inputBg = isDarkMode
    ? (isEditable
        ? 'bg-slate-800/80 border-slate-700/80 text-white placeholder-slate-500 focus:border-blue-500'
        : 'bg-slate-800/40 border-slate-700/50 text-slate-300 cursor-default select-text')
    : (isEditable
        ? 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-blue-500 shadow-xs'
        : 'bg-slate-50 border-slate-200 text-slate-700 cursor-default select-text');

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-20 ${bgClass}`}>
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className={`p-6 flex-1 ${bgClass}`}>
        <button onClick={() => navigate(-1)} className="flex items-center text-slate-500 hover:text-blue-600 mb-6 transition-colors">
          <ArrowLeft size={16} className="mr-2" /> {t('back', 'Назад')}
        </button>
        <div className="text-center py-10 text-slate-500 text-lg">{t('profileNotFoundTitle', 'Профиль не найден')}</div>
      </div>
    );
  }

  const regionLabel = TURKMEN_REGIONS.find(r => r.id === formData.region)?.defaultName || formData.region;

  return (
    <div className={`max-w-5xl mx-auto space-y-6 ${bgClass}`}>
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
        isBannerDismissed={isBannerDismissed}
        onDismissBanner={handleDismissBanner}
        isEditing={isEditing}
        onStartEdit={handleStartEdit}
        t={t}
      />

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Левая колонка - Профиль и форма */}
        <div className={`flex-1 min-w-0 rounded-[2rem] p-6 sm:p-8 space-y-8 ${cardBg}`}>
          {/* Шапка профиля компании */}
          <SupplierHeader
            supplier={supplier}
            formData={formData}
            isEditable={isEditable}
            isForeignCompany={isForeignCompany}
            onLogoUpload={handleLogoUpload}
            t={t}
          />

          {/* Карточка представителя аккаунта */}
          <SupplierRepresentativeCard
            supplier={supplier}
            formData={formData}
            t={t}
          />

          {(effectiveIsOwner || isAdmin) ? (
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
            /* Режим простого просмотра для других ролей */
            <div className="text-center py-6 text-slate-400 text-xs">
              {t('guestProfileViewMode', 'Просмотр информации об участнике электронных торгов')}
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

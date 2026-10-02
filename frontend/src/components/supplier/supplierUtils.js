// Получение чистого названия бренда без формы собственности (ИП, ХО, ООО, ЧП и т.д.)
export const getCleanCompanyName = (rawName) => {
  if (!rawName) return '';
  return rawName.trim()
    .replace(/^(ип|хо|ооо|чп|hj|dh|hk|telekeçi|hojalyk\s+jemgyýeti|hususy\s+telekeçi|hususy\s+kärhana)\s*["«'”]?\s*/i, '')
    .replace(/["»'”]$/, '')
    .trim() || rawName.trim();
};

// Получение монограммы бренда
export const getBrandInitials = (rawName) => {
  const clean = getCleanCompanyName(rawName);
  if (!clean) return 'TU';
  const parts = clean.split(/[\s\-–—]+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  const upperMatches = clean.match(/[A-ZА-ЯЁ]/g);
  if (upperMatches && upperMatches.length >= 2) {
    return (upperMatches[0] + upperMatches[1]).toUpperCase();
  }
  return clean.slice(0, Math.min(2, clean.length)).toUpperCase();
};

// Полное юридическое наименование для официальных документов и карточки предприятия
export const getFullFormalCompanyName = (name, type) => {
  const clean = getCleanCompanyName(name);
  if (!clean) return '';
  if (type === 'ENTREPRENEUR') return `ИП «${clean}» (Hususy telekeçi «${clean}»)`;
  if (type === 'BUSINESS_SOCIETY') return `ХО «${clean}» (HJ «${clean}»)`;
  if (type === 'PRIVATE_ENTERPRISE' || type === 'BUSINESS_COMPANY') return `ЧП «${clean}» (HK «${clean}»)`;
  if (type === 'DAÝHAN_HOJALYGY' || type === 'FARMER_ASSOCIATION') return `DH «${clean}» (Daýhan hojalygy «${clean}»)`;
  if (type === 'FOREIGN_ENTITY') return `Иностранная компания «${clean}»`;
  return clean;
};

// Надежное получение формы собственности компании
export const getCompanyTypeBadge = (customType, supplier = null, isForeignCompany = false, t = (k, f) => f) => {
  let type = customType || supplier?.type;
  if (!type && supplier?.name) {
    const n = supplier.name.trim().toLowerCase();
    if (n.startsWith('ип') || n.includes('hususy telekeçi') || n.includes('telekeçi')) type = 'ENTREPRENEUR';
    else if (n.startsWith('хо') || n.includes('hojalyk') || n.includes('hj')) type = 'BUSINESS_SOCIETY';
    else if (n.startsWith('чп') || n.includes('kärhana') || n.includes('hk')) type = 'PRIVATE_ENTERPRISE';
    else if (n.startsWith('dh') || n.includes('daýhan')) type = 'DAÝHAN_HOJALYGY';
    else if (isForeignCompany) type = 'FOREIGN_ENTITY';
    else type = 'ENTREPRENEUR';
  }
  if (type === 'ENTREPRENEUR') return 'ИП (Hususy telekeçi)';
  if (type === 'BUSINESS_SOCIETY') return 'ХО (Hojalyk jemgyýeti)';
  if (type === 'PRIVATE_ENTERPRISE' || type === 'BUSINESS_COMPANY') return 'ЧП (Hususy kärhana)';
  if (type === 'DAÝHAN_HOJALYGY' || type === 'FARMER_ASSOCIATION') return 'DH (Daýhan hojalygy)';
  if (type === 'GOVERNMENT') return 'Гос. предприятие (Döwlet kärhanasy)';
  if (type === 'FOREIGN_ENTITY') return t('foreignEntity', 'Иностранное юр. лицо');
  return type || 'ИП (Hususy telekeçi)';
};

// Очистка адреса от дублирования названия велаята / города
export const cleanAddressString = (addr, reg) => {
  if (!addr) return '';
  let cleaned = addr.trim();

  const regionKeywords = [
    'aşgabat ş.', 'aşgabat', 'ашхабад г.', 'ашхабад', 'г. ашхабад', 'г.ашхабад',
    'ahal welaýaty', 'ahal', 'ахалский велаят', 'ахал',
    'balkan welaýaty', 'balkan', 'балканский велаят', 'балкан',
    'daşoguz welaýaty', 'daşoguz', 'дашогузский велаят', 'дашогуз',
    'lebap welaýaty', 'lebap', 'лебапский велаят', 'лебап',
    'mary welaýaty', 'mary', 'марыйский велаят', 'марый'
  ];

  if (reg) {
    regionKeywords.unshift(reg.toLowerCase());
  }

  for (const kw of regionKeywords) {
    const regExp = new RegExp(`^${kw}[,\\s\\-\\–]+`, 'i');
    if (regExp.test(cleaned)) {
      cleaned = cleaned.replace(regExp, '').trim();
      break;
    }
  }

  return cleaned;
};

// Форматирование телефонного номера для ТМ: 8 цифр -> "65 56-65-65"
export const formatPhoneString = (rawDigits) => {
  if (!rawDigits) return '';
  let res = '';
  if (rawDigits.length > 0) res += rawDigits.slice(0, 2);
  if (rawDigits.length > 2) res += ' ' + rawDigits.slice(2, 4);
  if (rawDigits.length > 4) res += '-' + rawDigits.slice(4, 6);
  if (rawDigits.length > 6) res += '-' + rawDigits.slice(6, 8);
  return res;
};

// Расчет готовности профиля
export const calculateReadiness = (formData, documents, selectedCategoryIds, supplier, bankTab = 'local', t = (k, f) => f) => {
  const isBasicDetailsFilled = Boolean(
    formData?.name?.trim() &&
    formData?.address?.trim() && 
    formData?.phone?.trim() && 
    formData?.email?.trim()
  );

  const isBankFilled = bankTab === 'foreign'
    ? Boolean(formData?.bankName?.trim() && formData?.bankSwift?.trim() && formData?.bankIban?.trim())
    : Boolean(formData?.bankName?.trim() && formData?.bankAccount?.trim() && formData?.bankMfo?.trim());

  const isDirectorFilled = Boolean(
    formData?.directorName?.trim() && 
    (formData?.passportSeries?.trim() || formData?.directorPersonalCode?.trim())
  );

  const isMedicalValid = !formData?.isMedicalLicensed || Boolean(
    formData?.licenseNumber?.trim() && 
    formData?.licenseExpiryDate && 
    new Date(formData.licenseExpiryDate) >= new Date().setHours(0, 0, 0, 0)
  );

  const isCategoriesSelected = Boolean(selectedCategoryIds && selectedCategoryIds.length > 0);
  const isDetailsFilled = isBasicDetailsFilled && isBankFilled && isDirectorFilled && isMedicalValid && isCategoriesSelected;
  const isDocsUploaded = Boolean(documents && documents.length > 0);
  const isApproved = supplier?.verificationStatus === 'VERIFIED';
  const isPendingReview = supplier?.verificationStatus === 'PENDING_REVIEW';

  const steps = [
    {
      id: 'account',
      title: t('profileStepAccount', 'Создание учетной записи'),
      completed: true,
      weight: 20
    },
    {
      id: 'details',
      title: t('profileStepDetails', 'Заполнение контактов и реквизитов'),
      completed: isDetailsFilled,
      weight: 35
    },
    {
      id: 'documents',
      title: t('profileStepDocs', 'Загрузка сканов документов'),
      completed: isDocsUploaded,
      weight: 30
    },
    {
      id: 'approval',
      title: t('profileStepApproval', 'Одобрение администратором Минздрава'),
      completed: isApproved,
      pending: isPendingReview,
      weight: 15
    }
  ];

  let percent = 0;
  if (isApproved) {
    percent = 100;
  } else {
    steps.forEach(s => {
      if (s.completed) percent += s.weight;
    });
  }

  return { steps, percent, isApproved, isPendingReview, isDetailsFilled, isDocsUploaded, isCategoriesSelected };
};

// Парсинг истории изменений профиля, отправленных на модерацию
export const parseSupplierChanges = (notes) => {
  if (!notes) return null;
  try {
    const data = typeof notes === 'string' ? JSON.parse(notes) : notes;
    if (data && Array.isArray(data.changes) && data.changes.length > 0) {
      return data;
    }
    return null;
  } catch {
    return null;
  }
};


import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Trophy, 
  FileText, 
  Building2, 
  Phone, 
  Mail, 
  MapPin, 
  CreditCard, 
  User, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Trash2, 
  UploadCloud, 
  ChevronDown, 
  Check, 
  X, 
  ShieldCheck, 
  FileCheck, 
  Image as ImageIcon,
  Search,
  Printer,
  Edit3,
  Lock,
  Eye,
  Download,
  Shield,
  XCircle,
  ExternalLink
} from 'lucide-react';
import API from '../services/api';
import { getTranslation } from '../utils/translations';
import { getRoleTheme } from '../utils/themeUtils';
import RejectSupplierModal from '../components/RejectSupplierModal';
import { useAlert } from '../context/AlertContext';
import CustomSelect from '../components/CustomSelect';

// Список официальных регионов Туркменистана (юридические наименования)
const REGIONS = [
  { id: 'Aşgabat ş.', key: 'region_asgabat', defaultName: 'Aşgabat ş.' },
  { id: 'Ahal welaýaty', key: 'region_ahal', defaultName: 'Ahal welaýaty' },
  { id: 'Balkan welaýaty', key: 'region_balkan', defaultName: 'Balkan welaýaty' },
  { id: 'Daşoguz welaýaty', key: 'region_dasoguz', defaultName: 'Daşoguz welaýaty' },
  { id: 'Lebap welaýaty', key: 'region_lebap', defaultName: 'Lebap welaýaty' },
  { id: 'Mary welaýaty', key: 'region_mary', defaultName: 'Mary welaýaty' },
];

// Список коммерческих банков Туркменистана (официальные наименования)
const TURKMEN_BANKS = [
  { id: 'Rysgal', name: 'PTB «Rysgal»', key: 'bank_rysgal', code: '390101744' },
  { id: 'Senagat', name: 'AKB «Senagat»', key: 'bank_senagat', code: '390101742' },
  { id: 'Turkmenbasy', name: 'DTB «Türkmenbaşy»', key: 'bank_turkmenbasy', code: '390101741' },
  { id: 'Halkbank', name: 'DTB «Halkbank»', key: 'bank_halkbank', code: '390101705' },
  { id: 'Dayhanbank', name: 'DTB «Daýhanbank»', key: 'bank_dayhanbank', code: '390101712' },
  { id: 'DasaryYkdysady', name: 'Türkmenistanyň Daşary ykdysady iş banky', key: 'bank_dasary', code: '390101726' },
  { id: 'TurkmenTurk', name: 'Türkmen-Türk paýdarlar täjirçilik banky', key: 'bank_turkmenturk', code: '390101735' },
  { id: 'Prezidentbank', name: '«Prezidentbank»', key: 'bank_prezidentbank', code: '390101701' },
];

export default function SupplierProfilePage({ role, lang = 'RU', isDarkMode, isOwner }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const t = (key, fallback) => getTranslation(lang, key, fallback);
  const theme = getRoleTheme(role, isDarkMode);
  const { showAlert, showConfirm } = useAlert();

  const [supplier, setSupplier] = useState(null);
  const [stats, setStats] = useState({ totalOffers: 0, wonOffers: 0 });
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  // Состояние выпадающего списка банков с поиском
  const [isBankOpen, setIsBankOpen] = useState(false);
  const [bankSearch, setBankSearch] = useState('');
  const bankDropdownRef = useRef(null);
  const fileInputRef = useRef(null);

  // Состояние кастомного выпадающего списка велаятов
  const [isRegionOpen, setIsRegionOpen] = useState(false);
  const regionDropdownRef = useRef(null);

  // Форма профиля
  const [formData, setFormData] = useState({
    name: '',
    type: 'ENTREPRENEUR',
    region: '',
    address: '',
    bankName: '',
    bankAccount: '',
    bankMfo: '',
    passportSeries: '',
    passportIssuedBy: '',
    email: '',
    phone: ''
  });

  // Локальное отображение номера телефона (без префикса +993)
  const [phoneDigits, setPhoneDigits] = useState('');

  // Режим редактирования (для верифицированных компаний по умолчанию false)
  const [isEditing, setIsEditing] = useState(false);
  const [initialFormData, setInitialFormData] = useState(null);
  const [initialPhoneDigits, setInitialPhoneDigits] = useState('');
  const [showCompanyCard, setShowCompanyCard] = useState(false);
  const [passportError, setPassportError] = useState('');

  // Безопасное удаление документов (стейджинг изменений при редактировании)
  const [pendingDeleteDocIds, setPendingDeleteDocIds] = useState([]);
  const [initialDocuments, setInitialDocuments] = useState([]);

  // Модерация администратором
  const isAdmin = role === 'ADMIN';
  const effectiveIsOwner = Boolean(isOwner || (role === 'SUPPLIER' && !id));
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isModerating, setIsModerating] = useState(false);

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
      await API.post(`/suppliers/${supplier.id}/approve`);
      setSupplier(prev => ({ ...prev, verificationStatus: 'VERIFIED', rejectionReason: null }));
      await showAlert({
        title: t('success', 'Успешно'),
        message: lang === 'RU' ? 'Верификация компании успешно одобрена!' : 'Kompaniýanyň barlagy üstünlikli tassyklandy!',
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
        message: lang === 'RU' ? 'Заявка отклонена. Замечания переданы поставщику.' : 'Arza ret edildi.',
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

  // Состояние скрытия верхнего баннера верификации (сохраняется в localStorage)
  const [isBannerDismissed, setIsBannerDismissed] = useState(() => {
    return localStorage.getItem('tender_verified_banner_dismissed') === 'true';
  });

  const handleDismissBanner = () => {
    localStorage.setItem('tender_verified_banner_dismissed', 'true');
    setIsBannerDismissed(true);
  };

  // Получение чистого названия бренда без формы собственности (ИП, ХО, ООО, ЧП и т.д.)
  const getCleanCompanyName = (rawName) => {
    if (!rawName) return '';
    return rawName.trim()
      .replace(/^(ип|хо|ооо|чп|hj|dh|hk|telekeçi|hojalyk\s+jemgyýeti|hususy\s+telekeçi|hususy\s+kärhana)\s*["«'”]?\s*/i, '')
      .replace(/["»'”]$/, '')
      .trim() || rawName.trim();
  };

  // Получение монограммы бренда (например, «Медик-Фарм» -> «МФ», «ФармаЛогистик» -> «ФЛ»)
  const getBrandInitials = (rawName) => {
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
  const getFullFormalCompanyName = (name, type) => {
    const clean = getCleanCompanyName(name);
    if (!clean) return '';
    if (type === 'ENTREPRENEUR') return `ИП «${clean}» (Hususy telekeçi «${clean}»)`;
    if (type === 'BUSINESS_SOCIETY') return `ХО «${clean}» (HJ «${clean}»)`;
    if (type === 'PRIVATE_ENTERPRISE' || type === 'BUSINESS_COMPANY') return `ЧП «${clean}» (HK «${clean}»)`;
    if (type === 'DAÝHAN_HOJALYGY' || type === 'FARMER_ASSOCIATION') return `DH «${clean}» (Daýhan hojalygy «${clean}»)`;
    return clean;
  };

  // Надежное получение формы собственности компании (ИП / ХО / ЧП / DH)
  const getCompanyTypeBadge = (customType) => {
    let type = customType || supplier?.type;
    if (!type && supplier?.name) {
      const n = supplier.name.trim().toLowerCase();
      if (n.startsWith('ип') || n.includes('hususy telekeçi') || n.includes('telekeçi')) type = 'ENTREPRENEUR';
      else if (n.startsWith('хо') || n.includes('hojalyk') || n.includes('hj')) type = 'BUSINESS_SOCIETY';
      else if (n.startsWith('чп') || n.includes('kärhana') || n.includes('hk')) type = 'PRIVATE_ENTERPRISE';
      else if (n.startsWith('dh') || n.includes('daýhan')) type = 'DAÝHAN_HOJALYGY';
      else type = 'ENTREPRENEUR';
    }
    if (type === 'ENTREPRENEUR') return 'ИП (Hususy telekeçi)';
    if (type === 'BUSINESS_SOCIETY') return 'ХО (Hojalyk jemgyýeti)';
    if (type === 'PRIVATE_ENTERPRISE' || type === 'BUSINESS_COMPANY') return 'ЧП (Hususy kärhana)';
    if (type === 'DAÝHAN_HOJALYGY' || type === 'FARMER_ASSOCIATION') return 'DH (Daýhan hojalygy)';
    if (type === 'GOVERNMENT') return 'Гос. предприятие';
    return type || 'ИП (Hususy telekeçi)';
  };

  // Закрытие выпадающих списков при клике вне их области
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (bankDropdownRef.current && !bankDropdownRef.current.contains(e.target)) {
        setIsBankOpen(false);
      }
      if (regionDropdownRef.current && !regionDropdownRef.current.contains(e.target)) {
        setIsRegionOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Получение переведенного названия выбранного региона
  const getSelectedRegionLabel = () => {
    if (!formData.region) return '';
    const found = REGIONS.find(r => 
      r.id.toLowerCase() === formData.region.toLowerCase() ||
      r.id.toLowerCase().startsWith(formData.region.toLowerCase()) ||
      formData.region.toLowerCase().startsWith(r.id.toLowerCase().slice(0, 4))
    );
    if (found) {
      return t(found.key, found.defaultName);
    }
    return formData.region;
  };

  // Форматирование телефонного номера: 8 цифр -> "65 56-65-65"
  const formatPhoneString = (rawDigits) => {
    if (!rawDigits) return '';
    let res = '';
    if (rawDigits.length > 0) res += rawDigits.slice(0, 2);
    if (rawDigits.length > 2) res += ' ' + rawDigits.slice(2, 4);
    if (rawDigits.length > 4) res += '-' + rawDigits.slice(4, 6);
    if (rawDigits.length > 6) res += '-' + rawDigits.slice(6, 8);
    return res;
  };

  // Загрузка данных
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        let currentSupplier = null;
        let userEmail = '';
        let userPhone = '';

        if (effectiveIsOwner && !id) {
          // Загружаем профиль текущего пользователя
          const meRes = await API.get('/auth/me');
          userEmail = meRes.data?.email || (meRes.data?.username?.includes('@') ? meRes.data.username : '');
          userPhone = meRes.data?.phone || '';
          currentSupplier = meRes.data?.suppliers?.[0];
          
          if (currentSupplier) {
            currentSupplier.phone = userPhone || currentSupplier.phone;
            currentSupplier.email = currentSupplier.email || userEmail;
          }
        } else {
          // Загружаем профиль по id через прямой эндпоинт
          try {
            const compRes = await API.get(`/suppliers/${id}`);
            currentSupplier = compRes.data;
          } catch (fetchErr) {
            const fallbackRes = await API.get('/offers/suppliers');
            currentSupplier = fallbackRes.data.find(c => String(c.id) === String(id));
          }
        }

        setSupplier(currentSupplier);

        if (currentSupplier) {
          // Извлечение паспортных данных (если ранее были сохранены единой строкой)
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

          // Нормализация региона под официальный список
          let reg = currentSupplier.region || '';
          let addr = currentSupplier.address || '';
          if (reg) {
            const matched = REGIONS.find(r => 
              r.id.toLowerCase() === reg.toLowerCase() || 
              r.id.toLowerCase().startsWith(reg.toLowerCase()) ||
              reg.toLowerCase().startsWith(r.id.toLowerCase().slice(0, 4))
            );
            if (matched) reg = matched.id;
          } else if (addr) {
            const foundRegion = REGIONS.find(r => addr.toLowerCase().includes(r.id.toLowerCase().slice(0, 4)));
            if (foundRegion) {
              reg = foundRegion.id;
            }
          }

          // Обработка телефона
          const rawP = (currentSupplier.phone || currentSupplier.user?.phone || userPhone || '').replace(/\D/g, '');
          let pureDigits = rawP;
          if (pureDigits.startsWith('993')) {
            pureDigits = pureDigits.slice(3);
          }
          pureDigits = pureDigits.slice(0, 8);
          const formattedP = formatPhoneString(pureDigits);

          setPhoneDigits(formattedP);
          setInitialPhoneDigits(formattedP);

          const cleanName = getCleanCompanyName(currentSupplier.name);
          const initialData = {
            name: cleanName,
            type: currentSupplier.type || 'ENTREPRENEUR',
            region: reg,
            address: addr,
            bankName: currentSupplier.bankName || '',
            bankAccount: currentSupplier.bankAccount || '',
            bankMfo: currentSupplier.bankMfo || '',
            passportSeries: pSeries,
            passportIssuedBy: pIssued,
            email: currentSupplier.email || userEmail || '',
            phone: pureDigits ? `+993 ${formattedP}` : ''
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
            const statsRes = await API.get(`/offers/suppliers/${currentSupplier.id}/stats`).catch(() => ({ data: { totalOffers: 0, wonOffers: 0 } }));
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

  // Вычисление наличия изменений в форме по сравнению с сохраненными данными
  const hasChanges = Boolean(
    initialFormData && (
      formData.name !== initialFormData.name ||
      formData.type !== initialFormData.type ||
      formData.region !== initialFormData.region ||
      formData.address !== initialFormData.address ||
      formData.bankName !== initialFormData.bankName ||
      formData.bankAccount !== initialFormData.bankAccount ||
      formData.bankMfo !== initialFormData.bankMfo ||
      formData.passportSeries !== initialFormData.passportSeries ||
      formData.passportIssuedBy !== initialFormData.passportIssuedBy ||
      formData.phone !== initialFormData.phone ||
      formData.email !== initialFormData.email ||
      pendingDeleteDocIds.length > 0 ||
      documents.length !== initialDocuments.length
    )
  );

  // Очистка адреса от дублирования названия велаята / города
  const cleanAddressString = (addr, reg) => {
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

  const handleAddressBlur = () => {
    const cleaned = cleanAddressString(formData.address, formData.region);
    if (cleaned !== formData.address) {
      setFormData(prev => ({ ...prev, address: cleaned }));
    }
  };

  // Обработка ввода паспорта: серия (римские цифры + дефис + 2 буквы) + пробел + строго максимум 6 цифр
  const handlePassportChange = (e) => {
    let input = e.target.value.toUpperCase();
    setPassportError('');

    // Строго не более 6 цифр
    const digits = (input.match(/\d/g) || []).join('').slice(0, 6);
    
    // Буквенная часть серии
    let letters = input.replace(/[0-9]/g, '').trim();
    
    // Если введено слитно без дефиса, например "IAS" или "IIMR"
    letters = letters.replace(/^([I|V|X]+)[-\s]?([A-ZА-Я]{1,2})/i, '$1-$2');
    letters = letters.replace(/-+$/, '');

    if (letters.length > 7) {
      letters = letters.slice(0, 7);
    }

    let result = letters;
    if (digits.length > 0 || input.includes(' ')) {
      result = letters ? `${letters} ${digits}`.trimEnd() : digits;
      if (input.endsWith(' ') && !result.endsWith(' ')) {
        result += ' ';
      }
    }

    setFormData(prev => ({
      ...prev,
      passportSeries: result
    }));
  };

  // Управление режимом редактирования
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
    // Восстанавливаем исходный список документов (не удаленный на сервере)
    if (initialDocuments && initialDocuments.length > 0) {
      setDocuments([...initialDocuments]);
    }
    setPendingDeleteDocIds([]);
    setPassportError('');
    setIsEditing(false);
  };

  // Обработка изменения телефона
  const handlePhoneInputChange = (e) => {
    let raw = e.target.value.replace(/\D/g, '');
    if (raw.startsWith('993')) {
      raw = raw.slice(3);
    }
    raw = raw.slice(0, 8);
    const formatted = formatPhoneString(raw);
    setPhoneDigits(formatted);
    setFormData(prev => ({
      ...prev,
      phone: raw ? `+993 ${formatted}` : ''
    }));
  };

  // Обработка выбора банка
  const handleSelectBank = (bank) => {
    setFormData(prev => ({
      ...prev,
      bankName: bank.name,
      bankMfo: bank.code || prev.bankMfo
    }));
    setIsBankOpen(false);
    setBankSearch('');
  };

  // Загрузка файлов с жесткой валидацией допустимых расширений и MIME-типов
  const handleFileUpload = async (filesToUpload) => {
    if (!filesToUpload || !filesToUpload.length || !supplier?.id) return;
    setUploading(true);
    setUploadError('');

    const ALLOWED_EXTS = ['pdf', 'jpg', 'jpeg', 'png'];
    const ALLOWED_MIME = ['application/pdf', 'image/jpeg', 'image/png', 'image/pjpeg'];

    try {
      for (const file of Array.from(filesToUpload)) {
        const ext = file.name.split('.').pop()?.toLowerCase() || '';
        const mime = (file.type || '').toLowerCase();

        // Блокируем любые недопустимые форматы (.doc, .exe, скрипты и др.) на клиенте
        if (!ALLOWED_EXTS.includes(ext) || (mime && !ALLOWED_MIME.includes(mime))) {
          setUploadError(t('onlyPdfJpgAllowed', 'Разрешены только документы PDF и изображения JPG/PNG'));
          setUploading(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
          return;
        }

        const uploadData = new FormData();
        uploadData.append('file', file);
        uploadData.append('supplierId', supplier.id);
        uploadData.append('name', file.name);

        const res = await API.post('/documents/upload', uploadData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (res.data) {
          setDocuments(prev => [res.data, ...prev]);
        }
      }
    } catch (err) {
      console.error('Ошибка при загрузке документа:', err);
      const serverMsg = err.response?.data?.error || err.response?.data?.message;
      setUploadError(serverMsg || t('uploadError', 'Ошибка при загрузке файла'));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Удаление документа
  // Безопасное удаление документа (стейджинг удаления при редактировании)
  const handleDeleteDocument = (docId) => {
    setDocuments(prev => prev.filter(d => d.id !== docId));
    setPendingDeleteDocIds(prev => [...prev, docId]);
  };

  // Drag & Drop
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  // Отправка формы профиля
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!documents || documents.length === 0) {
      showAlert({
        title: t('attention', 'Внимание'),
        message: t('attachDocsToSubmit', 'Прикрепите документы для отправки на проверку'),
        type: 'warning'
      });
      return;
    }

    // Проверка формата паспорта: строго 6 цифр
    if (formData.passportSeries) {
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
      // Удаляем на сервере файлы, отложенные на удаление пользователем
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

      const cleanedAddr = cleanAddressString(formData.address, formData.region);
      const cleanedName = getCleanCompanyName(formData.name);

      const payload = {
        ...formData,
        name: cleanedName,
        address: cleanedAddr,
        passportInfo: [formData.passportSeries, formData.passportIssuedBy].filter(Boolean).join(', ')
      };
      const res = await API.put('/suppliers/profile', payload);
      setSupplier(res.data);
      const newSavedData = { 
        ...formData, 
        name: cleanedName, 
        address: cleanedAddr,
        phone: res.data?.phone || formData.phone 
      };
      setFormData(newSavedData);
      setInitialFormData(newSavedData);
      setInitialPhoneDigits(phoneDigits);
      setInitialDocuments([...documents]);
      setIsEditing(false);
      showAlert({
        title: t('success', 'Успешно'),
        message: t('profileSentSuccess', 'Профиль успешно отправлен на модерацию!'),
        type: 'success'
      });
    } catch (error) {
      console.error(error);
      showAlert({
        title: t('error', 'Ошибка'),
        message: t('profileSaveError', 'Ошибка при сохранении'),
        type: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  // Форматирование размера файла
  const formatFileSize = (bytes) => {
    if (!bytes) return 'PDF / Скан';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Иконка формата файла
  const getFileIcon = (fileName = '') => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return <FileText className="text-rose-500" size={18} />;
    if (['jpg', 'jpeg', 'png'].includes(ext)) return <ImageIcon className="text-blue-500" size={18} />;
    return <FileText className="text-indigo-500" size={18} />;
  };

  // Расчет готовности профиля
  const calculateReadiness = () => {
    const isDetailsFilled = Boolean(
      formData.name?.trim() &&
      formData.region && 
      formData.address?.trim() && 
      formData.phone?.trim() && 
      formData.email?.trim() && 
      formData.bankName?.trim() && 
      formData.bankAccount?.trim() && 
      formData.bankMfo?.trim() && 
      formData.passportSeries?.trim() && 
      formData.passportIssuedBy?.trim()
    );

    const isDocsUploaded = documents.length > 0;
    const isApproved = supplier?.verificationStatus === 'VERIFIED';
    const isPendingReview = supplier?.verificationStatus === 'PENDING_REVIEW';

    const steps = [
      {
        id: 'account',
        title: t('profileStepAccount', 'Создание учетной записи'),
        completed: true,
        weight: 25
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
        weight: 25
      },
      {
        id: 'approval',
        title: t('profileStepApproval', 'Одобрение администратором'),
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

    return { steps, percent, isApproved, isPendingReview };
  };

  const readiness = calculateReadiness();
  const hasDocuments = documents && documents.length > 0;

  const isVerified = supplier?.verificationStatus === 'VERIFIED';
  const isEditable = effectiveIsOwner && (isVerified ? isEditing : supplier?.verificationStatus !== 'PENDING_REVIEW');
  const isSubmitDisabled = !isEditable || !hasDocuments || saving;

  const bgClass = isDarkMode ? 'text-slate-100' : 'text-slate-800';
  const cardBg = isDarkMode ? 'bg-slate-900 border-slate-800 shadow-none' : 'bg-white border-slate-200/60 shadow-xl shadow-slate-200/40';
  
  // В режиме просмотра инпуты выглядят как неактивные поля (светлый/приглушенный текст, режим только для чтения)
  const inputBg = isEditable
    ? (isDarkMode 
        ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-text' 
        : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-xs cursor-text')
    : (isDarkMode 
        ? 'bg-slate-800/40 border-slate-800/60 text-slate-400 cursor-not-allowed select-text opacity-75' 
        : 'bg-slate-50 border-slate-200 text-slate-500 cursor-not-allowed select-text opacity-75');

  if (loading) {
    return (
      <div className={`p-6 flex-1 flex justify-center items-center h-full ${bgClass}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className={`p-6 flex-1 ${bgClass}`}>
        <button onClick={() => navigate(-1)} className="flex items-center text-slate-500 hover:text-blue-600 mb-6 transition-colors">
          <ArrowLeft size={16} className="mr-2" /> {t('back', 'Назад')}
        </button>
        <div className="text-center py-10 text-slate-500 text-lg">{lang === 'RU' ? 'Профиль не найден' : 'Profil tapylmady'}</div>
      </div>
    );
  }

  // Отрисовка баннера статуса верификации
  const renderStatusBanner = () => {
    if (supplier.verificationStatus === 'VERIFIED') {
      if (isBannerDismissed || !effectiveIsOwner) return null;
      return (
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-start justify-between gap-3 mb-6 animate-in fade-in duration-200">
          <div className="flex items-start space-x-3">
            <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-emerald-800">{lang === 'RU' ? 'Компания верифицирована' : 'Kompaniýa tassyklanan'}</h3>
              <p className="text-emerald-600 text-sm mt-0.5">{lang === 'RU' ? 'Доступ к торгам открыт. Вы можете подавать заявки на тендеры.' : 'Söwdalara girmäge rugsat berildi.'}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDismissBanner}
            className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-100/80 rounded-xl transition-colors cursor-pointer shrink-0"
            title={lang === 'RU' ? 'Закрыть уведомление' : 'Ýapmak'}
          >
            <X size={18} />
          </button>
        </div>
      );
    }

    if (supplier.verificationStatus === 'REJECTED') {
      return (
        <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 p-5 rounded-2xl mb-6 shadow-xs animate-in fade-in duration-200">
          <div className="flex items-start gap-3.5">
            <XCircle className="text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" size={24} />
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-rose-900 dark:text-rose-100 text-base">
                {t('rejectionBannerTitle', 'Верификация отклонена администратором')}
              </h3>
              <p className="text-rose-700 dark:text-rose-300 text-xs mt-1 leading-relaxed">
                {t('rejectionBannerDesc', 'Администратор отклонил заявку на верификацию. Пожалуйста, ознакомьтесь с замечаниями ниже, внесите исправления и отправьте профиль на повторную проверку.')}
              </p>

              {/* Блок с точной причиной отклонения */}
              <div className="mt-3 p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-rose-200 dark:border-rose-900/60 shadow-xs">
                <span className="text-[11px] font-bold text-rose-500 uppercase tracking-wider block mb-1">
                  {t('rejectionReasonLabel', 'Причина отклонения')}:
                </span>
                <p className="text-sm font-semibold text-rose-950 dark:text-rose-100 whitespace-pre-wrap">
                  {supplier.rejectionReason || (lang === 'RU' ? 'Причина не указана' : 'Sebäp görkezilmedi')}
                </p>
              </div>

              {effectiveIsOwner && !isEditing && (
                <div className="mt-4 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-rose-600/20 flex items-center gap-2 cursor-pointer active:scale-95"
                  >
                    <Edit3 size={14} />
                    <span>{t('fixAndResubmitBtn', 'Редактировать профиль и исправить замечания')}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    if (supplier.verificationStatus === 'PENDING_REVIEW') {
      if (!effectiveIsOwner) return null;
      return (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-start space-x-3 mb-6">
          <Clock className="text-amber-500 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-amber-800">{lang === 'RU' ? 'Документы на проверке' : 'Resminamalar barlanýar'}</h3>
            <p className="text-amber-600 text-sm mt-1">{lang === 'RU' ? 'Ваши документы находятся на проверке администратором. Ожидайте подтверждения.' : 'Resminamalaryňyz dolandyryjy tarapyndan barlanýar.'}</p>
          </div>
        </div>
      );
    }

    if (!effectiveIsOwner) return null;

    return (
      <div className="bg-blue-50 border border-blue-200 p-4 rounded-2xl flex items-start space-x-3 mb-6">
        <AlertCircle className="text-blue-500 shrink-0 mt-0.5" />
        <div>
          <h3 className="font-bold text-blue-800">{lang === 'RU' ? 'Требуется верификация профиля' : 'Tassyklamak talap edilýär'}</h3>
          <p className="text-blue-600 text-sm mt-1">{lang === 'RU' ? 'Пожалуйста, заполните профиль и загрузите сканы документов для участия в электронных торгах.' : 'Elektron söwdalara gatnaşmak üçin profili dolduryň.'}</p>
        </div>
      </div>
    );
  };

  // Фильтрация банков по поисковому запросу
  const filteredBanks = TURKMEN_BANKS.filter(b => 
    b.name.toLowerCase().includes(bankSearch.toLowerCase()) || 
    t(b.key, b.name).toLowerCase().includes(bankSearch.toLowerCase()) ||
    b.code.includes(bankSearch)
  );

  return (
    <div className={`max-w-5xl mx-auto space-y-6 ${bgClass}`}>
      {isAdmin && (
        <button 
          type="button" 
          onClick={() => navigate('/suppliers')} 
          className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer mb-2"
        >
          <ArrowLeft size={16} />
          <span>{lang === 'RU' ? 'Назад к списку поставщиков' : 'Üpjün edijileriň sanawyna gaýtmak'}</span>
        </button>
      )}

      {renderStatusBanner()}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Левая колонка - Профиль и форма */}
        <div className={`flex-1 min-w-0 rounded-[2rem] p-6 sm:p-8 space-y-8 ${cardBg}`}>
          {/* Шапка профиля компании: чистый бренд + аватар-монограмма */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 pb-6 border-b border-slate-100">
            <div className="h-20 w-20 bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 text-white rounded-[1.25rem] flex items-center justify-center shadow-lg shadow-blue-500/30 shrink-0 font-black text-2xl tracking-wider select-none">
              {getBrandInitials(supplier.name)}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-black tracking-tight truncate">
                {getCleanCompanyName(supplier.name)}
              </h1>
              <div className="flex flex-wrap items-center gap-2.5 mt-2">
                {/* Форма собственности */}
                <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg">
                  {getCompanyTypeBadge(supplier.type)}
                </span>
                
                {/* Защищенный STŞK с иконкой замка и тултипом */}
                <span 
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg cursor-help hover:bg-slate-200/70 transition-colors" 
                  title={t('stskLockedHint', 'STŞK зафиксирован после верификации. Изменение возможно только через техподдержку')}
                >
                  <Lock size={12} className="text-slate-400" />
                  <span>STŞK: <strong className="text-slate-900 font-bold">{supplier.taxId}</strong></span>
                </span>

                {/* 🟡 / 🟢 Бейдж статуса верификации в шапке */}
                {supplier.verificationStatus === 'VERIFIED' ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200/80 rounded-full text-xs font-bold shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    {t('statusVerifiedBadge', 'Верифицирован')}
                  </span>
                ) : supplier.verificationStatus === 'PENDING_REVIEW' ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200/80 rounded-full text-xs font-bold shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                    {t('statusInReviewBadge', 'На проверке')}
                  </span>
                ) : supplier.verificationStatus === 'REJECTED' ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-700 border border-rose-200/80 rounded-full text-xs font-bold shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                    {t('statusRejectedBadge', 'Отклонен')}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200/80 rounded-full text-xs font-bold shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                    {t('statusPendingBadge', 'Требует проверки')}
                  </span>
                )}
              </div>
            </div>
          </div>

          {(effectiveIsOwner || isAdmin) ? (
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* 0. Данные компании и форма собственности */}
              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Building2 size={18} className="text-blue-600" />
                  {t('companyLegalData', 'Данные компании и форма')}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Организационно-правовая форма */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">
                      {t('companyLegalForm', 'Организационно-правовая форма')} {isEditable && <span className="text-rose-500">*</span>}
                    </label>
                    {isEditable ? (
                      <CustomSelect
                        role={role}
                        value={formData.type}
                        onChange={(val) => setFormData(prev => ({ ...prev, type: val }))}
                        options={[
                          { id: 'ENTREPRENEUR', name: 'ИП (Hususy telekeçi)' },
                          { id: 'BUSINESS_SOCIETY', name: 'ХО (Hojalyk jemgyýeti)' },
                          { id: 'PRIVATE_ENTERPRISE', name: 'ЧП (Hususy kärhana)' },
                          { id: 'DAÝHAN_HOJALYGY', name: 'DH (Daýhan hojalygy)' },
                          { id: 'GOVERNMENT', name: 'Гос. предприятие (Döwlet kärhanasy)' }
                        ]}
                        isDarkMode={isDarkMode}
                        size="md"
                      />
                    ) : (
                      <div className={`w-full px-4 py-3 rounded-xl text-sm font-medium border ${inputBg}`}>
                        {getCompanyTypeBadge(formData.type)}
                      </div>
                    )}
                  </div>

                  {/* Наименование компании / бренда */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">
                      {t('companyBrandName', 'Наименование компании / бренда')} {isEditable && <span className="text-rose-500">*</span>}
                    </label>
                    <input
                      type="text"
                      required
                      disabled={!isEditable}
                      value={formData.name}
                      onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      onBlur={() => {
                        const cleaned = getCleanCompanyName(formData.name);
                        if (cleaned !== formData.name) {
                          setFormData(prev => ({ ...prev, name: cleaned }));
                        }
                      }}
                      placeholder={isEditable ? t('companyBrandPlaceholder', 'например, Медик-Фарм') : ''}
                      className={`w-full px-4 py-3 rounded-xl text-sm font-medium border ${inputBg}`}
                    />
                    {isEditable && (
                      <p className="text-[11px] text-slate-400 mt-1 ml-1">
                        {t('companyBrandHint', 'Указывайте только название бренда без организационной формы (ИП, ХО, ЧП)')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              {/* 1. Контактные данные */}
              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <MapPin size={18} className="text-blue-600" />
                  {t('contactInfo', 'Контактная информация')}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Кастомный красивый выпадающий список «Велаят» (без поиска) */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">
                      {t('regionLabel', 'Велаят')} {isEditable && <span className="text-rose-500">*</span>}
                    </label>

                    <div className="relative" ref={regionDropdownRef}>
                      {/* Кнопка выбора региона: стрелочка только в режиме редактирования */}
                      <button
                        type="button"
                        disabled={!isEditable}
                        onClick={() => {
                          if (!isEditable) return;
                          setIsRegionOpen(!isRegionOpen);
                          if (isBankOpen) setIsBankOpen(false);
                        }}
                        className={`w-full px-4 py-3 rounded-xl text-sm font-medium border flex items-center justify-between text-left transition-colors ${inputBg} ${
                          isEditable ? 'cursor-pointer' : 'cursor-not-allowed'
                        }`}
                      >
                        <span className={isEditable ? (formData.region ? (isDarkMode ? 'text-slate-100 font-medium' : 'text-slate-900 font-medium') : 'text-slate-400') : (isDarkMode ? 'text-slate-400' : 'text-slate-500')}>
                          {getSelectedRegionLabel() || (isEditable ? t('regionSelect', 'Выберите велаят...') : '—')}
                        </span>
                        {isEditable && (
                          <ChevronDown size={18} className={`text-slate-400 transition-transform ${isRegionOpen ? 'rotate-180' : ''}`} />
                        )}
                      </button>

                      {/* Всплывающее меню без поиска */}
                      {isEditable && isRegionOpen && (
                        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150 p-1.5 divide-y divide-slate-50">
                          {REGIONS.map(r => {
                            const isSelected = formData.region === r.id || formData.region?.toLowerCase().startsWith(r.id.toLowerCase().slice(0, 4));
                            const translatedLabel = t(r.key, r.defaultName);
                            return (
                              <button
                                key={r.id}
                                type="button"
                                onClick={() => {
                                  setFormData(prev => ({ ...prev, region: r.id }));
                                  setIsRegionOpen(false);
                                }}
                                className={`w-full text-left px-3.5 py-3 rounded-xl transition-colors flex items-center justify-between group cursor-pointer ${
                                  isSelected ? 'bg-blue-50/80 text-blue-700' : 'hover:bg-slate-50 text-slate-700'
                                }`}
                              >
                                <div>
                                  <p className={`text-xs ${isSelected ? 'font-bold text-blue-700' : 'font-semibold text-slate-800 group-hover:text-blue-700'}`}>
                                    {translatedLabel}
                                  </p>
                                  {lang === 'RU' && (
                                    <p className="text-[11px] text-slate-400 font-normal">{r.defaultName}</p>
                                  )}
                                </div>
                                {isSelected && (
                                  <Check size={16} className="text-blue-600 shrink-0 ml-2" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Текстовое поле «Точный адрес» с очисткой от повторения велаята */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">
                      {t('exactAddress', 'Точный адрес (этрап, улица, дом/офис)')} {isEditable && <span className="text-rose-500">*</span>}
                    </label>
                    <input 
                      type="text" 
                      required
                      disabled={!isEditable}
                      value={formData.address}
                      onChange={e => setFormData({ ...formData, address: e.target.value })}
                      onBlur={handleAddressBlur}
                      placeholder={isEditable ? t('exactAddressPlaceholder', 'этрап, улица, дом/офис') : ''}
                      className={`w-full px-4 py-3 rounded-xl text-sm font-medium border ${inputBg}`} 
                    />
                    {isEditable && (
                      <p className="text-[11px] text-slate-400 mt-1 ml-1">
                        {t('addressCleanHint', 'Указывайте без повторения города/велаята: этрап, улица, дом, офис')}
                      </p>
                    )}
                  </div>

                  {/* Рабочий телефон с чистым международным префиксом +993 */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">
                      {t('workPhone', 'Рабочий телефон')} {isEditable && <span className="text-rose-500">*</span>}
                    </label>
                    {isEditable ? (
                      <div className="relative flex items-center">
                        <span className="absolute left-4 font-bold select-none pointer-events-none text-sm tracking-tight text-slate-600">
                          +993
                        </span>
                        <input 
                          type="tel" 
                          required
                          value={phoneDigits}
                          onChange={handlePhoneInputChange}
                          placeholder="65 56-65-65"
                          className={`w-full pl-16 pr-4 py-3 rounded-xl text-sm font-medium border tracking-wider ${inputBg}`} 
                        />
                      </div>
                    ) : (
                      <div className={`w-full px-4 py-3 rounded-xl text-sm font-semibold border ${inputBg} flex items-center`}>
                        <span>
                          {phoneDigits 
                            ? `+993 ${phoneDigits}` 
                            : (supplier?.phone || supplier?.user?.phone || '-')}
                        </span>
                      </div>
                    )}
                    {isEditable && (
                      <p className="text-[11px] text-slate-400 mt-1 ml-1">
                        {t('phoneFormatHint', 'Формат: +993 XX XX-XX-XX')}
                      </p>
                    )}
                  </div>

                  {/* Автозаполнение Email */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">
                      {t('corpEmail', 'Корпоративный Email')} {isEditable && <span className="text-rose-500">*</span>}
                    </label>
                    <div className="relative">
                      <input 
                        type="email" 
                        required
                        disabled={!isEditable}
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        placeholder={isEditable ? "company@example.com" : ""}
                        className={`w-full px-4 py-3 rounded-xl text-sm font-medium border ${inputBg}`} 
                      />
                    </div>
                    {isEditable && (
                      <p className="text-[11px] text-slate-400 mt-1 ml-1">
                        {t('emailSyncHint', 'Автоматически синхронизирован с аккаунтом')}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* 2. Банковские реквизиты */}
              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <CreditCard size={18} className="text-blue-600" />
                  {t('bankDetails', 'Банковские реквизиты')}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Селект с поиском для банка */}
                  <div className="sm:col-span-2 relative" ref={bankDropdownRef}>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">
                      {t('bankNameLabel', 'Наименование банка')} {isEditable && <span className="text-rose-500">*</span>}
                    </label>
                    
                    {/* Кнопка выбора банка: стрелочка только в режиме редактирования */}
                    <button
                      type="button"
                      disabled={!isEditable}
                      onClick={() => {
                        if (!isEditable) return;
                        setIsBankOpen(!isBankOpen);
                        if (isRegionOpen) setIsRegionOpen(false);
                      }}
                      className={`w-full px-4 py-3 rounded-xl text-sm font-medium border flex items-center justify-between text-left transition-colors ${inputBg} ${
                        isEditable ? 'cursor-pointer' : 'cursor-not-allowed'
                      }`}
                    >
                      <span className={isEditable ? (formData.bankName ? (isDarkMode ? 'text-slate-100 font-medium' : 'text-slate-900 font-medium') : 'text-slate-400') : (isDarkMode ? 'text-slate-400' : 'text-slate-500')}>
                        {formData.bankName || (isEditable ? t('bankSelectPlaceholder', 'Выберите банк из списка...') : '—')}
                      </span>
                      {isEditable && (
                        <ChevronDown size={18} className={`text-slate-400 transition-transform ${isBankOpen ? 'rotate-180' : ''}`} />
                      )}
                    </button>

                    {/* Всплывающее меню с поиском */}
                    {isEditable && isBankOpen && (
                      <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                        <div className="p-3 border-b border-slate-100 bg-slate-50/50">
                          <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                              type="text"
                              value={bankSearch}
                              onChange={e => setBankSearch(e.target.value)}
                              placeholder={t('bankSearchPlaceholder', 'Поиск банка (название или МФО)...')}
                              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                              autoFocus
                            />
                          </div>
                        </div>
                        
                        <div className="max-h-60 overflow-y-auto divide-y divide-slate-50 p-1">
                          {filteredBanks.length > 0 ? (
                            filteredBanks.map(bank => (
                              <button
                                key={bank.id}
                                type="button"
                                onClick={() => handleSelectBank(bank)}
                                className="w-full text-left px-3.5 py-2.5 rounded-xl hover:bg-blue-50/80 transition-colors flex items-center justify-between group cursor-pointer"
                              >
                                <div>
                                  <p className="text-xs font-bold text-slate-800 group-hover:text-blue-700">{bank.name}</p>
                                  <p className="text-[11px] text-slate-400">МФО: {bank.code}</p>
                                </div>
                                {formData.bankName === bank.name && (
                                  <Check size={16} className="text-blue-600" />
                                )}
                              </button>
                            ))
                          ) : (
                            <div className="p-4 text-center text-xs text-slate-400">
                              {t('bankNotFound', 'Банк не найден в стандартном списке')}
                              {bankSearch && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFormData(prev => ({ ...prev, bankName: bankSearch }));
                                    setIsBankOpen(false);
                                  }}
                                  className="mt-2 block w-full py-1.5 px-3 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 rounded-lg font-bold text-xs"
                                >
                                  {t('useCustomBank', 'Использовать')}: "{bankSearch}"
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Расчетный счет */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">
                      {t('bankAccountLabel', 'Расчетный счет (Hasap belgisi)')} {isEditable && <span className="text-rose-500">*</span>}
                    </label>
                    <input 
                      type="text" 
                      required
                      disabled={!isEditable}
                      maxLength={28}
                      value={formData.bankAccount}
                      onChange={e => setFormData({ ...formData, bankAccount: e.target.value.replace(/\s/g, '') })}
                      placeholder={isEditable ? "xxxxxxxxxxxxxxxxxxxxxxxxxxxx" : ""}
                      className={`w-full px-4 py-3 rounded-xl text-sm font-medium tracking-wider border ${inputBg}`} 
                    />
                    {isEditable && (
                      <p className="text-[11px] text-slate-400 mt-1 ml-1">{t('bankAccountHint', '28 символов (стандарт ЦБ Туркменистана)')}</p>
                    )}
                  </div>

                  {/* МФО банка */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">
                      {t('bankMfoLabel', 'МФО банка (MFO kody)')} {isEditable && <span className="text-rose-500">*</span>}
                    </label>
                    <input 
                      type="text" 
                      required
                      disabled={!isEditable}
                      maxLength={9}
                      value={formData.bankMfo}
                      onChange={e => setFormData({ ...formData, bankMfo: e.target.value })}
                      placeholder={isEditable ? "xxxxxxxxx" : ""}
                      className={`w-full px-4 py-3 rounded-xl text-sm font-medium border ${inputBg}`} 
                    />
                    {isEditable && (
                      <p className="text-[11px] text-slate-400 mt-1 ml-1">
                        {t('bankMfoAutoHint', 'Подставляется автоматически при выборе банка (9 цифр)')}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* 3. Данные руководителя (разделено на два аккуратных поля с маской) */}
              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <User size={18} className="text-blue-600" />
                  {t('directorData', 'Данные руководителя')}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">
                      {t('passportSeriesLabel', 'Серия и номер паспорта')} {isEditable && <span className="text-rose-500">*</span>}
                    </label>
                    <input 
                      type="text" 
                      required
                      disabled={!isEditable}
                      value={formData.passportSeries}
                      onChange={handlePassportChange}
                      placeholder={isEditable ? "I-AS 123456" : ""}
                      className={`w-full px-4 py-3 rounded-xl text-sm font-medium border ${inputBg}`} 
                    />
                    {isEditable && (
                      passportError ? (
                        <p className="text-[11px] text-rose-500 font-semibold mt-1 ml-1">{passportError}</p>
                      ) : (
                        <p className="text-[11px] text-slate-400 mt-1 ml-1">{t('passportFormatHint', 'Пример: I-AS 123456 (серия и 6 цифр)')}</p>
                      )
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">
                      {t('passportIssuedLabel', 'Кем и когда выдан')} {isEditable && <span className="text-rose-500">*</span>}
                    </label>
                    <input 
                      type="text" 
                      required
                      disabled={!isEditable}
                      value={formData.passportIssuedBy}
                      onChange={e => setFormData({ ...formData, passportIssuedBy: e.target.value })}
                      placeholder={isEditable ? (lang === 'RU' ? 'Ашхабадским ГОВД, 15.05.2018' : 'Aşgabat ş. IIB, 15.05.2018') : ''}
                      className={`w-full px-4 py-3 rounded-xl text-sm font-medium border ${inputBg}`} 
                    />
                  </div>
                </div>
              </div>

              {/* 4. Загрузка документов с отображением списка и строгим фильтром */}
              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <FileCheck size={18} className="text-blue-600" />
                  {t('companyDocsTitle', 'Документы компании (PDF / JPG)')}
                </h3>
                
                {/* Скрытый input с жестким accept: проводник ОС отфильтровывает все недопустимые файлы */}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                  onChange={e => handleFileUpload(e.target.files)}
                  className="hidden"
                  disabled={!isEditable || uploading}
                />

                {/* 1. Список загруженных документов с бейджами проверки */}
                {documents.length > 0 && (
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between ml-1">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        {t('uploadedDocsCount', 'Загруженные файлы')} ({documents.length})
                      </p>
                      {isVerified && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 border border-emerald-200/80 text-emerald-700 rounded-lg text-[11px] font-bold">
                          <CheckCircle2 size={12} className="text-emerald-500" />
                          {t('docVerifiedBadge', 'Проверено администратором ✔️')}
                        </span>
                      )}
                    </div>

                    <div className="space-y-2">
                      {documents.map(doc => (
                        <div 
                          key={doc.id} 
                          className="flex items-center justify-between p-3.5 bg-slate-50/80 border border-slate-200 rounded-xl hover:bg-slate-100/60 transition-colors"
                        >
                          <div className="flex items-center space-x-3 overflow-hidden min-w-0 flex-1">
                            <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-xs shrink-0">
                              {getFileIcon(doc.fileName || doc.name)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-slate-800 truncate">{doc.name || doc.fileName}</p>
                              <p className="text-[11px] text-slate-400">
                                {formatFileSize(doc.fileSize)} {doc.createdAt ? `• ${new Date(doc.createdAt).toLocaleDateString()}` : ''}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {/* Ссылка на открытие / скачивание документа */}
                            <a
                              href={`http://localhost:5000/${(doc.filePath || `uploads/${doc.fileName || doc.name}`).replace(/\\/g, '/')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 px-2.5 text-blue-600 hover:text-blue-700 bg-blue-50/80 hover:bg-blue-100/80 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                              title={t('downloadDocTooltip', 'Скачать / открыть документ')}
                            >
                              <ExternalLink size={14} />
                              <span className="hidden sm:inline">{lang === 'RU' ? 'Открыть' : 'Açmak'}</span>
                            </a>

                            {isEditable && (
                              <button 
                                type="button" 
                                onClick={() => handleDeleteDocument(doc.id)} 
                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors shrink-0 cursor-pointer"
                                title={t('deleteDocumentTooltip', 'Удалить документ')}
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. Зона добавления файлов: компактная под документами или полноразмерная если пусто */}
                {isEditable ? (
                  hasDocuments ? (
                    /* Компактная плашка добавления файлов снизу списка */
                    <div 
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`p-3.5 border-2 border-dashed rounded-2xl flex items-center justify-between gap-3 cursor-pointer transition-all ${
                        isDragging 
                          ? 'border-blue-500 bg-blue-50/70' 
                          : 'border-slate-200 bg-slate-50/50 hover:bg-blue-50/40 hover:border-blue-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                          {uploading ? (
                            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <UploadCloud size={18} />
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-700">
                            {uploading ? t('uploadingDocs', 'Загрузка документов...') : t('addMoreDocsBtn', '+ Прикрепить дополнительный документ')}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {lang === 'RU' ? 'PDF, JPG, PNG до 15 МБ (перетащите или нажмите)' : 'PDF, JPG, PNG 15 MB çenli'}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={uploading}
                        className="px-4 py-2 bg-white border border-slate-200 shadow-xs rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all shrink-0 cursor-pointer"
                      >
                        {t('chooseFilesBtn', 'Выбрать файл')}
                      </button>
                    </div>
                  ) : (
                    /* Полноразмерная дропзона, когда нет ни одного загруженного документа */
                    <div 
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
                        isDragging 
                          ? 'border-blue-500 bg-blue-50/70 scale-[1.01]' 
                          : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'
                      }`}
                    >
                      <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center mx-auto mb-3 text-blue-600">
                        {uploading ? (
                          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <UploadCloud size={24} />
                        )}
                      </div>
                      
                      <p className="text-sm font-bold text-slate-700 mb-1">
                        {uploading 
                          ? t('uploadingDocs', 'Загрузка документов...') 
                          : t('companyDocsDesc', 'Свидетельство, Выписка ЕГРЮЛ, Патент, Устав')}
                      </p>
                      <p className="text-xs text-slate-400 mb-4">
                        {t('companyDocsDropHint', 'Перетащите файлы сюда или выберите на компьютере')}
                      </p>

                      <button 
                        type="button" 
                        disabled={!isEditable || uploading} 
                        onClick={() => fileInputRef.current?.click()}
                        className="px-5 py-2.5 bg-white border border-slate-200 shadow-sm rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                      >
                        {t('chooseFilesBtn', 'Выбрать файлы')}
                      </button>

                      {uploadError && (
                        <p className="text-xs text-rose-500 font-medium mt-3">{uploadError}</p>
                      )}
                    </div>
                  )
                ) : (
                  !hasDocuments && (
                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-center text-xs text-slate-400">
                      {t('noDocsUploaded', 'Документы не прикреплены')}
                    </div>
                  )
                )}
              </div>

              {/* 5. Кнопки действий: Режим просмотра vs Режим редактирования */}
              {isOwner && (
                <div className="pt-6 border-t border-slate-100">
                  {isVerified ? (
                    !isEditing ? (
                      /* ВЕРИФИЦИРОВАН: Режим просмотра */
                      <div className="flex flex-col sm:flex-row items-center gap-3">
                        <button
                          type="button"
                          onClick={handleStartEdit}
                          className={`w-full sm:flex-1 py-3.5 px-6 border font-bold rounded-2xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer text-sm active:scale-[0.99] ${
                            isDarkMode 
                              ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200' 
                              : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700'
                          }`}
                        >
                          <Edit3 size={18} />
                          <span>{t('editProfileBtn', 'Редактировать профиль')}</span>
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => setShowCompanyCard(true)}
                          className="w-full sm:flex-1 py-3.5 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 cursor-pointer text-sm active:scale-[0.99]"
                        >
                          <FileText size={18} />
                          <span>{t('downloadCompanyCard', 'Скачать карточку предприятия (PDF)')}</span>
                        </button>
                      </div>
                    ) : (
                      /* ВЕРИФИЦИРОВАН: Режим редактирования */
                      <div className="space-y-4">
                        {hasChanges && (
                          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-xs text-amber-800 animate-in fade-in">
                            <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-bold">{t('resubmitWarningTitle', 'Повторная модерация')}</p>
                              <p className="mt-0.5 leading-relaxed">
                                {t('resubmitWarning', 'При изменении юридических или банковских реквизитов статус верификации будет временно приостановлен до проверки администратором.')}
                              </p>
                            </div>
                          </div>
                        )}

                        <div className="flex flex-col sm:flex-row items-center gap-3">
                          <button
                            type="button"
                            onClick={handleCancelEdit}
                            disabled={saving}
                            className="w-full sm:w-auto px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition-all text-sm cursor-pointer"
                          >
                            {t('cancelEditBtn', 'Отмена')}
                          </button>

                          {hasChanges ? (
                            <button
                              type="submit"
                              disabled={saving || !hasDocuments}
                              className="w-full sm:flex-1 py-4 px-6 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-amber-600/20 flex items-center justify-center gap-2 cursor-pointer text-sm active:scale-[0.99]"
                            >
                              {saving ? (
                                <>
                                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                  <span>{t('submitting', 'Отправка...')}</span>
                                </>
                              ) : (
                                <span>{t('resubmitBtn', 'Сохранить и отправить на повторную проверку')}</span>
                              )}
                            </button>
                          ) : (
                            <div className="text-xs text-slate-400 italic px-2">
                              {lang === 'RU' ? 'Измените поля, чтобы отправить на повторную проверку' : 'Gaýtadan barlaga ibermek üçin maglumatlary üýtgediň'}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  ) : (
                    /* НЕ ВЕРИФИЦИРОВАН: Стандартная кнопка отправки на модерацию */
                    <div className="space-y-3">
                      {!hasDocuments && (
                        <div className="flex items-center gap-2.5 p-3.5 bg-amber-50 border border-amber-200/80 rounded-xl text-xs font-semibold text-amber-800 animate-in fade-in">
                          <AlertCircle size={16} className="text-amber-600 shrink-0" />
                          <span>{t('attachDocsToSubmit', 'Прикрепите документы для отправки на проверку')}</span>
                        </div>
                      )}

                      <button 
                        type="submit" 
                        disabled={isSubmitDisabled} 
                        title={!hasDocuments ? t('attachDocsToSubmit', 'Прикрепите документы для отправки на проверку') : ''}
                        className={`w-full py-4 rounded-2xl font-bold transition-all flex items-center justify-center space-x-2 text-base ${
                          isSubmitDisabled
                            ? 'bg-slate-300 text-slate-500 cursor-not-allowed opacity-50 shadow-none'
                            : 'bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white shadow-lg shadow-blue-500/25 cursor-pointer'
                        }`}
                      >
                        {saving ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>{t('submitting', 'Отправка...')}</span>
                          </>
                        ) : (
                          <span>{t('submitToModeration', 'Отправить профиль на модерацию')}</span>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Панель модерации для администратора */}
              {isAdmin && (
                supplier.verificationStatus !== 'VERIFIED' ? (
                  <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                    <div className="p-5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <Shield className="text-blue-600" size={16} />
                          {t('adminReviewDossier', 'Анкета поставщика')}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {t('adminReviewDossierSubtitle', 'Проверка данных и прикрепленных документов компании')}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 w-full sm:w-auto">
                        <button
                          type="button"
                          onClick={() => setIsRejectModalOpen(true)}
                          disabled={isModerating}
                          className="flex-1 sm:flex-initial px-5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 dark:bg-rose-950/30 dark:border-rose-900/40 dark:text-rose-400 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                        >
                          <XCircle size={16} />
                          <span>{t('rejectSupplier', 'Отклонить заявку')}</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleAdminApprove}
                          disabled={isModerating}
                          className="flex-1 sm:flex-initial px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                        >
                          <CheckCircle2 size={16} />
                          <span>{t('approveSupplier', 'Одобрить верификацию')}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                    <div className="p-5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                          <CheckCircle2 size={20} />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-100">
                            {t('verifiedDossierStatus', '🟢 Профиль поставщика верифицирован')}
                          </h4>
                          <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">
                            {lang === 'RU' ? 'Компания имеет полный доступ к участию в электронных торгах.' : 'Kompaniýanyň elektron söwdalara gatnaşmaga doly hukugy bar.'}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => navigate('/suppliers', { state: { activeTab: 'pending' } })}
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <ArrowLeft size={16} />
                        <span>{t('backToModerationList', 'Вернуться к заявкам')}</span>
                      </button>
                    </div>
                  </div>
                )
              )}
            </form>
          ) : (
            // РЕЖИМ ПРОСМОТРА ДЛЯ ДРУГИХ ПОЛЬЗОВАТЕЛЕЙ
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-4 text-sm">
                <div className="flex items-start gap-3">
                  <MapPin size={18} className="text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-slate-500 font-medium">{t('address', 'Адрес')}</p>
                    <p className="font-semibold">{getSelectedRegionLabel() ? `${getSelectedRegionLabel()}, ` : (supplier.region ? `${supplier.region}, ` : '')}{supplier.address || '-'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone size={18} className="text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-slate-500 font-medium">{t('phone', 'Телефон')}</p>
                    <p className="font-semibold">{supplier.phone || '-'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail size={18} className="text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-slate-500 font-medium">Email</p>
                    <p className="font-semibold">{supplier.email || '-'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CreditCard size={18} className="text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-slate-500 font-medium">{t('bankNameLabel', 'Банк')}</p>
                    <p className="font-semibold">{supplier.bankName || '-'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Правая колонка: Всегда липкая (sticky top-6 self-start) плашка готовности профиля */}
        <div className="w-full lg:w-80 shrink-0">
          <div className="sticky top-6 self-start space-y-6">
            {isAdmin ? (
              /* ВИДЖЕТ МОДЕРАТОРА ДЛЯ АДМИНИСТРАТОРА */
              <div className={`rounded-[2rem] p-6 space-y-5 ${cardBg} border`}>
                <div className="flex items-center space-x-2.5 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-white text-sm leading-tight">
                      {t('adminReviewDossier', 'Анкета поставщика')}
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {lang === 'RU' ? 'Проверка профиля' : 'Profili barlamak'}
                    </p>
                  </div>
                </div>

                {/* Текущий статус */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    {lang === 'RU' ? 'Текущий статус' : 'Häzirki statusy'}
                  </span>
                  <div className="flex items-center gap-2">
                    {supplier.verificationStatus === 'VERIFIED' ? (
                      <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        {t('statusVerifiedBadge', 'Верифицирован')}
                      </span>
                    ) : supplier.verificationStatus === 'PENDING_REVIEW' ? (
                      <span className="text-xs font-bold text-amber-600 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                        {t('statusInReviewBadge', 'На проверке')}
                      </span>
                    ) : supplier.verificationStatus === 'REJECTED' ? (
                      <span className="text-xs font-bold text-rose-600 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                        {t('statusRejectedBadge', 'Отклонен')}
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-amber-600 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                        {t('statusPendingBadge', 'Требует проверки')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Сводка реквизитов */}
                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400">{t('companyLegalForm', 'Форма')}:</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">{getCompanyTypeBadge(supplier.type)}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400">STŞK:</span>
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{supplier.taxId || '-'}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400">{t('uploadedDocsCount', 'Документы')}:</span>
                    <span className="font-bold text-blue-600">{documents.length} {lang === 'RU' ? 'прикреплено' : 'sany'}</span>
                  </div>
                </div>

                {/* Если отклонен - показываем причину в сайдбаре */}
                {supplier.verificationStatus === 'REJECTED' && supplier.rejectionReason && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 rounded-xl">
                    <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider block mb-1">
                      {t('rejectionReasonLabel', 'Причина отклонения')}:
                    </span>
                    <p className="text-xs text-rose-800 dark:text-rose-200 font-medium">
                      {supplier.rejectionReason}
                    </p>
                  </div>
                )}

                {/* Кнопки действий администратора */}
                {supplier.verificationStatus !== 'VERIFIED' ? (
                  <div className="space-y-2 pt-2">
                    <button
                      type="button"
                      onClick={handleAdminApprove}
                      disabled={isModerating}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                    >
                      <CheckCircle2 size={16} />
                      <span>{t('approveSupplier', 'Одобрить верификацию')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsRejectModalOpen(true)}
                      disabled={isModerating}
                      className="w-full py-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 dark:bg-rose-950/30 dark:border-rose-900/40 dark:text-rose-400 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                    >
                      <XCircle size={16} />
                      <span>{t('rejectSupplier', 'Отклонить заявку')}</span>
                    </button>
                  </div>
                ) : (
                  <div className="pt-2">
                    <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-xl text-center space-y-2">
                      <p className="text-xs font-bold text-emerald-800 dark:text-emerald-200">
                        {t('profileVerified100', '🟢 Профиль активен на 100%')}
                      </p>
                      <p className="text-[11px] text-emerald-600 dark:text-emerald-400">
                        {lang === 'RU' ? 'Верификация подтверждена' : 'Barlag tassyklandy'}
                      </p>
                      <button
                        type="button"
                        onClick={() => navigate('/suppliers', { state: { activeTab: 'pending' } })}
                        className="w-full mt-1.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <ArrowLeft size={14} />
                        <span>{t('backToModerationList', 'К заявкам')}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Для невалидированного поставщика показываем виджет готовности профиля */
              supplier.verificationStatus !== 'VERIFIED' ? (
                <div className={`rounded-[2rem] p-6 space-y-6 ${cardBg} border`}>
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                        <ShieldCheck size={20} />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 text-sm leading-tight">
                          {t('profileReadiness', 'Готовность профиля')}
                        </h3>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {t('profileReadinessSub', 'Для доступа к торгам')}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
                      {readiness.percent}%
                    </span>
                  </div>

                  {/* Прогресс-бар */}
                  <div className="space-y-1.5">
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full rounded-full transition-all duration-500" 
                        style={{ width: `${readiness.percent}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-[11px] text-slate-400 font-medium">
                      <span>{t('profileProgress', 'Прогресс')}</span>
                      <span>{readiness.percent}%</span>
                    </div>
                  </div>

                  {/* Чек-лист шагов */}
                  <div className="space-y-3.5 pt-1">
                    {readiness.steps.map((step) => (
                      <div key={step.id} className="flex items-start space-x-3">
                        {step.completed ? (
                          <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                            <Check size={12} strokeWidth={3} />
                          </div>
                        ) : step.pending ? (
                          <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 mt-0.5 animate-pulse shadow-xs">
                            <Clock size={12} strokeWidth={2.5} />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-slate-300 flex items-center justify-center shrink-0 mt-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                          </div>
                        )}
                        <div className="text-xs leading-snug">
                          <p className={`font-semibold ${step.completed ? 'text-slate-800' : 'text-slate-500'}`}>
                            {step.title}
                          </p>
                          {step.pending && (
                            <span className="text-[10px] text-amber-600 font-medium">
                              {t('profileStepWaiting', 'Ожидает решения модератора')}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Подсказка */}
                  <div className="p-3.5 bg-blue-50/70 border border-blue-100 rounded-xl text-xs text-blue-700 leading-relaxed">
                    {t('profileFillTip', 'Заполните все разделы формы, прикрепите сканы документов и отправьте профиль на проверку.')}
                  </div>
                </div>
              ) : (
                // Для подтвержденного пользователя возвращаем карточки статистики
                <div className="space-y-4">
                <div className={`rounded-[2rem] p-6 flex flex-col items-center justify-center text-center space-y-3 ${cardBg}`}>
                  <div className="p-4 bg-blue-50 text-blue-600 rounded-full">
                    <FileText size={32} />
                  </div>
                  <div>
                    <p className="text-4xl font-black text-slate-800 dark:text-white">{stats.totalOffers}</p>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">
                      {lang === 'RU' ? 'Всего заявок' : 'Jemi teklipler'}
                    </p>
                  </div>
                </div>

                <div className={`rounded-[2rem] p-6 flex flex-col items-center justify-center text-center space-y-3 ${cardBg}`}>
                  <div className="p-4 bg-amber-50 text-amber-600 rounded-full">
                    <Trophy size={32} />
                  </div>
                  <div>
                    <p className="text-4xl font-black text-slate-800 dark:text-white">{stats.wonOffers}</p>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">
                      {lang === 'RU' ? 'Побед в тендерах' : 'Ýeňilen tenderler'}
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center">
                  <p className="text-xs font-bold text-emerald-800">
                    {t('profileVerified100', '🟢 Профиль активен на 100%')}
                  </p>
                  <p className="text-[11px] text-emerald-600 mt-0.5">
                    {t('profileVerified100Sub', 'Вы можете подавать ценовые предложения')}
                  </p>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>

      {/* Модальное окно "Карточка предприятия (PDF / Печать)" */}
      {showCompanyCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm print:p-0 print:bg-white print:static print:inset-auto">
          <style>{`
            @media print {
              body * {
                visibility: hidden !important;
              }
              #company-card-printable, #company-card-printable * {
                visibility: visible !important;
              }
              #company-card-printable {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                padding: 1.5rem !important;
                margin: 0 !important;
                border: none !important;
              }
            }
          `}</style>
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden print:shadow-none print:max-w-none print:max-h-none print:w-full print:rounded-none">
            
            {/* Панель управления печатью (скрыта при печати) */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 print:hidden">
              <div className="flex items-center gap-2">
                <FileText className="text-blue-600" size={20} />
                <h3 className="font-bold text-slate-800 text-sm">
                  {t('companyCardOfficial', 'ОФИЦИАЛЬНАЯ КАРТОЧКА ПРЕДПРИЯТИЯ')}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm shadow-blue-500/20 active:scale-95"
                >
                  <Printer size={15} />
                  <span>{t('printCompanyCard', 'Печать / Сохранить в PDF')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowCompanyCard(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Карточка предприятия */}
            <div id="company-card-printable" className="p-8 overflow-y-auto space-y-6 text-slate-800 print:overflow-visible print:p-6 bg-white">
              
              {/* Фирменная шапка с гербом / заголовком */}
              <div className="border-b-2 border-slate-900 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                    TÜRKMENISTANYŇ DÖWLET SAGLYK GORAÝYŞ SANLY TENDER MEÝDANÇASY
                  </p>
                  <h2 className="text-2xl font-black text-slate-900 mt-1">
                    {getFullFormalCompanyName(supplier.name, supplier.type)}
                  </h2>
                  <p className="text-xs text-slate-600 font-medium mt-0.5">
                    {getCompanyTypeBadge(supplier.type)}
                  </p>
                </div>
                <div className="text-left sm:text-right shrink-0">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-full text-xs font-black">
                    <CheckCircle2 size={14} className="text-emerald-600" />
                    {t('verifiedStateBadge', 'Верифицированный участник электронных торгов')}
                  </span>
                  <p className="text-[11px] text-slate-400 mt-1 font-mono">
                    {lang === 'RU' ? 'Дата выгрузки' : 'Döredilen senesi'}: {new Date().toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Сетка основных реквизитов */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                
                {/* Блок адреса и контактов */}
                <div className="p-4 bg-slate-50 rounded-2xl space-y-2.5 border border-slate-200/80">
                  <p className="font-black text-slate-400 uppercase tracking-wider text-[10px]">
                    {t('contactInfo', 'Адрес и контакты')}
                  </p>
                  <div>
                    <p className="text-slate-500">{t('regionLabel', 'Велаят / Регион')}:</p>
                    <p className="font-bold text-slate-800">{getSelectedRegionLabel() || supplier.region || '-'}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">{t('exactAddress', 'Точный адрес')}:</p>
                    <p className="font-bold text-slate-800">{formData.address || '-'}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">{t('workPhone', 'Телефон')}:</p>
                    <p className="font-bold text-slate-800">{formData.phone || '-'}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Email:</p>
                    <p className="font-bold text-slate-800">{formData.email || '-'}</p>
                  </div>
                </div>

                {/* Блок банковских реквизитов */}
                <div className="p-4 bg-slate-50 rounded-2xl space-y-2.5 border border-slate-200/80">
                  <p className="font-black text-slate-400 uppercase tracking-wider text-[10px]">
                    {t('bankDetails', 'Банковские реквизиты')}
                  </p>
                  <div>
                    <p className="text-slate-500">STŞK / Салык коду:</p>
                    <p className="font-bold text-slate-900 text-sm tracking-wide">{supplier.taxId}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">{t('bankNameLabel', 'Банк')}:</p>
                    <p className="font-bold text-slate-800">{formData.bankName || '-'}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">{t('bankAccountLabel', 'Расчетный счет')}:</p>
                    <p className="font-bold text-slate-800 tracking-wider font-mono">{formData.bankAccount || '-'}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">{t('bankMfoLabel', 'МФО банка')}:</p>
                    <p className="font-bold text-slate-800">{formData.bankMfo || '-'}</p>
                  </div>
                </div>

              </div>

              {/* Данные руководителя */}
              <div className="p-4 bg-slate-50 rounded-2xl space-y-2 border border-slate-200/80 text-xs">
                <p className="font-black text-slate-400 uppercase tracking-wider text-[10px]">
                  {t('directorData', 'Данные руководителя')}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-slate-500">{t('passportSeriesLabel', 'Серия и номер паспорта')}:</p>
                    <p className="font-bold text-slate-800 text-sm tracking-wider font-mono">{formData.passportSeries || '-'}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">{t('passportIssuedLabel', 'Кем и когда выдан')}:</p>
                    <p className="font-bold text-slate-800">{formData.passportIssuedBy || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Проверенные документы */}
              {documents.length > 0 && (
                <div className="text-xs space-y-2">
                  <p className="font-black text-slate-400 uppercase tracking-wider text-[10px]">
                    {t('uploadedDocsCount', 'Проверенные регистрационные документы')} ({documents.length})
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {documents.map(doc => (
                      <div key={doc.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                        <span className="font-medium text-slate-700 truncate">{doc.name || doc.fileName}</span>
                        <span className="text-[10px] font-bold text-emerald-600 shrink-0 ml-2">✓ {t('statusVerifiedBadge', 'Проверено')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Официальный подвал с электронной подписью системы */}
              <div className="pt-5 border-t-2 border-slate-200 flex flex-col sm:flex-row items-center justify-between text-[10px] text-slate-400 gap-2">
                <p>
                  {lang === 'RU' 
                    ? 'Электронная торговая площадка Министерства здравоохранения Туркменистана • Сформировано автоматически' 
                    : 'Türkmenistanyň Saglygy goraýyş ministrliginiň elektron söwda meýdançasy • Awtomatiki döredildi'}
                </p>
                <p className="font-mono">ID: {supplier.id} • STŞK: {supplier.taxId}</p>
              </div>

            </div>

          </div>
        </div>
      )}
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

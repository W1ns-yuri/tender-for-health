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
  Search
} from 'lucide-react';
import API from '../services/api';
import { getTranslation } from '../utils/translations';
import { getRoleTheme } from '../utils/themeUtils';

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

        if (isOwner && !id) {
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
          // Загружаем публичный профиль по id
          const compRes = await API.get('/offers/suppliers');
          currentSupplier = compRes.data.find(c => String(c.id) === String(id));
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
          const rawP = (currentSupplier.phone || userPhone || '').replace(/\D/g, '');
          let pureDigits = rawP;
          if (pureDigits.startsWith('993')) {
            pureDigits = pureDigits.slice(3);
          }
          pureDigits = pureDigits.slice(0, 8);
          const formattedP = formatPhoneString(pureDigits);

          setPhoneDigits(formattedP);

          setFormData({
            region: reg,
            address: addr,
            bankName: currentSupplier.bankName || '',
            bankAccount: currentSupplier.bankAccount || '',
            bankMfo: currentSupplier.bankMfo || '',
            passportSeries: pSeries,
            passportIssuedBy: pIssued,
            email: currentSupplier.email || userEmail || '',
            phone: pureDigits ? `+993 ${formattedP}` : ''
          });

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
            setDocuments(docsRes.data || []);
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
      bankMfo: prev.bankMfo || bank.code
    }));
    setIsBankOpen(false);
    setBankSearch('');
  };

  // Загрузка файлов
  const handleFileUpload = async (filesToUpload) => {
    if (!filesToUpload || !filesToUpload.length || !supplier?.id) return;
    setUploading(true);
    setUploadError('');

    try {
      for (const file of Array.from(filesToUpload)) {
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
      setUploadError(t('uploadError', 'Ошибка при загрузке файла'));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Удаление документа
  const handleDeleteDocument = async (docId) => {
    try {
      await API.delete(`/documents/${docId}`);
      setDocuments(prev => prev.filter(d => d.id !== docId));
    } catch (err) {
      console.error('Ошибка при удалении документа:', err);
      setDocuments(prev => prev.filter(d => d.id !== docId));
    }
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
      alert(t('attachDocsToSubmit', 'Прикрепите документы для отправки на проверку'));
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...formData,
        passportInfo: [formData.passportSeries, formData.passportIssuedBy].filter(Boolean).join(', ')
      };
      const res = await API.put('/suppliers/profile', payload);
      setSupplier(res.data);
      alert(t('profileSentSuccess', 'Профиль успешно отправлен на модерацию!'));
    } catch (error) {
      console.error(error);
      alert(t('profileSaveError', 'Ошибка при сохранении'));
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

  const bgClass = isDarkMode ? 'text-slate-100' : 'text-slate-800';
  const cardBg = isDarkMode ? 'bg-slate-900 border-slate-800 shadow-none' : 'bg-white border-slate-200/60 shadow-xl shadow-slate-200/40';
  const inputBg = isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500' : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400';

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
    if (!isOwner) return null;

    if (supplier.verificationStatus === 'VERIFIED') {
      return (
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-start space-x-3 mb-6">
          <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-emerald-800">{lang === 'RU' ? 'Компания верифицирована' : 'Kompaniýa tassyklanan'}</h3>
            <p className="text-emerald-600 text-sm mt-1">{lang === 'RU' ? 'Доступ к торгам открыт. Вы можете подавать заявки на тендеры.' : 'Söwdalara girmäge rugsat berildi.'}</p>
          </div>
        </div>
      );
    }

    if (supplier.verificationStatus === 'REJECTED') {
      return (
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl flex items-start space-x-3 mb-6">
          <AlertCircle className="text-rose-500 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-rose-800">{lang === 'RU' ? 'Заявка отклонена' : 'Arza ret edildi'}</h3>
            <p className="text-rose-600 text-sm mt-1">{supplier.rejectionReason || (lang === 'RU' ? 'Исправьте данные в профиле и отправьте снова.' : 'Maglumatlary düzedip, täzeden iberiň.')}</p>
          </div>
        </div>
      );
    }

    if (supplier.verificationStatus === 'PENDING_REVIEW') {
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

  const isEditable = isOwner && supplier.verificationStatus !== 'PENDING_REVIEW';
  const isSubmitDisabled = !isEditable || !hasDocuments || saving;

  // Фильтрация банков по поисковому запросу
  const filteredBanks = TURKMEN_BANKS.filter(b => 
    b.name.toLowerCase().includes(bankSearch.toLowerCase()) || 
    t(b.key, b.name).toLowerCase().includes(bankSearch.toLowerCase()) ||
    b.code.includes(bankSearch)
  );

  return (
    <div className={`max-w-5xl mx-auto space-y-6 ${bgClass}`}>
      {renderStatusBanner()}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Левая колонка - Профиль и форма */}
        <div className={`flex-1 min-w-0 rounded-[2rem] p-6 sm:p-8 space-y-8 ${cardBg}`}>
          {/* Шапка профиля компании */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 pb-6 border-b border-slate-100">
            <div className="h-20 w-20 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-[1.25rem] flex items-center justify-center shadow-lg shadow-blue-500/30 shrink-0">
              <Building2 size={36} />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-black tracking-tight truncate">{supplier.name}</h1>
              <div className="flex flex-wrap items-center gap-2.5 mt-2">
                <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-md">
                  {supplier.type === 'ENTREPRENEUR' ? 'ИП (Hususy telekeçi)' : 
                   supplier.type === 'BUSINESS_SOCIETY' ? 'ХО (Hojalyk jemgyýeti)' : 
                   supplier.type === 'PRIVATE_ENTERPRISE' ? 'ЧП (Hususy kärhana)' : 
                   supplier.type === 'DAÝHAN_HOJALYGY' ? 'DH (Daýhan hojalygy)' : supplier.type}
                </span>
                <span className="text-slate-400 text-sm font-medium">STŞK: <span className="text-slate-700 font-bold">{supplier.taxId}</span></span>

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

          {isOwner ? (
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* 1. Контактные данные */}
              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <MapPin size={18} className="text-blue-600" />
                  {t('contactInfo', 'Контактная информация')}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Кастомный красивый выпадающий список «Велаят» (без поиска) */}
                  <div className="relative" ref={regionDropdownRef}>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">
                      {t('regionLabel', 'Велаят')} <span className="text-rose-500">*</span>
                    </label>

                    {/* Кнопка выбора региона */}
                    <button
                      type="button"
                      disabled={!isEditable}
                      onClick={() => {
                        setIsRegionOpen(!isRegionOpen);
                        if (isBankOpen) setIsBankOpen(false);
                      }}
                      className={`w-full px-4 py-3 rounded-xl text-sm font-medium border flex items-center justify-between text-left focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 cursor-pointer ${inputBg}`}
                    >
                      <span className={formData.region ? 'text-slate-800 font-semibold' : 'text-slate-400'}>
                        {getSelectedRegionLabel() || t('regionSelect', 'Выберите велаят...')}
                      </span>
                      <ChevronDown size={18} className={`text-slate-400 transition-transform ${isRegionOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Всплывающее меню без поиска */}
                    {isRegionOpen && (
                      <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150 p-1.5 divide-y divide-slate-50">
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

                  {/* Текстовое поле «Точный адрес» */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">
                      {t('exactAddress', 'Точный адрес (этрап, улица, офис)')} <span className="text-rose-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      required
                      disabled={!isEditable}
                      value={formData.address}
                      onChange={e => setFormData({ ...formData, address: e.target.value })}
                      placeholder={t('exactAddressPlaceholder', 'Битараплык шаёлы, д. 12, оф. 4')}
                      className={`w-full px-4 py-3 rounded-xl text-sm font-medium border focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 ${inputBg}`} 
                    />
                  </div>

                  {/* Рабочий телефон с чистым международным префиксом +993 */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">
                      {t('workPhone', 'Рабочий телефон')} <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-4 text-slate-500 font-bold select-none pointer-events-none text-sm tracking-tight">
                        +993
                      </span>
                      <input 
                        type="tel" 
                        required
                        disabled={!isEditable}
                        value={phoneDigits}
                        onChange={handlePhoneInputChange}
                        placeholder="65 56-65-65"
                        className={`w-full pl-16 pr-4 py-3 rounded-xl text-sm font-medium border focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 tracking-wider ${inputBg}`} 
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 ml-1">
                      {t('phoneFormatHint', 'Формат: +993 6X XX-XX-XX')}
                    </p>
                  </div>

                  {/* Автозаполнение Email */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">
                      {t('corpEmail', 'Корпоративный Email')} <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input 
                        type="email" 
                        required
                        disabled={!isEditable}
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        placeholder="company@example.com"
                        className={`w-full px-4 py-3 rounded-xl text-sm font-medium border focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 ${inputBg}`} 
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 ml-1">
                      {t('emailSyncHint', 'Автоматически синхронизирован с аккаунтом')}
                    </p>
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
                      {t('bankNameLabel', 'Наименование банка')} <span className="text-rose-500">*</span>
                    </label>
                    
                    {/* Кнопка выбора банка */}
                    <button
                      type="button"
                      disabled={!isEditable}
                      onClick={() => {
                        setIsBankOpen(!isBankOpen);
                        if (isRegionOpen) setIsRegionOpen(false);
                      }}
                      className={`w-full px-4 py-3 rounded-xl text-sm font-medium border flex items-center justify-between text-left focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 ${inputBg}`}
                    >
                      <span className={formData.bankName ? 'text-slate-800 font-semibold' : 'text-slate-400'}>
                        {formData.bankName || t('bankSelectPlaceholder', 'Выберите банк из списка...')}
                      </span>
                      <ChevronDown size={18} className={`text-slate-400 transition-transform ${isBankOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Всплывающее меню с поиском */}
                    {isBankOpen && (
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
                                className="w-full text-left px-3.5 py-2.5 rounded-xl hover:bg-blue-50/80 transition-colors flex items-center justify-between group"
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
                      {t('bankAccountLabel', 'Расчетный счет (Hasap belgisi)')} <span className="text-rose-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      required
                      disabled={!isEditable}
                      maxLength={28}
                      value={formData.bankAccount}
                      onChange={e => setFormData({ ...formData, bankAccount: e.target.value.replace(/\s/g, '') })}
                      placeholder="2320xxxxxxxxxxxxxxxxxxxxxxxx"
                      className={`w-full px-4 py-3 rounded-xl text-sm font-medium tracking-wider border focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 ${inputBg}`} 
                    />
                    <p className="text-[11px] text-slate-400 mt-1 ml-1">{t('bankAccountHint', '28 символов (стандарт ЦБ Туркменистана)')}</p>
                  </div>

                  {/* МФО банка */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">
                      {t('bankMfoLabel', 'МФО банка (MFO kody)')} <span className="text-rose-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      required
                      disabled={!isEditable}
                      value={formData.bankMfo}
                      onChange={e => setFormData({ ...formData, bankMfo: e.target.value })}
                      placeholder="390101xxx"
                      className={`w-full px-4 py-3 rounded-xl text-sm font-medium border focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 ${inputBg}`} 
                    />
                  </div>
                </div>
              </div>

              {/* 3. Данные руководителя (разделено на два аккуратных поля) */}
              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <User size={18} className="text-blue-600" />
                  {t('directorData', 'Данные руководителя')}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">
                      {t('passportSeriesLabel', 'Серия и номер паспорта')} <span className="text-rose-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      required
                      disabled={!isEditable}
                      value={formData.passportSeries}
                      onChange={e => setFormData({ ...formData, passportSeries: e.target.value })}
                      placeholder="I-AS 123456"
                      className={`w-full px-4 py-3 rounded-xl text-sm font-medium border focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 ${inputBg}`} 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">
                      {t('passportIssuedLabel', 'Кем и когда выдан')} <span className="text-rose-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      required
                      disabled={!isEditable}
                      value={formData.passportIssuedBy}
                      onChange={e => setFormData({ ...formData, passportIssuedBy: e.target.value })}
                      placeholder={lang === 'RU' ? 'Ашхабадским ГОВД, 15.05.2018' : 'Aşgabat ş. IIB, 15.05.2018'}
                      className={`w-full px-4 py-3 rounded-xl text-sm font-medium border focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 ${inputBg}`} 
                    />
                  </div>
                </div>
              </div>

              {/* 4. Загрузка документов с отображением списка */}
              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <FileCheck size={18} className="text-blue-600" />
                  {t('companyDocsTitle', 'Документы компании (PDF / JPG)')}
                </h3>
                
                {/* Дропзона загрузки */}
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
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    onChange={e => handleFileUpload(e.target.files)}
                    className="hidden"
                    disabled={!isEditable || uploading}
                  />

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

                {/* Список загруженных документов */}
                {documents.length > 0 && (
                  <div className="space-y-2 mt-4">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">
                      {t('uploadedDocsCount', 'Загруженные файлы')} ({documents.length})
                    </p>
                    <div className="space-y-2">
                      {documents.map(doc => (
                        <div 
                          key={doc.id} 
                          className="flex items-center justify-between p-3.5 bg-slate-50/80 border border-slate-200 rounded-xl hover:bg-slate-100/60 transition-colors"
                        >
                          <div className="flex items-center space-x-3 overflow-hidden">
                            <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-xs shrink-0">
                              {getFileIcon(doc.fileName || doc.name)}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-800 truncate">{doc.name || doc.fileName}</p>
                              <p className="text-[11px] text-slate-400">
                                {formatFileSize(doc.fileSize)} {doc.createdAt ? `• ${new Date(doc.createdAt).toLocaleDateString()}` : ''}
                              </p>
                            </div>
                          </div>
                          {isEditable && (
                            <button 
                              type="button" 
                              onClick={() => handleDeleteDocument(doc.id)} 
                              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-2 shrink-0 cursor-pointer"
                              title={t('deleteDocumentTooltip', 'Удалить документ')}
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 5. Главная кнопка отправки на модерацию (с валидацией загруженных документов) */}
              {isEditable && (
                <div className="pt-6 border-t border-slate-100 space-y-3">
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
            {/* Для невалидированного пользователя показываем виджет готовности профиля */}
            {supplier.verificationStatus !== 'VERIFIED' ? (
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

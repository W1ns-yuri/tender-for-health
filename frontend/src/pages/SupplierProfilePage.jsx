import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy, FileText, Building2, Phone, Mail, MapPin, Hash, Globe, CreditCard, User, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import API from '../services/api';
import { getTranslation } from '../utils/translations';
import { getRoleTheme } from '../utils/themeUtils';

export default function SupplierProfilePage({ role, lang = 'RU', isDarkMode, isOwner }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const t = (key, fallback) => getTranslation(lang, key, fallback);
  const theme = getRoleTheme(role, isDarkMode);

  const [supplier, setSupplier] = useState(null);
  const [stats, setStats] = useState({ totalOffers: 0, wonOffers: 0 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Форма для редактирования владельцем
  const [formData, setFormData] = useState({
    address: '',
    bankName: '',
    bankAccount: '',
    bankMfo: '',
    passportInfo: '',
    email: '',
    phone: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        let currentSupplier = null;
        
        if (isOwner && !id) {
            // Загружаем профиль текущего пользователя
            const meRes = await API.get('/auth/me');
            currentSupplier = meRes.data?.suppliers?.[0];
            if (currentSupplier) {
                // Если телефон есть в юзере, берем оттуда
                currentSupplier.phone = meRes.data.phone || currentSupplier.phone;
            }
        } else {
            // Загружаем публичный профиль по id
            const compRes = await API.get('/offers/suppliers');
            currentSupplier = compRes.data.find(c => String(c.id) === String(id));
        }

        setSupplier(currentSupplier);

        if (currentSupplier) {
          setFormData({
            address: currentSupplier.address || '',
            bankName: currentSupplier.bankName || '',
            bankAccount: currentSupplier.bankAccount || '',
            bankMfo: currentSupplier.bankMfo || '',
            passportInfo: currentSupplier.passportInfo || '',
            email: currentSupplier.email || '',
            phone: currentSupplier.phone || ''
          });

          try {
            const statsRes = await API.get(`/offers/suppliers/${currentSupplier.id}/stats`).catch(() => ({ data: { totalOffers: 0, wonOffers: 0 }}));
            setStats(statsRes.data || { totalOffers: 0, wonOffers: 0 });
          } catch (statsErr) {
            console.error('Не удалось загрузить статистику:', statsErr);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id, isOwner]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
        const res = await API.put('/suppliers/profile', formData);
        setSupplier(res.data);
        alert(lang === 'RU' ? 'Профиль успешно отправлен на модерацию!' : 'Maglumatlar barlag üçin iberildi!');
    } catch (error) {
        console.error(error);
        alert(lang === 'RU' ? 'Ошибка при сохранении' : 'Ýalňyşlyk');
    } finally {
        setSaving(false);
    }
  };

  const bgClass = isDarkMode ? 'bg-[#0b0f17] text-slate-100' : 'bg-[#f8fbff] text-slate-800';
  const cardBg = isDarkMode ? 'bg-slate-900 border-slate-800 shadow-none' : 'bg-white border-slate-200/60 shadow-xl shadow-slate-200/40';

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
                    <p className="text-rose-600 text-sm mt-1">{supplier.rejectionReason || 'Исправьте данные в профиле и отправьте снова.'}</p>
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

  return (
    <div className={`p-4 md:p-6 lg:p-8 flex-1 overflow-y-auto ${bgClass}`}>
      <div className="max-w-5xl mx-auto space-y-6">
        
        {renderStatusBanner()}

        <div className="flex flex-col lg:flex-row gap-6">
            {/* Левая колонка - Профиль и форма */}
            <div className={`flex-1 rounded-[2rem] p-8 space-y-8 ${cardBg}`}>
                <div className="flex items-center gap-5 pb-6 border-b border-slate-100">
                    <div className="h-20 w-20 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-[1.25rem] flex items-center justify-center shadow-lg shadow-blue-500/30">
                    <Building2 size={36} />
                    </div>
                    <div>
                    <h1 className="text-2xl font-black tracking-tight">{supplier.name}</h1>
                    <div className="flex items-center gap-2 mt-2">
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-md">
                        {supplier.type === 'ENTREPRENEUR' ? 'ИП' : supplier.type === 'BUSINESS_SOCIETY' ? 'ХО' : supplier.type}
                        </span>
                        <span className="text-slate-400 text-sm font-medium">STŞK: <span className="text-slate-600 font-bold">{supplier.taxId}</span></span>
                    </div>
                    </div>
                </div>

                {isOwner ? (
                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Контактные данные */}
                        <div>
                            <h3 className="text-lg font-bold text-slate-800 mb-4">{lang === 'RU' ? 'Контактная информация' : 'Aragatnaşyk maglumatlary'}</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">{lang === 'RU' ? 'Адрес (Велаят, этрап, улица)' : 'Salgysy'}</label>
                                    <input 
                                        type="text" 
                                        required
                                        disabled={!isEditable}
                                        value={formData.address}
                                        onChange={e => setFormData({...formData, address: e.target.value})}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60" 
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">{lang === 'RU' ? 'Рабочий телефон' : 'Telefon'}</label>
                                    <input 
                                        type="text" 
                                        required
                                        disabled={!isEditable}
                                        value={formData.phone}
                                        onChange={e => setFormData({...formData, phone: e.target.value})}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60" 
                                    />
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">{lang === 'RU' ? 'Корпоративный Email' : 'Email'}</label>
                                    <input 
                                        type="email" 
                                        required
                                        disabled={!isEditable}
                                        value={formData.email}
                                        onChange={e => setFormData({...formData, email: e.target.value})}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60" 
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Банковские реквизиты */}
                        <div>
                            <h3 className="text-lg font-bold text-slate-800 mb-4">{lang === 'RU' ? 'Банковские реквизиты' : 'Bank maglumatlary'}</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="sm:col-span-2">
                                    <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">{lang === 'RU' ? 'Наименование банка' : 'Bankyň ady'}</label>
                                    <input 
                                        type="text" 
                                        required
                                        disabled={!isEditable}
                                        value={formData.bankName}
                                        onChange={e => setFormData({...formData, bankName: e.target.value})}
                                        placeholder="Например: «Rysgal» PB"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60" 
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">{lang === 'RU' ? 'Расчетный счет (Hasap belgisi)' : 'Hasap belgisi'}</label>
                                    <input 
                                        type="text" 
                                        required
                                        disabled={!isEditable}
                                        maxLength={28}
                                        value={formData.bankAccount}
                                        onChange={e => setFormData({...formData, bankAccount: e.target.value})}
                                        placeholder="2320xxxxxxxxxxxxxxxxxxxxxxxx"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium tracking-wide focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60" 
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">{lang === 'RU' ? 'МФО банка (MFO kody)' : 'MFO kody'}</label>
                                    <input 
                                        type="text" 
                                        required
                                        disabled={!isEditable}
                                        value={formData.bankMfo}
                                        onChange={e => setFormData({...formData, bankMfo: e.target.value})}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60" 
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Руководитель */}
                        <div>
                            <h3 className="text-lg font-bold text-slate-800 mb-4">{lang === 'RU' ? 'Данные руководителя' : 'Ýolbaşçynyň maglumatlary'}</h3>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">{lang === 'RU' ? 'Паспортные данные (Серия, номер, кем выдан)' : 'Pasport maglumatlary'}</label>
                                <textarea 
                                    required
                                    disabled={!isEditable}
                                    value={formData.passportInfo}
                                    onChange={e => setFormData({...formData, passportInfo: e.target.value})}
                                    rows="2"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 resize-none" 
                                />
                            </div>
                        </div>

                        {/* Загрузка документов (UI-заглушка) */}
                        <div>
                            <h3 className="text-lg font-bold text-slate-800 mb-4">{lang === 'RU' ? 'Документы (PDF / JPG)' : 'Resminamalar (PDF / JPG)'}</h3>
                            <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center bg-slate-50/50">
                                <FileText className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                                <p className="text-sm font-medium text-slate-600 mb-1">{lang === 'RU' ? 'Свидетельство, Выписка ЕГРЮЛ, Патент' : 'Şahadatnama, ÝŞÝDS-den göçürme, Patent'}</p>
                                <p className="text-xs text-slate-400 mb-4">{lang === 'RU' ? 'Загрузите одним архивом или несколько файлов' : 'Faýllary ýükläň'}</p>
                                <button type="button" disabled={!isEditable} className="px-4 py-2 bg-white border border-slate-200 shadow-sm rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50">
                                    {lang === 'RU' ? 'Выбрать файлы' : 'Faýllary saýlaň'}
                                </button>
                            </div>
                        </div>

                        {isEditable && (
                            <div className="pt-6 border-t border-slate-100">
                                <button type="submit" disabled={saving} className="w-full py-4 bg-slate-800 hover:bg-slate-900 text-white rounded-2xl font-black shadow-lg shadow-slate-900/20 transition-all flex items-center justify-center space-x-2 active:scale-[0.98]">
                                    {saving ? 'Отправка...' : (lang === 'RU' ? 'Отправить профиль на модерацию' : 'Barlaga ibermek')}
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
                                <p className="font-semibold">{supplier.address || '-'}</p>
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
                        </div>
                    </div>
                )}
            </div>

            {/* Правая колонка - Статистика */}
            <div className="w-full lg:w-80 space-y-6 shrink-0">
                <div className={`rounded-[2rem] p-6 flex flex-col items-center justify-center text-center space-y-3 ${cardBg}`}>
                    <div className="p-4 bg-blue-50 text-blue-600 rounded-full">
                    <FileText size={32} />
                    </div>
                    <div>
                    <p className="text-4xl font-black text-slate-800 dark:text-white">{stats.totalOffers}</p>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">{lang === 'RU' ? 'Всего заявок' : 'Jemi teklipler'}</p>
                    </div>
                </div>

                <div className={`rounded-[2rem] p-6 flex flex-col items-center justify-center text-center space-y-3 ${cardBg}`}>
                    <div className="p-4 bg-amber-50 text-amber-600 rounded-full">
                    <Trophy size={32} />
                    </div>
                    <div>
                    <p className="text-4xl font-black text-slate-800 dark:text-white">{stats.wonOffers}</p>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">{lang === 'RU' ? 'Побед в тендерах' : 'Ýeňilen tenderler'}</p>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}

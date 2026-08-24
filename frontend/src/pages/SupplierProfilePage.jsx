import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy, FileText, Building2, Phone, Mail, MapPin, Hash } from 'lucide-react';
import API from '../services/api';
import { getTranslation } from '../utils/translations';
import { getRoleTheme } from '../utils/themeUtils';

export default function SupplierProfilePage({ role, lang = 'RU', isDarkMode }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const t = (key, fallback) => getTranslation(lang, key, fallback);
  const theme = getRoleTheme(role, isDarkMode);

  const [supplier, setSupplier] = useState(null);
  const [stats, setStats] = useState({ totalOffers: 0, wonOffers: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // We need the supplier details as well. The stats endpoint doesn't return the full profile, 
    // but maybe we can fetch the company first or wait, we just pass the ID.
    // In SuppliersList we already had the supplier object. Here we need to fetch it.
    // Actually, getting all companies and finding this one is easy, or we can use the API.
    const fetchData = async () => {
      try {
        setLoading(true);
        // Сначала получаем список компаний
        const compRes = await API.get('/companies');
        const comp = compRes.data.find(c => String(c.id) === String(id));
        setSupplier(comp);

        // Затем пробуем получить статистику (если сервер не перезагружен, это может упасть с 404)
        if (comp) {
          try {
            const statsRes = await API.get(`/companies/${id}/stats`);
            setStats(statsRes.data);
          } catch (statsErr) {
            console.error('Не удалось загрузить статистику:', statsErr);
            // Оставляем нули
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id]);

  const bgClass = isDarkMode ? 'bg-[#0b0f17] text-slate-100' : 'bg-slate-50 text-slate-800';
  const cardBg = isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200';

  if (loading) {
    return (
      <div className={`p-6 flex-1 flex justify-center items-center h-full ${bgClass}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className={`p-6 flex-1 ${bgClass}`}>
        <button onClick={() => navigate(-1)} className="flex items-center text-slate-500 hover:text-teal-600 mb-6 transition-colors">
          <ArrowLeft size={16} className="mr-2" /> {t('back', 'Назад')}
        </button>
        <div className="text-center py-10 text-slate-500 text-lg">Поставщик не найден</div>
      </div>
    );
  }

  return (
    <div className={`p-4 md:p-6 lg:p-8 flex-1 overflow-y-auto ${bgClass} space-y-6 max-w-5xl mx-auto`}>
      <button onClick={() => navigate(-1)} className="flex items-center text-slate-500 hover:text-teal-600 font-medium transition-colors">
        <ArrowLeft size={16} className="mr-2" /> {t('back', 'Назад')}
      </button>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Левая колонка - Профиль */}
        <div className={`flex-1 rounded-2xl shadow-sm border p-6 space-y-6 ${cardBg}`}>
          <div className="flex items-center gap-4 border-b border-slate-100/10 pb-6">
            <div className="h-16 w-16 bg-teal-100 text-teal-600 rounded-2xl flex items-center justify-center">
              <Building2 size={32} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{supplier.name}</h1>
              <span className="inline-block mt-1 px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">
                Активен
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-lg">Контактная информация</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="flex items-start gap-3">
                <Hash size={18} className="text-slate-400 mt-0.5" />
                <div>
                  <p className="text-slate-500 font-medium">ИНН / Рег. номер</p>
                  <p className="font-semibold">{supplier.inn || supplier.reg || '-'}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <FileText size={18} className="text-slate-400 mt-0.5" />
                <div>
                  <p className="text-slate-500 font-medium">Лицензия</p>
                  <p className="font-semibold">{supplier.license || '-'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone size={18} className="text-slate-400 mt-0.5" />
                <div>
                  <p className="text-slate-500 font-medium">Телефон</p>
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

              <div className="flex items-start gap-3 sm:col-span-2">
                <MapPin size={18} className="text-slate-400 mt-0.5" />
                <div>
                  <p className="text-slate-500 font-medium">Адрес</p>
                  <p className="font-semibold">{supplier.address || '-'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Правая колонка - Статистика */}
        <div className="w-full md:w-80 space-y-6">
          <div className={`rounded-2xl shadow-sm border p-6 flex flex-col items-center justify-center text-center space-y-3 ${cardBg}`}>
            <div className="p-4 bg-blue-100 text-blue-600 rounded-full">
              <FileText size={32} />
            </div>
            <div>
              <p className="text-4xl font-black text-slate-800 dark:text-white">{stats.totalOffers}</p>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest mt-2">Всего заявок</p>
            </div>
          </div>

          <div className={`rounded-2xl shadow-sm border p-6 flex flex-col items-center justify-center text-center space-y-3 ${cardBg}`}>
            <div className="p-4 bg-yellow-100 text-yellow-600 rounded-full">
              <Trophy size={32} />
            </div>
            <div>
              <p className="text-4xl font-black text-slate-800 dark:text-white">{stats.wonOffers}</p>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest mt-2">Выиграно тендеров</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

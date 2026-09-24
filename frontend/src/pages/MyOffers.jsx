import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Eye, RefreshCw, AlertCircle } from 'lucide-react';
import { getStatusBadge, getTypeBadge } from '../utils/statusUtils';
import API from '../services/api';
import { getTranslation } from '../utils/translations';
import { useNavigate } from 'react-router-dom';
import { getRoleTheme, safeString } from '../utils/themeUtils';
import { useAlert } from '../context/AlertContext';
import { TableFilters } from '../components/ui';

export default function MyOffers({ role, isDarkMode, lang = 'RU' }) {
  const theme = getRoleTheme(role, isDarkMode);
  const isAdmin = role === 'ADMIN';
  const t = (key, fallback) => getTranslation(lang, key, fallback);
  const navigate = useNavigate();
  const { showAlert, showConfirm } = useAlert();
  
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Фильтры
  const [filterCurrency, setFilterCurrency] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchMyOffers();
  }, [role]);

  const fetchMyOffers = async () => {
    setLoading(true);
    try {
      const endpoint = isAdmin ? '/offers' : '/offers/my';
      const res = await API.get(endpoint);
      if (res.data) setOffers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to fetch offers', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOffer = async (offerId) => {
    const isConfirmed = await showConfirm({
      title: t('withdrawOfferTitle', 'Отзыв предложения'),
      message: t('withdrawOfferConfirm', 'Вы действительно хотите отозвать/удалить это коммерческое предложение?'),
      type: 'danger',
      confirmText: t('delete', 'Удалить'),
      cancelText: t('cancelEditBtn', 'Отмена'),
      isDanger: true,
    });
    if (!isConfirmed) return;

    try {
      await API.delete(`/offers/${offerId}`);
      setOffers(prev => prev.filter(o => o.id !== offerId));
      showAlert({
        title: t('successTitle', 'Успешно'),
        message: t('offerDeletedSuccess', 'Коммерческое предложение успешно удалено'),
        type: 'success'
      });
    } catch (err) {
      console.error('Error deleting offer', err);
      showAlert({
        title: t('errorTitle', 'Ошибка'),
        message: err.response?.data?.error || (t('offerDeleteError', 'Ошибка при удалении предложения')),
        type: 'error'
      });
    }
  };

  // Фильтрация списка предложений
  const filteredOffers = offers.filter(item => {
    if (filterCurrency) {
      const curr = item.baseCurrency?.code || item.currency || '';
      if (curr !== filterCurrency) return false;
    }
    if (filterStatus) {
      if (item.status !== filterStatus) return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase().trim();
      const matchTender = (item.tender?.title || '').toLowerCase().includes(q);
      const matchTenderNum = (item.tender?.tenderNumber || '').toLowerCase().includes(q);
      const matchSupplier = (item.supplier?.name || '').toLowerCase().includes(q);
      const matchClient = (item.tender?.client?.name || '').toLowerCase().includes(q);
      const matchNumber = (item.number || item.code || '').toLowerCase().includes(q);
      const matchComment = (item.comment || '').toLowerCase().includes(q);
      if (!matchTender && !matchTenderNum && !matchSupplier && !matchClient && !matchNumber && !matchComment) return false;
    }
    return true;
  });

  return (
    <div className="space-y-5 animate-in fade-in duration-300 pb-12">
      {/* Баннер приостановки, если профиль поставщика на повторной модерации */}
      {!isAdmin && offers.some(o => o.supplier?.verificationStatus === 'PENDING_REVIEW') && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start space-x-3 text-xs text-amber-800 animate-in fade-in">
          <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">{t('resubmitWarningTitle', 'Повторная модерация')}</p>
            <p className="mt-0.5 leading-relaxed">
              {t('offersSuspendedWarning', 'Ваш профиль находится на повторной модерации. До подтверждения администратором участие в торгах ограничено, а поданные предложения временно приостановлены.')}
            </p>
          </div>
        </div>
      )}

      {/* 1. Заголовок страницы и действия */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-xl font-bold ${theme.primaryText}`}>
            {isAdmin 
              ? (t('submittedOffers', 'Поданные предложения'))
              : t('myOffers', 'Tekliplerim')
            }
          </h2>
          <p className={`text-xs font-medium ${theme.subText}`}>
            {isAdmin 
              ? (t('adminOffersPageTitle', 'Администратор / Поданные коммерческие предложения поставщиков'))
              : t('supplierMyOffers', 'Üpjün ediji / Tekliplerim')
            }
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={fetchMyOffers}
            disabled={loading}
            className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 transition-colors"
            title="Обновить"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>

          {/* Кнопка "Подать предложение" видна ТОЛЬКО поставщику */}
          {!isAdmin && (
            <button
              onClick={() => navigate('/tenders')}
              className={`px-4 py-2 font-semibold text-xs shadow-md transition-all flex items-center space-x-2 rounded-lg ${theme.primaryBtn}`}
            >
              <Plus size={16} />
              <span>{t('submitOfferBtn', 'Teklip ber')}</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Унифицированная панель фильтров */}
      <TableFilters
        role={role}
        isDarkMode={isDarkMode}
        theme={theme}
        t={t}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder={t('searchOffersPlaceholder', 'Поиск по номеру предложения, тендеру, коду...')}
        hasActiveFilters={Boolean(searchQuery || filterCurrency || filterStatus)}
        onReset={() => {
          setSearchQuery('');
          setFilterCurrency('');
          setFilterStatus('');
        }}
        filters={[
          {
            id: 'currency',
            value: filterCurrency,
            onChange: (val) => setFilterCurrency(val),
            options: [
              { id: '', name: t('allCurrenciesFilter', 'Все валюты') },
              { id: 'TMT', name: 'TMT (Манат)' },
              { id: 'USD', name: 'USD ($ Доллар)' },
              { id: 'EUR', name: 'EUR (€ Евро)' }
            ],
            width: 'min-w-[160px]'
          },
          {
            id: 'status',
            value: filterStatus,
            onChange: (val) => setFilterStatus(val),
            options: [
              { id: '', name: t('allStatusesFilter', 'Все статусы') },
              { id: 'TABSARYLDY', name: t('statusTabsyryldy', 'Подано') },
              { id: 'YENIJI', name: t('statusYeniji', 'Победитель') },
              { id: 'RET_EDILDI', name: t('statusRet', 'Отклонено') },
              { id: 'TASLAMA', name: t('statusTaslama', 'Черновик') }
            ],
            width: 'min-w-[170px]'
          }
        ]}
      />

      {/* 3. Таблица коммерческих предложений */}
      <div className={`bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden ${theme.tableCardBorderTop}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className={theme.tableHeaderBg}>
              <tr className="border-b border-slate-200 dark:border-slate-800">
                <th className="py-3.5 px-3 w-36 text-center">{t('tenderOrName', 'Тендер / Наименование')}</th>
                <th className="py-3.5 px-3 text-center">{t('type', 'Görnüşi')}</th>
                {isAdmin && <th className="py-3.5 px-3 text-left">{t('supplierStr', 'Поставщик')}</th>}
                <th className="py-3.5 px-3 text-center">{t('client', 'Заказчик')}</th>
                <th className="py-3.5 px-3 text-center">{t('currency', 'Walýuta')}</th>
                <th className="py-3.5 px-3 text-center">{t('code', 'Номер заявки')}</th>
                <th className="py-3.5 px-3 text-center">{t('status', 'Status')}</th>
                <th className="py-3.5 px-3 text-center">{t('paymentTerms', 'Условия оплаты')}</th>
                <th className="py-3.5 px-3 text-center">{t('totalAmount', 'Сумма')}</th>
                <th className="py-3.5 px-3 text-center">{t('uploadDate', 'Дата подачи')}</th>
                <th className="py-3.5 px-3 text-center w-20">{t('action', 'Действие')}</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
              {loading ? (
                <tr>
                  <td colSpan={isAdmin ? "11" : "10"} className="py-8 text-center text-slate-500">{t('loading', 'Загрузка...')}</td>
                </tr>
              ) : filteredOffers.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? "11" : "10"} className="py-8 text-center text-slate-500">
                    {offers.length === 0 ? (t('noOffersYet', 'Предложений пока не поступало')) : (t('nothingFoundForFilters', 'По заданным фильтрам ничего не найдено'))}
                  </td>
                </tr>
              ) : (
                filteredOffers.map((item, idx) => {
                  const supplierName = item.supplier?.name || item.supplier?.user?.username || '-';
                  const currency = item.baseCurrency?.code || item.currency || 'TMT';
                  const offerPrice = item.offeredPrice || 0;

                  return (
                    <tr key={item.id || idx} className={theme.tableRowHover}>
                      {/* Номер и название тендера */}
                      <td className="py-3 px-3 text-center font-semibold">
                        <span className="font-bold font-mono tabular-nums text-slate-800 dark:text-slate-100">{safeString(item.tender?.tenderNumber || item.lot)}</span>
                        {item.tender?.title && <span className="block text-[11px] font-normal text-slate-500 truncate max-w-40">{item.tender.title}</span>}
                      </td>

                      {/* Вид закупки */}
                      <td className="py-3 px-3 text-center">{getTypeBadge(item.tender?.type || item.type, lang, isDarkMode)}</td>

                      {/* Поставщик (виден администратору) */}
                      {isAdmin && (
                        <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-200">
                          <span className="truncate max-w-45 block">{supplierName}</span>
                        </td>
                      )}

                      {/* Заказчик */}
                      <td className="py-3 px-3 text-center">
                        <span className="text-slate-800 dark:text-slate-200 font-medium hover:text-emerald-600 dark:hover:text-emerald-400 hover:underline transition-colors">
                          {safeString(item.tender?.client?.name || item.tender?.createdBy?.firstName || "-")}
                        </span>
                      </td>

                      {/* Валюта */}
                      <td className={`py-3 px-3 text-center font-bold tabular-nums ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{currency}</td>

                      {/* Номер заявки */}
                      <td className="py-3 px-3 text-center text-slate-500 font-mono tabular-nums">{item.number || item.code}</td>

                      {/* Статус */}
                      <td className="py-3 px-3 text-center">
                        {item.supplier?.verificationStatus === 'PENDING_REVIEW' ? (
                          <div className="flex flex-col items-center gap-1">
                            {getStatusBadge(item.status, lang, isDarkMode)}
                            <span className="text-[10px] text-amber-500 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded">
                              {t('moderationBadge', 'На модерации')}
                            </span>
                          </div>
                        ) : (
                          getStatusBadge(item.status, lang, isDarkMode)
                        )}
                      </td>

                      {/* Условия оплаты */}
                      <td className="py-3 px-3 text-center text-slate-500 max-w-32 truncate" title={item.paymentTerms}>
                        {item.paymentTerms || '-'}
                      </td>

                      {/* Предложенная цена */}
                      <td className="py-3 px-3 text-center font-bold tabular-nums text-slate-700 dark:text-slate-200">
                        {offerPrice > 0 ? `${offerPrice.toLocaleString('ru-RU')} ${currency}` : '-'}
                      </td>

                      {/* Дата подачи */}
                      <td className="py-3 px-3 text-center text-slate-500 tabular-nums">{new Date(item.createdAt || item.date).toLocaleDateString('ru-RU')}</td>

                      {/* Действия */}
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button 
                            onClick={() => navigate(`/offers/${item.id}`)} 
                            className={theme.actionBtn}
                            title={t('viewDetails', 'Просмотр')}
                          >
                            <Eye size={16} />
                          </button>

                          {/* Кнопка удаления только для поставщика */}
                          {!isAdmin && (
                            <button 
                              onClick={() => handleDeleteOffer(item.id)}
                              className="w-8 h-8 rounded-lg border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-800 shadow-2xs flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-300 dark:hover:bg-rose-950/50 dark:hover:text-rose-400 transition-all active:scale-95 cursor-pointer" 
                              title={t('delete', 'Удалить / Отозвать')}
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

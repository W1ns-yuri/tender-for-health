import React, { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FileSignature, Eye } from 'lucide-react';
import API from '../services/api';
import { getRoleTheme } from '../utils/themeUtils';
import useT from '../utils/useT';
import { contractStatus, formatMoney, formatDate, nextStep } from '../utils/contracts';

/** Договоры по итогам тендеров: организатор видит все, поставщик только свои */
export default function ContractsPage({ role, isDarkMode, lang = 'RU' }) {
  const theme = getRoleTheme(role, isDarkMode);
  const t = useT(lang);
  const isAdmin = role === 'ADMIN';
  const [params] = useSearchParams();
  const tenderId = params.get('tenderId');
  const [rows, setRows] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    API.get('/contracts', { params: tenderId ? { tenderId } : {} })
      .then((res) => setRows(Array.isArray(res.data) ? res.data : []))
      .catch((err) => { setError(err.response?.data?.error || 'Не удалось загрузить договоры'); setRows([]); });
  }, [tenderId]);
  useEffect(() => { load(); }, [load]);

  // Для тендеров, итоги которых объявили до появления договоров
  const generate = async () => {
    setError('');
    try {
      await API.post(`/contracts/generate/${tenderId}`);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Не удалось создать договоры');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{t('contractsTitle', 'Договоры')}</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          {isAdmin
            ? t('contractsSubAdmin', 'Создаются сами, когда вы объявляете итоги: один договор с каждым победителем.')
            : t('contractsSubSupplier', 'Договоры по выигранным тендерам. Скачайте, подпишите и загрузите скан.')}
        </p>
        {tenderId && (
          <Link to="/contracts" className={`text-xs font-semibold ${theme.primaryText} hover:underline`}>{t('allContracts', 'Показать все договоры')}</Link>
        )}
      </div>

      {error && <p className="text-sm text-rose-600">{error}</p>}

      <div className={`rounded-xl border overflow-x-auto ${theme.cardBg} ${theme.tableCardBorderTop}`}>
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className={theme.tableHeaderBg}>
              <th className="py-3 px-4">{t('contractNumber', 'Номер')}</th>
              <th className="py-3 px-4">{t('tender', 'Тендер')}</th>
              {isAdmin && <th className="py-3 px-4">{t('supplier', 'Поставщик')}</th>}
              <th className="py-3 px-4 text-right">{t('amount', 'Сумма')}</th>
              <th className="py-3 px-4">{t('status', 'Статус')}</th>
              <th className="py-3 px-4">{t('nextStep', 'Что дальше')}</th>
              <th className="py-3 px-4 w-16" />
            </tr>
          </thead>
          <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
            {rows === null ? (
              <tr><td colSpan={7} className="py-10 text-center text-slate-400">{t('loading', 'Загрузка...')}</td></tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  <FileSignature size={36} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm font-semibold">{t('noContracts', 'Договоров пока нет')}</p>
                  <p className="text-xs mt-0.5">{t('noContractsHint', 'Они появятся после объявления итогов тендера.')}</p>
                  {isAdmin && tenderId && (
                    <button type="button" onClick={generate} className={`mt-3 px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer ${theme.primaryBtn}`}>
                      {t('generateContracts', 'Создать договоры по итогам')}
                    </button>
                  )}
                </td>
              </tr>
            ) : rows.map((c) => {
              const st = contractStatus(c.status);
              return (
                <tr key={c.id} className={theme.tableRowHover}>
                  <td className="py-3 px-4 font-mono font-semibold whitespace-nowrap">{c.number}</td>
                  <td className="py-3 px-4">
                    <span className="block font-semibold">№{c.tender?.tenderNumber}</span>
                    <span className="text-slate-500 line-clamp-1">{c.tender?.title}</span>
                  </td>
                  {isAdmin && <td className="py-3 px-4">{c.supplier?.name}</td>}
                  <td className="py-3 px-4 text-right font-mono whitespace-nowrap">{formatMoney(c.amount, c.currencyCode)}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-md border text-xs font-semibold whitespace-nowrap ${st.cls}`}>{st.label}</span>
                    {c.signedAt && <span className="block text-slate-400 mt-1">{formatDate(c.signedAt)}</span>}
                  </td>
                  <td className="py-3 px-4 text-slate-500">{c.status === 'CANCELLED' ? c.cancelReason : nextStep(c.status, isAdmin)}</td>
                  <td className="py-3 px-4">
                    <Link to={`/contracts/${c.id}`} className={theme.actionBtn} title={t('open', 'Открыть')}><Eye size={15} /></Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

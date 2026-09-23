import React from 'react';
import CustomSelect from '../CustomSelect';
import { getCurrencyLabel } from '../../utils/themeUtils';

export default function OfferCommercialTermsCard({
  currencies = [],
  currency,
  setCurrency,
  paymentTerms,
  setPaymentTerms,
  comment,
  setComment,
  isDarkMode,
  theme,
  t
}) {
  return (
    <div className={`p-6 rounded-2xl border shadow-xs space-y-4 ${theme?.cardBg || ''}`}>
      <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
        <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">
          {t('offerMainParamsTitle', 'Основные параметры вашего предложения')}
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs pt-1">
        <div>
          <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
            {t('currency', 'Валюта предложения')}*
          </label>
          <CustomSelect
            role="SUPPLIER"
            options={currencies.map(c => ({ id: c.id, name: getCurrencyLabel(c) }))}
            value={currency}
            onChange={(val) => setCurrency(val)}
            isDarkMode={isDarkMode}
            theme={theme}
            t={t}
          />
          <span className="text-[10px] text-slate-400 mt-1 block">
            {t('currencyNotice', 'Цены по всем лотам будут рассчитаны в этой валюте')}
          </span>
        </div>

        <div>
          <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
            {t('paymentTerms', 'Условия оплаты')}
          </label>
          <input
            type="text"
            value={paymentTerms}
            onChange={(e) => setPaymentTerms(e.target.value)}
            className={`w-full px-3 py-2.5 rounded-xl border text-xs ${theme?.inputBg || ''}`}
          />
        </div>

        <div>
          <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
            {t('offerValidityNotes', 'Срок действия предложения / Примечание')}
          </label>
          <input
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className={`w-full px-3 py-2.5 rounded-xl border text-xs ${theme?.inputBg || ''}`}
          />
        </div>
      </div>
    </div>
  );
}

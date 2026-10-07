import React from 'react';
import { Trophy } from 'lucide-react';
import { safeString } from '../../utils/themeUtils';

export default function TenderDetailsLegacySpecs({
  specs,
  offers,
  status,
  isDarkMode,
  theme,
  t,
}) {
  if (!specs || specs.length === 0) return null;

  return (
    <div className={`rounded-xl border shadow-xs overflow-hidden ${theme.cardBg}`}>
      <div className={`p-4 border-b ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
        <h3 className="font-bold text-base">{t('tenderSpecs', 'Товары / Спецификация')}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className={theme.tableHeaderBg}>
              <th className="py-3 px-4 w-16 text-center">{t('itemNumber', '№ п/п')}</th>
              <th className="py-3 px-4 text-center w-48">{t('product', 'Товар')}</th>
              <th className="py-3 px-4 text-center w-24">{t('quantity', 'Количество')}</th>
              <th className="py-3 px-4 text-center w-28">{t('unit', 'Ед. измерения')}</th>
              <th className="py-3 px-4 text-center w-36">{t('manufacturer', 'Производитель')}</th>
              <th className="py-3 px-4 text-center">{t('description', 'Описание')}</th>
              {status === 'YENIJI_YGLAN_EDILDI' && (
                <th className="py-3 px-4 text-center w-36">{t('winnerBadge', 'Победитель')}</th>
              )}
            </tr>
          </thead>
          <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
            {specs.map((spec, idx) => {
              let winningSupplier = null;
              if (status === 'YENIJI_YGLAN_EDILDI' && offers) {
                for (const offer of offers) {
                  const os = offer.specs?.find((s) => s.tenderSpecId === spec.id);
                  if (os && os.isAwarded) {
                    winningSupplier = offer.supplier?.name;
                    break;
                  }
                }
              }

              return (
                <tr key={spec.id || idx} className={theme.tableRowHover}>
                  <td className="py-3.5 px-4 text-center font-semibold text-slate-400">
                    {safeString(spec?.positionNumber || idx + 1)}
                  </td>
                  <td className="py-3.5 px-4 text-center font-medium">
                    {safeString(spec?.generalProduct?.name || spec?.name)}
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold">
                    {safeString(spec?.quantity)}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {safeString(spec?.unit?.name || spec?.unit?.shortName)}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {safeString(spec?.manufacturer?.name || '-')}
                  </td>
                  <td className="py-3.5 px-4 text-center w-auto min-w-60 whitespace-normal text-wrap text-slate-500">
                    {safeString(spec?.description)}
                  </td>
                  {status === 'YENIJI_YGLAN_EDILDI' && (
                    <td className="py-3.5 px-4 text-center font-bold text-emerald-600">
                      {winningSupplier ? (
                        <div className="flex items-center justify-center gap-1">
                          <Trophy size={14} /> <span>{winningSupplier}</span>
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import React from 'react';
import { MapPin, Clock, UserCheck, Fuel, LifeBuoy, Truck, KeyRound } from 'lucide-react';

/**
 * Условия лота аренды или лицензий одной строкой (для поставщика и в карточке тендера).
 * Для товаров, работ и услуг ничего не рисует: у них свои блоки.
 */
export default function LotTypeConditions({ lot, t = (k, f) => f }) {
  if (lot?.lotType !== 'RENTAL' && lot?.lotType !== 'LICENSES') return null;
  const item = (Icon, label, value) => (
    <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
      <Icon size={13} className="text-slate-400 shrink-0" />
      {label && <span className="text-slate-400">{label}</span>}
      <strong className="truncate max-w-56" title={typeof value === 'string' ? value : undefined}>{value}</strong>
    </div>
  );
  const isRental = lot.lotType === 'RENTAL';
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-xs text-xs">
      {isRental ? (
        <>
          {lot.workAddress && item(MapPin, t('rentalSiteColon', 'Где работает техника:'), lot.workAddress)}
          {lot.workPeriod && item(Clock, t('rentalTermColon', 'Срок аренды:'), lot.workPeriod)}
          {item(UserCheck, null, lot.withOperator ? t('withOperator', 'С оператором') : t('withoutOperator', 'Без оператора'))}
          {item(Fuel, null, lot.fuelIncluded ? t('fuelIncluded', 'Топливо за счёт арендодателя') : t('fuelNotIncluded', 'Топливо за счёт заказчика'))}
          {lot.deliveryAddress && item(Truck, t('rentalDeliveryColon', 'Доставка техники:'), lot.deliveryAddress)}
        </>
      ) : (
        <>
          {lot.workPeriod && item(KeyRound, t('licenseTermColon', 'Срок лицензии:'), lot.workPeriod)}
          {item(LifeBuoy, null, lot.supportIncluded ? t('supportIncluded', 'Техподдержка включена') : t('supportNotIncluded', 'Без техподдержки'))}
          {lot.supportIncluded && lot.slaPeriod && item(Clock, 'SLA:', lot.slaPeriod)}
        </>
      )}
    </div>
  );
}

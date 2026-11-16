/**
 * Принимает ли тендер заявки прямо сейчас. Сервер проверяет то же самое при подаче,
 * но поставщик должен узнать об этом до того, как заполнит всю форму.
 */
export function isBiddingOpen(tender) {
  if (!tender) return false;
  if (tender.status !== 'ACYK') return false;
  if (tender.deadline && new Date() > new Date(tender.deadline)) return false;
  return true;
}

const { Prisma } = require('@prisma/client');

/**
 * Денежная арифметика без ошибок Float.
 * Пример: 0.1 + 0.2 в JS = 0.30000000000000004, а через Decimal = 0.3.
 */
const D = (value) => new Prisma.Decimal(value ?? 0);

/** Итог по позициям: сумма unitPrice × quantity, округлённая до копеек (тийинов). */
const sumLineTotals = (lines) =>
    lines
        .reduce((acc, line) => acc.plus(D(line.unitPrice).times(D(line.quantity))), D(0))
        .toDecimalPlaces(2);

module.exports = { D, sumLineTotals };

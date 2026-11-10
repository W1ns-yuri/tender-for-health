require('dotenv').config();
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient, Prisma } = require('@prisma/client');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

/**
 * Деньги в БД хранятся как Decimal (точно, без ошибок округления Float).
 * Prisma отдаёт их объектами Decimal, а JSON.stringify по умолчанию превращает их в строки ("1800000"),
 * и фронт, который ждёт числа, сломался бы. Поэтому в ответах API отдаём обычное число.
 * Все расчёты на бэке (суммы, курсы) делаем через Decimal: см. utils/money.js.
 */
Prisma.Decimal.prototype.toJSON = function toJSON() {
    return this.toNumber();
};

module.exports = prisma;
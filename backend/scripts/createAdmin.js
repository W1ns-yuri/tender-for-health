/**
 * Создать первого администратора на чистой базе (или сбросить пароль существующему).
 *
 *   ADMIN_USERNAME=admin ADMIN_PASSWORD='длинный-пароль' node scripts/createAdmin.js
 *
 * Пароль берётся только из переменной окружения, чтобы не оставался в истории команд в открытом виде
 * дольше, чем нужно, и не попадал в репозиторий.
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const bcrypt = require('bcryptjs');
const prisma = require('../src/lib/prisma');
const { passwordError } = require('../src/utils/accountRules');

async function main() {
    const username = (process.env.ADMIN_USERNAME || '').trim();
    const password = process.env.ADMIN_PASSWORD || '';
    if (!username || !password) {
        console.error('Укажите ADMIN_USERNAME и ADMIN_PASSWORD в переменных окружения.');
        process.exit(1);
    }
    const pwdError = passwordError(password);
    if (pwdError) {
        console.error(pwdError);
        process.exit(1);
    }

    const hash = await bcrypt.hash(password, 10);
    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
        if (existing.roleType !== 'ADMIN') {
            console.error(`Пользователь «${username}» уже есть и он не администратор. Выберите другой логин.`);
            process.exit(1);
        }
        await prisma.user.update({ where: { id: existing.id }, data: { password: hash, isActive: true, failedCount: 0, lockoutExpireDate: null } });
        console.log(`Пароль администратора «${username}» обновлён.`);
    } else {
        await prisma.user.create({
            data: { username, password: hash, firstName: 'Администратор', lastName: 'Системы', roleType: 'ADMIN', position: 'Администратор' },
        });
        console.log(`Администратор «${username}» создан.`);
    }
}

main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());

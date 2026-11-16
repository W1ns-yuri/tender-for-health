const bcrypt = require('bcryptjs');
const { passwordError } = require('../utils/accountRules');
const { signToken } = require('../utils/authToken');
const prisma = require('../lib/prisma');
const { setAuthCookie, clearAuthCookie } = require('../utils/authCookie');
const { sendError } = require('../utils/httpErrors');
const { registrationError } = require('../utils/validation');

// Регистрация нового пользователя
const register = async (req, res) => {
    try {
        const { username, password, firstName, lastName, middleName, position, phone, companyType, companyName, taxId, okpoCode, categoryIds, countryCode } = req.body;

        if (!username || !password || !firstName || !lastName || !phone) {
            return res.status(400).json({ error: 'Пожалуйста, заполните обязательные поля: username, password, firstName, lastName, phone' });
        }

        const inputError = registrationError(req.body);
        if (inputError) return res.status(400).json({ error: inputError });

        // Одна компания = один ИНН: иначе можно завести несколько «независимых» участников одного тендера
        if (taxId) {
            const sameTax = await prisma.supplier.findFirst({ where: { taxId: String(taxId).trim() }, select: { id: true } });
            if (sameTax) {
                return res.status(400).json({ error: 'Компания с таким ИНН уже зарегистрирована. Войдите в существующий аккаунт или обратитесь к организатору.' });
            }
        }

        // Проверяем, существует ли уже пользователь с таким логином
        const existingUser = await prisma.user.findUnique({ where: { username } });
        if (existingUser) {
            return res.status(400).json({ error: 'Пользователь с таким логином уже существует' });
        }

        // Находим countryId по countryCode (по умолчанию Туркменистан)
        let countryId = null;
        if (countryCode) {
            const country = await prisma.country.findFirst({
                where: { alpha2: countryCode.toUpperCase() }
            });
            if (country) countryId = country.id;
        }
        if (!countryId) {
            const defaultTm = await prisma.country.findFirst({ where: { alpha2: 'TM' } });
            if (defaultTm) countryId = defaultTm.id;
        }

        // Хешируем пароль (10 раундов соли)
        const pwdError = passwordError(password);
        if (pwdError) return res.status(400).json({ error: pwdError });

        const hashedPassword = await bcrypt.hash(password, 10);

        // Очищаем наименование компании от случайных юридических приставок
        let cleanCompanyName = companyName ? companyName.trim() : '';
        if (cleanCompanyName) {
            cleanCompanyName = cleanCompanyName.replace(/^(ип|хо|ооо|чп|hj|dh|hk|telekeçi|hojalyk\s+jemgyýeti|hususy\s+telekeçi|hususy\s+kärhana)\s*["«'”]?\s*/i, '').replace(/["»'”]$/, '').trim() || cleanCompanyName;
        }

        // Атомарное создание пользователя, профиля поставщика и его категорий в одной транзакции
        const newUser = await prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    username,
                    password: hashedPassword,
                    firstName,
                    lastName,
                    middleName: middleName || null,
                    roleType: 'SUPPLIER',
                    position: position || null,
                    phone: phone || null,
                },
            });

            const supplier = await tx.supplier.create({
                data: {
                    userId: user.id,
                    name: cleanCompanyName || `${firstName} ${lastName}`,
                    type: companyType || 'ENTREPRENEUR',
                    taxId: taxId ? String(taxId).trim() : null,
                    okpoCode: okpoCode || (countryCode === 'TM' ? taxId : null),
                    countryId: countryId || null,
                    phone: phone || null,
                    email: username.includes('@') ? username : null,
                    verificationStatus: 'PENDING',
                    directorName: `${firstName} ${lastName}`.trim(),
                },
            });

            if (Array.isArray(categoryIds) && categoryIds.length > 0) {
                await tx.supplierCategory.createMany({
                    data: categoryIds.map(categoryId => ({
                        supplierId: supplier.id,
                        categoryId
                    })),
                    skipDuplicates: true
                });
            }

            return user;
        });

        const token = signToken(newUser);

        const { password: _, ...userWithoutPassword } = newUser;
        setAuthCookie(res, token);
        res.status(201).json({ user: userWithoutPassword, token });
    } catch (error) {
        sendError(res, error, 'Ошибка при регистрации');
    }
};

// Вход в систему (логин)
const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password || typeof username !== 'string' || typeof password !== 'string') {
            return res.status(400).json({ error: 'Укажите логин и пароль' });
        }

        // Ищем пользователя в БД (пароль в лог сервера не пишется из соображений безопасности)
        const user = await prisma.user.findUnique({ 
            where: { username }, 
            include: { 
                suppliers: {
                    include: { country: true }
                } 
            } 
        });
        if (!user) {
            return res.status(401).json({ error: 'Неверный логин или пароль' });
        }

        if (!user.isActive) {
            return res.status(403).json({ error: 'Аккаунт заблокирован' });
        }

        if (user.lockoutExpireDate && user.lockoutExpireDate > new Date()) {
            return res.status(403).json({ error: 'Аккаунт временно заблокирован из-за превышения попыток входа. Попробуйте позже.' });
        }

        // Сравниваем введенный пароль с хешем
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            let failedCount = user.failedCount + 1;
            let lockoutExpireDate = null;
            if (failedCount >= 5) {
                lockoutExpireDate = new Date(Date.now() + 15 * 60 * 1000); // 15 минут блокировки
            }
            await prisma.user.update({
                where: { id: user.id },
                data: { failedCount, lockoutExpireDate }
            });
            return res.status(401).json({ error: 'Неверный логин или пароль' });
        }

        await prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date(), failedCount: 0, lockoutExpireDate: null }
        });

        const token = signToken(user);

        const { password: _, ...userWithoutPassword } = user;
        setAuthCookie(res, token);
        res.json({ user: userWithoutPassword, token });
    } catch (error) {
        sendError(res, error, 'Ошибка при входе');
    }
};

// Получение данных текущего пользователя (Me)
const getMe = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            include: { 
                companies: true, 
                suppliers: {
                    include: {
                        country: true,
                        categories: {
                            include: { category: true }
                        }
                    }
                } 
            },
        });

        if (!user) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }

        // Сессии, начатые до появления cookie, получат её при первой загрузке приложения
        const bearer = req.headers.authorization?.split(' ')[1];
        if (bearer) setAuthCookie(res, bearer);

        const { password: _, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
    } catch (error) {
        sendError(res, error, 'Ошибка при получении профиля');
    }
};

// Смена пароля текущего пользователя.
// Все прежние токены (другие браузеры, украденный токен) перестают работать, текущей вкладке выдаём новый.
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (typeof currentPassword !== 'string' || !currentPassword || typeof newPassword !== 'string' || !newPassword) {
            return res.status(400).json({ error: 'Пожалуйста, укажите текущий и новый пароль' });
        }
        const pwdError = passwordError(newPassword);
        if (pwdError) return res.status(400).json({ error: pwdError });

        const user = await prisma.user.findUnique({ where: { id: req.user.id } });
        if (!user) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Неверный текущий пароль' });
        }
        if (await bcrypt.compare(newPassword, user.password)) {
            return res.status(400).json({ error: 'Новый пароль совпадает с текущим' });
        }

        const updated = await prisma.user.update({
            where: { id: req.user.id },
            data: { password: await bcrypt.hash(newPassword, 10), passwordChangedAt: new Date() },
        });

        const token = signToken(updated);
        setAuthCookie(res, token);
        res.json({ success: true, message: 'Пароль успешно изменен', token });
    } catch (error) {
        sendError(res, error, 'Ошибка при смене пароля');
    }
};

// Выход: удаляем cookie для скачивания файлов (токен в localStorage удаляет фронт)
const logout = (req, res) => {
    clearAuthCookie(res);
    res.json({ success: true });
};

module.exports = {
    logout,
    register,
    login,
    getMe,
    changePassword,
};
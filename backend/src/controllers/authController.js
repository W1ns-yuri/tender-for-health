const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');

// Регистрация нового пользователя
const register = async (req, res) => {
    try {
        const { username, password, firstName, lastName, middleName, position, phone, companyType, companyName, taxId, okpoCode, categoryIds, countryCode } = req.body;

        if (!username || !password || !firstName || !lastName || !phone) {
            return res.status(400).json({ error: 'Пожалуйста, заполните обязательные поля: username, password, firstName, lastName, phone' });
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
                    taxId: taxId || null,
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

        // Генерируем JWT-токен на 7 дней
        const token = jwt.sign(
            { userId: newUser.id, roleType: newUser.roleType },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        const { password: _, ...userWithoutPassword } = newUser;
        res.status(201).json({ user: userWithoutPassword, token });
    } catch (error) {
        res.status(500).json({ error: 'Ошибка при регистрации', details: error.message });
    }
};

// Вход в систему (логин)
const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
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

        const token = jwt.sign(
            { userId: user.id, roleType: user.roleType },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        const { password: _, ...userWithoutPassword } = user;
        res.json({ user: userWithoutPassword, token });
    } catch (error) {
        res.status(500).json({ error: 'Ошибка при входе', details: error.message });
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

        const { password: _, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка при получении профиля', details: error.message });
    }
};

// Смена пароля текущего пользователя
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Пожалуйста, укажите текущий и новый пароль' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'Новый пароль должен содержать не менее 6 символов' });
        }

        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
        });

        if (!user) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Неверный текущий пароль' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({
            where: { id: req.user.id },
            data: { password: hashedPassword },
        });

        res.json({ success: true, message: 'Пароль успешно изменен' });
    } catch (error) {
        res.status(500).json({ error: 'Ошибка при смене пароля', details: error.message });
    }
};

module.exports = {
    register,
    login,
    getMe,
    changePassword,
};
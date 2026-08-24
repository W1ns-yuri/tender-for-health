const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');

// Регистрация нового пользователя
const register = async (req, res) => {
    try {
        const { username, password, firstName, lastName, middleName, roleType, position } = req.body;

        if (!username || !password || !firstName || !lastName) {
            return res.status(400).json({ error: 'Пожалуйста, заполните обязательные поля: username, password, firstName, lastName' });
        }

        // Проверяем, существует ли уже пользователь с таким логином
        const existingUser = await prisma.user.findUnique({ where: { username } });
        if (existingUser) {
            return res.status(400).json({ error: 'Пользователь с таким логином уже существует' });
        }

        // Хешируем пароль (10 кругов соль)
        const hashedPassword = await bcrypt.hash(password, 10);

        // Создаем пользователя в БД
        const newUser = await prisma.user.create({
            data: {
                username,
                password: hashedPassword,
                firstName,
                lastName,
                middleName: middleName || null,
                roleType: roleType || 'SUPPLIER',
                position: position || null,
            },
        });

        // Генерируем JWT-токен на 7 дней
        const token = jwt.sign(
            { userId: newUser.id, roleType: newUser.roleType },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Не возвращаем хеш пароля в ответе
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

        // Ищем пользователя в БД
        const user = await prisma.user.findUnique({ where: { username }, include: { companies: true, suppliers: true } });
        if (!user) {
            return res.status(401).json({ error: 'Неверный логин или пароль' });
        }

        // Сравниваем введенный пароль с хешем из базы
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Неверный логин или пароль' });
        }

        // Создаем токен
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
            include: { companies: true, suppliers: true },
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

module.exports = {
    register,
    login,
    getMe,
};
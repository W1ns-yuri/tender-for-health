const prisma = require('../lib/prisma');
const bcrypt = require('bcryptjs');

// Получить всех пользователей (без паролей!)
const getUsers = async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                middleName: true,
                roleType: true,
                position: true,
                roleId: true,
                createdAt: true,
                updatedAt: true,
                companies: true,
            },
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка при получении пользователей', details: error.message });
    }
};

// Создать пользователя (с паролем)
const createUser = async (req, res) => {
    try {
        const { username, password, firstName, lastName, roleType } = req.body;

        if (!username || !password || !firstName || !lastName) {
            return res.status(400).json({ error: 'Обязательные поля: username, password, firstName, lastName' });
        }

        const existingUser = await prisma.user.findUnique({ where: { username } });
        if (existingUser) {
            return res.status(400).json({ error: 'Пользователь с таким логином уже существует' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await prisma.user.create({
            data: { username, password: hashedPassword, firstName, lastName, roleType: roleType || 'SUPPLIER' },
        });

        const { password: _, ...userWithoutPassword } = newUser;
        res.status(201).json(userWithoutPassword);
    } catch (error) {
        res.status(400).json({ error: 'Не удалось создать пользователя', details: error.message });
    }
};

module.exports = {
    getUsers,
    createUser,
};
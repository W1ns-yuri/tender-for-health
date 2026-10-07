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
                phone: true,
                isActive: true,
                lastLogin: true,
                roleId: true,
                createdAt: true,
                updatedAt: true,
                companies: true,
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка при получении пользователей', details: error.message });
    }
};

// Создать пользователя (с паролем)
const createUser = async (req, res) => {
    try {
        const { username, password, firstName, lastName, middleName, roleType, position, phone } = req.body;

        if (!username || !password || !firstName || !lastName) {
            return res.status(400).json({ error: 'Обязательные поля: username, password, firstName, lastName' });
        }

        const existingUser = await prisma.user.findUnique({ where: { username } });
        if (existingUser) {
            return res.status(400).json({ error: 'Пользователь с таким логином уже существует' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await prisma.user.create({
            data: {
                username,
                password: hashedPassword,
                firstName,
                lastName,
                middleName: middleName || null,
                roleType: roleType || 'SUPPLIER',
                position: position || null,
                phone: phone || null,
                isActive: true
            },
        });

        const { password: _, ...userWithoutPassword } = newUser;
        res.status(201).json(userWithoutPassword);
    } catch (error) {
        res.status(400).json({ error: 'Не удалось создать пользователя', details: error.message });
    }
};

// Обновить данные пользователя
const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { firstName, lastName, middleName, roleType, position, phone, isActive } = req.body;

        const updateData = {};
        if (firstName !== undefined) updateData.firstName = firstName;
        if (lastName !== undefined) updateData.lastName = lastName;
        if (middleName !== undefined) updateData.middleName = middleName;
        if (roleType !== undefined) updateData.roleType = roleType;
        if (position !== undefined) updateData.position = position;
        if (phone !== undefined) updateData.phone = phone;
        if (isActive !== undefined) updateData.isActive = Boolean(isActive);

        const updated = await prisma.user.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                middleName: true,
                roleType: true,
                position: true,
                phone: true,
                isActive: true,
                lastLogin: true,
                roleId: true,
                createdAt: true,
                updatedAt: true,
            }
        });

        res.json(updated);
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(400).json({ error: 'Не удалось обновить пользователя', details: error.message });
    }
};

// Переключить статус блокировки пользователя
const toggleUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await prisma.user.findUnique({ where: { id }, select: { isActive: true } });
        if (!user) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }

        const updated = await prisma.user.update({
            where: { id },
            data: { isActive: !user.isActive },
            select: { id: true, username: true, isActive: true }
        });

        res.json(updated);
    } catch (error) {
        console.error('Error toggling user status:', error);
        res.status(400).json({ error: 'Не удалось изменить статус пользователя', details: error.message });
    }
};

module.exports = {
    getUsers,
    createUser,
    updateUser,
    toggleUserStatus,
};
const prisma = require('../lib/prisma');
const bcrypt = require('bcryptjs');
const { ASSIGNABLE_ROLES, passwordError } = require('../utils/accountRules');
const { sendError } = require('../utils/httpErrors');

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
        sendError(res, error, 'Ошибка при получении пользователей');
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

        const pwdError = passwordError(password);
        if (pwdError) return res.status(400).json({ error: pwdError });
        if (roleType && !ASSIGNABLE_ROLES.includes(roleType)) {
            return res.status(400).json({ error: 'Недопустимая роль' });
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
        res.status(400).json({ error: 'Не удалось создать пользователя' });
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
        if (roleType !== undefined) {
            if (!ASSIGNABLE_ROLES.includes(roleType)) {
                return res.status(400).json({ error: 'Недопустимая роль' });
            }
            updateData.roleType = roleType;
        }
        // Админ не может случайно разжаловать или заблокировать сам себя и остаться без доступа
        if (id === req.user.id && ((roleType !== undefined && roleType !== 'ADMIN') || isActive === false)) {
            return res.status(400).json({ error: 'Нельзя снять с себя роль администратора или заблокировать себя' });
        }
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
        res.status(400).json({ error: 'Не удалось обновить пользователя' });
    }
};

// Переключить статус блокировки пользователя
const toggleUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        if (id === req.user.id) {
            return res.status(400).json({ error: 'Нельзя заблокировать самого себя' });
        }
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
        res.status(400).json({ error: 'Не удалось изменить статус пользователя' });
    }
};

module.exports = {
    getUsers,
    createUser,
    updateUser,
    toggleUserStatus,
};
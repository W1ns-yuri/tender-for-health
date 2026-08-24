    const prisma = require('../lib/prisma');
    const bcrypt = require('bcryptjs');
    const createCompany = async (req, res) => {
        try {
            const { name, inn, phone, address, username, password, email, license } = req.body;

            if (!username || !password || !name || !inn) {
                return res.status(400).json({ error: 'Пожалуйста, заполните обязательные поля: название, ИНН, логин и пароль' });
            }

            // Проверяем, существует ли уже пользователь
            const existingUser = await prisma.user.findUnique({ where: { username } });
            if (existingUser) {
                return res.status(400).json({ error: 'Пользователь с таким логином уже существует' });
            }

            // Проверяем, существует ли компания с таким же именем
            const existingCompany = await prisma.company.findFirst({
                where: { name: { equals: name, mode: 'insensitive' } }
            });
            if (existingCompany) {
                return res.status(400).json({ error: 'Компания с таким названием уже зарегистрирована' });
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            // Создаем пользователя и компанию в транзакции
            const result = await prisma.$transaction(async (tx) => {
                const user = await tx.user.create({
                    data: {
                        username,
                        password: hashedPassword,
                        firstName: name, // Имя пользователя = Название компании
                        lastName: 'Supplier',
                        roleType: 'SUPPLIER'
                    }
                });

                const company = await tx.company.create({
                    data: {
                        name,
                        inn,
                        phone,
                        address,
                        email,
                        license,
                        userId: user.id,
                    },
                });

                // Создаем также запись Supplier для обратной совместимости
                await tx.supplier.create({
                    data: {
                        userId: user.id,
                        name: name,
                        phone: phone,
                        address: address,
                        email: email,
                        licenseNumber: license,
                    }
                });

                return company;
            });

            res.status(201).json(result);
        } catch (error) {
            res.status(500).json({ error: 'Ошибка при создании компании', details: error.message });
        }
    };

    const getCompanies = async (req, res) => {
        try {
            const companies = await prisma.company.findMany({
                include: {
                    user: {
                        select: { id: true, username: true, firstName: true, lastName: true },
                    },
                },
            });

            res.json(companies);
        } catch (error) {
            res.status(500).json({ error: 'Ошибка при получении компаний', details: error.message });
        }
    };

    const updateCompany = async (req, res) => {
        try {
            const { id } = req.params;
            const { name, inn, phone, address, email, license, username, password } = req.body;
            const bcrypt = require('bcryptjs');

            // Проверяем, не занято ли имя другой компанией
            const existingCompany = await prisma.company.findFirst({
                where: { 
                    name: { equals: name, mode: 'insensitive' },
                    id: { not: id }
                }
            });
            if (existingCompany) {
                return res.status(400).json({ error: 'Компания с таким названием уже зарегистрирована' });
            }

            const company = await prisma.company.update({
                where: { id },
                data: { name, inn, phone, address, email, license }
            });

            // Синхронизируем email и license в Supplier
            await prisma.supplier.updateMany({
                where: { userId: company.userId },
                data: { email, phone, address, name, licenseNumber: license }
            });

            // Обновляем логин и пароль в User (если переданы)
            if (username || password) {
                const userDataToUpdate = {};
                if (username) {
                    const existingUser = await prisma.user.findFirst({
                        where: { username, id: { not: company.userId } }
                    });
                    if (existingUser) {
                        return res.status(400).json({ error: 'Пользователь с таким логином уже существует' });
                    }
                    userDataToUpdate.username = username;
                }
                if (password) {
                    userDataToUpdate.password = await bcrypt.hash(password, 10);
                }
                await prisma.user.update({
                    where: { id: company.userId },
                    data: userDataToUpdate
                });
            }

            res.json(company);
        } catch (error) {
            res.status(500).json({ error: 'Ошибка при обновлении компании', details: error.message });
        }
    };

    const deleteCompany = async (req, res) => {
        try {
            const { id } = req.params;

            // Находим компанию, чтобы узнать userId
            const company = await prisma.company.findUnique({ where: { id } });
            if (!company) {
                return res.status(404).json({ error: 'Компания не найдена' });
            }

            // Удаляем пользователя (компания удалится каскадно, если настроено Cascade)
            // Но мы вручную удалим сначала компанию, потом пользователя, или просто пользователя, а остальное Cascade
            await prisma.user.delete({
                where: { id: company.userId }
            });

            res.json({ message: 'Компания и связанный аккаунт успешно удалены' });
        } catch (error) {
            res.status(500).json({ error: 'Ошибка при удалении компании', details: error.message });
        }
    };

    const getCompanyStats = async (req, res) => {
        try {
            const { id } = req.params;
            const company = await prisma.company.findUnique({
                where: { id },
                include: { user: true }
            });

            if (!company) {
                return res.status(404).json({ error: 'Компания не найдена' });
            }

            // Получаем supplier, связанный с этой компанией
            const supplier = await prisma.supplier.findFirst({
                where: { userId: company.userId }
            });

            if (!supplier) {
                return res.json({ totalOffers: 0, wonOffers: 0 });
            }

            // Считаем все заявки (кроме TASLAMA/Черновиков, так как они еще не поданы)
            const totalOffers = await prisma.offer.count({
                where: {
                    supplierId: supplier.id,
                    status: { not: 'TASLAMA' }
                }
            });

            // Считаем победы
            const wonOffers = await prisma.offer.count({
                where: {
                    supplierId: supplier.id,
                    status: 'YENIJI'
                }
            });

            res.json({ totalOffers, wonOffers });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Ошибка при получении статистики компании' });
        }
    };

    module.exports = {
        createCompany,
        getCompanies,
        updateCompany,
        deleteCompany,
        getCompanyStats
    };
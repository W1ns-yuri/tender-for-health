const prisma = require('../lib/prisma');
const { sendNotification, notifyAdmins } = require('./notificationController');

// Вспомогательная функция определения измененных секций профиля поставщика для модератора
const detectProfileChanges = (supplier, body, cleanName, combinedPassport) => {
    const changes = [];

    // 1. Логотип компании
    if (body.logoUrl !== undefined && body.logoUrl !== (supplier.logoUrl || null)) {
        changes.push({
            field: 'logoUrl',
            key: 'changedFieldLogo',
            label: 'Логотип компании',
            labelTm: 'Kompaniýanyň logotipi',
            labelEn: 'Company Logo',
            description: body.logoUrl ? 'Загружено новое изображение логотипа компании' : 'Логотип удален'
        });
    }

    // 2. Банковские реквизиты
    const bankFields = ['bankName', 'bankAccount', 'bankMfo', 'bankCorrAccount', 'bankSwift', 'bankIban', 'bankCurrency'];
    const bankChanged = bankFields.some(f => body[f] !== undefined && body[f] !== (supplier[f] || ''));
    if (bankChanged) {
        changes.push({
            field: 'bank',
            key: 'changedFieldBank',
            label: 'Банковские реквизиты',
            labelTm: 'Bank maglumatlary',
            labelEn: 'Bank Details',
            description: 'Обновлены расчетные счета, реквизиты или банк'
        });
    }

    // 3. Медицинская лицензия Минздрава
    const licenseChanged = (
        (body.isMedicalLicensed !== undefined && Boolean(body.isMedicalLicensed) !== Boolean(supplier.isMedicalLicensed)) ||
        (body.licenseNumber !== undefined && body.licenseNumber !== (supplier.licenseNumber || '')) ||
        (body.licenseIssuedBy !== undefined && body.licenseIssuedBy !== (supplier.licenseIssuedBy || '')) ||
        (body.licenseExpiryDate !== undefined && String(body.licenseExpiryDate || '').slice(0, 10) !== String(supplier.licenseExpiryDate || '').slice(0, 10))
    );
    if (licenseChanged) {
        changes.push({
            field: 'license',
            key: 'changedFieldLicense',
            label: 'Медицинская лицензия',
            labelTm: 'Lukmançylyk ygtyýarnamasy',
            labelEn: 'Medical License',
            description: 'Обновлены номер, орган выдачи или срок действия лицензии'
        });
    }

    // 4. Юридический и фактический адрес, велаят
    const addressChanged = (
        (body.address !== undefined && body.address !== (supplier.address || '')) ||
        (body.legalAddress !== undefined && body.legalAddress !== (supplier.legalAddress || '')) ||
        (body.region !== undefined && body.region !== (supplier.region || ''))
    );
    if (addressChanged) {
        changes.push({
            field: 'address',
            key: 'changedFieldAddress',
            label: 'Адрес и регион',
            labelTm: 'Salgy we sebit',
            labelEn: 'Address & Region',
            description: 'Изменен фактический/юридический адрес или регион'
        });
    }

    // 5. Данные руководителя, паспортные данные, личный код, ОКПО, ИНН
    const directorChanged = (
        (body.directorName !== undefined && body.directorName !== (supplier.directorName || '')) ||
        (body.directorPersonalCode !== undefined && body.directorPersonalCode !== (supplier.directorPersonalCode || '')) ||
        (body.passportSeries !== undefined && body.passportSeries !== (supplier.passportSeries || '')) ||
        (body.passportIssuedBy !== undefined && body.passportIssuedBy !== (supplier.passportIssuedBy || '')) ||
        (body.okpoCode !== undefined && body.okpoCode !== (supplier.okpoCode || '')) ||
        (body.taxId !== undefined && body.taxId !== (supplier.taxId || '')) ||
        (combinedPassport && combinedPassport !== (supplier.passportInfo || ''))
    );
    if (directorChanged) {
        changes.push({
            field: 'director',
            key: 'changedFieldDirector',
            label: 'Данные руководителя / Паспорт',
            labelTm: 'Ýolbaşçy / Pasport maglumatlary',
            labelEn: 'Director / Passport Data',
            description: 'Изменены ФИО руководителя, паспортные данные, личный код или ИНН/ОКПО'
        });
    }

    // 6. Сферы / категории деятельности
    if (body.categoryIds !== undefined && Array.isArray(body.categoryIds)) {
        const oldCatIds = (supplier.categories || []).map(c => String(c.categoryId)).sort();
        const newCatIds = body.categoryIds.map(String).sort();
        if (JSON.stringify(oldCatIds) !== JSON.stringify(newCatIds)) {
            changes.push({
                field: 'categories',
                key: 'changedFieldCategories',
                label: 'Сферы деятельности',
                labelTm: 'Iş ugurlary',
                labelEn: 'Business Categories',
                description: `Обновлен перечень категорий (выбрано: ${newCatIds.length})`
            });
        }
    }

    // 7. Наименование компании и организационная форма
    if ((cleanName && cleanName !== supplier.name) || (body.type && body.type !== supplier.type)) {
        changes.push({
            field: 'name',
            key: 'changedFieldName',
            label: 'Наименование / Форма компании',
            labelTm: 'Kompaniýanyň ady / Görnüşi',
            labelEn: 'Company Name / Legal Form',
            description: `Изменено наименование или форма: «${cleanName || supplier.name}»`
        });
    }

    // 8. Контактная информация (телефон, email)
    const contactsChanged = (
        (body.phone !== undefined && body.phone !== (supplier.phone || '')) ||
        (body.email !== undefined && body.email !== (supplier.email || ''))
    );
    if (contactsChanged) {
        changes.push({
            field: 'contacts',
            key: 'changedFieldContacts',
            label: 'Контактные данные',
            labelTm: 'Habarlaşmak maglumatlary',
            labelEn: 'Contact Info',
            description: 'Обновлен контактный номер телефона или email компании'
        });
    }

    return changes;
};

// Обычный пользователь (Поставщик) обновляет свой профиль (Шаг 2 верификации)
const updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { 
            name, type, address, legalAddress, region, 
            bankName, bankAccount, bankMfo, bankCorrAccount, bankSwift, bankIban, bankCurrency,
            passportInfo, passportSeries, passportIssuedBy, 
            directorName, directorPersonalCode, okpoCode, taxId,
            isMedicalLicensed, licenseNumber, licenseIssuedBy, licenseExpiryDate,
            email, phone, categoryIds, logoUrl, countryId, submitForReview 
        } = req.body;

        // Ищем поставщика с его текущими категориями для точного вычисления изменений
        const supplier = await prisma.supplier.findFirst({
            where: { userId },
            include: {
                categories: true,
                files: { include: { document: true } }
            }
        });

        if (!supplier) {
            return res.status(404).json({ error: 'Профиль поставщика не найден' });
        }

        // Валидация срока действия медицинской лицензии при отправке на проверку
        const willSubmitForReview = submitForReview !== false;
        if (willSubmitForReview && isMedicalLicensed) {
            if (!licenseNumber || !licenseNumber.trim()) {
                return res.status(400).json({ error: 'Укажите номер медицинской лицензии Минздрава' });
            }
            if (licenseExpiryDate) {
                const expiry = new Date(licenseExpiryDate);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                if (expiry < today) {
                    return res.status(400).json({ error: 'Внимание: срок действия вашей медицинской лицензии истек' });
                }
            }
        }

        // Очищаем наименование от случайных приставок формы
        let cleanName = supplier.name;
        if (name && typeof name === 'string' && name.trim()) {
            cleanName = name.trim().replace(/^(ип|хо|ооо|чп|hj|dh|hk|telekeçi|hojalyk\s+jemgyýeti|hususy\s+telekeçi|hususy\s+kärhana)\s*["«'”]?\s*/i, '').replace(/["»'”]$/, '').trim() || name.trim();
        }

        const combinedPassport = passportInfo || [passportSeries, passportIssuedBy].filter(Boolean).join(', ');
        const previousStatus = supplier.verificationStatus;
        const newStatus = willSubmitForReview ? 'PENDING_REVIEW' : supplier.verificationStatus;

        // Вычисляем конкретный список изменений (diff)
        const changedFields = detectProfileChanges(supplier, req.body, cleanName, combinedPassport);

        // Формируем структурированные данные изменений для модератора
        let moderationNotes = supplier.notes;
        if (willSubmitForReview) {
            if (changedFields.length > 0) {
                moderationNotes = JSON.stringify({
                    type: 'PROFILE_CHANGES',
                    submittedAt: new Date().toISOString(),
                    previousStatus,
                    changes: changedFields,
                    summary: changedFields.map(c => c.label).join(', ')
                });
            } else if (previousStatus === 'PENDING') {
                moderationNotes = JSON.stringify({
                    type: 'INITIAL_SUBMISSION',
                    submittedAt: new Date().toISOString(),
                    previousStatus,
                    changes: [{
                        field: 'initial',
                        key: 'initialSubmissionNotice',
                        label: 'Первичная анкета',
                        labelTm: 'Ilkinji anketany bermek',
                        labelEn: 'Initial Application',
                        description: 'Первичная подача полного пакета данных на верификацию'
                    }],
                    summary: 'Первичная анкета'
                });
            }
        }

        // Обновляем Supplier и его категории в транзакции
        const updatedSupplier = await prisma.$transaction(async (tx) => {
            await tx.supplier.update({
                where: { id: supplier.id },
                data: {
                    name: cleanName,
                    type: type || supplier.type,
                    address,
                    ...(legalAddress !== undefined ? { legalAddress } : {}),
                    region,
                    bankName,
                    bankAccount,
                    bankMfo,
                    ...(bankCorrAccount !== undefined ? { bankCorrAccount } : {}),
                    ...(bankSwift !== undefined ? { bankSwift } : {}),
                    ...(bankIban !== undefined ? { bankIban } : {}),
                    ...(bankCurrency !== undefined ? { bankCurrency } : {}),
                    passportInfo: combinedPassport,
                    passportSeries,
                    passportIssuedBy,
                    ...(directorPersonalCode !== undefined ? { directorPersonalCode } : {}),
                    ...(okpoCode !== undefined ? { okpoCode } : {}),
                    ...(taxId !== undefined ? { taxId } : {}),
                    ...(isMedicalLicensed !== undefined ? { isMedicalLicensed: Boolean(isMedicalLicensed) } : {}),
                    ...(licenseNumber !== undefined ? { licenseNumber } : {}),
                    ...(licenseIssuedBy !== undefined ? { licenseIssuedBy } : {}),
                    ...(licenseExpiryDate !== undefined ? { licenseExpiryDate } : {}),
                    ...(countryId !== undefined ? { countryId: countryId || null } : {}),
                    email,
                    phone, // Сохраняем рабочий телефон в профиле компании
                    verificationStatus: newStatus,
                    notes: moderationNotes,
                    ...(directorName !== undefined ? { directorName } : {}),
                    ...(logoUrl !== undefined ? { logoUrl } : {}),
                },
            });

            if (categoryIds !== undefined && Array.isArray(categoryIds)) {
                await tx.supplierCategory.deleteMany({ where: { supplierId: supplier.id } });
                if (categoryIds.length > 0) {
                    await tx.supplierCategory.createMany({
                        data: categoryIds.map(cId => ({ supplierId: supplier.id, categoryId: cId })),
                        skipDuplicates: true
                    });
                }
            }

            if (phone) {
                await tx.user.update({
                    where: { id: userId },
                    data: { phone }
                });
            }

            return tx.supplier.findUnique({
                where: { id: supplier.id },
                include: {
                    country: true,
                    files: { include: { document: true } },
                    categories: { include: { category: true } }
                }
            });
        });

        // Записываем событие в историю модерации (SupplierModerationLog)
        if (willSubmitForReview) {
            try {
                const logAction = previousStatus === 'VERIFIED' ? 'PROFILE_UPDATED' : (previousStatus === 'REJECTED' ? 'RESUBMITTED' : 'SUBMITTED');
                const logReason = changedFields.length > 0 
                    ? `Изменения: ${changedFields.map(c => c.label).join(', ')}`
                    : (previousStatus === 'REJECTED' 
                        ? 'Повторная подача профиля на проверку после исправления замечаний' 
                        : 'Подача профиля на верификацию');

                await prisma.supplierModerationLog.create({
                    data: {
                        supplierId: supplier.id,
                        action: logAction,
                        previousStatus,
                        newStatus: 'PENDING_REVIEW',
                        reason: logReason
                    }
                });
            } catch (logErr) {
                console.error('Ошибка записи лога модерации:', logErr);
            }
        }

        // Оповещаем администраторов о поступлении анкеты поставщика на модерацию с конкретным списком изменений
        if (willSubmitForReview) {
            const changeSummary = changedFields.length > 0 ? ` (изменено: ${changedFields.map(c => c.label).join(', ')})` : '';
            notifyAdmins({
                title: previousStatus === 'VERIFIED' ? 'Изменение реквизитов поставщика' : 'Анкета поставщика ожидает модерации',
                message: `«${cleanName}» направил профиль компании на рассмотрение${changeSummary}.`,
                type: 'supplier',
                link: `/suppliers/${supplier.id}`
            }).catch(e => console.error('Error notifying admins:', e));
        }

        res.json(updatedSupplier);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка обновления профиля', details: error.message });
    }
};

// Администратор получает список всех поставщиков, требующих проверки
const getPendingSuppliers = async (req, res) => {
    try {
        const pending = await prisma.supplier.findMany({
            where: { verificationStatus: 'PENDING_REVIEW' },
            include: { 
                user: true, 
                files: { include: { document: true } },
                categories: { include: { category: true } },
                moderationLogs: {
                    include: { admin: { select: { firstName: true, lastName: true, username: true } } },
                    orderBy: { createdAt: 'desc' }
                }
            },
            orderBy: { updatedAt: 'desc' }
        });
        res.json(pending);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка при получении списка на модерацию', details: error.message });
    }
};

// Администратор получает реестр всех зарегистрированных поставщиков с фильтрацией
const getAllSuppliers = async (req, res) => {
    try {
        const { search, status, categoryId } = req.query;
        const where = {};
        if (status) {
            where.verificationStatus = status;
        }
        if (categoryId) {
            where.categories = {
                some: { categoryId }
            };
        }
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { taxId: { contains: search, mode: 'insensitive' } },
                { regNumber: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search, mode: 'insensitive' } },
            ];
        }

        const suppliers = await prisma.supplier.findMany({
            where,
            include: {
                user: { select: { id: true, username: true, phone: true } },
                country: true,
                files: { include: { document: true } },
                categories: { include: { category: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(suppliers);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка при получении реестра поставщиков', details: error.message });
    }
};

// Получение полной информации о поставщике по id (для профиля и модерации)
const getSupplierById = async (req, res) => {
    try {
        const { id } = req.params;
        const supplier = await prisma.supplier.findUnique({
            where: { id },
            include: {
                user: { select: { id: true, username: true, phone: true, firstName: true, lastName: true, middleName: true, createdAt: true } },
                country: true,
                files: {
                    include: { document: true }
                },
                categories: {
                    include: { category: true }
                },
                moderationLogs: {
                    include: { admin: { select: { firstName: true, lastName: true, username: true } } },
                    orderBy: { createdAt: 'desc' }
                }
            }
        });
        if (!supplier) {
            return res.status(404).json({ error: 'Поставщик не найден' });
        }

        // Защита персональных и финансовых данных: обычный поставщик может просматривать только свой собственный профиль
        if (req.user && req.user.roleType !== 'ADMIN' && supplier.userId !== req.user.id) {
            return res.status(403).json({ error: 'У вас нет прав на просмотр конфиденциальных данных этого поставщика' });
        }

        res.json(supplier);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка при получении данных поставщика', details: error.message });
    }
};

// Получение статистики предложений поставщика (всего заявок, выиграно)
const getSupplierStats = async (req, res) => {
    try {
        const { id } = req.params;
        const supplier = await prisma.supplier.findUnique({ where: { id } });
        if (!supplier) {
            return res.status(404).json({ error: 'Поставщик не найден' });
        }

        if (req.user && req.user.roleType !== 'ADMIN' && supplier.userId !== req.user.id) {
            return res.status(403).json({ error: 'Нет доступа к статистике этого поставщика' });
        }

        const totalOffers = await prisma.offer.count({
            where: {
                supplierId: id,
                status: { not: 'TASLAMA' }
            }
        });

        const wonOffers = await prisma.offer.count({
            where: {
                supplierId: id,
                status: 'YENIJI'
            }
        });

        res.json({ totalOffers, wonOffers });
    } catch (error) {
        res.status(500).json({ error: 'Ошибка получения статистики поставщика', details: error.message });
    }
};

// Администратор удаляет поставщика
const deleteSupplier = async (req, res) => {
    try {
        const { id } = req.params;
        const supplier = await prisma.supplier.findUnique({ where: { id } });
        if (!supplier) {
            return res.status(404).json({ error: 'Поставщик не найден' });
        }

        await prisma.$transaction([
            prisma.supplierModerationLog.deleteMany({ where: { supplierId: id } }),
            prisma.supplierFile.deleteMany({ where: { supplierId: id } }),
            prisma.supplier.delete({ where: { id } }),
        ]);

        res.json({ message: 'Поставщик успешно удален' });
    } catch (error) {
        res.status(500).json({ error: 'Ошибка при удалении поставщика', details: error.message });
    }
};

// Администратор обновляет данные любого поставщика
const adminUpdateSupplier = async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            name, inn, taxId, okpoCode, phone, address, legalAddress, email, 
            license, licenseNumber, licenseIssuedBy, licenseExpiryDate, isMedicalLicensed,
            bankName, bankAccount, bankMfo, bankCorrAccount, bankSwift, bankIban, bankCurrency,
            directorName, directorPersonalCode, countryId, isActive, categoryIds, logoUrl 
        } = req.body;
        const finalTaxId = taxId || inn;
        const finalLicense = licenseNumber || license;

        const updated = await prisma.$transaction(async (tx) => {
            await tx.supplier.update({
                where: { id },
                data: {
                    ...(name ? { name } : {}),
                    ...(finalTaxId !== undefined ? { taxId: finalTaxId } : {}),
                    ...(okpoCode !== undefined ? { okpoCode } : {}),
                    ...(phone !== undefined ? { phone } : {}),
                    ...(address !== undefined ? { address } : {}),
                    ...(legalAddress !== undefined ? { legalAddress } : {}),
                    ...(email !== undefined ? { email } : {}),
                    ...(finalLicense !== undefined ? { licenseNumber: finalLicense } : {}),
                    ...(licenseIssuedBy !== undefined ? { licenseIssuedBy } : {}),
                    ...(licenseExpiryDate !== undefined ? { licenseExpiryDate } : {}),
                    ...(isMedicalLicensed !== undefined ? { isMedicalLicensed: Boolean(isMedicalLicensed) } : {}),
                    ...(bankName !== undefined ? { bankName } : {}),
                    ...(bankAccount !== undefined ? { bankAccount } : {}),
                    ...(bankMfo !== undefined ? { bankMfo } : {}),
                    ...(bankCorrAccount !== undefined ? { bankCorrAccount } : {}),
                    ...(bankSwift !== undefined ? { bankSwift } : {}),
                    ...(bankIban !== undefined ? { bankIban } : {}),
                    ...(bankCurrency !== undefined ? { bankCurrency } : {}),
                    ...(directorPersonalCode !== undefined ? { directorPersonalCode } : {}),
                    ...(countryId !== undefined ? { countryId: countryId || null } : {}),
                    ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {}),
                    ...(directorName !== undefined ? { directorName } : {}),
                    ...(logoUrl !== undefined ? { logoUrl } : {}),
                }
            });

            if (categoryIds !== undefined && Array.isArray(categoryIds)) {
                await tx.supplierCategory.deleteMany({ where: { supplierId: id } });
                if (categoryIds.length > 0) {
                    await tx.supplierCategory.createMany({
                        data: categoryIds.map(cId => ({ supplierId: id, categoryId: cId })),
                        skipDuplicates: true
                    });
                }
            }

            return tx.supplier.findUnique({
                where: { id },
                include: {
                    user: { select: { id: true, username: true, phone: true } },
                    country: true,
                    files: { include: { document: true } },
                    categories: { include: { category: true } }
                }
            });
        });

        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка обновления поставщика', details: error.message });
    }
};

// Администратор одобряет
const approveSupplier = async (req, res) => {
    try {
        const { id } = req.params;
        const { categoryIds } = req.body || {};

        const previousSupplier = await prisma.supplier.findUnique({
            where: { id },
            select: { verificationStatus: true, name: true }
        });

        const updated = await prisma.$transaction(async (tx) => {
            if (categoryIds !== undefined && Array.isArray(categoryIds)) {
                await tx.supplierCategory.deleteMany({ where: { supplierId: id } });
                if (categoryIds.length > 0) {
                    await tx.supplierCategory.createMany({
                        data: categoryIds.map(cId => ({ supplierId: id, categoryId: cId })),
                        skipDuplicates: true
                    });
                }
            }

            return tx.supplier.update({
                where: { id },
                data: {
                    verificationStatus: 'VERIFIED',
                    rejectionReason: null,
                    notes: null
                },
                include: {
                    categories: { include: { category: true } }
                }
            });
        });

        // Записываем одобрение в архив / историю модерации
        try {
            await prisma.supplierModerationLog.create({
                data: {
                    supplierId: id,
                    adminId: req.user?.id || null,
                    action: 'APPROVED',
                    previousStatus: previousSupplier?.verificationStatus || 'PENDING_REVIEW',
                    newStatus: 'VERIFIED',
                    reason: null
                }
            });
        } catch (logErr) {
            console.error('Ошибка записи лога одобрения:', logErr);
        }

        // Оповещаем поставщика об успешной верификации
        if (updated?.userId) {
            sendNotification({
                userId: updated.userId,
                title: 'Верификация компании подтверждена',
                message: 'Администратор одобрил ваши уставные документы. Вам открыт полный доступ к подаче коммерческих предложений.',
                type: 'supplier',
                link: '/profile'
            }).catch(e => console.error('Error notifying supplier of approval:', e));
        }

        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка при одобрении', details: error.message });
    }
};

// Администратор отклоняет
const rejectSupplier = async (req, res) => {
    try {
        const { id } = req.params;
        const { rejectionReason } = req.body;

        const previousSupplier = await prisma.supplier.findUnique({
            where: { id },
            select: { verificationStatus: true, name: true }
        });

        const updated = await prisma.supplier.update({
            where: { id },
            data: {
                verificationStatus: 'REJECTED',
                rejectionReason
            }
        });

        // Записываем отклонение в архив / историю модерации
        try {
            await prisma.supplierModerationLog.create({
                data: {
                    supplierId: id,
                    adminId: req.user?.id || null,
                    action: 'REJECTED',
                    previousStatus: previousSupplier?.verificationStatus || 'PENDING_REVIEW',
                    newStatus: 'REJECTED',
                    reason: rejectionReason
                }
            });
        } catch (logErr) {
            console.error('Ошибка записи лога отклонения:', logErr);
        }

        // Оповещаем поставщика о замечаниях и причине отклонения
        if (updated?.userId) {
            sendNotification({
                userId: updated.userId,
                title: 'Заявка на верификацию отклонена',
                message: `Причина: ${rejectionReason || 'Несоответствие регистрационных документов требованиям'}. Исправьте замечания в профиле и отправьте на повторную проверку.`,
                type: 'warning',
                link: '/profile'
            }).catch(e => console.error('Error notifying supplier of rejection:', e));
        }

        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка при отклонении', details: error.message });
    }
};

// Администратор получает архив и статистику всех решений по модерации
const getModerationArchive = async (req, res) => {
    try {
        const logs = await prisma.supplierModerationLog.findMany({
            include: {
                supplier: {
                    select: {
                        id: true,
                        name: true,
                        type: true,
                        taxId: true,
                        email: true,
                        phone: true
                    }
                },
                admin: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        username: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 200
        });

        const [totalApproved, totalRejected, pendingCount] = await Promise.all([
            prisma.supplierModerationLog.count({ where: { action: 'APPROVED' } }),
            prisma.supplierModerationLog.count({ where: { action: 'REJECTED' } }),
            prisma.supplier.count({ where: { verificationStatus: { in: ['PENDING', 'PENDING_REVIEW'] } } })
        ]);

        res.json({
            logs,
            stats: {
                totalDecisions: totalApproved + totalRejected,
                totalApproved,
                totalRejected,
                pendingCount
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Ошибка при получении архива модерации', details: error.message });
    }
};

module.exports = {
    getAllSuppliers,
    deleteSupplier,
    adminUpdateSupplier,
    updateProfile,
    getPendingSuppliers,
    getSupplierById,
    getSupplierStats,
    approveSupplier,
    rejectSupplier,
    getModerationArchive
};

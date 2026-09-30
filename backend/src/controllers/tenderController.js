const prisma = require('../lib/prisma');

// Генерация последовательного номера тендера вида TNDR-YYYY-MM-001
const generateNextTenderNumber = async (txOrPrisma = prisma) => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const prefix = `TNDR-${year}-${month}-`;

    const existingTenders = await txOrPrisma.tender.findMany({
        where: {
            tenderNumber: {
                startsWith: prefix
            }
        },
        select: { tenderNumber: true }
    });

    let maxSeq = 0;
    for (const t of existingTenders) {
        const numPart = t.tenderNumber.replace(prefix, '');
        const parsed = parseInt(numPart, 10);
        if (!isNaN(parsed) && parsed > maxSeq) {
            maxSeq = parsed;
        }
    }

    const nextSeq = String(maxSeq + 1).padStart(3, '0');
    return `${prefix}${nextSeq}`;
};

const getNextNumber = async (req, res) => {
    try {
        const nextNumber = await generateNextTenderNumber();
        res.json({ nextTenderNumber: nextNumber });
    } catch (error) {
        console.error('Error generating next tender number:', error);
        res.status(500).json({ error: 'Ошибка генерации номера тендера' });
    }
};

// Создание тендера заказчиком / специалистом по закупкам / админом
const createTender = async (req, res) => {
    try {
        const {
            tenderNumber,
            title,
            deadline,
            categoryId,
            clientId,
            status,
            lots,
            technicalSpecs,
            additionalRequirements,
            paymentTerms,
        } = req.body;

        const createdById = req.user?.id || req.user?.userId;
        if (!createdById) {
            return res.status(401).json({ error: 'Пользователь не авторизован' });
        }

        // Проверка корректности дедлайна и даты объявления в соответствии с регламентом закупок
        if (!deadline || isNaN(new Date(deadline).getTime())) {
            return res.status(400).json({ error: 'Пожалуйста, укажите корректный крайний срок подачи заявок (дедлайн)' });
        }
        const deadlineDate = new Date(deadline);
        const announcementDate = req.body.announcementDate ? new Date(req.body.announcementDate) : new Date();
        if (deadlineDate <= announcementDate) {
            return res.status(400).json({ error: 'Крайний срок подачи заявок (дедлайн) должен быть позже даты объявления тендера' });
        }

        const tender = await prisma.$transaction(async (tx) => {
            // 1. Проверяем уникальность номера тендера
            const finalTenderNumber = (tenderNumber && tenderNumber.trim() !== '')
                ? tenderNumber.trim()
                : await generateNextTenderNumber(tx);

            const existingTender = await tx.tender.findFirst({
                where: { tenderNumber: { equals: finalTenderNumber, mode: 'insensitive' } }
            });
            if (existingTender) {
                const err = new Error(`Тендер с номером "${finalTenderNumber}" уже существует! Пожалуйста, укажите уникальный номер.`);
                err.isClientError = true;
                throw err;
            }

            const newTender = await tx.tender.create({
                data: {
                    tenderNumber: finalTenderNumber,
                    title: title || 'Без названия',
                    description: req.body.description || null,
                    technicalSpecs: technicalSpecs || null,
                    type: req.body.type || 'YERLI',
                    visibility: req.body.visibility || 'ACYK',
                    status: status || 'ACYK',
                    announcementDate: announcementDate,
                    deadline: deadlineDate,
                    categoryId: (categoryId && categoryId !== '') ? categoryId : null,
                    clientId: (clientId && clientId !== '') ? clientId : null,
                    procurementType: req.body.procurementType || 'GOODS',
                    createdById: req.user.id,
                }
            });

            // 2. Создаем лоты и спецификации
            let parsedLots = lots;
            if (!parsedLots || !Array.isArray(parsedLots)) {
                if (req.body.specs && Array.isArray(req.body.specs)) {
                    parsedLots = [{ name: 'Основной лот', specs: req.body.specs }];
                } else {
                    parsedLots = [];
                }
            }

            for (let i = 0; i < parsedLots.length; i++) {
                const lot = parsedLots[i];
                const newLot = await tx.tenderLot.create({
                    data: {
                        name: lot.name || `Лот №${i + 1}`,
                        tenderId: newTender.id,
                        lotNumber: parseInt(lot.lotNumber, 10) || (i + 1),
                        description: lot.description || null,
                        lotType: lot.lotType || 'GOODS',
                        categoryId: (lot.categoryId && lot.categoryId !== '') ? lot.categoryId : null,
                        endUser: lot.endUser ? lot.endUser.trim() : null,
                        deliveryTermId: (lot.deliveryTermId && lot.deliveryTermId !== '') ? lot.deliveryTermId : null,
                        deliveryAddress: lot.deliveryAddress || null,
                        workAddress: lot.workAddress || null,
                        workPeriod: lot.workPeriod || null,
                        licenseRequired: Boolean(lot.licenseRequired),
                        serviceFormat: lot.serviceFormat || null,
                        slaPeriod: lot.slaPeriod || null,
                    }
                });

                if (lot.specs && Array.isArray(lot.specs)) {
                    const validSpecs = lot.specs.filter(s => (s.name || s.haryt) && (s.name || s.haryt).trim() !== '');
                    if (validSpecs.length > 0) {
                        await tx.tenderSpecification.createMany({
                            data: validSpecs.map((spec, sIdx) => ({
                                tenderId: newTender.id,
                                lotId: newLot.id,
                                positionNumber: parseInt(spec.positionNumber, 10) || (sIdx + 1),
                                generalProductId: (spec.generalProductId && spec.generalProductId !== '') ? spec.generalProductId : null,
                                name: (spec.name || spec.haryt || '').trim(),
                                quantity: parseFloat(spec.quantity || spec.mukdar) || 1,
                                unitId: (spec.unitId && spec.unitId !== '') ? spec.unitId : ((spec.unit && spec.unit !== '') ? spec.unit : null),
                                manufacturerId: (spec.manufacturerId && spec.manufacturerId !== '') ? spec.manufacturerId : ((spec.brand && spec.brand !== '') ? spec.brand : null),
                                description: (spec.description || spec.desc || '').trim() || null
                            }))
                        });
                    }
                }
            }

            // 3. Привязываем загруженные документы к тендеру
            const documents = req.body.documents;
            if (documents && Array.isArray(documents) && documents.length > 0) {
                for (const docId of documents) {
                    if (docId && typeof docId === 'string' && docId.length > 10) {
                        const existingDoc = await tx.document.findUnique({ where: { id: docId } });
                        if (existingDoc) {
                            await tx.tenderFile.create({
                                data: {
                                    tenderId: newTender.id,
                                    documentId: docId
                                }
                            });
                            await tx.document.update({
                                where: { id: docId },
                                data: { tenderId: newTender.id }
                            });
                        }
                    }
                }
            }

            // 4. Приглашенные поставщики (для закрытых тендеров YAPYK)
            const invitedSupplierIds = req.body.invitedSupplierIds;
            if (req.body.visibility === 'YAPYK' && Array.isArray(invitedSupplierIds) && invitedSupplierIds.length > 0) {
                const uniqueSupplierIds = [...new Set(invitedSupplierIds.filter(Boolean))];
                await tx.tenderInvitedSupplier.createMany({
                    data: uniqueSupplierIds.map(sId => ({
                        tenderId: newTender.id,
                        supplierId: sId,
                    }))
                });
            }

            return await tx.tender.findUnique({
                where: { id: newTender.id },
                include: {
                    lots: {
                        include: {
                            deliveryTerm: true,
                            specs: {
                                include: {
                                    generalProduct: true,
                                    unit: true,
                                    manufacturer: true,
                                }
                            }
                        }
                    },
                    files: {
                        include: {
                            document: true
                        }
                    },
                    invitedSuppliers: {
                        include: {
                            supplier: {
                                select: { id: true, name: true, taxId: true, type: true, logoUrl: true }
                            }
                        }
                    },
                    createdBy: {
                        select: { id: true, username: true, firstName: true, lastName: true, roleType: true },
                    },
                    category: true,
                    client: true,
                }
            });
        });

        res.status(201).json(tender);
    } catch (error) {
        console.error('CreateTender Error:', error);
        res.status(error.isClientError ? 400 : 500).json({ error: error.message || 'Ошибка при создании тендера', details: error.message });
    }
};

const getTenders = async (req, res) => {
    try {
        const { tenderNumber, lotNumber, status, type, visibility, categoryId, search, onlyInvited } = req.query;

        const where = {};
        const numberQuery = tenderNumber || lotNumber;
        if (numberQuery) where.tenderNumber = { contains: numberQuery, mode: 'insensitive' };
        if (status) where.status = status;
        if (type) where.type = type;
        if (visibility) where.visibility = visibility;
        if (categoryId) where.categoryId = categoryId;

        // Скрытие черновиков (TASLAMA): только администраторы могут видеть черновики тендеров
        if (!req.user || req.user.roleType !== 'ADMIN') {
            if (where.status === 'TASLAMA') {
                return res.json([]);
            }
            if (!where.status) {
                where.status = { not: 'TASLAMA' };
            }
        }

        where.AND = where.AND || [];

        // Неавторизованные пользователи видят ТОЛЬКО открытые (ACYK) тендеры
        if (!req.user) {
            where.AND.push({ visibility: 'ACYK' });
        }

        if (search) {
            where.AND.push({
                OR: [
                    { tenderNumber: { contains: search, mode: 'insensitive' } },
                    { title: { contains: search, mode: 'insensitive' } },
                    { description: { contains: search, mode: 'insensitive' } },
                ]
            });
        }

        // Персонализация выдачи и контроль доступа для закрытых тендеров (YAPYK)
        if (req.user && req.user.roleType === 'SUPPLIER') {
            const supplier = await prisma.supplier.findFirst({
                where: { userId: req.user.id },
                include: { categories: true }
            });

            if (supplier) {
                const catIds = (supplier.categories || []).map(c => c.categoryId);
                const categoryFilter = catIds.length > 0 ? [
                    { categoryId: { in: catIds } },
                    { lots: { some: { categoryId: { in: catIds } } } },
                    {
                        AND: [
                            { categoryId: null },
                            { lots: { none: { categoryId: { not: null } } } }
                        ]
                    }
                ] : [];

                if (onlyInvited === 'true') {
                    // Только персональные приглашения в закрытые тендеры
                    where.AND.push({
                        invitedSuppliers: {
                            some: { supplierId: supplier.id }
                        }
                    });
                } else {
                    // Поставщик видит:
                    // 1) Открытые (ACYK) тендеры по своим направлениям
                    // 2) ИЛИ закрытые (YAPYK), куда его персонально пригласили
                    where.AND.push({
                        OR: [
                            {
                                visibility: 'ACYK',
                                ...(categoryFilter.length > 0 ? { OR: categoryFilter } : {})
                            },
                            {
                                visibility: 'YAPYK',
                                invitedSuppliers: {
                                    some: { supplierId: supplier.id }
                                }
                            }
                        ]
                    });
                }
            } else {
                where.AND.push({ visibility: 'ACYK' });
            }
        }

        const tenders = await prisma.tender.findMany({
            where,
            include: {
                lots: {
                    orderBy: { lotNumber: 'asc' },
                    include: {
                        category: true,
                        deliveryTerm: true,
                        specs: {
                            include: { generalProduct: true, unit: true, manufacturer: true },
                            orderBy: { positionNumber: 'asc' }
                        },
                        files: {
                            include: { document: true }
                        }
                    }
                },
                specs: {
                    include: { generalProduct: true, unit: true, manufacturer: true },
                },
                createdBy: {
                    select: { id: true, username: true, firstName: true, lastName: true },
                },
                category: true,
                client: true,
                invitedSuppliers: {
                    select: {
                        id: true,
                        supplierId: true,
                        isViewed: true,
                        viewedAt: true,
                        supplier: {
                            select: { id: true, name: true, taxId: true, logoUrl: true }
                        }
                    }
                },
                _count: { select: { offers: true } },
            },
            orderBy: { createdAt: 'desc' },
        });

        res.json(tenders);
    } catch (error) {
        console.error('GetTenders Error:', error);
        res.status(500).json({ error: 'Ошибка при получении списка тендеров', details: error.message });
    }
};

// Получение одного тендера по ID со всеми деталями
const getTenderById = async (req, res) => {
    try {
        const { id } = req.params;
        const tenderBase = await prisma.tender.findUnique({
            where: { id },
            select: { status: true, visibility: true }
        });

        if (!tenderBase) {
            return res.status(404).json({ error: 'Тендер не найден' });
        }

        if (tenderBase.status === 'TASLAMA' && (!req.user || req.user.roleType !== 'ADMIN')) {
            return res.status(403).json({ error: 'Черновик тендера доступен только администратору' });
        }

        // Проверка прав доступа для закрытого тендера (YAPYK)
        if (tenderBase.visibility === 'YAPYK') {
            if (!req.user) {
                return res.status(401).json({ error: 'Для доступа к закрытому тендеру требуется авторизация' });
            }
            if (req.user.roleType === 'SUPPLIER') {
                const supplier = await prisma.supplier.findFirst({
                    where: { userId: req.user.id }
                });
                if (!supplier) {
                    return res.status(403).json({ error: 'Профиль поставщика не найден' });
                }

                const supplierInvitation = await prisma.tenderInvitedSupplier.findUnique({
                    where: {
                        tenderId_supplierId: {
                            tenderId: id,
                            supplierId: supplier.id
                        }
                    }
                });

                if (!supplierInvitation) {
                    return res.status(403).json({
                        error: 'Доступ ограничен: данный тендер является закрытым и доступен только по персональному приглашению организатора'
                    });
                }

                // Отмечаем, что приглашенный поставщик открыл и просмотрел тендер
                if (!supplierInvitation.isViewed) {
                    await prisma.tenderInvitedSupplier.update({
                        where: { id: supplierInvitation.id },
                        data: { isViewed: true, viewedAt: new Date() }
                    }).catch(e => console.error('Failed to update invitation isViewed:', e));
                }
            }
        }

        // Защита коммерческой тайны и процедура "запечатанных конвертов":
        // 1. Если тендер открыт (ACYK) или в черновике (TASLAMA):
        //    - Поставщик видит ТОЛЬКО свою собственную поданную заявку.
        //    - Администратор видит только обезличенные метаданные (без коммерческих цен/спецификаций),
        //      так как вскрытие предложений до дедлайна запрещено регламентом закупок.
        // 2. Если тендер на рассмотрении (BAHALANDYRYLDY):
        //    - Администратор и комиссия видят все вскрытые заявки с позициями.
        //    - Поставщик видит только свою заявку.
        // 3. Если победитель объявлен (YENIJI_YGLAN_EDILDI):
        //    - Заявки и победители открыты для прозрачности результатов.
        let includeOffers = false;
        const isSealedState = tenderBase.status === 'ACYK' || tenderBase.status === 'TASLAMA';

        if (req.user) {
            if (req.user.roleType === 'ADMIN') {
                if (isSealedState) {
                    includeOffers = {
                        select: { id: true, bidderCode: true, createdAt: true, status: true, version: true }
                    };
                } else {
                    includeOffers = {
                        include: { supplier: true, specs: true, exchangeRates: { include: { currency: true } } }
                    };
                }
            } else {
                if (tenderBase.status === 'YENIJI_YGLAN_EDILDI') {
                    includeOffers = {
                        include: { supplier: true, specs: true, exchangeRates: { include: { currency: true } } }
                    };
                } else {
                    includeOffers = {
                        where: { supplier: { userId: req.user.id } },
                        include: { supplier: true, specs: true, exchangeRates: { include: { currency: true } } }
                    };
                }
            }
        }

        const tender = await prisma.tender.findUnique({
            where: { id },
            include: {
                lots: {
                    orderBy: { lotNumber: 'asc' },
                    include: {
                        category: true,
                        deliveryTerm: true,
                        specs: {
                            include: {
                                generalProduct: true,
                                unit: true,
                                manufacturer: true,
                            },
                            orderBy: { positionNumber: 'asc' }
                        },
                        files: {
                            include: {
                                document: true
                            }
                        }
                    }
                },
                client: true,
                category: true,
                createdBy: {
                    select: { id: true, username: true, firstName: true, lastName: true },
                },
                offers: includeOffers,
                invitedSuppliers: {
                    include: {
                        supplier: {
                            select: {
                                id: true,
                                name: true,
                                taxId: true,
                                type: true,
                                logoUrl: true,
                                legalAddress: true,
                            }
                        }
                    }
                },
                files: {
                    include: {
                        document: true
                    }
                }
            },
        });

        if (!tender) {
            return res.status(404).json({ error: 'Тендер не найден' });
        }

        res.json(tender);
    } catch (error) {
        console.error(error); res.status(500).json({ error: 'Ошибка при получении тендера' });
    }
};

const updateTender = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            tenderNumber,
            title,
            description,
            technicalSpecs,
            deadline,
            announcementDate,
            categoryId,
            clientId,
            procurementType,
            status,
            type,
            visibility,
            invitedSupplierIds
        } = req.body;

        const existingTender = await prisma.tender.findUnique({ where: { id } });
        if (!existingTender) {
            return res.status(404).json({ error: 'Тендер не найден' });
        }

        const updateData = {};
        if (title !== undefined) updateData.title = title.trim();
        if (tenderNumber !== undefined && tenderNumber.trim() !== '') {
            updateData.tenderNumber = tenderNumber.trim();
        }
        if (description !== undefined) updateData.description = description;
        if (technicalSpecs !== undefined) updateData.technicalSpecs = technicalSpecs;
        if (type !== undefined) updateData.type = type;
        if (visibility !== undefined) updateData.visibility = visibility;
        if (status !== undefined) updateData.status = status;
        if (procurementType !== undefined) updateData.procurementType = procurementType;
        if (categoryId !== undefined) updateData.categoryId = (categoryId && categoryId !== '') ? categoryId : null;
        if (clientId !== undefined) updateData.clientId = (clientId && clientId !== '') ? clientId : null;
        if (deadline) updateData.deadline = new Date(deadline);
        if (announcementDate) updateData.announcementDate = new Date(announcementDate);

        // Синхронизация приглашенных поставщиков для закрытых тендеров
        if (invitedSupplierIds !== undefined && Array.isArray(invitedSupplierIds)) {
            const uniqueSupplierIds = [...new Set(invitedSupplierIds.filter(Boolean))];
            await prisma.$transaction(async (tx) => {
                await tx.tenderInvitedSupplier.deleteMany({ where: { tenderId: id } });
                if (uniqueSupplierIds.length > 0) {
                    await tx.tenderInvitedSupplier.createMany({
                        data: uniqueSupplierIds.map(sId => ({
                            tenderId: id,
                            supplierId: sId,
                        }))
                    });
                }
            });
        }

        const updated = await prisma.tender.update({
            where: { id },
            data: updateData,
            include: {
                category: true,
                client: true,
                invitedSuppliers: {
                    include: {
                        supplier: {
                            select: { id: true, name: true, taxId: true, type: true, logoUrl: true }
                        }
                    }
                },
                createdBy: { select: { id: true, username: true, firstName: true, lastName: true } }
            }
        });

        res.json(updated);
    } catch (error) {
        console.error('UpdateTender Error:', error);
        res.status(500).json({ error: 'Ошибка обновления тендера', details: error.message });
    }
};

const publishTender = async (req, res) => {
    try {
        const { id } = req.params;
        const tender = await prisma.tender.findUnique({
            where: { id },
            include: {
                lots: {
                    include: { specs: true }
                }
            }
        });

        if (!tender) {
            return res.status(404).json({ error: 'Тендер не найден' });
        }

        if (!tender.lots || tender.lots.length === 0) {
            return res.status(400).json({ error: 'Невозможно опубликовать тендер: добавьте как минимум один лот' });
        }

        const updated = await prisma.tender.update({
            where: { id },
            data: { status: 'ACYK' },
            include: {
                lots: {
                    orderBy: { lotNumber: 'asc' },
                    include: {
                        category: true,
                        deliveryTerm: true,
                        specs: {
                            include: { generalProduct: true, unit: true, manufacturer: true },
                            orderBy: { positionNumber: 'asc' }
                        },
                        files: {
                            include: { document: true }
                        }
                    }
                },
                client: true,
                category: true,
            }
        });

        res.json(updated);
    } catch (error) {
        console.error('PublishTender Error:', error);
        res.status(500).json({ error: 'Ошибка публикации тендера', details: error.message });
    }
};

const createLot = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            lotNumber,
            name,
            description,
            lotType,
            categoryId,
            endUser,
            deliveryTermId,
            deliveryAddress,
            workAddress,
            workPeriod,
            licenseRequired,
            serviceFormat,
            slaPeriod,
            specs
        } = req.body;

        const tender = await prisma.tender.findUnique({ where: { id } });
        if (!tender) {
            return res.status(404).json({ error: 'Тендер не найден' });
        }

        let finalLotNumber = lotNumber;
        if (!finalLotNumber) {
            const maxLot = await prisma.tenderLot.findFirst({
                where: { tenderId: id },
                orderBy: { lotNumber: 'desc' }
            });
            finalLotNumber = (maxLot?.lotNumber || 0) + 1;
        }

        const newLot = await prisma.$transaction(async (tx) => {
            const lot = await tx.tenderLot.create({
                data: {
                    tenderId: id,
                    lotNumber: parseInt(finalLotNumber, 10) || 1,
                    name: name?.trim() || `Лот №${finalLotNumber}`,
                    description: description || null,
                    lotType: lotType || 'GOODS',
                    categoryId: (categoryId && categoryId !== '') ? categoryId : null,
                    endUser: endUser ? endUser.trim() : null,
                    deliveryTermId: (deliveryTermId && deliveryTermId !== '') ? deliveryTermId : null,
                    deliveryAddress: deliveryAddress || null,
                    workAddress: workAddress || null,
                    workPeriod: workPeriod || null,
                    licenseRequired: Boolean(licenseRequired),
                    serviceFormat: serviceFormat || null,
                    slaPeriod: slaPeriod || null,
                }
            });

            if (specs && Array.isArray(specs)) {
                const validSpecs = specs.filter(s => (s.name || s.haryt) && (s.name || s.haryt).trim() !== '');
                if (validSpecs.length > 0) {
                    await tx.tenderSpecification.createMany({
                        data: validSpecs.map((spec, idx) => ({
                            tenderId: id,
                            lotId: lot.id,
                            positionNumber: parseInt(spec.positionNumber, 10) || (idx + 1),
                            generalProductId: (spec.generalProductId && spec.generalProductId !== '') ? spec.generalProductId : null,
                            name: (spec.name || spec.haryt || '').trim(),
                            quantity: parseFloat(spec.quantity || spec.mukdar) || 1,
                            unitId: (spec.unitId && spec.unitId !== '') ? spec.unitId : ((spec.unit && spec.unit !== '') ? spec.unit : null),
                            manufacturerId: (spec.manufacturerId && spec.manufacturerId !== '') ? spec.manufacturerId : ((spec.brand && spec.brand !== '') ? spec.brand : null),
                            description: (spec.description || spec.desc || '').trim() || null
                        }))
                    });
                }
            }

            return await tx.tenderLot.findUnique({
                where: { id: lot.id },
                include: {
                    category: true,
                    deliveryTerm: true,
                    specs: {
                        include: { generalProduct: true, unit: true, manufacturer: true },
                        orderBy: { positionNumber: 'asc' }
                    },
                    files: {
                        include: { document: true }
                    }
                }
            });
        });

        res.status(201).json(newLot);
    } catch (error) {
        console.error('CreateLot error:', error);
        res.status(500).json({ error: 'Ошибка создания лота', details: error.message });
    }
};

const updateLot = async (req, res) => {
    try {
        const { id, lotId } = req.params;
        const {
            lotNumber,
            name,
            description,
            lotType,
            categoryId,
            endUser,
            deliveryTermId,
            deliveryAddress,
            workAddress,
            workPeriod,
            licenseRequired,
            serviceFormat,
            slaPeriod,
            specs
        } = req.body;

        const existingLot = await prisma.tenderLot.findFirst({
            where: { id: lotId, tenderId: id }
        });
        if (!existingLot) {
            return res.status(404).json({ error: 'Лот не найден в данном тендере' });
        }

        const updatedLot = await prisma.$transaction(async (tx) => {
            await tx.tenderLot.update({
                where: { id: lotId },
                data: {
                    lotNumber: lotNumber !== undefined ? parseInt(lotNumber, 10) : existingLot.lotNumber,
                    name: name !== undefined ? name.trim() : existingLot.name,
                    description: description !== undefined ? description : existingLot.description,
                    lotType: lotType || existingLot.lotType,
                    categoryId: (categoryId !== undefined) ? ((categoryId && categoryId !== '') ? categoryId : null) : existingLot.categoryId,
                    endUser: endUser !== undefined ? (endUser ? endUser.trim() : null) : existingLot.endUser,
                    deliveryTermId: (deliveryTermId !== undefined) ? ((deliveryTermId && deliveryTermId !== '') ? deliveryTermId : null) : existingLot.deliveryTermId,
                    deliveryAddress: deliveryAddress !== undefined ? deliveryAddress : existingLot.deliveryAddress,
                    workAddress: workAddress !== undefined ? workAddress : existingLot.workAddress,
                    workPeriod: workPeriod !== undefined ? workPeriod : existingLot.workPeriod,
                    licenseRequired: licenseRequired !== undefined ? Boolean(licenseRequired) : existingLot.licenseRequired,
                    serviceFormat: serviceFormat !== undefined ? serviceFormat : existingLot.serviceFormat,
                    slaPeriod: slaPeriod !== undefined ? slaPeriod : existingLot.slaPeriod,
                }
            });

            if (specs !== undefined && Array.isArray(specs)) {
                await tx.tenderSpecification.deleteMany({
                    where: { lotId }
                });

                const validSpecs = specs.filter(s => (s.name || s.haryt) && (s.name || s.haryt).trim() !== '');
                if (validSpecs.length > 0) {
                    await tx.tenderSpecification.createMany({
                        data: validSpecs.map((spec, idx) => ({
                            tenderId: id,
                            lotId: lotId,
                            positionNumber: parseInt(spec.positionNumber, 10) || (idx + 1),
                            generalProductId: (spec.generalProductId && spec.generalProductId !== '') ? spec.generalProductId : null,
                            name: (spec.name || spec.haryt || '').trim(),
                            quantity: parseFloat(spec.quantity || spec.mukdar) || 1,
                            unitId: (spec.unitId && spec.unitId !== '') ? spec.unitId : ((spec.unit && spec.unit !== '') ? spec.unit : null),
                            manufacturerId: (spec.manufacturerId && spec.manufacturerId !== '') ? spec.manufacturerId : ((spec.brand && spec.brand !== '') ? spec.brand : null),
                            description: (spec.description || spec.desc || '').trim() || null
                        }))
                    });
                }
            }

            return await tx.tenderLot.findUnique({
                where: { id: lotId },
                include: {
                    category: true,
                    deliveryTerm: true,
                    specs: {
                        include: { generalProduct: true, unit: true, manufacturer: true },
                        orderBy: { positionNumber: 'asc' }
                    },
                    files: {
                        include: { document: true }
                    }
                }
            });
        });

        res.json(updatedLot);
    } catch (error) {
        console.error('UpdateLot error:', error);
        res.status(500).json({ error: 'Ошибка обновления лота', details: error.message });
    }
};

const deleteLot = async (req, res) => {
    try {
        const { id, lotId } = req.params;
        const existingLot = await prisma.tenderLot.findFirst({
            where: { id: lotId, tenderId: id }
        });
        if (!existingLot) {
            return res.status(404).json({ error: 'Лот не найден' });
        }

        await prisma.$transaction(async (tx) => {
            await tx.tenderSpecification.deleteMany({ where: { lotId } });
            await tx.lotFile.deleteMany({ where: { lotId } });
            await tx.tenderLot.delete({ where: { id: lotId } });
        });

        res.json({ success: true, message: 'Лот успешно удален', lotId });
    } catch (error) {
        console.error('DeleteLot error:', error);
        res.status(500).json({ error: 'Ошибка удаления лота', details: error.message });
    }
};

const deleteTender = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.tender.delete({
            where: { id }
        });
        res.json({ message: 'Тендер успешно удален' });
    } catch (error) {
        console.error('Delete tender error:', error);
        res.status(500).json({ error: 'Ошибка при удалении тендера', details: error.message });
    }
};

module.exports = {
    createTender,
    getTenders,
    getTenderById,
    updateTender,
    publishTender,
    deleteTender,
    getNextNumber,
    createLot,
    updateLot,
    deleteLot
};
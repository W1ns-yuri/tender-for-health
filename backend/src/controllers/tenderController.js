/**
 * Тендер целиком: номер, создание, список, карточка, изменение, публикация, удаление.
 * Лоты и позиции: controllers/lotController.js и services/tenderStructure.js.
 */
const prisma = require('../lib/prisma');
const { isTenderOpened } = require('../utils/sealedEnvelope');
const { canTransitionManually, parseDeadline } = require('../utils/tenderRules');
const { supplierTenderScope } = require('../utils/tenderAccess');
const { sendError } = require('../utils/httpErrors');
const { publishTenderById, publishBlocker } = require('../services/tenderPublish');
const { MAX_TITLE, tooLong, specsError, lotNumberError, deadlineTooFar, lotTypeError } = require('../utils/validation');
const { REQUIREMENTS_INCLUDE } = require('../services/specRequirements');
const { assertStructureEditable, createLotSpecs, generateNextTenderNumber } = require('../services/tenderStructure');

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
        const deadlineDate = parseDeadline(deadline);
        if (!deadlineDate) {
            return res.status(400).json({ error: 'Пожалуйста, укажите корректный крайний срок подачи заявок (дедлайн)' });
        }
        // Создать можно только черновик или сразу открытый тендер (не "оценённый" и не "с победителем")
        if (status && !['TASLAMA', 'ACYK'].includes(status)) {
            return res.status(400).json({ error: 'Новый тендер может быть только черновиком или открытым' });
        }
        if (status === 'ACYK' && deadlineDate <= new Date()) {
            return res.status(400).json({ error: 'Нельзя открыть тендер с дедлайном в прошлом' });
        }
        if (deadlineTooFar(deadlineDate)) {
            return res.status(400).json({ error: 'Дедлайн дальше чем через 2 года: проверьте год' });
        }
        if (tooLong(title, MAX_TITLE)) {
            return res.status(400).json({ error: `Название тендера: не длиннее ${MAX_TITLE} символов` });
        }
        for (const lot of Array.isArray(lots) ? lots : []) {
            const err = specsError(lot?.specs) || lotNumberError(lot?.lotNumber) || lotTypeError(lot?.lotType);
            if (err) return res.status(400).json({ error: err });
        }
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
                    title: (typeof title === 'string' && title.trim()) || 'Без названия',
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
                        withOperator: Boolean(lot.withOperator),
                        fuelIncluded: Boolean(lot.fuelIncluded),
                        supportIncluded: Boolean(lot.supportIncluded),
                    }
                });

                if (lot.specs && Array.isArray(lot.specs)) {
                    await createLotSpecs(tx, newTender.id, newLot.id, lot.specs);
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
                                    requirements: REQUIREMENTS_INCLUDE,
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
        sendError(res, error, 'Ошибка при создании тендера');
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
                if (onlyInvited === 'true') {
                    // Только персональные приглашения в закрытые тендеры
                    where.AND.push({
                        invitedSuppliers: {
                            some: { supplierId: supplier.id }
                        }
                    });
                } else {
                    // Открытые тендеры по своим направлениям или закрытые, куда пригласили
                    where.AND.push(supplierTenderScope(supplier));
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
                            include: { generalProduct: true, unit: true, manufacturer: true, requirements: REQUIREMENTS_INCLUDE },
                            orderBy: { positionNumber: 'asc' }
                        },
                        files: {
                            include: { document: true }
                        }
                    }
                },
                specs: {
                    include: { generalProduct: true, unit: true, manufacturer: true, requirements: REQUIREMENTS_INCLUDE },
                },
                createdBy: {
                    select: { id: true, username: true, firstName: true, lastName: true },
                },
                category: true,
                client: true,
                // Кто приглашён в тендер — только организатору (список был виден всем, даже без входа)
                invitedSuppliers: req.user?.roleType !== 'ADMIN' ? false : {
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
        sendError(res, error, 'Ошибка при получении списка тендеров');
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
        // Запечатано всё, что ещё не вскрыто: в т.ч. YAPYK (дедлайн прошёл, но конверты не вскрыты)
        const isSealedState = !isTenderOpened(tenderBase);

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
                    // Итоги: своё предложение + предложения победителей. Раньше любой поставщик получал
                    // ВСЕ предложения с полной карточкой (банк, паспорт директора) — теперь только название.
                    includeOffers = {
                        where: {
                            OR: [
                                { supplier: { userId: req.user.id } },
                                { specs: { some: { isAwarded: true } } },
                            ],
                        },
                        include: {
                            supplier: { select: { id: true, name: true, userId: true } },
                            specs: true,
                            exchangeRates: { include: { currency: true } },
                        },
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
                                requirements: REQUIREMENTS_INCLUDE,
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
                // Список приглашённых видит только организатор: поставщикам незачем знать конкурентов
                invitedSuppliers: req.user?.roleType !== 'ADMIN' ? false : {
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

        // isMine: фронт по нему понимает, подавал ли поставщик заявку (в итогах есть и чужие победные)
        if (req.user && req.user.roleType !== 'ADMIN' && Array.isArray(tender.offers)) {
            tender.offers = tender.offers.map((offer) => {
                const isMine = offer.supplier?.userId === req.user.id;
                const supplier = offer.supplier ? { ...offer.supplier } : offer.supplier;
                if (supplier) delete supplier.userId;
                return { ...offer, supplier, isMine };
            });
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

        const existingTender = await prisma.tender.findUnique({
            where: { id },
            include: { invitedSuppliers: { select: { supplierId: true } } },
        });
        if (!existingTender) {
            return res.status(404).json({ error: 'Тендер не найден' });
        }

        // --- Правила изменения статуса: только отмена и архив, остальное через свои эндпоинты ---
        const statusChanged = status !== undefined && status !== existingTender.status;
        if (statusChanged && !canTransitionManually(existingTender.status, status)) {
            return res.status(400).json({
                error: 'Этот переход статуса недоступен. Публикация, вскрытие и итоги выполняются отдельными кнопками; вручную можно только отменить или архивировать тендер.',
            });
        }

        // --- После публикации условия процедуры менять нельзя (кроме продления дедлайна и добавления участников) ---
        const newDeadline = deadline ? parseDeadline(deadline) : null;
        if (deadline && !newDeadline) {
            return res.status(400).json({ error: 'Некорректный дедлайн' });
        }
        if (newDeadline && deadlineTooFar(newDeadline)) {
            return res.status(400).json({ error: 'Дедлайн дальше чем через 2 года: проверьте год' });
        }
        if (tooLong(req.body.title, MAX_TITLE)) {
            return res.status(400).json({ error: `Название тендера: не длиннее ${MAX_TITLE} символов` });
        }
        if (existingTender.status !== 'TASLAMA' && !statusChanged) {
            if (existingTender.status !== 'ACYK') {
                return res.status(400).json({ error: 'Приём заявок закрыт: тендер больше нельзя редактировать. Доступны только отмена или архив.' });
            }
            if (newDeadline && newDeadline.getTime() !== existingTender.deadline.getTime()) {
                if (newDeadline < existingTender.deadline) {
                    return res.status(400).json({ error: 'После публикации дедлайн можно только продлить, но не сократить' });
                }
            }
            if (type !== undefined && type !== existingTender.type) {
                return res.status(400).json({ error: 'После публикации нельзя менять тип тендера' });
            }
            if (visibility !== undefined && visibility !== existingTender.visibility) {
                return res.status(400).json({ error: 'После публикации нельзя менять доступность тендера (открытый/закрытый)' });
            }
            if (Array.isArray(invitedSupplierIds) && existingTender.visibility === 'YAPYK') {
                const newIds = new Set(invitedSupplierIds.filter(Boolean));
                const removed = existingTender.invitedSuppliers.some((inv) => !newIds.has(inv.supplierId));
                if (removed) {
                    return res.status(400).json({ error: 'После публикации нельзя исключать приглашённых поставщиков, только добавлять новых' });
                }
            }
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
        if (statusChanged) updateData.status = status;
        if (procurementType !== undefined) updateData.procurementType = procurementType;
        if (categoryId !== undefined) updateData.categoryId = (categoryId && categoryId !== '') ? categoryId : null;
        if (clientId !== undefined) updateData.clientId = (clientId && clientId !== '') ? clientId : null;
        if (newDeadline) updateData.deadline = newDeadline;
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
        sendError(res, error, 'Ошибка обновления тендера');
    }
};

const publishTender = async (req, res) => {
    try {
        const { id } = req.params;

        // Отложенная публикация: проверяем тендер сейчас, публикует планировщик в назначенное время
        if (req.body?.publishAt) {
            const at = new Date(req.body.publishAt);
            if (isNaN(at.getTime())) return res.status(400).json({ error: 'Некорректная дата публикации' });
            if (at <= new Date()) return res.status(400).json({ error: 'Дата публикации должна быть в будущем. Чтобы опубликовать сейчас, нажмите «Опубликовать».' });
            const tender = await prisma.tender.findUnique({ where: { id }, include: { lots: { include: { specs: true } } } });
            if (!tender) return res.status(404).json({ error: 'Тендер не найден' });
            const blocker = publishBlocker(tender, at);
            if (blocker) return res.status(400).json({ error: blocker });
            const updated = await prisma.tender.update({ where: { id }, data: { publishAt: at } });
            return res.json(updated);
        }

        const result = await publishTenderById(id);
        if (result.error) return res.status(result.status).json({ error: result.error });
        res.json(result.tender);
    } catch (error) {
        sendError(res, error, 'Ошибка публикации тендера');
    }
};

// Отменить отложенную публикацию: тендер остаётся черновиком
const unscheduleTender = async (req, res) => {
    try {
        const { count } = await prisma.tender.updateMany({ where: { id: req.params.id, status: 'TASLAMA' }, data: { publishAt: null } });
        if (!count) return res.status(400).json({ error: 'Отменить можно только запланированный черновик' });
        res.json({ id: req.params.id, publishAt: null });
    } catch (error) {
        sendError(res, error, 'Ошибка отмены публикации');
    }
};

const deleteTender = async (req, res) => {
    try {
        const { id } = req.params;
        const tender = await prisma.tender.findUnique({ where: { id } });
        if (!tender) {
            return res.status(404).json({ error: 'Тендер не найден' });
        }
        // Удаление каскадно стирает все поданные предложения. Тендер с заявками можно только отменить.
        if (!(await assertStructureEditable(tender))) {
            return res.status(400).json({ error: 'Тендер с поданными предложениями удалить нельзя, его можно только отменить (статус «Отменён»).' });
        }
        await prisma.tender.delete({
            where: { id }
        });
        res.json({ message: 'Тендер успешно удален' });
    } catch (error) {
        sendError(res, error, 'Ошибка при удалении тендера');
    }
};

module.exports = {
    unscheduleTender,
    createTender,
    getTenders,
    getTenderById,
    updateTender,
    publishTender,
    deleteTender,
    getNextNumber,
};
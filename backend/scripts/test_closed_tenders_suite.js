require('dotenv').config();
const jwt = require('jsonwebtoken');
const prisma = require('../src/lib/prisma');

const BASE_URL = 'http://127.0.0.1:5000/api';

async function runTests() {
    console.log('=====================================================');
    console.log('🚀 ЗАПУСК ПОЛНОГО E2E ТЕСТИРОВАНИЯ ЗАКРЫТЫХ ТЕНДЕРОВ');
    console.log('=====================================================\n');

    let passedTests = 0;
    let failedTests = 0;

    function assert(condition, message) {
        if (condition) {
            console.log(`  ✅ [PASS] ${message}`);
            passedTests++;
        } else {
            console.error(`  ❌ [FAIL] ${message}`);
            failedTests++;
        }
    }

    try {
        // 1. Подготовка тестовых пользователей и поставщиков
        console.log('1. Загрузка тестовых учетных записей из БД...');
        const adminUser = await prisma.user.findFirst({
            where: { roleType: 'ADMIN' }
        });
        if (!adminUser) throw new Error('Администратор не найден в БД');

        const suppliers = await prisma.supplier.findMany({
            include: { user: true },
            where: { verificationStatus: 'VERIFIED' },
            take: 4
        });
        if (suppliers.length < 3) {
            // Если верифицированных меньше 3, берем любых активных
            const anySuppliers = await prisma.supplier.findMany({
                include: { user: true },
                take: 4
            });
            suppliers.splice(0, suppliers.length, ...anySuppliers);
        }

        if (suppliers.length < 3) {
            throw new Error('Для теста требуется минимум 3 поставщика в БД');
        }

        const supplier1 = suppliers[0]; // Приглашенный А
        const supplier2 = suppliers[1]; // Приглашенный Б
        const supplier3 = suppliers[2]; // Добавляемый при редактировании В
        const uninvitedSupplier = suppliers[3] || suppliers[2]; // Неприглашенный

        // Убедимся, что поставщики верифицированы, чтобы они могли подавать предложения
        await prisma.supplier.updateMany({
            where: { id: { in: [supplier1.id, supplier2.id, supplier3.id, uninvitedSupplier.id] } },
            data: { verificationStatus: 'VERIFIED' }
        });

        const adminToken = jwt.sign({ userId: adminUser.id, roleType: 'ADMIN' }, process.env.JWT_SECRET, { expiresIn: '1h' });
        const sup1Token = jwt.sign({ userId: supplier1.userId, roleType: 'SUPPLIER' }, process.env.JWT_SECRET, { expiresIn: '1h' });
        const sup2Token = jwt.sign({ userId: supplier2.userId, roleType: 'SUPPLIER' }, process.env.JWT_SECRET, { expiresIn: '1h' });
        const uninvitedToken = jwt.sign({ userId: uninvitedSupplier.userId, roleType: 'SUPPLIER' }, process.env.JWT_SECRET, { expiresIn: '1h' });

        console.log(`   Админ: ${adminUser.username}`);
        console.log(`   Приглашенный 1: ${supplier1.name} (STŞK: ${supplier1.taxId})`);
        console.log(`   Приглашенный 2: ${supplier2.name} (STŞK: ${supplier2.taxId})`);
        console.log(`   Неприглашенный: ${uninvitedSupplier.name} (STŞK: ${uninvitedSupplier.taxId})\n`);

        let testTenderId = null;
        let testLotId = null;
        let offer1Id = null;
        let offer2Id = null;

        // -----------------------------------------------------------------------------------------
        // ТЕСТ 1: Создание черновика закрытого тендера (POST /api/tenders)
        // -----------------------------------------------------------------------------------------
        console.log('2. Тест: Создание черновика закрытого тендера (YAPYK)...');
        const announcementDate = new Date().toISOString().split('T')[0];
        const deadline = new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString().split('T')[0];

        const createRes = await fetch(`${BASE_URL}/tenders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify({
                title: 'E2E Тест Закрытой Закупки Медоборудования',
                description: 'Специальная закрытая процедура закупки',
                type: 'YERLI',
                status: 'TASLAMA',
                visibility: 'YAPYK',
                announcementDate,
                deadline,
                invitedSupplierIds: [supplier1.id, supplier2.id]
            })
        });

        const createdTender = await createRes.json();
        assert(createRes.status === 201, `Тендер успешно создан (HTTP 201, статус: ${createRes.status})`);
        assert(createdTender.visibility === 'YAPYK', `Режим доступа установлен в закрытый (visibility: 'YAPYK')`);
        assert(createdTender.invitedSuppliers?.length === 2, `Приглашено ровно 2 поставщика (получено: ${createdTender.invitedSuppliers?.length})`);
        testTenderId = createdTender.id;

        // -----------------------------------------------------------------------------------------
        // ТЕСТ 2: Редактирование закрытого тендера (PUT /api/tenders/:id)
        // -----------------------------------------------------------------------------------------
        console.log('\n3. Тест: Редактирование закрытого тендера (добавление 3-го участника)...');
        const updateRes = await fetch(`${BASE_URL}/tenders/${testTenderId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify({
                title: 'E2E Тест Закрытой Закупки (Отредактировано)',
                visibility: 'YAPYK',
                invitedSupplierIds: [supplier1.id, supplier2.id, supplier3.id]
            })
        });

        const updatedTender = await updateRes.json();
        assert(updateRes.status === 200, `Тендер успешно отредактирован (HTTP 200)`);
        assert(updatedTender.invitedSuppliers?.length === 3, `Синхронизация участников: теперь 3 приглашенных (получено: ${updatedTender.invitedSuppliers?.length})`);

        // -----------------------------------------------------------------------------------------
        // ТЕСТ 3: Добавление лота и публикация тендера
        // -----------------------------------------------------------------------------------------
        console.log('\n4. Тест: Добавление лота и публикация (перевод в статус ACYK)...');
        const lotRes = await fetch(`${BASE_URL}/tenders/${testTenderId}/lots`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify({
                name: 'Лот 1: Реанимационные мониторы',
                lotNumber: 1,
                lotType: 'GOODS',
                specs: [
                    { positionNumber: 1, name: 'Монитор пациента прикроватный', quantity: 5 }
                ]
            })
        });
        const lotData = await lotRes.json();
        testLotId = lotData.id || (lotData.lots && lotData.lots[0]?.id);
        assert(lotRes.status === 200 || lotRes.status === 201, `Лот успешно добавлен к тендеру`);

        // Публикуем тендер (переводим из TASLAMA в ACYK)
        const publishRes = await fetch(`${BASE_URL}/tenders/${testTenderId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify({
                status: 'ACYK'
            })
        });
        const publishedTender = await publishRes.json();
        assert(publishedTender.status === 'ACYK', `Тендер опубликован и открыт для приема заявок (status: 'ACYK')`);

        // -----------------------------------------------------------------------------------------
        // ТЕСТ 4: Проверка изоляции видимости (Access Control)
        // -----------------------------------------------------------------------------------------
        console.log('\n5. Тест: Проверка контроля доступа и видимости закрытого тендера...');

        // 4.1 Приглашенный поставщик 1 (Wins Corp) смотрит общий реестр
        const sup1ListRes = await fetch(`${BASE_URL}/tenders`, {
            headers: { 'Authorization': `Bearer ${sup1Token}` }
        });
        const sup1List = await sup1ListRes.json();
        const sup1CanSeeInList = Array.isArray(sup1List) && sup1List.some(t => t.id === testTenderId);
        assert(sup1CanSeeInList, `Приглашенный поставщик 1 ВИДИТ закрытый тендер в общем реестре`);

        // 4.2 Приглашенный поставщик 1 открывает детали тендера
        const sup1DetailRes = await fetch(`${BASE_URL}/tenders/${testTenderId}`, {
            headers: { 'Authorization': `Bearer ${sup1Token}` }
        });
        assert(sup1DetailRes.status === 200, `Приглашенный поставщик 1 может открыть карточку закрытого тендера (HTTP 200)`);

        // 4.3 Неприглашенный поставщик смотрит общий реестр
        const uninvitedListRes = await fetch(`${BASE_URL}/tenders`, {
            headers: { 'Authorization': `Bearer ${uninvitedToken}` }
        });
        const uninvitedList = await uninvitedListRes.json();
        const uninvitedCanSeeInList = Array.isArray(uninvitedList) && uninvitedList.some(t => t.id === testTenderId);
        assert(!uninvitedCanSeeInList, `Неприглашенный поставщик НЕ ВИДИТ закрытый тендер в общем реестре (полная изоляция)`);

        // 4.4 Неприглашенный поставщик пробует открыть тендер по прямой ссылке /api/tenders/:id
        const uninvitedDetailRes = await fetch(`${BASE_URL}/tenders/${testTenderId}`, {
            headers: { 'Authorization': `Bearer ${uninvitedToken}` }
        });
        assert(uninvitedDetailRes.status === 403, `Неприглашенный поставщик получает 403 Forbidden при попытке прямого доступа (получено: ${uninvitedDetailRes.status})`);

        // 4.5 Неавторизованный гость
        const guestDetailRes = await fetch(`${BASE_URL}/tenders/${testTenderId}`);
        assert(guestDetailRes.status === 401 || guestDetailRes.status === 403, `Неавторизованный гость блокируется (HTTP ${guestDetailRes.status})`);

        // -----------------------------------------------------------------------------------------
        // ТЕСТ 5: Подача заявок (Offers)
        // -----------------------------------------------------------------------------------------
        console.log('\n6. Тест: Подача коммерческих предложений (Заявок)...');

        const tenderSpec = await prisma.tenderSpecification.findFirst({
            where: { tenderId: testTenderId }
        });
        const tenderSpecId = tenderSpec?.id;
        assert(Boolean(tenderSpecId), `Спецификация лота получена для подачи предложений (ID: ${tenderSpecId})`);

        // 5.1 Неприглашенный поставщик пытается взломать/отправить заявку напрямую
        const uninvitedOfferRes = await fetch(`${BASE_URL}/offers`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${uninvitedToken}`
            },
            body: JSON.stringify({
                tenderId: testTenderId,
                number: 'OFFER-HACK-01',
                specs: [{ tenderSpecId, unitPrice: 2000, quantity: 5 }]
            })
        });
        assert(uninvitedOfferRes.status === 403, `Неприглашенный поставщик НЕ МОЖЕТ подать заявку в закрытый тендер (HTTP 403)`);

        // 5.2 Приглашенный поставщик 1 подает валидную заявку
        const offer1Res = await fetch(`${BASE_URL}/offers`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${sup1Token}`
            },
            body: JSON.stringify({
                tenderId: testTenderId,
                number: 'OFFER-SUP1-001',
                specs: [{ tenderSpecId, unitPrice: 3000, quantity: 5 }]
            })
        });
        const offer1Data = await offer1Res.json();
        offer1Id = offer1Data.id;
        assert(offer1Res.status === 201 || offer1Res.status === 200, `Приглашенный поставщик 1 успешно подал заявку (HTTP ${offer1Res.status})`);

        // 5.3 Приглашенный поставщик 2 подает конкурентную заявку
        const offer2Res = await fetch(`${BASE_URL}/offers`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${sup2Token}`
            },
            body: JSON.stringify({
                tenderId: testTenderId,
                number: 'OFFER-SUP2-002',
                specs: [{ tenderSpecId, unitPrice: 2840, quantity: 5 }]
            })
        });
        const offer2Data = await offer2Res.json();
        offer2Id = offer2Data.id;
        assert(offer2Res.status === 201 || offer2Res.status === 200, `Приглашенный поставщик 2 успешно подал заявку (HTTP ${offer2Res.status})`);

        // -----------------------------------------------------------------------------------------
        // ТЕСТ 6: Оценка и Выбор победителя (selectWinnerOffer)
        // -----------------------------------------------------------------------------------------
        console.log('\n7. Тест: Оценка предложений и выбор победителя тендера...');
        const winnerRes = await fetch(`${BASE_URL}/evaluation/select-winner`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify({
                tenderId: testTenderId,
                winningOfferId: offer2Id // Выбираем победителем предложение 2 (цена ниже)
            })
        });

        const winnerData = await winnerRes.json();
        assert(winnerRes.status === 200, `Комиссия успешно утвердила победителя (HTTP 200)`);
        assert(winnerData.status === 'YENIJI_YGLAN_EDILDI', `Тендер переведен в статус 'YENIJI_YGLAN_EDILDI' (Победитель объявлен)`);

        // Проверяем статусы заявок в базе
        const winningOfferInDb = await prisma.offer.findUnique({ where: { id: offer2Id } });
        const secondOfferInDb = await prisma.offer.findUnique({ where: { id: offer1Id } });
        assert(winningOfferInDb.status === 'YENIJI', `Выбранное предложение получило статус 'YENIJI' (Победитель)`);
        assert(secondOfferInDb.status === 'RET_EDILDI', `Другое предложение получило статус 'RET_EDILDI' (Отклонено / 2-е место)`);

        // -----------------------------------------------------------------------------------------
        // Очистка тестовых данных
        // -----------------------------------------------------------------------------------------
        console.log('\n8. Очистка созданных тестовых данных...');
        if (offer1Id || offer2Id) {
            await prisma.offerSpecification.deleteMany({
                where: { offerId: { in: [offer1Id, offer2Id].filter(Boolean) } }
            });
            await prisma.offer.deleteMany({
                where: { id: { in: [offer1Id, offer2Id].filter(Boolean) } }
            });
        }
        if (testTenderId) {
            await prisma.tenderInvitedSupplier.deleteMany({ where: { tenderId: testTenderId } });
            await prisma.tenderSpecification.deleteMany({ where: { tenderId: testTenderId } });
            await prisma.tenderLot.deleteMany({ where: { tenderId: testTenderId } });
            await prisma.tender.delete({ where: { id: testTenderId } });
        }
        console.log('   Тестовые данные успешно удалены, БД чиста.');

    } catch (err) {
        console.error('❌ Критическая ошибка во время выполнения тестов:', err);
        failedTests++;
    }

    console.log('\n=====================================================');
    console.log(`ИТОГИ ТЕСТИРОВАНИЯ: Пройдено: ${passedTests} | Ошибок: ${failedTests}`);
    console.log('=====================================================');

    if (failedTests > 0) {
        process.exit(1);
    } else {
        process.exit(0);
    }
}

runTests();

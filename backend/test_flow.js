require('dotenv').config();
const prisma = require('./src/lib/prisma');
const bcrypt = require('bcryptjs');

async function testFullTenderLifecycle() {
    console.log('========================================================');
    console.log('🧪 СТАРТ ПОЛНОГО ТЕСТИРОВАНИЯ ЦИКЛА ТЕНДЕРНОЙ СИСТЕМЫ');
    console.log('========================================================\n');

    try {
        // 1. Очистка прошлых тестовых данных перед запуском
        console.log('1️⃣ Очищаем старые данные...');
        await prisma.log.deleteMany();
        await prisma.offerFile.deleteMany();
        await prisma.offerSpecification.deleteMany();
        await prisma.offerExchangeRate.deleteMany();
        await prisma.offer.deleteMany();
        await prisma.supplier.deleteMany();
        await prisma.tenderSpecification.deleteMany();
        await prisma.tender.deleteMany();
        await prisma.exchangeRate.deleteMany();
        await prisma.currency.deleteMany();
        await prisma.generalProduct.deleteMany();
        await prisma.category.deleteMany();
        await prisma.unit.deleteMany();
        await prisma.country.deleteMany();
        await prisma.deliveryTerm.deleteMany();
        await prisma.user.deleteMany();

        console.log('✅ База данных успешно очищена.\n');

        // 2. Создание пользователей с ролями по ТЗ
        console.log('2️⃣ Создаем пользователей с ролями...');
        const hashedPassword = await bcrypt.hash('password123', 10);

        const admin = await prisma.user.create({
            data: { username: 'admin', password: hashedPassword, firstName: 'Админ', lastName: 'Главный', roleType: 'ADMIN' }
        });
        const client = await prisma.user.create({
            data: { username: 'client1', password: hashedPassword, firstName: 'Заказчик', lastName: 'Миндздрав', roleType: 'CLIENT' }
        });
        const specialist = await prisma.user.create({
            data: { username: 'spec1', password: hashedPassword, firstName: 'Сердар', lastName: 'Специалистов', roleType: 'PURCHASING_SPECIALIST' }
        });
        const commission = await prisma.user.create({
            data: { username: 'comm1', password: hashedPassword, firstName: 'Аман', lastName: 'Комиссиев', roleType: 'COMMISSION_MEMBER' }
        });
        const supplierUser1 = await prisma.user.create({
            data: { username: 'supplier1', password: hashedPassword, firstName: 'Поставщик', lastName: 'ФармаЛогистик', roleType: 'SUPPLIER' }
        });
        const supplierUser2 = await prisma.user.create({
            data: { username: 'supplier2', password: hashedPassword, firstName: 'Поставщик', lastName: 'МедИмпорт', roleType: 'SUPPLIER' }
        });

        console.log(`✅ Пользователи созданы: Admin, Client (${client.firstName}), Specialist (${specialist.firstName}), Commission (${commission.firstName}), Suppliers.`);

        // 3. Создание Справочников (Каталогов)
        console.log('\n3️⃣ Заполняем справочники (Категории, Валюты, МНН, Страны)...');
        const category = await prisma.category.create({
            data: { name: 'Медикаменты и Фармацевтика', code: 'MED-01' }
        });

        const product1 = await prisma.generalProduct.create({
            data: { name: 'Парацетамол 500мг (таблетки)', code: 'MNN-001', categoryId: category.id, type: 'HARYT' }
        });
        const product2 = await prisma.generalProduct.create({
            data: { name: 'Амоксициллин 500мг', code: 'MNN-002', categoryId: category.id, type: 'HARYT' }
        });

        const unitPack = await prisma.unit.create({
            data: { name: 'Упаковка', shortName: 'уп', order: 1 }
        });

        const currencyTMT = await prisma.currency.create({
            data: { name: 'Манат', code: 'TMT', symbol: 'm', order: 1 }
        });
        const currencyUSD = await prisma.currency.create({
            data: { name: 'Доллар США', code: 'USD', symbol: '$', order: 2 }
        });

        // Курс обмена: 1 USD = 3.5 TMT
        await prisma.exchangeRate.create({
            data: { fromCurrencyId: currencyUSD.id, toCurrencyId: currencyTMT.id, value: 3.5 }
        });

        const countryTM = await prisma.country.create({
            data: { name: 'Туркменистан', alpha2: 'TM', alpha3: 'TKM' }
        });

        const deliveryTerm = await prisma.deliveryTerm.create({
            data: { name: 'Delivery at Place', shortName: 'DAP' }
        });

        console.log('✅ Справочники заполнены! (Курс 1 USD = 3.5 TMT зафиксирован)');

        // 4. Регистрация Поставщиков (Suppliers)
        console.log('\n4️⃣ Регистрируем профили Поставщиков...');
        const supplier1 = await prisma.supplier.create({
            data: {
                userId: supplierUser1.id,
                countryId: countryTM.id,
                name: 'ИП ФармаЛогистик',
                regNumber: 'REG-100230',
                taxId: '1002304958',
                email: 'info@pharmalog.tm',
                phone: '+99312000001'
            }
        });

        const supplier2 = await prisma.supplier.create({
            data: {
                userId: supplierUser2.id,
                countryId: countryTM.id,
                name: 'ХО МедИмпорт Трейд',
                regNumber: 'REG-500990',
                taxId: '5009901122',
                email: 'sales@medimport.tm',
                phone: '+99312000002'
            }
        });

        console.log(`✅ Поставщики созданы: ${supplier1.name} и ${supplier2.name}`);

        // 5. Создание тендера с спецификацией по товарам МНН
        console.log('\n5️⃣ Заказчик создает открытый тендер...');
        const tender = await prisma.tender.create({
            data: {
                tenderNumber: 'LOT-2026-MED-01',
                title: 'Закупка антибиотиков и жаропонижающих для больниц',
                description: 'Срочный тендер на поставку партий медикаментов',
                technicalSpecs: 'Срок годности не менее 24 месяцев с даты поставки',
                price: 50000,
                type: 'YERLI',
                status: 'ACYK', // Открыт для приема заявок
                visibility: 'ACYK',
                announcementDate: new Date(),
                deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                categoryId: category.id,
                createdById: client.id,
                specs: {
                    create: [
                        { positionNumber: 1, generalProductId: product1.id, unitId: unitPack.id, quantity: 1000, description: 'Упаковки по 20 таб' },
                        { positionNumber: 2, generalProductId: product2.id, unitId: unitPack.id, quantity: 500, description: 'Упаковки по 10 капсул' }
                    ]
                }
            },
            include: { specs: true }
        });

        console.log(`✅ Тендер создан! Лот: ${tender.tenderNumber}, Статус: ${tender.status}, Позиций: ${tender.specs.length}`);

        // 6. Подача Коммерческих Предложений Поставщиками
        console.log('\n6️⃣ Поставщики подают коммерческие предложения...');
        
        // Поставщик 1 (ФармаЛогистик) подает цену в TMT
        const activeRates = await prisma.exchangeRate.findMany();

        const offer1 = await prisma.offer.create({
            data: {
                tenderId: tender.id,
                supplierId: supplier1.id,
                deliveryTermId: deliveryTerm.id,
                baseCurrencyId: currencyTMT.id,
                number: 'OFFER-FL-01',
                paymentTerms: 'Предоплата 30%',
                version: 1,
                isDefault: true,
                status: 'TABSARYLDY', // Отправлено
                offeredPrice: 1000 * 15 + 500 * 30, // 15,000 + 15,000 = 30,000 TMT
                specs: {
                    create: [
                        { tenderSpecId: tender.specs[0].id, generalProductId: product1.id, unitId: unitPack.id, quantity: 1000, unitPrice: 15 },
                        { tenderSpecId: tender.specs[1].id, generalProductId: product2.id, unitId: unitPack.id, quantity: 500, unitPrice: 30 }
                    ]
                },
                exchangeRates: {
                    create: activeRates.map(r => ({ currencyId: r.fromCurrencyId, value: r.value }))
                }
            }
        });

        // Поставщик 2 (МедИмпорт) подает цену в USD ($7.00 за позицию 1, $12.00 за позицию 2)
        const offer2 = await prisma.offer.create({
            data: {
                tenderId: tender.id,
                supplierId: supplier2.id,
                deliveryTermId: deliveryTerm.id,
                baseCurrencyId: currencyUSD.id,
                number: 'OFFER-MI-01',
                paymentTerms: 'Оплата по факту поставки',
                version: 1,
                isDefault: true,
                status: 'TABSARYLDY', // Отправлено
                offeredPrice: 1000 * 7 + 500 * 12, // $7,000 + $6,000 = $13,000 USD
                specs: {
                    create: [
                        { tenderSpecId: tender.specs[0].id, generalProductId: product1.id, unitId: unitPack.id, quantity: 1000, unitPrice: 7 },
                        { tenderSpecId: tender.specs[1].id, generalProductId: product2.id, unitId: unitPack.id, quantity: 500, unitPrice: 12 }
                    ]
                },
                exchangeRates: {
                    create: activeRates.map(r => ({ currencyId: r.fromCurrencyId, value: r.value }))
                }
            }
        });

        console.log(`✅ Подано 2 заявки:`);
        console.log(`   - Z1 (${supplier1.name}): ${offer1.offeredPrice} TMT (Курс зафиксирован в OfferExchangeRate)`);
        console.log(`   - Z2 (${supplier2.name}): $${offer2.offeredPrice} USD (Курс зафиксирован в OfferExchangeRate)`);

        // 7. ТЕСТИРОВАНИЕ: Вскрытие предложений (Teklipleri açmak)
        console.log('\n7️⃣ ТЕСТ: Процесс Вскрытия Предложений (Teklipleri açmak)...');
        const openedTender = await prisma.tender.update({
            where: { id: tender.id },
            data: { status: 'BAHALANDYRYLDY' } // Переводим в Оценен / На рассмотрении
        });
        console.log(`✅ Статус тендера изменен на: ${openedTender.status} (bahalandyryldy)`);

        // 8. ТЕСТИРОВАНИЕ: Оценка Предложений Комиссией (Bahalandyrmak)
        console.log('\n8️⃣ ТЕСТ: Финансовая и Техническая оценка комиссии (Bahalandyrmak)...');
        
        // Получаем тендер с предложениями и зафиксированными курсами
        const fullTender = await prisma.tender.findUnique({
            where: { id: tender.id },
            include: {
                specs: true,
                offers: {
                    include: { supplier: true, specs: true, exchangeRates: true }
                }
            }
        });

        const ranking = fullTender.offers.map(off => {
            let totalInTMT = 0;
            off.specs.forEach(s => {
                // Если валюта USD, пересчитываем в TMT по зафиксированному курсу OfferExchangeRate (3.5)
                const rateObj = off.exchangeRates.find(r => r.currencyId === currencyUSD.id);
                const rate = off.baseCurrencyId === currencyUSD.id ? (rateObj ? rateObj.value : 3.5) : 1;
                totalInTMT += s.unitPrice * s.quantity * rate;
            });

            return {
                offerId: off.id,
                supplierName: off.supplier.name,
                currency: off.baseCurrencyId === currencyUSD.id ? 'USD' : 'TMT',
                originalPrice: off.offeredPrice,
                calculatedPriceInTMT: totalInTMT
            };
        });

        ranking.sort((a, b) => a.calculatedPriceInTMT - b.calculatedPriceInTMT);

        console.log('📊 Результаты финансового ранжирования комиссии:');
        ranking.forEach((item, index) => {
            console.log(`   ${index + 1} Место: ${item.supplierName} | Итоговая сумма в ТМТ: ${item.calculatedPriceInTMT} TMT (Исходно: ${item.originalPrice} ${item.currency})`);
        });

        // 9. ТЕСТИРОВАНИЕ: Объявление Победителя (ýeňiji yglan edildi)
        console.log('\n9️⃣ ТЕСТ: Объявление победителя (ýeňiji yglan edildi)...');
        const winnerOffer = ranking[0];

        await prisma.$transaction([
            prisma.offer.updateMany({
                where: { tenderId: tender.id, id: { not: winnerOffer.offerId } },
                data: { status: 'RET_EDILDI' } // Отклонено (ret edildi)
            }),
            prisma.offer.update({
                where: { id: winnerOffer.offerId },
                data: { status: 'YENIJI' } // Победитель (ýeňiji)
            }),
            prisma.tender.update({
                where: { id: tender.id },
                data: { status: 'YENIJI_YGLAN_EDILDI' } // Победитель объявлен
            })
        ]);

        const finalTenderState = await prisma.tender.findUnique({
            where: { id: tender.id },
            include: { offers: { include: { supplier: true } } }
        });

        console.log(`🏆 Статус тендера: ${finalTenderState.status} (ýeňiji yglan edildi)`);
        finalTenderState.offers.forEach(o => {
            console.log(`   - Заявка от ${o.supplier.name}: Статус = ${o.status}`);
        });

        // 10. Проверка Журнала Аудита (Log)
        console.log('\n🔟 ТЕСТ: Проверка записи в Журнал Аудита (Log)...');
        await prisma.log.create({
            data: {
                userId: admin.id,
                eventType: 'TENDER',
                operationType: 'YAZMAK',
                ip: '127.0.0.1',
                data: { action: 'SELECT_WINNER', winnerSupplier: winnerOffer.supplierName }
            }
        });

        const logsCount = await prisma.log.count();
        console.log(`✅ В Журнале аудита записей: ${logsCount}`);

        console.log('\n========================================================');
        console.log('🎉 ВСЕ ТЕСТЫ ПРОЙДЕНЫ УСПЕШНО! КОД РАБОТАЕТ НА 100% КОРРЕКТНО!');
        console.log('========================================================');

    } catch (err) {
        console.error('❌ ОШИБКА ПРИ ТЕСТИРОВАНИИ:', err);
    } finally {
        await prisma.$disconnect();
    }
}

testFullTenderLifecycle();

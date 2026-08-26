require('dotenv').config();
const prisma = require('./src/lib/prisma');
const bcrypt = require('bcryptjs');

async function seedDatabase() {
    console.log('========================================================');
    console.log('🌱 СИДДИНГ (ЗАПОЛНЕНИЕ) РЕАЛЬНЫХ ДАННЫХ В POSTGRESQL');
    console.log('========================================================\n');

    try {
        // 1. Очистка таблиц
        console.log('1️⃣ Очищаем таблицы перед заполнением...');
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

        console.log('✅ Очистка завершена.');

        // 2. Создание пользователей
        console.log('2️⃣ Создаем пользователей...');
        const passwordHash = await bcrypt.hash('password123', 10);

        const admin = await prisma.user.create({
            data: { username: 'admin', password: passwordHash, firstName: 'Arzygül', lastName: 'Berdiýewa', middleName: 'Berdiýewna', roleType: 'ADMIN', position: 'Главный Администратор' }
        });

        const client = await prisma.user.create({
            data: { username: 'client1', password: passwordHash, firstName: 'Aman', lastName: 'Amanow', middleName: 'Amonowiç', roleType: 'CLIENT', position: 'Заказчик (Минздрав)' }
        });

        const specialist = await prisma.user.create({
            data: { username: 'spec1', password: passwordHash, firstName: 'Serdar', lastName: 'Begjanow', middleName: 'Batyrowiç', roleType: 'PURCHASING_SPECIALIST', position: 'Специалист по закупкам' }
        });

        const commission = await prisma.user.create({
            data: { username: 'comm1', password: passwordHash, firstName: 'Resul', lastName: 'Baýramow', roleType: 'COMMISSION_MEMBER', position: 'Член Тендерной Комиссии' }
        });

        const supplierUser1 = await prisma.user.create({
            data: { username: 'supplier1', password: passwordHash, firstName: 'Gülşat', lastName: 'Berdiýewa', roleType: 'SUPPLIER', position: 'Директор ИП ФармаЛогистик' }
        });

        const supplierUser2 = await prisma.user.create({
            data: { username: 'supplier2', password: passwordHash, firstName: 'Merjen', lastName: 'Süleýmanowa', roleType: 'SUPPLIER', position: 'Представитель ХО МедИмпорт' }
        });

        console.log('✅ Пользователи созданы.');

        // 3. Категории
        console.log('3️⃣ Создаем категории...');
        const catMed = await prisma.category.create({ data: { name: 'Медикаменты', code: 'MED-01' } });
        const catCon = await prisma.category.create({ data: { name: 'Строительные материалы', code: 'CON-02' } });
        const catEqp = await prisma.category.create({ data: { name: 'Медицинское оборудование', code: 'EQP-03' } });

        // 4. Единицы измерения
        console.log('4️⃣ Создаем единицы измерения...');
        const unitPack = await prisma.unit.create({ data: { name: 'Упаковка', shortName: 'уп', order: 1 } });
        const unitPcs = await prisma.unit.create({ data: { name: 'Штука', shortName: 'шт', order: 2 } });
        const unitKg = await prisma.unit.create({ data: { name: 'Килограмм', shortName: 'кг', order: 3 } });

        // 5. Валюты и курсы
        console.log('5️⃣ Создаем валюты и курсы обмена...');
        const curTMT = await prisma.currency.create({ data: { name: 'Türkmenistan Manat', code: 'TMT', symbol: 'm', flag: '🇹🇲', order: 1 } });
        const curUSD = await prisma.currency.create({ data: { name: 'US Dollar', code: 'USD', symbol: '$', flag: '🇺🇸', order: 2 } });
        const curEUR = await prisma.currency.create({ data: { name: 'Euro', code: 'EUR', symbol: '€', flag: '🇪🇺', order: 3 } });

        await prisma.exchangeRate.create({ data: { fromCurrencyId: curUSD.id, toCurrencyId: curTMT.id, value: 3.5 } });
        await prisma.exchangeRate.create({ data: { fromCurrencyId: curEUR.id, toCurrencyId: curTMT.id, value: 3.8 } });

        // 6. Страны
        console.log('6️⃣ Создаем страны...');
        const countryTM = await prisma.country.create({ data: { name: 'Turkmenistan', alpha2: 'TM', alpha3: 'TKM', order: 1 } });
        const countryTR = await prisma.country.create({ data: { name: 'Turkey', alpha2: 'TR', alpha3: 'TUR', order: 2 } });
        const countryDE = await prisma.country.create({ data: { name: 'Germany', alpha2: 'DE', alpha3: 'DEU', order: 3 } });

        // 7. Условия поставки
        console.log('7️⃣ Создаем условия поставки INCOTERMS...');
        const termDAP = await prisma.deliveryTerm.create({ data: { name: 'Delivered At Place', shortName: 'DAP' } });
        const termDDP = await prisma.deliveryTerm.create({ data: { name: 'Delivered Duty Paid', shortName: 'DDP' } });
        const termCIP = await prisma.deliveryTerm.create({ data: { name: 'Carriage and Insurance Paid To', shortName: 'CIP' } });

        // 8. Товары МНН
        console.log('8️⃣ Создаем справочник товаров МНН...');
        const prodPara = await prisma.generalProduct.create({ data: { categoryId: catMed.id, name: 'Paracetamol 500 mg', code: 'PRC500', type: 'HARYT', description: 'Agry we gyzgyn düşüriji derman' } });
        const prodIbu = await prisma.generalProduct.create({ data: { categoryId: catMed.id, name: 'Ibuprofen 200 mg', code: 'IBU200', type: 'HARYT', description: 'Çişme we agry garşy derman' } });
        const prodSyr = await prisma.generalProduct.create({ data: { categoryId: catMed.id, name: 'Syringe 5 ml', code: 'SYR5ML', type: 'HARYT', description: 'Infeksiýa üçin şpris' } });
        const prodAmox = await prisma.generalProduct.create({ data: { categoryId: catMed.id, name: 'Amoxicillin 500 mg', code: 'GP003', type: 'HARYT', description: 'Antibiotik derman' } });

        // 9. Профили поставщиков
        console.log('9️⃣ Создаем поставщиков...');
        const supplier1 = await prisma.supplier.create({
            data: {
                userId: supplierUser1.id,
                countryId: countryTM.id,
                name: 'ИП ФармаЛогистик',
                regNumber: 'REG-100230',
                licenseNumber: 'LIC-998822',
                taxId: '1002304958',
                email: 'info@pharmalog.tm',
                phone: '+99312000001',
                address: 'г. Ашхабад, ул. Махтумкули 45'
            }
        });

        const supplier2 = await prisma.supplier.create({
            data: {
                userId: supplierUser2.id,
                countryId: countryTM.id,
                name: 'ХО МедИмпорт Трейд',
                regNumber: 'REG-500990',
                licenseNumber: 'LIC-554411',
                taxId: '5009901122',
                email: 'sales@medimport.tm',
                phone: '+99312000002',
                address: 'г. Аркадаг, проспект Акхана 12'
            }
        });

        
        // 9.5 Создаем компании
        console.log('9️⃣.5️⃣ Создаем компании...');
        await prisma.company.create({
            data: {
                name: 'ООО Медик-Фарм',
                address: 'Москва, ул. Ленина, 1',
                license: 'LIC-654321',
                email: 'info@medic-pharm.ru',
                phone: '+79991234567',
                 inn: '1234567890', userId: supplierUser1.id
            }
        });
        await prisma.company.create({
            data: {
                name: 'ИП Строй-Торг',
                address: 'Москва, ул. Пушкина, 2',
                license: 'LIC-210987',
                email: 'stroy@torg.ru',
                phone: '+79997654321',
                 inn: '0987654321', userId: supplierUser1.id
            }
        });
    
    // 10. Тендеры
        console.log('🔟 Создаем тендеры и спецификации...');
        const tender1 = await prisma.tender.create({
            data: {
                tenderNumber: 'Тендер № 23',
                title: 'Abatlyş işleri üçin строительных материалов и оборудования',
                description: 'Ministrliginiň garamagyndaky binalaryň we desgalaryň abatlaýyş işleri üçin tor (setka) enjam satyn almak.',
                technicalSpecs: 'TDS standartly, §3mm galyňlykda, §50x50mm gözenekli sinklenen metal tor.',
                price: 75000,
                type: 'YERLI',
                status: 'ACYK',
                visibility: 'ACYK',
                announcementDate: new Date('2026-01-30'),
                deadline: new Date('2026-03-30'),
                categoryId: catCon.id,
                createdById: client.id,
                specs: {
                    create: [
                        { positionNumber: 1, generalProductId: prodPara.id, unitId: unitPack.id, quantity: 1000, description: 'Упаковки по 20 таблеток' },
                        { positionNumber: 2, generalProductId: prodAmox.id, unitId: unitPack.id, quantity: 500, description: 'Упаковки по 10 капсул' }
                    ]
                }
            }
        });

        const tender2 = await prisma.tender.create({
            data: {
                tenderNumber: 'Тендер № 325',
                title: 'Arkadag şäherindäki медикаментов в г. Аркадаг',
                description: 'Ministrliginiň garamagyndaky binalaryň we desgalaryň abatlaýyş işleri üçin derman serişdelerini satyn almak.',
                technicalSpecs: 'Срок годности не менее 24 месяцев со дня поставки.',
                price: 120000,
                type: 'HALKARA',
                status: 'BAHALANDYRYLDY',
                visibility: 'ACYK',
                announcementDate: new Date('2026-02-01'),
                deadline: new Date('2026-03-01'),
                categoryId: catMed.id,
                createdById: client.id,
                specs: {
                    create: [
                        { positionNumber: 1, generalProductId: prodPara.id, unitId: unitPack.id, quantity: 5000, description: 'Analgyn tabletka 5000 gr' },
                        { positionNumber: 2, generalProductId: prodIbu.id, unitId: unitPack.id, quantity: 5000, description: 'Parasetamol tabletka 5000 gr' }
                    ]
                }
            }
        });

        // 11. Подача коммерческих предложений (Offers)
        console.log('1️⃣1️⃣ Создаем коммерческие предложения...');
        await prisma.offer.create({
            data: {
                tenderId: tender2.id,
                supplierId: supplier1.id,
                deliveryTermId: termCIP.id,
                baseCurrencyId: curTMT.id,
                number: 'AD1235',
                paymentTerms: 'Umumy mukdarynyň 50% geçirildi. Galan 50% ähli işler tamamlanansoň geçirilýär.',
                version: 1,
                isDefault: true,
                status: 'TABSARYLDY',
                offeredPrice: 30000,
                specs: {
                    create: [
                        { tenderSpecId: (await prisma.tenderSpecification.findFirst({ where: { tenderId: tender2.id } })).id, quantity: 5000, unitPrice: 3 },
                    ]
                },
                exchangeRates: {
                    create: [
                        { currencyId: curUSD.id, value: 3.5 },
                        { currencyId: curEUR.id, value: 3.8 }
                    ]
                }
            }
        });

        // 12. Логи аудита
        console.log('1️⃣2️⃣ Создаем записи в Журнал Аудита (Log)...');
        await prisma.log.create({
            data: {
                userId: admin.id,
                eventType: 'TENDER',
                operationType: 'YAZMAK',
                ip: '172.16.10.34',
                data: { action: 'SEED_DATABASE', message: 'Системное наполнение реальными данными завершено' }
            }
        });

        console.log('\n========================================================');
        console.log('🎉 РЕАЛЬНЫЕ ДАННЫЕ УСПЕШНО ЗАГРУЖЕНЫ В POSTGRESQL!');
        console.log('========================================================');

    } catch (e) {
        console.error('❌ Ошибка сиддинга:', e);
    } finally {
        await prisma.$disconnect();
    }
}

seedDatabase();

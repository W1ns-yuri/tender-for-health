const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const prisma = require('../src/lib/prisma');
const bcrypt = require('bcryptjs');

async function main() {
    console.log('==============================================');
    console.log('🚀 ЗАПУСК СИМУЛЯЦИИ ТЕНДЕРНОГО ПРОЦЕССА (E2E) 🚀');
    console.log('==============================================');

    try {
        // --- 1. Очистка старых тестовых данных (опционально, но полезно для чистоты эксперимента) ---
        console.log('\n🧹 1. Очистка предыдущих тестовых данных симуляции...');
        await prisma.offer.deleteMany();
        await prisma.tender.deleteMany();
        
        // Удаляем только тестовых пользователей из этого скрипта
        const dummyUsers = Array.from({ length: 10 }).map((_, i) => `sim_supplier_${i+1}`);
        await prisma.user.deleteMany({ where: { username: { in: dummyUsers } } });
        await prisma.user.deleteMany({ where: { username: 'sim_admin' } });

        // --- 2. Получение валюты ---
        console.log('💰 2. Подготовка валют...');
        let currencyTmt = await prisma.currency.findUnique({ where: { code: 'TMT' } });
        if (!currencyTmt) {
            currencyTmt = await prisma.currency.create({ data: { name: 'Manat', code: 'TMT' } });
        }
        let currencyUsd = await prisma.currency.findUnique({ where: { code: 'USD' } });
        if (!currencyUsd) {
            currencyUsd = await prisma.currency.create({ data: { name: 'Dollar', code: 'USD' } });
        }
        
        // Курс валюты
        await prisma.exchangeRate.deleteMany();
        await prisma.exchangeRate.create({
            data: { fromCurrencyId: currencyUsd.id, toCurrencyId: currencyTmt.id, value: 3.5 }
        });
        await prisma.exchangeRate.create({
            data: { fromCurrencyId: currencyTmt.id, toCurrencyId: currencyTmt.id, value: 1.0 }
        });

        // --- 3. Создание Администратора и 10 Поставщиков ---
        console.log('\n👥 3. Регистрация Администратора и 10 компаний-поставщиков...');
        const passwordHash = await bcrypt.hash('password123', 10);
        
        // Создаем админа
        const admin = await prisma.user.create({
            data: {
                username: 'sim_admin',
                password: passwordHash,
                firstName: 'Admin',
                lastName: 'Simulation',
                roleType: 'ADMIN'
            }
        });
        console.log(`✅ Создан администратор: ${admin.username}`);

        // Создаем поставщиков
        const suppliers = [];
        const companyNames = [
            'ХО "ФармаЛогистик"', 'ИП "МедСнаб"', 'ТОО "Здоровье Плюс"', 'ОАО "АптекаФарм"',
            'ЗАО "ГлобалМедика"', 'ИП "ТуркменДерман"', 'ХО "БиоСинтез"', 'ТОО "МедикалЭквипмент"',
            'ООО "ФармСтандарт"', 'ИП "ЭкоМед"'
        ];

        for (let i = 0; i < 10; i++) {
            const user = await prisma.user.create({
                data: {
                    username: `sim_supplier_${i+1}`,
                    password: passwordHash,
                    firstName: `Представитель ${i+1}`,
                    lastName: `Поставщика`,
                    roleType: 'SUPPLIER'
                }
            });
            const supplier = await prisma.supplier.create({
                data: {
                    userId: user.id,
                    name: companyNames[i],
                    taxId: `TAX${100000+i}`
                }
            });
            suppliers.push({ user, supplier });
        }
        console.log(`✅ Создано ${suppliers.length} компаний-поставщиков.`);

        // --- 4. Администратор создает тендер ---
        console.log('\n📝 4. Администратор объявляет новый тендер...');
        const tender = await prisma.tender.create({
            data: {
                lotNumber: `LOT-SIM-${Date.now().toString().slice(-4)}`,
                title: 'Закупка антибиотиков (Симуляция)',
                description: 'Срочная закупка медикаментов для клиник.',
                technicalSpecs: 'Срок годности не менее 12 месяцев. Соответствие стандартам.',
                price: 100000,
                deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // +7 дней
                type: 'YERLI',
                status: 'ACYK',
                visibility: 'ACYK',
                createdById: admin.id,
                specs: {
                    create: [
                        { name: 'Амоксициллин 500мг', quantity: 10000, positionNumber: 1, description: 'Таблетки' },
                        { name: 'Парацетамол 500мг', quantity: 20000, positionNumber: 2, description: 'Упаковки по 10шт' }
                    ]
                }
            },
            include: { specs: true }
        });
        console.log(`✅ Тендер "${tender.title}" (Лот ${tender.lotNumber}) успешно опубликован!`);
        
        // Симуляция уведомлений
        console.log('📧 Рассылка уведомлений участникам:');
        suppliers.forEach(s => {
            console.log(`   ➡️ Отправлено письмо компании "${s.supplier.name}": Опубликован новый тендер ${tender.lotNumber}.`);
        });

        // --- 5. Поставщики подают коммерческие предложения ---
        console.log('\n💼 5. Участники подают свои коммерческие предложения (Offers)...');
        
        const activeExchangeRates = await prisma.exchangeRate.findMany();
        
        for (let i = 0; i < suppliers.length; i++) {
            // Генерируем случайную цену с небольшим разбросом
            const basePriceItem1 = 5.0 + (Math.random() * 2); // 5-7
            const basePriceItem2 = 2.0 + (Math.random() * 1.5); // 2-3.5
            
            // Кто-то подает в USD, кто-то в TMT
            const currency = i % 3 === 0 ? currencyUsd : currencyTmt;
            
            // Кто-то "ошибается" и подает только одну позицию (неполное соответствие)
            const offerSpecsData = [];
            offerSpecsData.push({
                tenderSpecId: tender.specs[0].id,
                quantity: tender.specs[0].quantity,
                unitPrice: currency.code === 'USD' ? basePriceItem1 / 3.5 : basePriceItem1,
                description: 'Точное соответствие ТЗ'
            });

            // 9-я компания не подает вторую позицию
            if (i !== 8) {
                offerSpecsData.push({
                    tenderSpecId: tender.specs[1].id,
                    quantity: tender.specs[1].quantity,
                    unitPrice: currency.code === 'USD' ? basePriceItem2 / 3.5 : basePriceItem2,
                    description: 'Аналог высокого качества'
                });
            }

            const totalPrice = offerSpecsData.reduce((acc, curr) => acc + (curr.quantity * curr.unitPrice), 0);

            await prisma.offer.create({
                data: {
                    tenderId: tender.id,
                    supplierId: suppliers[i].supplier.id,
                    baseCurrencyId: currency.id,
                    paymentTerms: 'Предоплата 30%',
                    status: 'TABSARYLDY',
                    offeredPrice: totalPrice,
                    specs: { create: offerSpecsData },
                    exchangeRates: {
                        create: activeExchangeRates.map((rate) => ({
                            currencyId: rate.fromCurrencyId,
                            value: rate.value,
                        }))
                    }
                }
            });
            console.log(`   ✅ Компания "${suppliers[i].supplier.name}" подала заявку на сумму ${totalPrice.toFixed(2)} ${currency.code}`);
        }

        // --- 6. Комиссия: Вскрытие предложений ---
        console.log('\n🔓 6. Комиссия вскрывает предложения (Перевод статуса в BAHALANDYRYLDY)...');
        await prisma.tender.update({
            where: { id: tender.id },
            data: { status: 'BAHALANDYRYLDY' }
        });
        console.log('✅ Конверты вскрыты. Оценки разблокированы.');

        // --- 7. Оценка комиссии (Пересчет по валютам и выявление лидера) ---
        console.log('\n⚖️ 7. Финансово-техническая оценка (Ранжирование)...');
        const tenderForEval = await prisma.tender.findUnique({
            where: { id: tender.id },
            include: {
                specs: true,
                offers: {
                    include: { supplier: true, specs: true, exchangeRates: { include: { currency: true } } },
                },
            },
        });

        const evaluatedOffers = tenderForEval.offers.map((offer) => {
            let calculatedTotalInBase = 0;
            offer.specs.forEach((spec) => {
                const rateObj = offer.exchangeRates.find((r) => r.currencyId === offer.baseCurrencyId);
                const rate = rateObj ? rateObj.value : 1;
                calculatedTotalInBase += spec.unitPrice * spec.quantity * rate;
            });

            return {
                offerId: offer.id,
                supplierName: offer.supplier.name,
                rawPrice: offer.offeredPrice.toFixed(2),
                currency: offer.exchangeRates.find((r) => r.currencyId === offer.baseCurrencyId)?.currency?.code || 'TMT',
                calculatedTMT: calculatedTotalInBase,
                isFullCompliance: offer.specs.length === tenderForEval.specs.length,
            };
        });

        evaluatedOffers.sort((a, b) => {
            if (a.isFullCompliance !== b.isFullCompliance) return a.isFullCompliance ? -1 : 1;
            return a.calculatedTMT - b.calculatedTMT;
        });

        console.table(evaluatedOffers.map((e, idx) => ({
            'Ранг': idx + 1,
            'Компания': e.supplierName,
            'Заявлено': `${e.rawPrice} ${e.currency}`,
            'Итого (TMT)': e.calculatedTMT.toFixed(2),
            'Спецификация': e.isFullCompliance ? 'Полная (100%)' : 'Частичная'
        })));

        // --- 8. Выбор победителя ---
        console.log('\n🏆 8. Объявление победителя...');
        const winner = evaluatedOffers[0]; // Выбираем самого выгодного
        
        await prisma.$transaction([
            prisma.offer.updateMany({
                where: { tenderId: tender.id, id: { not: winner.offerId } },
                data: { status: 'RET_EDILDI' },
            }),
            prisma.offer.update({
                where: { id: winner.offerId },
                data: { status: 'YENIJI' },
            }),
            prisma.tender.update({
                where: { id: tender.id },
                data: { status: 'YENIJI_YGLAN_EDILDI' },
            }),
        ]);

        console.log(`✅ Компания "${winner.supplierName}" официально объявлена победителем тендера!`);
        console.log(`📧 Отправлено уведомление компании "${winner.supplierName}": Поздравляем! Ваш тендер выигран!`);
        console.log(`📧 Отправлено уведомление остальным 9 компаниям: К сожалению, ваша заявка была отклонена.`);
        
        console.log('\n🎉 Симуляция успешно завершена! 🎉');

    } catch (e) {
        console.error('❌ Ошибка во время симуляции:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();

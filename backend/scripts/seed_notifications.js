const prisma = require('../src/lib/prisma');

async function seedNotifications() {
    console.log('Seeding initial notifications...');

    const admin = await prisma.user.findUnique({ where: { username: 'admin' } });
    const derman = await prisma.user.findUnique({ where: { username: 'derman_saglyk' } });
    const medtech = await prisma.user.findUnique({ where: { username: 'medtehnika' } });
    const arassa = await prisma.user.findUnique({ where: { username: 'arassa_lukman' } });

    // Очищаем старые уведомления для чистой демонстрации
    await prisma.notification.deleteMany();

    // 1. Уведомления для Администратора
    if (admin) {
        await prisma.notification.createMany({
            data: [
                {
                    userId: admin.id,
                    title: 'Новый поставщик ожидает модерации',
                    message: '«HK BioReagent Standart» зарегистрировался и загрузил медицинскую лицензию Минздрава.',
                    type: 'supplier',
                    link: '/suppliers',
                    isRead: false,
                    createdAt: new Date(Date.now() - 1000 * 60 * 12),
                },
                {
                    userId: admin.id,
                    title: 'Поступило коммерческое предложение',
                    message: 'Новая заявка по тендеру TNDR-2026-004 от «HK Arassa Lukman Enjamlary».',
                    type: 'offer',
                    link: '/evaluation',
                    isRead: false,
                    createdAt: new Date(Date.now() - 1000 * 60 * 45),
                },
                {
                    userId: admin.id,
                    title: 'Прием заявок завершен',
                    message: 'Дедлайн тендера TNDR-2026-005 истек. Процедура готова к вскрытию конвертов комиссией.',
                    type: 'tender',
                    link: '/evaluation',
                    isRead: false,
                    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
                },
                {
                    userId: admin.id,
                    title: 'Утверждены результаты оценки',
                    message: 'Оглашен победитель «ÝGP MedTehnika Üpjünçilik» по закупке диагностических томографов.',
                    type: 'winner',
                    link: '/evaluation',
                    isRead: true,
                    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
                },
            ]
        });
    }

    // 2. Уведомления для Поставщиков
    if (derman) {
        await prisma.notification.createMany({
            data: [
                {
                    userId: derman.id,
                    title: '🏆 Поздравляем с победой в тендере!',
                    message: 'Ваше предложение признано победителем по тендеру TNDR-2026-001 (Фармацевтика и инсулины) на сумму 1,800,000 TMT.',
                    type: 'winner',
                    link: '/evaluation',
                    isRead: false,
                    createdAt: new Date(Date.now() - 1000 * 60 * 15),
                },
                {
                    userId: derman.id,
                    title: 'Верификация компании подтверждена',
                    message: 'Администратор одобрил ваши уставные документы. Вам открыт полный доступ к подаче коммерческих предложений.',
                    type: 'supplier',
                    link: '/profile',
                    isRead: false,
                    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3),
                },
                {
                    userId: derman.id,
                    title: 'Опубликован новый открытый тендер',
                    message: 'Минздрав объявил открытый тендер: «Закупка антибактериальных средств для стационаров».',
                    type: 'tender',
                    link: '/tenders',
                    isRead: true,
                    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5),
                },
            ]
        });
    }

    if (medtech) {
        await prisma.notification.createMany({
            data: [
                {
                    userId: medtech.id,
                    title: '🏆 Поздравляем с победой в тендере!',
                    message: 'Ваша заявка признана победителем по закупке томографов МРТ и УЗИ оборудования на 3,450,000 TMT.',
                    type: 'winner',
                    link: '/evaluation',
                    isRead: false,
                    createdAt: new Date(Date.now() - 1000 * 60 * 30),
                },
                {
                    userId: medtech.id,
                    title: 'Персональное приглашение на закрытый тендер',
                    message: 'Ваша организация приглашена к участию в закрытом тендере №TNDR-2026-002: Сервисное обслуживание медоборудования.',
                    type: 'tender',
                    link: '/tenders',
                    isRead: false,
                    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6),
                },
            ]
        });
    }

    if (arassa) {
        await prisma.notification.createMany({
            data: [
                {
                    userId: arassa.id,
                    title: 'Коммерческое предложение зарегистрировано',
                    message: 'Ваша заявка по тендеру №TNDR-2026-004 успешно сохранена и принята к рассмотрению организатором.',
                    type: 'offer',
                    link: '/offers',
                    isRead: false,
                    createdAt: new Date(Date.now() - 1000 * 60 * 45),
                },
                {
                    userId: arassa.id,
                    title: 'Верификация компании подтверждена',
                    message: 'Статус аккредитации подтвержден. Доступ ко всем процедурам открыт.',
                    type: 'supplier',
                    link: '/profile',
                    isRead: true,
                    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
                },
            ]
        });
    }

    console.log('✅ Notifications seeded successfully!');
}

seedNotifications()
    .catch(console.error)
    .finally(() => prisma.$disconnect());

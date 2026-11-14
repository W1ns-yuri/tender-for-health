const prisma = require('../lib/prisma');
const { notifyAdmins, sendNotification } = require('../controllers/notificationController');
const { publishTenderById } = require('./tenderPublish');

/**
 * Отложенная публикация: черновики с наступившим publishAt публикуются.
 * Если тендер к этому моменту не проходит проверки (например, дедлайн уже прошёл),
 * снимаем расписание и сообщаем админам, а не молчим.
 */
async function publishScheduledTenders() {
    try {
        const due = await prisma.tender.findMany({
            where: { status: 'TASLAMA', publishAt: { lte: new Date() } },
            select: { id: true, tenderNumber: true, title: true },
        });
        for (const t of due) {
            const result = await publishTenderById(t.id);
            if (result.error) {
                await prisma.tender.updateMany({ where: { id: t.id, status: 'TASLAMA' }, data: { publishAt: null } });
                await notifyAdmins({
                    title: 'Запланированная публикация не состоялась',
                    message: `Тендер №${t.tenderNumber} («${t.title}») не опубликован: ${result.error}`,
                    type: 'warning',
                    link: `/tenders/${t.id}/edit`,
                });
            }
        }
    } catch (error) {
        console.error('[TenderScheduler] Ошибка отложенной публикации:', error);
    }
}

/**
 * Проверка дедлайнов открытых тендеров и авто-перевод в статус YAPYK
 */
async function checkTenderDeadlines() {
    try {
        const now = new Date();
        
        // Поиск всех открытых тендеров, у которых истек срок подачи
        const expiredTenders = await prisma.tender.findMany({
            where: {
                status: 'ACYK',
                deadline: {
                    lt: now
                }
            },
            include: {
                offers: {
                    select: {
                        supplier: {
                            select: {
                                userId: true,
                                name: true
                            }
                        }
                    }
                }
            }
        });

        if (expiredTenders.length === 0) return;

        console.log(`⏰ [TenderScheduler] Найдено ${expiredTenders.length} тендер(ов) с истекшим дедлайном. Автоперевод в статус YAPYK...`);

        for (const tender of expiredTenders) {
            // Переводим статус в YAPYK (Прием заявок закрыт)
            // Атомарно: переводим только если тендер всё ещё ACYK. Если запущено два инстанса сервера
            // или админ успел вскрыть конверты, второй раз ничего не произойдёт и уведомления не задвоятся.
            const { count } = await prisma.tender.updateMany({
                where: { id: tender.id, status: 'ACYK' },
                data: { status: 'YAPYK' }
            });
            if (count === 0) continue;

            // 1. Уведомление администраторам платформы
            await notifyAdmins({
                title: '⏳ Дедлайн тендера завершен',
                message: `Срок подачи коммерческих предложений по закупке №${tender.tenderNumber} («${tender.title}») истек. Прием заявок закрыт. Доступно вскрытие конвертов и процедура оценки.`,
                type: 'warning',
                link: `/evaluation/${tender.id}`
            });

            // 2. Уведомление всем поставщикам, успевшим подать предложения
            const participantUserIds = Array.from(new Set(
                (tender.offers || [])
                    .map(o => o.supplier?.userId)
                    .filter(Boolean)
            ));

            if (participantUserIds.length > 0) {
                await sendNotification({
                    userIds: participantUserIds,
                    title: 'Прием предложений завершен',
                    message: `Прием коммерческих предложений по тендеру №${tender.tenderNumber} («${tender.title}») завершен. Тендерная комиссия переходит к процедуре оценки.`,
                    type: 'tender',
                    link: `/tenders/${tender.id}`
                });
            }
        }
    } catch (error) {
        console.error('❌ [TenderScheduler] Ошибка при проверке дедлайнов:', error);
    }
}

/**
 * Инициализация фонового планировщика
 * @param {number} intervalMs - интервал проверки (по умолчанию 60 секунд)
 */
function initTenderScheduler(intervalMs = 60000) {
    // Выполняем проверку через 3 секунды после старта сервера
    const tick = async () => {
        await publishScheduledTenders();
        await checkTenderDeadlines();
    };
    setTimeout(tick, 3000);

    // Регулярный интервал
    const timer = setInterval(tick, intervalMs);
    console.log(`⏱️ [TenderScheduler] Фоновый планировщик дедлайнов запущен (интервал: ${intervalMs / 1000} сек)`);
    return timer;
}

module.exports = {
    checkTenderDeadlines,
    publishScheduledTenders,
    initTenderScheduler
};

/**
 * Публикация тендера: проверки + атомарный перевод TASLAMA → ACYK + оповещения поставщиков.
 * Используется кнопкой «Опубликовать» и планировщиком (отложенная публикация).
 * Возвращает { tender } или { status, error }.
 */
const prisma = require('../lib/prisma');
const { sendNotification } = require('../controllers/notificationController');

/** Проверки перед публикацией. at — момент публикации (для отложенной — запланированное время) */
function publishBlocker(tender, at = new Date()) {
    if (tender.status !== 'TASLAMA') return 'Опубликовать можно только черновик';
    if (!tender.lots || tender.lots.length === 0) return 'Невозможно опубликовать тендер: добавьте как минимум один лот';
    const emptyLot = tender.lots.find((l) => !l.specs || l.specs.length === 0);
    if (emptyLot) return `Невозможно опубликовать тендер: в лоте «${emptyLot.name || emptyLot.lotNumber}» нет ни одной позиции`;
    if (new Date(tender.deadline) <= at) return 'Невозможно опубликовать тендер: дедлайн уже прошёл. Укажите новый срок.';
    if (!tender.title?.trim() || tender.title.trim() === 'Без названия') return 'Невозможно опубликовать тендер: укажите название закупки';
    return null;
}

async function publishTenderById(id) {
    const tender = await prisma.tender.findUnique({
        where: { id },
        include: {
            lots: {
                include: { specs: true }
            }
        }
    });

    if (!tender) {
        return { status: 404, error: 'Тендер не найден' };
    }

    const blocker = publishBlocker(tender);
    if (blocker) return { status: 400, error: blocker };

    // Атомарно: при двойном клике второй запрос не пройдёт (статус уже не TASLAMA),
    // иначе поставщики получили бы оповещение о публикации дважды
    const switched = await prisma.tender.updateMany({ where: { id, status: 'TASLAMA' }, data: { status: 'ACYK', announcementDate: new Date(), publishAt: null } });
    if (switched.count === 0) {
        return { status: 400, error: 'Тендер уже опубликован' };
    }

    const updated = await prisma.tender.findUnique({
        where: { id },
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
            invitedSuppliers: {
                include: {
                    supplier: true
                }
            }
        }
    });

    // Оповещения при публикации тендера:
    try {
        if (updated.visibility === 'YAPYK' && updated.invitedSuppliers && updated.invitedSuppliers.length > 0) {
            // Закрытый тендер: персональные приглашения для выбранных поставщиков
            for (const inv of updated.invitedSuppliers) {
                if (inv.supplier?.userId) {
                    sendNotification({
                        userId: inv.supplier.userId,
                        title: 'Персональное приглашение на участие в закрытом тендере',
                        message: `Ваша организация приглашена к участию в закрытом тендере №${updated.tenderNumber}: «${updated.title}».`,
                        type: 'tender',
                        link: `/tenders/${updated.id}`
                    }).catch(e => console.error('Error sending private tender invite:', e));
                }
            }
        } else if (updated.visibility === 'ACYK') {
            // Открытый тендер: оповещаем верифицированных поставщиков (например, по релевантной категории)
            const suppliers = await prisma.supplier.findMany({
                where: {
                    verificationStatus: 'VERIFIED',
                    isActive: true,
                    ...(updated.categoryId ? {
                        categories: {
                            some: { categoryId: updated.categoryId }
                        }
                    } : {})
                },
                select: { userId: true }
            });

            const targetUserIds = suppliers.map(s => s.userId).filter(Boolean);
            if (targetUserIds.length > 0) {
                sendNotification({
                    userIds: targetUserIds,
                    title: 'Опубликован новый открытый тендер',
                    message: `Объявлен открытый тендер №${updated.tenderNumber}: «${updated.title}». Прием заявок открыт.`,
                    type: 'tender',
                    link: `/tenders/${updated.id}`
                }).catch(e => console.error('Error notifying suppliers about new open tender:', e));
            }
        }
    } catch (notifErr) {
        console.error('Ошибка отправки уведомлений при публикации тендера:', notifErr);
    }

    return { tender: updated };
}

module.exports = { publishTenderById, publishBlocker };

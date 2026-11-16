/**
 * Лоты тендера: добавление, изменение (вместе с позициями) и удаление.
 * Менять структуру можно, только пока по тендеру нет заявок и приём не закрыт.
 */
const prisma = require('../lib/prisma');
const { sendError } = require('../utils/httpErrors');
const { MAX_TITLE, tooLong, specsError, lotNumberError, lotTypeError } = require('../utils/validation');
const { REQUIREMENTS_INCLUDE } = require('../services/specRequirements');
const { LOCKED_STRUCTURE_ERROR, assertStructureEditable, createLotSpecs } = require('../services/tenderStructure');

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
            withOperator,
            fuelIncluded,
            supportIncluded,
            specs
        } = req.body;

        const inputError = specsError(specs) || lotNumberError(lotNumber) || lotTypeError(lotType) || (tooLong(name, MAX_TITLE) ? 'Слишком длинное название лота' : null);
        if (inputError) return res.status(400).json({ error: inputError });

        const tender = await prisma.tender.findUnique({ where: { id } });
        if (!tender) {
            return res.status(404).json({ error: 'Тендер не найден' });
        }
        if (!(await assertStructureEditable(tender))) {
            return res.status(400).json({ error: LOCKED_STRUCTURE_ERROR });
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
                    withOperator: Boolean(withOperator),
                    fuelIncluded: Boolean(fuelIncluded),
                    supportIncluded: Boolean(supportIncluded),
                }
            });

            if (specs && Array.isArray(specs)) {
                await createLotSpecs(tx, id, lot.id, specs);
            }

            return await tx.tenderLot.findUnique({
                where: { id: lot.id },
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
            });
        });

        res.status(201).json(newLot);
    } catch (error) {
        sendError(res, error, 'Ошибка создания лота');
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
            withOperator,
            fuelIncluded,
            supportIncluded,
            specs
        } = req.body;

        const inputError = specsError(specs) || lotNumberError(lotNumber) || lotTypeError(lotType) || (tooLong(name, MAX_TITLE) ? 'Слишком длинное название лота' : null);
        if (inputError) return res.status(400).json({ error: inputError });

        const existingLot = await prisma.tenderLot.findFirst({
            where: { id: lotId, tenderId: id }
        });
        if (!existingLot) {
            return res.status(404).json({ error: 'Лот не найден в данном тендере' });
        }
        const lotTender = await prisma.tender.findUnique({ where: { id } });
        if (!(await assertStructureEditable(lotTender))) {
            return res.status(400).json({ error: LOCKED_STRUCTURE_ERROR });
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
                    withOperator: withOperator !== undefined ? Boolean(withOperator) : existingLot.withOperator,
                    fuelIncluded: fuelIncluded !== undefined ? Boolean(fuelIncluded) : existingLot.fuelIncluded,
                    supportIncluded: supportIncluded !== undefined ? Boolean(supportIncluded) : existingLot.supportIncluded,
                }
            });

            if (specs !== undefined && Array.isArray(specs)) {
                await tx.tenderSpecification.deleteMany({
                    where: { lotId }
                });

                await createLotSpecs(tx, id, lotId, specs);
            }

            return await tx.tenderLot.findUnique({
                where: { id: lotId },
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
            });
        });

        res.json(updatedLot);
    } catch (error) {
        sendError(res, error, 'Ошибка обновления лота');
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
        const lotTender = await prisma.tender.findUnique({ where: { id } });
        if (!(await assertStructureEditable(lotTender))) {
            return res.status(400).json({ error: LOCKED_STRUCTURE_ERROR });
        }

        await prisma.$transaction(async (tx) => {
            await tx.tenderSpecification.deleteMany({ where: { lotId } });
            await tx.lotFile.deleteMany({ where: { lotId } });
            await tx.tenderLot.delete({ where: { id: lotId } });
        });

        res.json({ success: true, message: 'Лот успешно удален', lotId });
    } catch (error) {
        sendError(res, error, 'Ошибка удаления лота');
    }
};

module.exports = { createLot, updateLot, deleteLot };

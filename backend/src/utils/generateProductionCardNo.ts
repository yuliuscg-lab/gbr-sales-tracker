// backend/src/utils/productionCardNo.ts
import { prisma } from '../config/prisma';

const PREFIX = 'KP';

export async function generateProductionCardNo(): Promise<string> {
    const now = new Date();
    const yearFull = now.getFullYear();
    const yy = String(yearFull).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const prefixYearMonth = `${PREFIX}${yy}${mm}`;

    // Rentang awal dan akhir tahun berjalan (1 Jan - 31 Des)
    const startOfYear = new Date(yearFull, 0, 1);
    const endOfYear = new Date(yearFull, 11, 31, 23, 59, 59, 999);

    // Ambil kartu terakhir yang dibuat pada tahun ini
    const lastCard = await prisma.productionCard.findFirst({
        where: {
            createdAt: {
                gte: startOfYear,
                lte: endOfYear,
            },
        },
        orderBy: {
            cardNo: 'desc',
        },
        select: {
            cardNo: true,
        },
    });

    if (!lastCard || !lastCard.cardNo) {
        return `${prefixYearMonth}0001`;
    }

    // Ekstrak 4 digit terakhir (XXXX)
    const lastSequenceStr = lastCard.cardNo.slice(-4);
    const lastSequence = parseInt(lastSequenceStr, 10);
    const nextSequence = isNaN(lastSequence) ? 1 : lastSequence + 1;

    return `${prefixYearMonth}${String(nextSequence).padStart(4, '0')}`;
}

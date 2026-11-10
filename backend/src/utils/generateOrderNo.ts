import { prisma } from '../config/prisma';

export async function generateOrderNo(
    date: Date = new Date()
): Promise<string> {
    const currentYear = date.getFullYear();
    const yy = String(currentYear).slice(-2); // 2 digit tahun, misal "26"
    const mm = String(date.getMonth() + 1).padStart(2, '0'); // 2 digit bulan, misal "11"
    const prefix = `SO${yy}${mm}`;

    // Rentang waktu 1 tahun berjalan untuk reset tahunan
    const startOfYear = new Date(currentYear, 0, 1, 0, 0, 0, 0);
    const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59, 999);

    // Ambil order terakhir yang dibuat pada tahun berjalan dengan awalan SO{YY}
    const lastOrderOfYear = await prisma.order.findFirst({
        where: {
            createdAt: {
                gte: startOfYear,
                lte: endOfYear,
            },
            orderNo: {
                startsWith: `SO${yy}`,
            },
        },
        orderBy: {
            createdAt: 'desc',
        },
        select: {
            orderNo: true,
        },
    });

    let nextSequence = 1;

    if (lastOrderOfYear?.orderNo) {
        // Ambil 4 digit sequence terakhir (XXXX)
        const lastSeqString = lastOrderOfYear.orderNo.slice(-4);
        const lastSeq = parseInt(lastSeqString, 10);

        if (!isNaN(lastSeq)) {
            nextSequence = lastSeq + 1;
        }
    }

    const sequencePadded = String(nextSequence).padStart(4, '0');
    return `${prefix}${sequencePadded}`;
}

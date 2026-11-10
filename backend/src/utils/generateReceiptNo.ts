import { prisma } from '../config/prisma';

export async function generateReceiptNo(
    date: Date = new Date()
): Promise<string> {
    const currentYear = date.getFullYear();
    const yy = String(currentYear).slice(-2); // 2 digit tahun, misal: "26"
    const mm = String(date.getMonth() + 1).padStart(2, '0'); // 2 digit bulan, misal: "11"
    const prefix = `PAY${yy}${mm}`;

    const startOfYear = new Date(currentYear, 0, 1, 0, 0, 0, 0);
    const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59, 999);

    // Ambil data payment terakhir di tahun berjalan dengan awalan RCP{YY}
    const lastPayment = await prisma.payment.findFirst({
        where: {
            createdAt: {
                gte: startOfYear,
                lte: endOfYear,
            },
            receiptNo: {
                startsWith: `PAY${yy}`,
            },
        },
        orderBy: {
            createdAt: 'desc',
        },
        select: {
            receiptNo: true,
        },
    });

    let nextSequence = 1;

    if (lastPayment?.receiptNo) {
        // Ambil 4 digit sequence terakhir
        const lastSeqString = lastPayment.receiptNo.slice(-4);
        const lastSeq = parseInt(lastSeqString, 10);

        if (!isNaN(lastSeq)) {
            nextSequence = lastSeq + 1;
        }
    }

    const sequencePadded = String(nextSequence).padStart(4, '0');
    return `${prefix}${sequencePadded}`;
}

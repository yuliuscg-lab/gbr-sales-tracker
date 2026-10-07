import { prisma } from "../config/prisma";

export async function generateOrderNo(date: Date = new Date()): Promise<string> {
    const currentYear = date.getFullYear();
    const yy = String(currentYear).slice(-2);
    const mm = String(date.getMonth()+1).padStart(2, "0");

    const startOfYear = new Date(currentYear, 0, 1, 0, 0, 0, 0);
    const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59, 999);

    const lastOrderOfYear = await prisma.order.findFirst({
        where: {
            createdAt: {
                gte: startOfYear,
                lte: endOfYear,
            },
            orderNo: {
                startsWith: `SO-${yy}`,
            },
        },
        orderBy: {
            createdAt: "desc",
        },
        select:{
            orderNo:true,
        },
    });

    let nextSequence = 1;

    if (lastOrderOfYear?.orderNo) {
        const parts = lastOrderOfYear.orderNo.split("-");
        const lastSeqString = parts[parts.length-1];
        const lastSeq = parseInt(lastSeqString,10);
        
        if (!isNaN(lastSeq)) {
            nextSequence = lastSeq + 1;
        }
    }

    const sequencePadded = String(nextSequence).padStart(4,"0");

    return `SO-${yy}${mm}-${sequencePadded}`;
}

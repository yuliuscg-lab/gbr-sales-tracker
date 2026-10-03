import { prisma } from "../config/prisma";

const prefix = "GBR";

export async function generateProductCode(): Promise<string> {

    const lastProduct = await prisma.product.findFirst({
        where: {
            code: {
                startsWith: prefix,
            },
        },
        orderBy: {
            code: "desc",
        },
        select: {
            code: true,
        },
    });

    if (!lastProduct || !lastProduct.code) {
        return `${prefix}0001`;
    }

    const numericPart = lastProduct.code.substring(prefix.length);
    const lastSequence = parseInt(numericPart,10);

    const nextSequence = isNaN(lastSequence) ? 1 : lastSequence + 1;
    const paddedSequence = String(nextSequence).padStart(4,"0");


    return `${prefix}${paddedSequence}`;
    
}
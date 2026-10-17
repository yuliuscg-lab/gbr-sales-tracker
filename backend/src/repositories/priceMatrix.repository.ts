import { prisma } from "../config/prisma";

export class PriceMatrixRepository {
    async getMatrixByCustomerId(customerId: string) {
        const products = await prisma.product.findMany({
            where: {
                deletedAt:null
            },
            include: {
                units: {
                    orderBy: { conversionQty: "asc" },
                    include: {
                        customerPrices: {
                            where: { customerId },
                            select: { price: true },
                        },
                    },
                },
            },
            orderBy: { name: "asc"},
        });

        return products.map((prod)=>({
            productId: prod.id,
            code: prod.code,
            name: prod.name,
            baseUnit: prod.baseUnit,
            units: prod.units.map((unit) => ({
                productUnitId: unit.id,
                unitName: unit.unitName,
                conversionQty: unit.conversionQty,
                price: unit.customerPrices[0]?.price ?? null,
            })),
        }));
    }

    async findCustomerPrice(customerId:string, productUnitId:string) {
        return prisma.customerProductPrice.findUnique({
            where: {
                customerId_productUnitId: {
                    customerId,
                    productUnitId,
                },
            },
        });
    }

    async updateMatrix(customerId: string, prices: { productUnitId: string; price:number}[]) {
        return prisma.$transaction(
            prices.map((item)=> 
            prisma.customerProductPrice.upsert({
                where: {
                    customerId_productUnitId: {
                        customerId,
                        productUnitId: item.productUnitId,
                    },
                },
                create: {
                    customerId,
                    productUnitId: item.productUnitId,
                    price: item.price,
                },
                update: {
                    price: item.price,
                },
            })
        )
    );
    }
}

export const priceMatrixRepository = new PriceMatrixRepository();
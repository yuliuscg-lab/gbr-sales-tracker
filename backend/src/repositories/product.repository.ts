import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { CreateProductDTO, CreateProductUnitDTO, UpdateProductDTO } from "../types/product.types";

export class ProductRepository {
    async findMany(search?:string) {
        const where: Prisma.ProductWhereInput = {
            deletedAt: null,
        };

        if(search) {
            where.OR = [
                { code: { contains: search, mode: "insensitive"}},
                { name: { contains: search, mode: "insensitive"}},
            ];
        }

        return prisma.product.findMany({
            where,
            include: {
                units: {
                    orderBy: { conversionQty: "asc" },
                },
            },
            orderBy: { name: "asc" },
        });
    }

    async findById(id:string) {
        return prisma.product.findFirst({
            where: { id, deletedAt:null },
            include: {
                units : {
                    orderBy: { conversionQty: "asc" },
                },
            },
        });
    }

    async findByName(name:string) {
        return prisma.product.findFirst({
            where: { name: {
                equals: name, mode: "insensitive"
            }, deletedAt:null},
        });
    }

    async findByCode(code:string) {
        return prisma.product.findFirst({
            where: { code: { equals: code, mode: "insensitive"}, deletedAt:null },
        });
    }

    async create(data: CreateProductDTO) {
        const unitsData: CreateProductUnitDTO[] = [
            {
                unitName: data.baseUnit,
                conversionQty: 1,
                price: data.basePrice,
            },
            ...(data.additionalUnits || []),
        ];

        return prisma.product.create({
            data: {
                code: data.code,
                name: data.name,
                baseUnit: data.baseUnit,
                basePrice: data.basePrice,
                units: {
                    create: unitsData,
                },
            },
            include: {
                units: {
                    orderBy: { conversionQty: "asc" },
                },
            },
        });
    }

    async update(id: string, data: UpdateProductDTO) {

        return prisma.$transaction(async (tx)=> {
            const current = await tx.product.findUniqueOrThrow({
                where: { id },
                include: {
                    units: true
                }
            });

            const effectiveBaseUnit = data.baseUnit ?? current.baseUnit;

            await tx.product.update({
                where: { id },
                data : {
                    ...(data.name && { name: data.name}),
                    ...(data.baseUnit && { baseUnit: data.baseUnit}),
                    ...(data.basePrice !== undefined && { basePrice: data.basePrice})
                },
            });

            if (data.basePrice !== undefined || data.baseUnit !== undefined) {
                const baseUnitRecord = current.units.find((u)=>u.conversionQty ===1);
                if(baseUnitRecord) {
                    await tx.productUnit.update({
                        where: {id: baseUnitRecord.id},
                        data: {
                            ...(data.baseUnit && { unitName: data.baseUnit }),
                            ...(data.basePrice !== undefined && {price:data.basePrice}),
                        },
                    });
                }
            }

            if(data.additionalUnits ) {
                await tx.productUnit.deleteMany({
                    where : {
                        productId: id,
                        conversionQty: { gt: 1 },
                    },
                });

                if (data.additionalUnits.length>0) {
                    await tx.productUnit.createMany({
                        data: data.additionalUnits.map((u)=> ({
                            productId: id,
                            unitName: u.unitName!,
                            conversionQty: u.conversionQty!,
                            price: u.price!, 
                        })),
                    });
                }
            }

            return tx.product.findUnique({
                where: { id },
                include: {
                    units: {
                        orderBy: {
                            conversionQty: "asc"
                        },
                    },
                },
            });
        });
    }

    async delete (id:string) {
        return prisma.product.update({
            where: {id},
            data: {
                deletedAt: new Date(),
            },
        });
    }
}

export const productRepository = new ProductRepository();
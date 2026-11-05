import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import {
    CreateProductDTO,
    CreateProductUnitDTO,
    UpdateProductDTO,
} from '../types/product.types';

export class ProductRepository {
    async findMany(search?: string) {
        const where: Prisma.ProductWhereInput = {
            deletedAt: null,
        };

        if (search) {
            where.OR = [
                { code: { contains: search, mode: 'insensitive' } },
                { name: { contains: search, mode: 'insensitive' } },
            ];
        }

        return prisma.product.findMany({
            where,
            include: {
                units: {
                    orderBy: { conversionQty: 'asc' },
                },
            },
            orderBy: { code: 'asc' },
        });
    }

    async findById(id: string) {
        return prisma.product.findFirst({
            where: { id, deletedAt: null },
            include: {
                units: {
                    orderBy: { conversionQty: 'asc' },
                },
            },
        });
    }

    async findByIds(ids: string[]) {
        return prisma.product.findMany({
            where: {
                id: { in: ids },
                deletedAt: null,
            },
            select: {
                id: true,
                costPrice: true,
            },
        });
    }

    async findByName(name: string) {
        return prisma.product.findFirst({
            where: {
                name: {
                    equals: name,
                    mode: 'insensitive',
                },
                deletedAt: null,
            },
        });
    }

    async findByCode(code: string) {
        return prisma.product.findFirst({
            where: {
                code: { equals: code, mode: 'insensitive' },
                deletedAt: null,
            },
        });
    }

    async create(data: CreateProductDTO) {
        const unitsData: CreateProductUnitDTO[] = [
            {
                unitName: data.baseUnit,
                conversionQty: 1,
            },
            ...(data.additionalUnits || []),
        ];

        return prisma.product.create({
            data: {
                code: data.code,
                name: data.name,
                baseUnit: data.baseUnit,
                costPrice: data.costPrice ?? 0,
                units: {
                    create: unitsData.map((u) => ({
                        unitName: u.unitName,
                        conversionQty: u.conversionQty,
                    })),
                },
            },
            include: {
                units: {
                    orderBy: { conversionQty: 'asc' },
                },
            },
        });
    }

    async createManyWithUnits(
        items: {
            code: string;
            name: string;
            baseUnit: string;
            costPrice: number;
            additionalUnits?: { unitName: string; conversionQty: number }[];
        }[]
    ) {
        return prisma.$transaction(async (tx) => {
            const createdProducts = [];

            for (const item of items) {
                // Susun unit bawaan (factor = 1) dan unit tambahan
                const unitsData = [
                    {
                        unitName: item.baseUnit,
                        conversionQty: 1,
                    },
                    ...(item.additionalUnits || []),
                ];

                const product = await tx.product.create({
                    data: {
                        code: item.code,
                        name: item.name,
                        baseUnit: item.baseUnit,
                        costPrice: item.costPrice,
                        units: {
                            create: unitsData,
                        },
                    },
                    include: {
                        units: true,
                    },
                });

                createdProducts.push(product);
            }

            return createdProducts;
        });
    }

    async update(id: string, data: UpdateProductDTO) {
        return prisma.$transaction(async (tx) => {
            const current = await tx.product.findUniqueOrThrow({
                where: { id },
                include: {
                    units: true,
                },
            });

            const effectiveBaseUnit = data.baseUnit ?? current.baseUnit;

            await tx.product.update({
                where: { id },
                data: {
                    ...(data.name && { name: data.name }),
                    ...(data.baseUnit && { baseUnit: data.baseUnit }),
                    ...(data.costPrice !== undefined && {
                        costPrice: data.costPrice,
                    }),
                },
            });

            if (data.baseUnit && data.baseUnit !== current.baseUnit) {
                const baseUnitRecord = current.units.find(
                    (u) => u.conversionQty === 1
                );
                if (baseUnitRecord) {
                    await tx.productUnit.update({
                        where: { id: baseUnitRecord.id },
                        data: { unitName: data.baseUnit },
                    });
                }
            }

            if (data.additionalUnits) {
                const incomingUnitNames = data.additionalUnits.map((u) =>
                    u.unitName?.toLowerCase()
                );

                const unitsToDelete = current.units.filter(
                    (u) =>
                        u.conversionQty > 1 &&
                        !incomingUnitNames.includes(u.unitName.toLowerCase())
                );

                if (unitsToDelete.length > 0) {
                    await tx.productUnit.deleteMany({
                        where: {
                            id: { in: unitsToDelete.map((u) => u.id) },
                        },
                    });
                }

                for (const unit of data.additionalUnits) {
                    const existingUnit = current.units.find(
                        (u) =>
                            u.unitName.toLowerCase() ===
                            unit.unitName?.toLowerCase()
                    );

                    if (existingUnit) {
                        await tx.productUnit.update({
                            where: { id: existingUnit.id },
                            data: { conversionQty: unit.conversionQty },
                        });
                    } else {
                        await tx.productUnit.create({
                            data: {
                                productId: id,
                                unitName: unit.unitName!,
                                conversionQty: unit.conversionQty!,
                            },
                        });
                    }
                }
            }

            return tx.product.findUnique({
                where: { id },
                include: {
                    units: {
                        orderBy: {
                            conversionQty: 'asc',
                        },
                    },
                },
            });
        });
    }

    async delete(id: string) {
        return prisma.product.update({
            where: { id },
            data: {
                deletedAt: new Date(),
            },
        });
    }
}

export const productRepository = new ProductRepository();

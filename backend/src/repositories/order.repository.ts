import { OrderStatus, Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import {
    CreateOrderDTO,
    OrderFilterParams,
    UpdateDeliveryStatusDTO,
    UpdateOrderDTO,
} from '../types/order.type';

export class OrderRepository {
    async findMany(filters?: OrderFilterParams) {
        const where: Prisma.OrderWhereInput = {};

        if (filters?.customerId) {
            where.customerId = filters.customerId;
        }
        if (filters?.status) {
            where.status = filters.status;
        }
        if (filters?.search) {
            where.OR = [
                {
                    orderNo: {
                        contains: filters.search,
                        mode: 'insensitive',
                    },
                },
                {
                    customer: {
                        name: {
                            contains: filters.search,
                            mode: 'insensitive',
                        },
                    },
                },
            ];
        }

        if (filters?.startDate || filters?.endDate) {
            where.createdAt = {};
            if (filters.startDate) {
                where.createdAt.gte = new Date(
                    `${filters.startDate}T00:00:00.000Z`
                );
            }
            if (filters.endDate) {
                where.createdAt.lte = new Date(
                    `${filters.endDate}T23:59:59.999Z`
                );
            }
        }

        // Filter Due Date (dueDate)
        if (filters?.dueStartDate || filters?.dueEndDate) {
            where.dueDate = {};
            if (filters.dueStartDate) {
                where.dueDate.gte = new Date(
                    `${filters.dueStartDate}T00:00:00.000Z`
                );
            }
            if (filters.dueEndDate) {
                where.dueDate.lte = new Date(
                    `${filters.dueEndDate}T23:59:59.999Z`
                );
            }
        }

        return prisma.order.findMany({
            where,
            include: {
                customer: {
                    select: {
                        id: true,
                        name: true,
                        phone: true,
                        city: true,
                    },
                },
                items: true,
                payments: {
                    where: { deletedAt: null },
                    orderBy: { paymentDate: 'desc' },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }
    async findById(id: string) {
        return prisma.order.findUnique({
            where: { id },
            include: {
                customer: true,
                items: true,
                payments: {
                    orderBy: { paymentDate: 'desc' },
                },
            },
        });
    }

    async findByOrderNo(orderNo: string) {
        return prisma.order.findUnique({
            where: { orderNo },
        });
    }

    async create(data: CreateOrderDTO) {
        return prisma.order.create({
            data: {
                customerId: data.customerId,
                orderNo: data.orderNo,
                totalAmount: data.totalAmount,
                paidAmount: data.paidAmount,
                status: data.status || OrderStatus.UNPAID,
                dueDate: data.dueDate,
                notes: data.notes,
                deliveryFee: data.deliveryFee,
                deliveryDate: data.deliveryDate,
                items: {
                    create: data.items.map((item) => ({
                        productId: item.productId,
                        name: item.name,
                        unitName: item.unitName,
                        conversionQty: item.conversionQty,
                        baseQty: item.baseQty,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        subTotal: item.subTotal,
                    })),
                },
            },
            include: {
                customer: true,
                items: true,
            },
        });
    }

    async update(
        orderId: string,
        data: {
            deliveryDate?: Date;
            dueDate?: Date | null;
            notes?: string | null;
            deliveryFee?: number;
            totalAmount?: number;
            status?: OrderStatus;
            items?: {
                productId: string | null;
                name: string;
                unitName: string;
                conversionQty: number;
                baseQty: number;
                quantity: number;
                unitPrice: number;
                costPrice: number;
                subTotal: number;
                isProductionItem?: boolean;
            }[];
        },
        priceMatrixUpdates?: {
            customerId: string;
            productUnitId: string;
            price: number;
        }[]
    ) {
        return prisma.$transaction(async (tx) => {
            // 1. Jika ada perubahan item, hapus item lama dan buat item baru
            if (data.items) {
                await tx.orderItem.deleteMany({
                    where: { orderId },
                });

                await tx.orderItem.createMany({
                    data: data.items.map((item) => ({
                        orderId,
                        productId: item.productId,
                        name: item.name,
                        unitName: item.unitName,
                        conversionQty: item.conversionQty,
                        baseQty: item.baseQty,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        costPrice: item.costPrice,
                        subTotal: item.subTotal,
                        isProductionItem: item.isProductionItem ?? true,
                    })),
                });
            }

            // 2. Update record Order
            const updatedOrder = await tx.order.update({
                where: { id: orderId },
                data: {
                    ...(data.deliveryDate !== undefined && {
                        deliveryDate: data.deliveryDate,
                    }),
                    ...(data.dueDate !== undefined && {
                        dueDate: data.dueDate,
                    }),
                    ...(data.notes !== undefined && { notes: data.notes }),
                    ...(data.deliveryFee !== undefined && {
                        deliveryFee: data.deliveryFee,
                    }),
                    ...(data.totalAmount !== undefined && {
                        totalAmount: data.totalAmount,
                    }),
                    ...(data.status !== undefined && { status: data.status }),
                },
                include: {
                    customer: true,
                    items: true,
                    payments: {
                        where: { deletedAt: null },
                    },
                },
            });

            // 3. Upsert harga baru ke CustomerProductPrice
            if (priceMatrixUpdates && priceMatrixUpdates.length > 0) {
                for (const p of priceMatrixUpdates) {
                    await tx.customerProductPrice.upsert({
                        where: {
                            customerId_productUnitId: {
                                customerId: p.customerId,
                                productUnitId: p.productUnitId,
                            },
                        },
                        create: {
                            customerId: p.customerId,
                            productUnitId: p.productUnitId,
                            price: p.price,
                        },
                        update: {
                            price: p.price,
                        },
                    });
                }
            }

            return updatedOrder;
        });
    }

    async cancel(id: string, reason?: string) {
        return prisma.order.update({
            where: { id },
            data: {
                status: OrderStatus.CANCELLED,
                cancelReason: reason,
                cancelledAt: new Date(),
            },
            include: {
                customer: {
                    select: { id: true, name: true, phone: true },
                },
                items: true,
            },
        });
    }

    async updateDeliveryStatus(id: string, data: UpdateDeliveryStatusDTO) {
        return prisma.order.update({
            where: { id },
            data: {
                deliveryStatus: data.deliveryStatus,
                shippedAt: data.shippedAt,
            },
            include: {
                customer: true,
                items: true,
            },
        });
    }
}

export const orderRepository = new OrderRepository();

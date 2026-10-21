import { OrderStatus } from '@prisma/client';
import { orderRepository } from '../repositories/order.repository';
import {
    CreateOrderDTO,
    CreateOrderInput,
    CreateOrderItemDTO,
    UpdateOrderDTO,
} from '../types/order.type';
import { customerRepository } from '../repositories/customer.repository';
import { AppError } from '../errors/AppError';
import { generateOrderNo } from '../utils/generateOrderNo';
import { prisma } from '../config/prisma';
import { paymentRepository } from '../repositories/payment.repository';
import { OrderFilterParams } from '../types/order.type';
import { productRepository } from '../repositories/product.repository';

export class OrderService {
    async getAllOrders(filters?: OrderFilterParams) {
        return orderRepository.findMany(filters);
    }

    async getOrderById(id: string) {
        const order = await orderRepository.findById(id);
        if (!order) {
            throw new Error('Invoice not found');
        }
        return order;
    }

    async getOrderByOrderNo(orderNo: string) {
        const order = await orderRepository.findByOrderNo(orderNo);
        if (!order) {
            throw new Error('Invoice not found');
        }
        return order;
    }

    async createOrder(input: CreateOrderInput) {
        const customer = await customerRepository.findById(input.customerId);
        if (!customer) {
            throw new AppError('Customer tidak ditemukan', 404);
        }

        if (!input.items || input.items.length === 0) {
            throw new AppError(
                'Order harus memiliki minimal 1 (satu) item',
                400
            );
        }

        const productIds = input.items
            .map((item) => item.productId)
            .filter((id): id is string => Boolean(id));

        const products = await productRepository.findByIds(productIds);

        const costMap = new Map<string, number>(
            products.map((p) => [p.id, Number(p.costPrice || 0)])
        );

        let itemsTotal = 0;
        const computedItems: CreateOrderItemDTO[] = input.items.map((item) => {
            if (item.quantity <= 0) {
                throw new AppError(
                    `Jumlah untuk ${item.name} harus lebih dari 0`,
                    400
                );
            }

            if (item.unitPrice <= 0) {
                throw new AppError(
                    `Harga untuk ${item.name} tidak boleh negatif`,
                    400
                );
            }

            const conversionQty = item.conversionQty ?? 1;
            const baseQty = item.quantity * conversionQty;
            const subTotal = item.quantity * item.unitPrice;
            itemsTotal += subTotal;
            
            const costPrice = item.productId ? costMap.get(item.productId) ?? 0 : 0;
            
            return {
                productId: item.productId,
                productUnitId: item.productUnitId,
                name: item.name.trim(),
                unitName: item.unitName,
                conversionQty,
                baseQty,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                costPrice,
                subTotal,
            };
        });

        const deliveryFee = Number(input.deliveryFee) || 0;
        const totalAmount = itemsTotal + deliveryFee;

        const orderNo = await generateOrderNo();
        const dueDate = input.dueDate ? new Date(input.dueDate) : null;
        const deliveryDate = new Date(input.deliveryDate);

        return prisma.$transaction(async (tx) => {
            const order = await tx.order.create({
                data: {
                    customerId: input.customerId,
                    orderNo,
                    totalAmount,
                    paidAmount: 0,
                    status: OrderStatus.UNPAID,
                    dueDate,
                    notes: input.notes?.trim() || null,
                    deliveryFee: input.deliveryFee ?? 0,
                    deliveryDate,
                    items: {
                        create: computedItems.map((item) => ({
                            productId: item.productId,
                            name: item.name,
                            unitName: item.unitName,
                            conversionQty: item.conversionQty,
                            baseQty: item.baseQty,
                            quantity: item.quantity,
                            unitPrice: item.unitPrice,
                            costPrice: item.costPrice,
                            subTotal: item.subTotal,
                        })),
                    },
                },
                include: {
                    customer: true,
                    items: true,
                },
            });

            for (const item of input.items) {
                if (item.productUnitId) {
                    await tx.customerProductPrice.upsert({
                        where: {
                            customerId_productUnitId: {
                                customerId: input.customerId,
                                productUnitId: item.productUnitId,
                            },
                        },
                        create: {
                            customerId: input.customerId,
                            productUnitId: item.productUnitId,
                            price: item.unitPrice,
                        },
                        update: {
                            price: item.unitPrice,
                        },
                    });
                }
            }
            await customerRepository.syncOrderMetrics(input.customerId, tx);
            return order;
        });
    }

    async updateOrder(
        id: string,
        data: {
            dueDate?: string | null;
            notes?: string | null;
            status?: OrderStatus;
            deliveryDate?: string;
        }
    ) {
        const order = await orderRepository.findById(id);
        if (!order) {
            throw new AppError('Order tidak ditemukan', 404);
        }

        //1. Kunci total jika invoice sudah lunas
        if (order.status === OrderStatus.PAID) {
            throw new AppError(
                'Order yang sudah lunas tidak bisa diubah kembali',
                400
            );
        }

        //2. Perubahan status invoice hanya di-trigger oleh payment
        if (data.status && data.status !== order.status) {
            throw new AppError(
                'Perubahan status invoice hanya dapat dilakukan melalui pencatatan pembayaran',
                400
            );
        }

        //3. Hanya izinkan perubahan metadata non-nominal
        const updatePayload: UpdateOrderDTO = {};

        if (data.dueDate !== undefined) {
            updatePayload.dueDate = data.dueDate
                ? new Date(data.dueDate)
                : null;
        }

        if (data.notes !== undefined) {
            updatePayload.notes = data.notes?.trim() || null;
        }

        if (data.deliveryDate !== undefined) {
            updatePayload.deliveryDate = new Date(data.deliveryDate);
        }

        return orderRepository.update(id, updatePayload);
    }

    async cancelOrder(id: string, reason?: string) {
        const order = await orderRepository.findById(id);

        if (!order) {
            throw new AppError('Order tidak ditemukan', 404);
        }

        if (order.status === OrderStatus.CANCELLED) {
            throw new AppError('Order sudah dibatalkan', 400);
        }

        const payments = await paymentRepository.findMany({ orderId: id });

        for (const payment of payments) {
            if (payment.deletedAt === null) {
                throw new AppError(
                    'Order yang sudah memiliki pembayaran tidak bisa dibatalkan',
                    400
                );
            }
        }

        return prisma.$transaction(async (tx) => {
            const cancelledOrder = await tx.order.update({
                where: { id },
                data: {
                    status: OrderStatus.CANCELLED,
                    cancelReason: reason || 'Order was cancelled',
                    cancelledAt: new Date(),
                },
            });

            await customerRepository.syncOrderMetrics(order.customerId, tx);

            return cancelledOrder;
        });
    }
}

export const orderService = new OrderService();

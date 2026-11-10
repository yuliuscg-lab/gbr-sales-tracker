import { DeliveryStatus, OrderStatus } from '@prisma/client';
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

        const isProductionMap = new Map <string, boolean>(
            products.map((p) => [p.id, p.isProductionItem??true])
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

            if (
                item.unitPrice <
                (costMap.get(item.productId!) ?? 0) * item.conversionQty
            ) {
                throw new AppError(
                    `Harga untuk ${item.name} lebih kecil dari HPP (${(costMap.get(item.productId!) ?? 0) * item.conversionQty})`,
                    400
                );
            }

            const costPrice = item.productId
                ? (costMap.get(item.productId) ?? 0)
                : 0;
            
            const isProductionItem = item.productId ? (isProductionMap.get(item.productId) ?? true) : true;

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
                isProductionItem,
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
                            isProductionItem: item.isProductionItem
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

    async updateOrder(id: string, input: UpdateOrderDTO) {
        const existingOrder = await orderRepository.findById(id);
        if (!existingOrder) {
            throw new AppError('Order tidak ditemukan', 404);
        }

        if (existingOrder.status === OrderStatus.CANCELLED) {
            throw new AppError(
                'Tidak dapat mengubah order yang telah dibatalkan',
                400
            );
        }

        let parsedDeliveryDate: Date | null | undefined = undefined;
        if (input.deliveryDate !== undefined) {
            parsedDeliveryDate = input.deliveryDate
                ? new Date(input.deliveryDate)
                : null;
        }

        let parsedDueDate: Date | null | undefined = undefined;
        if (input.dueDate !== undefined) {
            parsedDueDate = input.dueDate ? new Date(input.dueDate) : null;
        }

        const notes =
            input.notes !== undefined ? input.notes?.trim() || null : undefined;
        const deliveryFee =
            input.deliveryFee !== undefined
                ? Number(input.deliveryFee)
                : existingOrder.deliveryFee;

        // Jika items dikirim, lakukan re-kalkulasi penuh
        if (input.items && input.items.length > 0) {
            // 1. Ambil snapshot HPP dari tabel Product
            const productIds = input.items
                .map((i) => i.productId)
                .filter(Boolean) as string[];
            const products = await prisma.product.findMany({
                where: { id: { in: productIds } },
                select: { id: true, costPrice: true, isProductionItem: true },
            });
            const costMap = new Map(products.map((p) => [p.id, p.costPrice]));
            const isProductionMap = new Map<string, boolean>(
                products.map((p) => [p.id, p.isProductionItem ?? true])
            );

            let calculatedSubtotal = 0;
            const priceMatrixUpdates: {
                customerId: string;
                productUnitId: string;
                price: number;
            }[] = [];

            const computedItems = input.items.map((item) => {
                if (!item.name || item.name.trim() === '') {
                    throw new AppError('Nama produk tidak boleh kosong', 400);
                }
                if (Number(item.quantity) <= 0) {
                    throw new AppError(
                        `Jumlah untuk ${item.name} harus lebih dari 0`,
                        400
                    );
                }
                if (Number(item.unitPrice) < 0) {
                    throw new AppError(
                        `Harga untuk ${item.name} tidak boleh negatif`,
                        400
                    );
                }

                const conversionQty =
                    Number(item.conversionQty) > 0
                        ? Number(item.conversionQty)
                        : 1;
                const baseQty = Number(item.quantity) * conversionQty;
                const subTotal = Number(item.quantity) * Number(item.unitPrice);
                calculatedSubtotal += subTotal;

                const costPrice = item.productId
                    ? (costMap.get(item.productId) ?? 0)
                    : 0;

                const isProductionItem = item.productId
                    ? (isProductionMap.get(item.productId) ?? true)
                    : true;

                // Kumpulkan untuk auto-update price matrix
                if (item.productUnitId) {
                    priceMatrixUpdates.push({
                        customerId: existingOrder.customerId,
                        productUnitId: item.productUnitId,
                        price: Number(item.unitPrice),
                    });
                }

                return {
                    productId: item.productId || null,
                    name: item.name.trim(),
                    unitName: item.unitName?.trim() || 'Pcs',
                    conversionQty,
                    baseQty,
                    quantity: Number(item.quantity),
                    unitPrice: Number(item.unitPrice),
                    costPrice,
                    subTotal,
                    isProductionItem,
                };
            });

            const newTotalAmount = calculatedSubtotal + deliveryFee;

            // 2. Evaluasi status pembayaran terhadap total baru
            const paidAmount = Number(existingOrder.paidAmount || 0);
            let newStatus: OrderStatus = existingOrder.status;

            if (paidAmount <= 0) {
                newStatus = OrderStatus.UNPAID;
            } else if (paidAmount >= newTotalAmount) {
                newStatus = OrderStatus.PAID;
            } else {
                newStatus = OrderStatus.PARTIALLY_PAID;
            }

            // 3. Eksekusi update
            const updatedOrder = await orderRepository.update(
                id,
                {
                    deliveryDate: parsedDeliveryDate!,
                    dueDate: parsedDueDate,
                    notes,
                    deliveryFee,
                    totalAmount: newTotalAmount,
                    status: newStatus,
                    items: computedItems,
                },
                priceMatrixUpdates
            );

            // 4. Sinkronkan metrik order customer
            await customerRepository.syncOrderMetrics(existingOrder.customerId);

            return updatedOrder;
        }

        // Jika HANYA mengubah tanggal/catatan/ongkir tanpa item
        return orderRepository.update(id, {
            deliveryDate: parsedDeliveryDate!,
            dueDate: parsedDueDate,
            notes,
            deliveryFee,
        });
    }

    async updateDeliveryStatus(id: string, shippedAt?: string | null) {
        const order = await orderRepository.findById(id);
        if (!order) {
            throw new AppError('Order tidak ditemukan', 404);
        }

        if (order.status === OrderStatus.CANCELLED) {
            throw new AppError(
                'Tidak dapat memperbarui status pengiriman untuk order yang telah dibatalkan',
                400
            );
        }
        const deliveryStatus: DeliveryStatus = 'SHIPPED';
        const parsedShippedAt = new Date(shippedAt ?? new Date());

        return orderRepository.updateDeliveryStatus(id, {
            deliveryStatus,
            shippedAt: parsedShippedAt,
        });
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

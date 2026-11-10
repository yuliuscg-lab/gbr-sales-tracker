// backend/src/repositories/production.repository.ts
import { prisma } from '../config/prisma';
import { Prisma } from '@prisma/client';

export class ProductionRepository {
    /**
     * Mengambil antrean order yang belum dikirim dan belum memiliki kartu produksi
     */
    async findQueueOrders() {
        return prisma.order.findMany({
            where: {
                deliveryStatus: 'NOT_SHIPPED',
                status: { not: 'CANCELLED' },
                productionCardId: null,
                items: {
                    some: {
                        isProductionItem:true,
                    },
                },
            },
            include: {
                customer: { select: { id: true, name: true, phone: true } },
                items: {
                    where : {
                        isProductionItem: true,
                    },
                },
            },
            orderBy: [{ dueDate: 'asc' }, { createdAt: 'asc' }],
        });
    }

    /**
     * Mengambil order yang valid untuk dimasukkan ke batch kartu produksi
     */
    async findEligibleOrdersByIds(orderIds: string[]) {
        return prisma.order.findMany({
            where: {
                id: { in: orderIds },
                deliveryStatus: 'NOT_SHIPPED',
                status: { not: 'CANCELLED' },
                productionCardId: null,
                items: {
                    some: {
                        isProductionItem:true,
                    },
                },
            },
        });
    }

    /**
     * Mencari nomor kartu produksi terakhir pada rentang tahun tertentu
     */
    async findLastCardInYear(startOfYear: Date, endOfYear: Date) {
        return prisma.productionCard.findFirst({
            where: {
                createdAt: {
                    gte: startOfYear,
                    lte: endOfYear,
                },
            },
            orderBy: {
                cardNo: 'desc',
            },
            select: {
                cardNo: true,
            },
        });
    }

    /**
     * Transaksi atomik: Membuat ProductionCard baru dan mengaitkannya ke daftar order
     */
    async createCardWithOrders(
        cardNo: string,
        orderIds: string[],
        notes?: string | null
    ) {
        return prisma.$transaction(async (tx) => {
            // 1. Buat record kartu produksi
            const productionCard = await tx.productionCard.create({
                data: {
                    cardNo,
                    notes: notes || null,
                },
            });

            // 2. Tautkan productionCardId ke order-order terpilih
            await tx.order.updateMany({
                where: { id: { in: orderIds } },
                data: {
                    productionCardId: productionCard.id,
                },
            });

            // 3. Kembalikan detail kartu beserta data order dan item untuk dicetak
            return tx.productionCard.findUnique({
                where: { id: productionCard.id },
                include: {
                    orders: {
                        include: {
                            customer: {
                                select: { id: true, name: true, phone: true },
                            },
                            items: {
                                where : {
                                    isProductionItem:true,
                                },
                            },
                        },
                        orderBy: { orderNo: 'asc' },
                    },
                },
            });
        });
    }

    /**
     * Mengambil riwayat kartu produksi beserta relasi pesanan
     */
    async findHistoryCards() {
        return prisma.productionCard.findMany({
            include: {
                orders: {
                    include: {
                        customer: {
                            select: { id: true, name: true, phone: true },
                        },
                        items: {
                            where : {
                                isProductionItem:true,
                            },
                        },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    /**
     * Mengambil satu kartu produksi berdasarkan ID
     */
    async findCardById(id: string) {
        return prisma.productionCard.findUnique({
            where: { id },
            include: {
                orders: {
                    include: {
                        customer: {
                            select: { id: true, name: true, phone: true },
                        },
                        items: {
                            where : {
                                isProductionItem:true,
                            },
                        },
                    },
                },
            },
        });
    }
}

export const productionRepository = new ProductionRepository();

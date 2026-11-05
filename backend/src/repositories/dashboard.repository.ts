import { prisma } from '../config/prisma';

export class DashboardRepository {
    /**
     * Mengambil daftar pesanan non-CANCELLED pada rentang tanggal terpilih beserta itemnya
     */
    async getOrdersInPeriod(startDate: Date, endDate: Date) {
        return prisma.order.findMany({
            where: {
                createdAt: { gte: startDate, lte: endDate },
                status: { not: 'CANCELLED' },
            },
            include: {
                items: true,
            },
        });
    }

    /**
     * Agregasi total kas riil yang masuk (Payment) pada rentang tanggal terpilih
     */
    async aggregatePayments(startDate: Date, endDate: Date) {
        return prisma.payment.aggregate({
            where: {
                paymentDate: { gte: startDate, lte: endDate },
                deletedAt: null,
            },
            _sum: { amount: true },
        });
    }

    /**
     * Agregasi total pengeluaran toko berdasarkan tipe (OPERATIONAL / MATERIAL)
     */
    async aggregateExpenses(
        startDate: Date,
        endDate: Date,
        type: 'OPERATIONAL' | 'MATERIAL'
    ) {
        return prisma.expense.aggregate({
            where: {
                expenseDate: { gte: startDate, lte: endDate },
                type,
            },
            _sum: { amount: true },
        });
    }

    /**
     * Mengambil seluruh order aktif yang belum lunas (UNPAID / PARTIALLY_PAID)
     * beserta relasi customer untuk menghitung total saldo piutang & top pelanggan menunggak
     */
    async getActiveUnpaidOrders() {
        return prisma.order.findMany({
            where: {
                status: { in: ['UNPAID', 'PARTIALLY_PAID'] },
            },
            select: {
                customerId: true,
                totalAmount: true,
                paidAmount: true,
                customer: {
                    select: { id: true, name: true, phone: true },
                },
            },
        });
    }

    /**
     * Menghitung total order aktif yang belum dikirim (NOT_SHIPPED)
     */
    async countPendingDeliveries() {
        return prisma.order.count({
            where: {
                status: { not: 'CANCELLED' },
                deliveryStatus: 'NOT_SHIPPED',
            },
        });
    }

    /**
     * Agregasi Top 15 Produk terlaris berdasarkan kontribusi omzet pada rentang waktu
     */
    async getTop15Products(startDate: Date, endDate: Date) {
        return prisma.orderItem.groupBy({
            by: ['productId', 'name'],
            where: {
                order: {
                    createdAt: { gte: startDate, lte: endDate },
                    status: { not: 'CANCELLED' },
                },
                productId: { not: null },
            },
            _sum: {
                baseQty: true,
                subTotal: true,
            },
            orderBy: {
                _sum: {
                    subTotal: 'desc',
                },
            },
            take: 15,
        });
    }

    /**
     * Mengambil 5 pesanan terbaru toko
     */
    async getRecentOrders(limit: number = 5) {
        return prisma.order.findMany({
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                customer: { select: { name: true } },
            },
        });
    }

    async getOrdersByYear(year: number) {
        const startOfYear = new Date(year, 0, 1, 0, 0, 0, 0);
        const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);

        return prisma.order.findMany({
            where: {
                createdAt: { gte: startOfYear, lte: endOfYear },
                status: { not: 'CANCELLED' },
            },
            select: {
                createdAt: true,
                totalAmount: true,
                items: {
                    select: {
                        costPrice: true,
                        baseQty: true,
                    },
                },
            },
        });
    }

    /**
     * Mengambil beban operasional toko dalam 1 tahun kalender untuk kalkulasi Net Profit bulanan
     */
    async getOperationalExpensesByYear(year: number) {
        const startOfYear = new Date(year, 0, 1, 0, 0, 0, 0);
        const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);

        return prisma.expense.findMany({
            where: {
                expenseDate: { gte: startOfYear, lte: endOfYear },
                type: 'OPERATIONAL',
            },
            select: {
                expenseDate: true,
                amount: true,
            },
        });
    }
}

export const dashboardRepository = new DashboardRepository();

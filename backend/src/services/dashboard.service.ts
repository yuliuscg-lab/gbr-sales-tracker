import { dashboardRepository } from '../repositories/dashboard.repository';

const MONTH_NAMES = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'Mei',
    'Jun',
    'Jul',
    'Agu',
    'Sep',
    'Okt',
    'Nov',
    'Des',
];

export interface MonthlyTrendData {
    monthIndex: number; // 1 - 12
    monthLabel: string; // Jan, Feb, dst.
    revenue: number;
    cogs: number;
    grossProfit: number;
    operationalExpenses: number;
    netProfit: number;
}

export class DashboardService {
    async getDashboardSummary(startDateStr: string, endDateStr: string) {
        const startDate = new Date(startDateStr);
        const endDate = new Date(endDateStr);

        // 1. Eksekusi query secara paralel melalui repository
        const [
            orders,
            paymentAggregate,
            operationalAggregate,
            materialAggregate,
            unpaidOrders,
            pendingDeliveriesCount,
            topProductsRaw,
            recentOrders,
        ] = await Promise.all([
            dashboardRepository.getOrdersInPeriod(startDate, endDate),
            dashboardRepository.aggregatePayments(startDate, endDate),
            dashboardRepository.aggregateExpenses(
                startDate,
                endDate,
                'OPERATIONAL'
            ),
            dashboardRepository.aggregateExpenses(
                startDate,
                endDate,
                'MATERIAL'
            ),
            dashboardRepository.getActiveUnpaidOrders(),
            dashboardRepository.countPendingDeliveries(),
            dashboardRepository.getTop15Products(startDate, endDate),
            dashboardRepository.getRecentOrders(5),
        ]);

        // 2. Kalkulasi Gross Revenue, Realized Revenue, dan COGS (HPP)
        let grossRevenue = 0;
        let realizedRevenue = 0;
        let totalCogs = 0;

        orders.forEach((ord) => {
            grossRevenue += Number(ord.totalAmount);
            realizedRevenue += Number(ord.paidAmount || 0);
            ord.items.forEach((item) => {
                totalCogs +=
                    Number(item.costPrice || 0) * Number(item.baseQty || 1);
            });
        });

        const grossProfit = grossRevenue - totalCogs;

        // 3. Arus Kas (In / Out)
        const totalCashIn = Number(paymentAggregate._sum.amount || 0);
        const totalOperationalExpenses = Number(
            operationalAggregate._sum.amount || 0
        );
        const totalMaterialPurchases = Number(
            materialAggregate._sum.amount || 0
        );
        const totalCashOut = totalOperationalExpenses + totalMaterialPurchases;

        // 4. Estimasi Laba Bersih (Net Profit)
        const netProfit = grossProfit - totalOperationalExpenses;

        // 5. Total Saldo Piutang Berjalan & Pemetaan Top 5 Pelanggan Menunggak
        let totalOutstandingDebt = 0;
        const debtMap: Record<
            string,
            {
                id: string;
                name: string;
                phone?: string | null;
                remaining: number;
            }
        > = {};

        unpaidOrders.forEach((ord) => {
            const remaining = Math.max(
                0,
                Number(ord.totalAmount) - Number(ord.paidAmount || 0)
            );
            totalOutstandingDebt += remaining;

            const cId = ord.customerId;
            if (!debtMap[cId]) {
                debtMap[cId] = {
                    id: cId,
                    name: ord.customer?.name || 'Pelanggan Umum',
                    phone: ord.customer?.phone,
                    remaining: 0,
                };
            }
            debtMap[cId].remaining += remaining;
        });

        const topCustomersWithDebt = Object.values(debtMap)
            .sort((a, b) => b.remaining - a.remaining)
            .slice(0, 5);

        // 6. Format Top 15 Produk
        const top15Products = topProductsRaw.map((item) => ({
            productId: item.productId,
            name: item.name,
            totalBaseQty: Number(item._sum.baseQty || 0),
            totalRevenue: Number(item._sum.subTotal || 0),
        }));

        return {
            financials: {
                grossRevenue,
                realizedRevenue,
                realizationRate:
                    grossRevenue > 0
                        ? (realizedRevenue / grossRevenue) * 100
                        : 0,
                totalCogs,
                grossProfit,
                netProfit,
                totalCashIn,
                totalCashOut,
                totalOperationalExpenses,
                totalMaterialPurchases,
                totalOutstandingDebt,
            },
            operations: {
                pendingDeliveriesCount,
                totalOrdersCount: orders.length,
            },
            top15Products,
            topCustomersWithDebt,
            recentOrders,
        };
    }
    async getYearlyTrend(year: number): Promise<MonthlyTrendData[]> {
        // 1. Ambil seluruh data tahun terkait secara paralel via repository
        const [orders, expenses] = await Promise.all([
            dashboardRepository.getOrdersByYear(year),
            dashboardRepository.getOperationalExpensesByYear(year),
        ]);

        // 2. Inisialisasi 12 bulan
        const monthlyStats: MonthlyTrendData[] = Array.from(
            { length: 12 },
            (_, i) => ({
                monthIndex: i + 1,
                monthLabel: MONTH_NAMES[i],
                revenue: 0,
                cogs: 0,
                grossProfit: 0,
                operationalExpenses: 0,
                netProfit: 0,
            })
        );

        // 3. Akumulasi Revenue dan COGS per bulan
        orders.forEach((ord) => {
            const month = new Date(ord.createdAt).getMonth(); // 0 - 11
            const orderRevenue = Number(ord.totalAmount || 0);
            let orderCogs = 0;

            ord.items.forEach((item) => {
                orderCogs +=
                    Number(item.costPrice || 0) * Number(item.baseQty || 1);
            });

            monthlyStats[month].revenue += orderRevenue;
            monthlyStats[month].cogs += orderCogs;
        });

        // 4. Akumulasi Beban Operasional per bulan
        expenses.forEach((exp) => {
            const month = new Date(exp.expenseDate).getMonth();
            monthlyStats[month].operationalExpenses += Number(exp.amount || 0);
        });

        // 5. Hitung Gross Profit dan Net Profit per bulan
        monthlyStats.forEach((stat) => {
            stat.grossProfit = stat.revenue - stat.cogs;
            stat.netProfit = stat.grossProfit - stat.operationalExpenses;
        });

        return monthlyStats;
    }
}

export const dashboardService = new DashboardService();

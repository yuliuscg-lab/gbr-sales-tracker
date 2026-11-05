import { api } from './client';

export interface DashboardSummaryData {
    financials: {
        grossRevenue: number;
        realizedRevenue: number;
        realizationRate: number;
        totalCogs: number;
        grossProfit: number;
        netProfit: number;
        totalCashIn: number;
        totalCashOut: number;
        totalOperationalExpenses: number;
        totalMaterialPurchases: number;
        totalOutstandingDebt: number;
    };
    operations: {
        pendingDeliveriesCount: number;
        totalOrdersCount: number;
    };
    top15Products: {
        productId: string;
        name: string;
        totalBaseQty: number;
        totalRevenue: number;
    }[];
    topCustomersWithDebt: {
        id: string;
        name: string;
        phone?: string | null;
        remaining: number;
    }[];
    recentOrders: {
        id: string;
        orderNo: string;
        createdAt: string;
        status: string;
        deliveryStatus: string;
        totalAmount: number;
        paidAmount: number;
        customer?: { name: string };
    }[];
}
export interface MonthlyTrendRecord {
  monthIndex: number;
  monthLabel: string;
  revenue: number;
  cogs: number;
  grossProfit: number;
  operationalExpenses: number;
  netProfit: number;
}
export const dashboardApi = {
    async getSummary(params?: {
        startDate?: string;
        endDate?: string;
    }): Promise<DashboardSummaryData> {
        const res = await api.get<{
            success: boolean;
            data: DashboardSummaryData;
        }>('/dashboard/summary', { params });
        return res.data.data;
    },

    async getYearlyTrend(year: number): Promise<MonthlyTrendRecord[]> {
    const res = await api.get<{ success: boolean; data: MonthlyTrendRecord[] }>('/dashboard/yearly-trend', {
      params: { year },
    });
    return res.data.data;
  },
};

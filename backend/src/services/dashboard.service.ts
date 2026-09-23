import { Role } from "@prisma/client";
import { dashboardRepository } from "../repositories/dashboard.repository";
import { Timeframe } from "../types/dashboard.types";

const CATEGORY_COLORS = [
    "#6366F1", "#22C55E", "#F59E0B", "#EC4899",
    "#06B6D4", "#8B5CF6", "#EF4444", "#84CC16",
];

export class DashboardService {
    
    getRangeStart(timeframe: Timeframe, now = new Date()): Date {
        const start = new Date(now);

        switch (timeframe) {
            case "1D":
                start.setHours(0, 0, 0, 0);
                return start;
            case "1W":
                start.setDate(start.getDate() - 6);
                start.setHours(0, 0, 0, 0);
                return start;
            case "1M":
                start.setDate(start.getDate() - 29);
                start.setHours(0, 0, 0, 0);
                return start;
            case "YTD":
                return new Date(now.getFullYear(), 0, 1);
        }
    }

    pctChange(curr: number, prev: number): number {
        if (prev === 0) return curr === 0 ? 0 : 100;
        return Math.round(((curr - prev) / prev) * 100);
    }

    async getDashboardStats(userId: string, role: Role) {
        const now = new Date();

        const last30Start = new Date(now);
        last30Start.setDate(last30Start.getDate() - 29);
        last30Start.setHours(0, 0, 0, 0);

        const prev30Start = new Date(last30Start);
        prev30Start.setDate(prev30Start.getDate() - 30);

        const [
            currentRevenue,
            prevRevenue,
            currentTickets,
            prevTickets,
            activeEventsNow,
            activeEventsPrev,
        ] = await Promise.all([
            dashboardRepository.sumRevenue(last30Start, undefined, userId, role),
            dashboardRepository.sumRevenue(prev30Start, last30Start, userId, role),
            dashboardRepository.sumTicketsSold(last30Start, undefined, userId, role),
            dashboardRepository.sumTicketsSold(prev30Start, last30Start, userId, role),
            dashboardRepository.countPublishedEvents(now, userId, role),
            dashboardRepository.countPublishedEvents(last30Start, userId, role),
        ]);

        return {
            totalRevenue: currentRevenue,
            totalRevenueGrowth: this.pctChange(currentRevenue, prevRevenue),
            totalTicketSold: currentTickets,
            totalTicketSoldGrowth: this.pctChange(currentTickets, prevTickets),
            totalActiveEvents: activeEventsNow,
            totalActiveEventsGrowth: this.pctChange(activeEventsNow, activeEventsPrev),
        };
    }

    async getSalesChartData(userId: string, role: Role, timeframe: Timeframe) {
        const start = this.getRangeStart(timeframe);
        const orders = await dashboardRepository.findPaidOrdersSince(start, userId, role);

        if (timeframe === "1D") {
            const buckets = Array.from({ length: 24 }, (_, h) => ({
                label: `${h.toString().padStart(2, "0")}:00`,
                sales: 0,
            }));

            orders.forEach((o) => {
                buckets[o.createdAt.getHours()].sales += o.finalPrice;
            });
            return buckets;
        }

        if (timeframe === "YTD") {
            const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
            const buckets = monthNames.map((label) => ({
                label,
                sales: 0,
            }));

            orders.forEach((o) => {
                buckets[o.createdAt.getMonth()].sales += o.finalPrice;
            });

            return buckets.slice(0, new Date().getMonth() + 1);
        }

        const days = timeframe === "1W" ? 7 : 30;
        const buckets: { label: string; sales: number; dateKey: string }[] = [];

        for (let i = days - 1; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            buckets.push({
                label: d.toLocaleDateString("id-ID", { day: "2-digit", month: "short" }),
                dateKey: d.toISOString().slice(0, 10),
                sales: 0,
            });
        }

        const indexByDate = new Map(buckets.map((b, i) => [b.dateKey, i]));
        orders.forEach((o) => {
            const key = o.createdAt.toISOString().slice(0, 10);
            const idx = indexByDate.get(key);

            if (idx !== undefined) buckets[idx].sales += o.finalPrice;
        });

        return buckets.map(({ label, sales }) => ({ label, sales }));
    }

    async getRevenueStreamData(userId: string, role: Role, timeframe: Timeframe) {
        const start = this.getRangeStart(timeframe);
        const orders = await dashboardRepository.findPaidOrdersWithCategorySince(start, userId, role);

        const totals = new Map<string, number>();

        orders.forEach((o) => {
            const cat = o.event.category.category;
            totals.set(cat, (totals.get(cat) || 0) + o.finalPrice);
        });

        const totalRevenue = Array.from(totals.values()).reduce((a, b) => a + b, 0);

        const breakdown = Array.from(totals.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([category, revenue], i) => ({
                category,
                revenue,
                percentage: totalRevenue > 0 ? Math.round((revenue / totalRevenue) * 100) : 0,
                fill: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
            }));

        return { totalRevenue, breakdown };
    }
}

export const dashboardService = new DashboardService();
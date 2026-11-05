import { Request, Response } from 'express';
import { dashboardService } from '../services/dashboard.service';
import { success } from '../utils/response';

export class DashboardController {
    async getSummary(req: Request, res: Response) {
        const { startDate, endDate } = req.query;

        const now = new Date();
        const defaultStart = new Date(
            now.getFullYear(),
            now.getMonth(),
            1
        ).toISOString();
        const defaultEnd = new Date(
            now.getFullYear(),
            now.getMonth() + 1,
            0,
            23,
            59,
            59,
            999
        ).toISOString();

        const data = await dashboardService.getDashboardSummary(
            (startDate as string) || defaultStart,
            (endDate as string) || defaultEnd
        );

        return success(
            res,
            200,
            'Berhasil mengambil ringkasan dashboard',
            data
        );
    }

    // Tambahkan di dalam DashboardController:

    async getYearlyTrend(req: Request, res: Response) {
        const currentYear = new Date().getFullYear();
        const year = req.query.year
            ? parseInt(req.query.year as string, 10)
            : currentYear;

        const data = await dashboardService.getYearlyTrend(year);
        return success(
            res,
            200,
            `Berhasil mengambil tren bulanan tahun ${year}`,
            data
        );
    }
}

export const dashboardController = new DashboardController();

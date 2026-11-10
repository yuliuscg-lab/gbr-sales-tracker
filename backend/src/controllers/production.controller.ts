// backend/src/controllers/production.controller.ts
import { Request, Response } from 'express';
import { productionService } from '../services/production.service';
import { success } from '../utils/response';

export class ProductionController {
    async getQueue(req: Request, res: Response) {
        const queue = await productionService.getQueueOrders();
        return success(res, 200, 'Berhasil memuat antrean order', queue);
    }

    async createCard(req: Request, res: Response) {
        const { orderIds, notes } = req.body;
        const card = await productionService.createProductionCard(
            orderIds,
            notes
        );
        return success(res, 201, 'Kartu produksi berhasil dibuat', card);
    }

    async getHistory(req: Request, res: Response) {
        const history = await productionService.getHistoryCards();
        return success(
            res,
            200,
            'Berhasil memuat riwayat kartu produksi',
            history
        );
    }
}

export const productionController = new ProductionController();

// backend/src/services/production.service.ts
import { productionRepository } from '../repositories/production.repository';
import { AppError } from '../errors/AppError';
import { generateProductionCardNo } from '../utils/generateProductionCardNo';

const PREFIX = 'KP';

export class ProductionService {

    async getQueueOrders() {
        return productionRepository.findQueueOrders();
    }

    /**
     * Validasi bisnis dan pembuatan kartu produksi batch
     */
    async createProductionCard(orderIds: string[], notes?: string) {
        if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
            throw new AppError(
                'Minimal pilih 1 order untuk membuat kartu produksi',
                400
            );
        }

        // Validasi apakah orderIds memenuhi syarat (NOT_SHIPPED, bukan CANCELLED, dan belum dicetak)
        const eligibleOrders =
            await productionRepository.findEligibleOrdersByIds(orderIds);

        if (eligibleOrders.length !== orderIds.length) {
            throw new AppError(
                'Beberapa order yang dipilih sudah pernah dicetak, dibatalkan, atau tidak valid',
                400
            );
        }

        // Generate nomor kartu KPYYMMXXXX
        const cardNo = await generateProductionCardNo();

        const result = await productionRepository.createCardWithOrders(
            cardNo,
            orderIds,
            notes?.trim()
        );

        if (!result) {
            throw new AppError('Gagal memproses kartu produksi', 500);
        }

        return result;
    }

    /**
     * Mengambil riwayat seluruh kartu produksi yang pernah dibuat
     */
    async getHistoryCards() {
        return productionRepository.findHistoryCards();
    }
}

export const productionService = new ProductionService();

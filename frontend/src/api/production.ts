// frontend/src/api/production.ts
import { api } from './client';
import { OrderRecord } from './order';

export interface ProductionCardRecord {
    id: string;
    cardNo: string;
    createdAt: string;
    notes?: string | null;
    orders: OrderRecord[];
}

export const productionApi = {
    async getQueue(): Promise<OrderRecord[]> {
        const res = await api.get<{ success: boolean; data: OrderRecord[] }>(
            '/production/queue'
        );
        return res.data.data;
    },

    async createCard(payload: {
        orderIds: string[];
        notes?: string;
    }): Promise<ProductionCardRecord> {
        const res = await api.post<{
            success: boolean;
            data: ProductionCardRecord;
        }>('/production/cards', payload);
        return res.data.data;
    },

    async getHistory(): Promise<ProductionCardRecord[]> {
        const res = await api.get<{
            success: boolean;
            data: ProductionCardRecord[];
        }>('/production/history');
        return res.data.data;
    },
};

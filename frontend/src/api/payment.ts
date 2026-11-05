import { api } from './client';
import { PaymentRequest } from '@/types/payment.type';

export type PaymentMethod = 'CASH' | 'TRANSFER';

export interface PaymentRecord {
    id: string;
    orderId: string;
    receiptNo?: string | null;
    amount: number;
    paymentMethod: PaymentMethod;
    paymentDate: string;
    note?: string | null;
    createdAt: string;
    order?: {
        id: string;
        orderNo: string;
        customer?: {
            id: string;
            name: string;
            phone?: string | null;
        } | null;
    } | null;
}

export interface PaymentFilterParams {
    orderId?: string;
    paymentMethod?: PaymentMethod | string;
    startDate?: string;
    endDate?: string;
    search?: string;
}

export const paymentApi = {
    async create(payload: PaymentRequest) {
        const res = await api.post('/payments', payload);
        return res.data.data;
    },

    async getAll(params?: PaymentFilterParams): Promise<PaymentRecord[]> {
        const res = await api.get<{ success: boolean; data: PaymentRecord[] }>(
            '/payments',
            {
                params,
            }
        );
        return res.data.data;
    },
};

import { api } from './client';
import {
    OrderFormData,
    UpdateOrderFormData,
} from '../validation/order.validation';

export type OrderStatus = 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'CANCELLED';
export type DeliveryStatus = 'NOT_SHIPPED' | 'SHIPPED';

export interface OrderItem {
    id: string;
    name: string;
    unitName: string;
    quantity: number;
    unitPrice: number;
}

export interface OrderRecord {
    id: string;
    orderNo: string;
    customerId: string;
    customer?: {
        id: string;
        name: string;
        phone?: string | null;
        city?:string|null;
    };
    totalAmount: number;
    paidAmount: number;
    status: OrderStatus;
    dueDate?: string | null;
    notes?: string | null;
    deliveryFee?: number;
    deliveryDate?: string;
    deliveryStatus: DeliveryStatus;
    shippedAt?: string | null;
    createdAt: string;
    items?: OrderItem[];
}

export interface OrderFilterQuery {
    search?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    dueStartDate?: string;
    dueEndDate?: string;
}
export const orderApi = {
    async getAll(params?: OrderFilterQuery): Promise<OrderRecord[]> {
        const res = await api.get<{ success: boolean; data: OrderRecord[] }>(
            '/orders',
            { params }
        );
        return res.data.data;
    },

    async getById(id: string): Promise<OrderRecord> {
        const res = await api.get<{ success: boolean; data: OrderRecord }>(
            `/orders/${id}`
        );
        return res.data.data;
    },

    async create(payload: OrderFormData): Promise<OrderRecord> {
        const res = await api.post<{ success: boolean; data: OrderRecord }>(
            '/orders',
            payload
        );
        return res.data.data;
    },

    async update(
        id: string,
        payload: UpdateOrderFormData
    ): Promise<OrderRecord> {
        const res = await api.put<{ success: boolean; data: OrderRecord }>(
            `/orders/${id}`,
            payload
        );
        return res.data.data;
    },

    async cancel(id: string, reason?: string): Promise<OrderRecord> {
        const res = await api.patch<{ success: boolean; data: OrderRecord }>(
            `/orders/${id}/cancel`,
            {
                reason,
            }
        );
        return res.data.data;
    },
    async updateDeliveryStatus(
        id: string,
        payload: { deliveryStatus: DeliveryStatus; shippedAt?: string | null }
    ): Promise<OrderRecord> {
        const res = await api.patch<{ success: boolean; data: OrderRecord }>(
            `/orders/${id}/delivery-status`,
            payload
        );
        return res.data.data;
    },
};

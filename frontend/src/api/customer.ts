import { api } from './client';
import { CustomerFormData } from '../validation/customer.validation';
import type { Customer } from '@/types/customer.type';

export const customerApi = {
    async getAll(search?: string) {
        const res = await api.get<{ success: boolean; data: Customer[] }>('/customers', {
        params: search ? { search } : undefined,
        });
        return res.data.data;
    },

    async create(data: CustomerFormData) {
        const res = await api.post<{ success: boolean; data: Customer }>('/customers', data);
        return res.data.data;
    },

    async update(id: string, data: CustomerFormData) {
        const res = await api.put<{ success: boolean; data: Customer }>(`/customers/${id}`, data);
        return res.data.data;
    },

    async delete(id: string) {
        const res = await api.delete<{ success: boolean; message: string }>(`/customers/${id}`);
        return res.data;
    },
};
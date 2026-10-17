import { api } from './client';
import { ProductFormData } from '../validation/product.validation';
import { Product } from '@/types/product.type';

export const productApi = {
    async getAll(search?: string): Promise<Product[]> {
        const res = await api.get<{ success: boolean; data: Product[] }>('/products', {
            params: search ? { search } : undefined,
        });
        return res.data.data;
    },

    async getById(id: string): Promise<Product> {
        const res = await api.get<{ success: boolean; data: Product }>(`/products/${id}`);
        return res.data.data;
    },

    async create(data: ProductFormData): Promise<Product> {
        const res = await api.post<{ success: boolean; data: Product }>('/products', data);
        return res.data.data;
    },

    async update(id: string, data: ProductFormData): Promise<Product> {
        const res = await api.put<{ success: boolean; data: Product }>(`/products/${id}`, data);
        return res.data.data;
    },

    async delete(id: string): Promise<{ success: boolean; message: string }> {
        const res = await api.delete<{ success: boolean; message: string }>(`/products/${id}`);
        return res.data;
    },
};
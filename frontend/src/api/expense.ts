import { api } from './client';

export type ExpenseType = 'OPERATIONAL' | 'MATERIAL';

export interface ExpenseRecord {
    id: string;
    expenseDate: string;
    type: ExpenseType;
    category: string;
    amount: number;
    note?: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface ExpensePayload {
    expenseDate: string;
    type: ExpenseType;
    category: string;
    amount: number;
    note?: string | null;
}

export interface ExpenseFilterParams {
    type?: ExpenseType | string;
    category?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
}

export const expenseApi = {
    async getAll(params?: ExpenseFilterParams): Promise<ExpenseRecord[]> {
        const res = await api.get<{ success: boolean; data: ExpenseRecord[] }>(
            '/expenses',
            {
                params,
            }
        );
        return res.data.data;
    },

    async create(payload: ExpensePayload): Promise<ExpenseRecord> {
        const res = await api.post<{ success: boolean; data: ExpenseRecord }>(
            '/expenses',
            payload
        );
        return res.data.data;
    },

    async update(
        id: string,
        payload: Partial<ExpensePayload>
    ): Promise<ExpenseRecord> {
        const res = await api.put<{ success: boolean; data: ExpenseRecord }>(
            `/expenses/${id}`,
            payload
        );
        return res.data.data;
    },

    async delete(id: string): Promise<void> {
        await api.delete(`/expenses/${id}`);
    },
};

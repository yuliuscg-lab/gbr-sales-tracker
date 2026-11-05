import { ExpenseType } from '@prisma/client';

export interface CreateExpenseDTO {
    expenseDate: string | Date;
    type?: ExpenseType;
    category: string;
    amount: number;
    note?: string | null;
}

export interface UpdateExpenseDTO {
    expenseDate?: string | Date;
    type?: ExpenseType;
    category?: string;
    amount?: number;
    note?: string | null;
}

export interface ExpenseFilterDTO {
    type?: ExpenseType;
    category?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
}

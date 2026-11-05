import { expenseRepository } from '../repositories/expense.repository';
import {
    CreateExpenseDTO,
    UpdateExpenseDTO,
    ExpenseFilterDTO,
} from '../types/expense.type';
import { AppError } from '../errors/AppError';
import { ExpenseType } from '@prisma/client';

export class ExpenseService {
    async getAllExpenses(filters?: ExpenseFilterDTO) {
        if (
            filters?.type &&
            !Object.values(ExpenseType).includes(filters.type)
        ) {
            throw new AppError(
                'Tipe pengeluaran tidak valid. Gunakan OPERATIONAL atau MATERIAL',
                400
            );
        }
        return expenseRepository.findMany(filters);
    }

    async getExpenseById(id: string) {
        const expense = await expenseRepository.findById(id);
        if (!expense) {
            throw new AppError('Data pengeluaran tidak ditemukan', 404);
        }
        return expense;
    }

    async createExpense(data: CreateExpenseDTO) {
        if (!data.expenseDate) {
            throw new AppError('Tanggal pengeluaran wajib diisi', 400);
        }

        if (!data.category?.trim()) {
            throw new AppError('Kategori pengeluaran wajib diisi', 400);
        }

        const amount = Number(data.amount);
        if (isNaN(amount) || amount <= 0) {
            throw new AppError(
                'Nominal pengeluaran harus berupa angka lebih dari 0',
                400
            );
        }

        if (data.type && !Object.values(ExpenseType).includes(data.type)) {
            throw new AppError(
                'Tipe pengeluaran harus OPERATIONAL atau MATERIAL',
                400
            );
        }

        return expenseRepository.create({
            ...data,
            amount,
        });
    }

    async updateExpense(id: string, data: UpdateExpenseDTO) {
        const existing = await expenseRepository.findById(id);
        if (!existing) {
            throw new AppError('Data pengeluaran tidak ditemukan', 404);
        }

        if (data.amount !== undefined) {
            const amount = Number(data.amount);
            if (isNaN(amount) || amount <= 0) {
                throw new AppError(
                    'Nominal pengeluaran harus berupa angka lebih dari 0',
                    400
                );
            }
            data.amount = amount;
        }

        if (data.category !== undefined && !data.category.trim()) {
            throw new AppError('Kategori pengeluaran tidak boleh kosong', 400);
        }

        if (
            data.type !== undefined &&
            !Object.values(ExpenseType).includes(data.type)
        ) {
            throw new AppError(
                'Tipe pengeluaran harus OPERATIONAL atau MATERIAL',
                400
            );
        }

        return expenseRepository.update(id, data);
    }

    async deleteExpense(id: string) {
        const existing = await expenseRepository.findById(id);
        if (!existing) {
            throw new AppError('Data pengeluaran tidak ditemukan', 404);
        }

        await expenseRepository.delete(id);
    }
}

export const expenseService = new ExpenseService();

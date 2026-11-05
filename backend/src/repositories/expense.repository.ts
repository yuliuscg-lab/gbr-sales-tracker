import { prisma } from '../config/prisma';
import {
    CreateExpenseDTO,
    UpdateExpenseDTO,
    ExpenseFilterDTO,
} from '../types/expense.type';
import { Prisma } from '@prisma/client';

export class ExpenseRepository {
    async findMany(filters?: ExpenseFilterDTO) {
        const where: Prisma.ExpenseWhereInput = {};

        if (filters?.type) {
            where.type = filters.type;
        }

        if (filters?.category) {
            where.category = { equals: filters.category, mode: 'insensitive' };
        }

        if (filters?.startDate || filters?.endDate) {
            where.expenseDate = {};
            if (filters.startDate) {
                where.expenseDate.gte = new Date(filters.startDate);
            }
            if (filters.endDate) {
                where.expenseDate.lte = new Date(filters.endDate);
            }
        }

        if (filters?.search) {
            where.OR = [
                { category: { contains: filters.search, mode: 'insensitive' } },
                { note: { contains: filters.search, mode: 'insensitive' } },
            ];
        }

        return prisma.expense.findMany({
            where,
            orderBy: { expenseDate: 'desc' },
        });
    }

    async findById(id: string) {
        return prisma.expense.findUnique({
            where: { id },
        });
    }

    async create(data: CreateExpenseDTO) {
        return prisma.expense.create({
            data: {
                expenseDate: new Date(data.expenseDate),
                type: data.type || 'OPERATIONAL',
                category: data.category.trim(),
                amount: data.amount,
                note: data.note?.trim() || null,
            },
        });
    }

    async update(id: string, data: UpdateExpenseDTO) {
        const updateData: Prisma.ExpenseUpdateInput = {};

        if (data.expenseDate !== undefined) {
            updateData.expenseDate = new Date(data.expenseDate);
        }
        if (data.type !== undefined) {
            updateData.type = data.type;
        }
        if (data.category !== undefined) {
            updateData.category = data.category.trim();
        }
        if (data.amount !== undefined) {
            updateData.amount = data.amount;
        }
        if (data.note !== undefined) {
            updateData.note = data.note ? data.note.trim() : null;
        }

        return prisma.expense.update({
            where: { id },
            data: updateData,
        });
    }

    async delete(id: string) {
        return prisma.expense.delete({
            where: { id },
        });
    }
}

export const expenseRepository = new ExpenseRepository();

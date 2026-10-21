import { Request, Response } from 'express';
import { expenseService } from '../services/expense.service';
import { success } from '../utils/response';
import { ExpenseType } from '@prisma/client';

export class ExpenseController {
    async getAll(req: Request, res: Response) {
        const { type, category, startDate, endDate, search } = req.query;

        const expenses = await expenseService.getAllExpenses({
            type: type as ExpenseType | undefined,
            category: category as string | undefined,
            startDate: startDate as string | undefined,
            endDate: endDate as string | undefined,
            search: search as string | undefined,
        });

        return success(
            res,
            200,
            'Berhasil mengambil data pengeluaran',
            expenses
        );
    }

    async getById(req: Request, res: Response) {
        const { id } = req.params;
        const expense = await expenseService.getExpenseById(id.toString());
        return success(
            res,
            200,
            'Berhasil mengambil detail pengeluaran',
            expense
        );
    }

    async create(req: Request, res: Response) {
        const { expenseDate, type, category, amount, note } = req.body;

        const newExpense = await expenseService.createExpense({
            expenseDate,
            type,
            category,
            amount: Number(amount),
            note,
        });

        return success(res, 201, 'Pengeluaran berhasil dicatat', newExpense);
    }

    async update(req: Request, res: Response) {
        const { id } = req.params;
        const { expenseDate, type, category, amount, note } = req.body;

        const updatedExpense = await expenseService.updateExpense(id.toString(), {
            expenseDate,
            type,
            category,
            amount: amount !== undefined ? Number(amount) : undefined,
            note,
        });

        return success(
            res,
            200,
            'Pengeluaran berhasil diperbarui',
            updatedExpense
        );
    }

    async delete(req: Request, res: Response) {
        const { id } = req.params;
        await expenseService.deleteExpense(id.toString());
        return success(res, 200, 'Pengeluaran berhasil dihapus');
    }
}

export const expenseController = new ExpenseController();

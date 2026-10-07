import { Request, Response } from "express";
import { paymentService } from "../services/payment.service";
import { PaymentMethod } from "@prisma/client";
import { success } from "../utils/response";

export class PaymentController {

    async getAll(req: Request, res: Response) {
        const { orderId, paymentMethod, startDate, endDate } = req.query;

        const payments = await paymentService.getAllPayments({
            orderId: orderId as string | undefined,
            paymentMethod: paymentMethod as PaymentMethod | undefined,
            startDate: startDate as string | undefined,
            endDate: endDate as string | undefined,
        });
        return success(
            res,
            200,
            "Berhasil mengambil riwayat data pembayaran",
            payments
        );
    }

    async getById(req: Request, res: Response) {
        const { id } = req.params;
        const payment = await paymentService.getPaymentById(id.toString());
        return success(
            res,
            200,
            "Berhasil mengambil data pembayaran",
            payment
        );
    }

    async create(req: Request, res: Response) {
        const { orderId, amount, paymentDate, paymentMethod, notes, receiptNo } = req.body;
        const newPayment = await paymentService.createPayment({
            orderId,
            amount: Number(amount),
            paymentDate,
            paymentMethod,
            notes,
            receiptNo,
        });
        return success(
            res,
            201,
            "Berhasil menambahkan pembayaran",
            newPayment
        );
    }

    async deletePayment(req: Request, res: Response) {
        const { id } = req.params;
        await paymentService.deletePayment(id.toString());
        return success(
            res,
            200,
            "Berhasil menghapus pembayaran"
        );
    }
}

export const paymentController = new PaymentController();
import { InvoiceStatus } from "@prisma/client";
import { Request, Response } from "express";
import { invoiceService } from "../services/invoice.service";
import { success } from "../utils/response";

export class InvoiceController {
    async getAll(req:Request, res:Response) {
        const { customerId, status, search } = req.query;

        const invoices = await invoiceService.getAllInvoices({
            customerId: customerId as string | undefined,
            status: status as InvoiceStatus | undefined,
            search: search as string | undefined,
        });

        return success (
            res,
            200,
            "Berhasil mengambil data invoice",
            invoices
        );
    }

    async getById(req:Request, res:Response) {
        const { id } = req.params;
        const invoice = await invoiceService.getInvoiceById(id.toString());
        return success (
            res,
            200,
            "Berhasil mengambil data invoice",
            invoice
        );
    }

    async create(req: Request, res: Response) {
        const {customerId, invoiceNo, dueDate, notes, items } = req.body;

        const newInvoice = await invoiceService.createInvoice({
            customerId,
            invoiceNo,
            dueDate,
            notes,
            items,
        });

        return success(
            res,
            201, 
            "Invoice berhasil dibuat",
            newInvoice
        );
    }

    async update(req:Request, res:Response) {
        const { id } = req.params;
        const { dueDate, notes, status } = req.body;

        const updatedInvoice = await invoiceService.updateInvoice(id.toString(), {
            dueDate,
            notes,
            status,
        });

        return success (
            res,
            200,
            "Invoice berhasil diperbarui",
            updatedInvoice
        );
    }

    async cancel(req:Request, res:Response) {
        const { id } = req.params;
        const { reason } = req.body;

        const cancelledInvoice = await invoiceService.cancelInvoice(id.toString(),reason);
        return success (
            res,
            200,
            "Invoice berhasil dibatalkan", 
            cancelledInvoice
        );
    }
}

export const invoiceController = new InvoiceController();
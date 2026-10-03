import { InvoiceStatus } from "@prisma/client"
import { invoiceRepository } from "../repositories/invoice.repository";
import { CreateInvoiceDTO, CreateInvoiceInput, CreateInvoiceItemDTO } from "../types/invoice.type";
import { customerRepository } from "../repositories/customer.repository";
import { AppError } from "../errors/AppError";
import { generateInvoiceNo } from "../utils/generateInvoiceNo";

export class InvoiceService {
    async getAllInvoices(filters?: { 
        customerId?: string;
        status?: InvoiceStatus;
        search?: string;
    }) {
        return invoiceRepository.findMany(filters);
    }

    async getInvoiceById(id:string) {
        const invoice = await invoiceRepository.findById(id);
        if(!invoice){
            throw new Error("Invoice not found");
        }
        return invoice;
    }

    async getInvoiceByInvoiceNo(invoiceNo:string) {
        const invoice = await invoiceRepository.findByInvoiceNo(invoiceNo);
        if(!invoice){
            throw new Error("Invoice not found");
        }
        return invoice;
    }

    async createInvoice(input: CreateInvoiceInput) {
        const customer = await customerRepository.findById(input.customerId);
        if(!customer){
            throw new AppError("Customer tidak ditemukan",404);
        }

        const activeUnpaidCount = customer.invoices?.filter(
            (inv) => inv.status !== InvoiceStatus.PAID
        ).length ?? 0;
        
        const maxLimit = customer.maxUnpaidInvoices ?? 2;

        if (activeUnpaidCount >= 2) {
            throw new AppError(
                `Pelanggan telah mencapai batas maksimal invoice belum lunas (${maxLimit})`,
                400 
            );
        }

        if (!input.items || input.items.length === 0) {
            throw new AppError("Invoice harus memiliki minimal 1 (satu) item",400);
        }
        
        let totalAmount = 0;
        const computedItems:CreateInvoiceItemDTO[] = input.items.map(item => {
            if(item.quantity <= 0) {
                throw new AppError(`Jumlah untuk ${item.name} harus lebih dari 0`, 400);
            }

            if(item.unitPrice <= 0) {
                throw new AppError(`Harga untuk ${item.name} tidak boleh negatif`, 400);
            }

            const subTotal = item.quantity * item.unitPrice;
            totalAmount += subTotal;
            return {
                name: item.name.trim(),
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                subTotal,
            };
        });

        const invoiceNo = await generateInvoiceNo();
        const dueDate = input.dueDate ? new Date(input.dueDate) : null;

        return invoiceRepository.create({
            customerId: input.customerId,
            invoiceNo,
            totalAmount,
            paidAmount: 0,
            status: InvoiceStatus.UNPAID,
            dueDate,
            notes: input.notes?.trim() || null,
            items: computedItems,
        });
    }

    async updateInvoice(id:string, data:{
        dueDate?:string|null;
        notes?:string|null;
        status?:InvoiceStatus;
    }) {
        const invoice = await invoiceRepository.findById(id);
        if (!invoice) {
            throw new AppError("Invoice tidak ditemukan", 404);
        }

        //1. Kunci total jika invoice sudah lunas
        if(invoice.status === InvoiceStatus.PAID) {
            throw new AppError("Invoice yang sudah lunas tidak bisa diubah kembali",400);
        }

        //2. Perubahan status invoice hanya di-trigger oleh payment
        if(data.status && data.status !== invoice.status) {
            throw new AppError("Perubahan status invoice hanya dapat dilakukan melalui pencatatan pembayaran", 400);
        }

        //3. Hanya izinkan perubahan metadata non-nominal
        const updatePayload: { dueDate?:Date|null, notes?: string|null} = {};

        if (data.dueDate !== undefined) {
            updatePayload.dueDate = data.dueDate ? new Date(data.dueDate):null;
        }

        if (data.notes !== undefined) {
            updatePayload.notes = data.notes?.trim() || null;
        }

        return invoiceRepository.update(id, updatePayload);
    }

    async cancelInvoice(id:string, reason?:string) {
        const invoice = await invoiceRepository.findById(id);

        if (!invoice) {
            throw new AppError("Invoice tidak ditemukan", 404);
        }

        if (invoice.status === InvoiceStatus.CANCELLED) {
            throw new AppError("Invoice sudah dibatalkan", 400);
        }

        if (invoice.payments && invoice.payments.length > 0) {
            throw new AppError("Invoice yang sudah memiliki pembayaran tidak bisa dibatalkan", 400);
        }

        return invoiceRepository.cancel(id,reason);
    }
}

export const invoiceService = new InvoiceService();
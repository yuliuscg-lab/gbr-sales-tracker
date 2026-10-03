import { InvoiceStatus } from "@prisma/client";

export interface CreateInvoiceItemDTO {
    name:string;
    quantity:number;
    unitPrice:number;
    subTotal:number;
}

export interface CreateInvoiceDTO {
    customerId: string;
    invoiceNo: string;
    totalAmount: number;
    paidAmount?: number;
    status?: InvoiceStatus;
    dueDate: Date | null;
    notes?: string | null;
    items: CreateInvoiceItemDTO[];
}

export interface UpdateInvoiceDTO {
    status?: InvoiceStatus;
    dueDate?: Date | null;
    notes?: string | null;
}

export interface CreateInvoiceInput {
    customerId:string;
    invoiceNo?:string;
    dueDate?:string|null;
    notes?:string|null;
    items: {
        name:string;
        quantity: number;
        unitPrice:number;
    }[];
}
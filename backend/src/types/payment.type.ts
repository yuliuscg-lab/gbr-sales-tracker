import { PaymentMethod } from "@prisma/client";

export interface CreatePaymentDTO {
    orderId: string;
    amount: number;
    paymentMethod: PaymentMethod;
    paymentDate: Date;
    notes?: string;
    receiptNo: string;
}

export interface PaymentFilterDTO {
    orderId?:string;
    paymentMethod?:PaymentMethod;
    startDate?:string;
    endDate?:string;
}
import { OrderStatus } from "@prisma/client";

export interface CreateOrderItemDTO {
    productId?:string|null;
    name:string;
    unitName:string;
    conversionQty:number;
    baseQty:number;
    quantity:number;
    unitPrice:number;
    subTotal:number;
}

export interface CreateOrderDTO {
    customerId: string;
    orderNo: string;
    totalAmount: number;
    paidAmount?: number;
    status?: OrderStatus;
    dueDate: Date | null;
    notes?: string | null;
    items: CreateOrderItemDTO[];
}

export interface UpdateOrderDTO {
    status?: OrderStatus;
    dueDate?: Date | null;
    notes?: string | null;
}

export interface CreateOrderInput {
    customerId:string;
    orderNo?:string;
    dueDate?:string|null;
    notes?:string|null;
    items: {
        productId: string;
        name:string;
        unitName:string;
        conversionQty:number;
        baseQty:number;
        quantity: number;
        unitPrice:number;
    }[];
}
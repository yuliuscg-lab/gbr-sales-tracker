import { OrderStatus } from '@prisma/client';

export interface CreateOrderItemDTO {
    productId?: string | null;
    name: string;
    unitName: string;
    conversionQty: number;
    baseQty: number;
    quantity: number;
    unitPrice: number;
    costPrice?: number;
    subTotal: number;
}

export interface CreateOrderDTO {
    customerId: string;
    orderNo: string;
    totalAmount: number;
    paidAmount?: number;
    status?: OrderStatus;
    dueDate: Date | null;
    notes?: string | null;
    deliveryFee: number;
    deliveryDate: Date;
    items: CreateOrderItemDTO[];
}

export interface UpdateOrderDTO {
    status?: OrderStatus;
    dueDate?: Date | null;
    notes?: string | null;
    deliveryDate?: Date;
}

export interface CreateOrderItemInput {
    productId?: string | null;
    productUnitId?: string | null;
    name: string;
    unitName: string;
    conversionQty: number;
    quantity: number;
    unitPrice: number;
}

export interface CreateOrderInput {
    customerId: string;
    orderNo?: string;
    dueDate?: string | null;
    notes?: string | null;
    deliveryFee: number;
    deliveryDate:Date;
    items: CreateOrderItemInput[];
}

export interface OrderFilterParams {
    customerId?: string;
    status?: OrderStatus;
    search?: string;
    startDate?: string;
    endDate?: string;
    dueStartDate?: string;
    dueEndDate?: string;
}

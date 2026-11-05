import { DeliveryStatus, OrderStatus } from "@/api/order";
import { PaymentMethod } from "@/api/payment";

export interface Customer {
    id: string;
    name: string;
    phone?: string;
    notes?: string;
    totalOrders: number;
    unpaidOrdersCount: number;
    createdAt: string;
    updatedAt: string;
}

export interface CustomerDetail extends Customer {
    address?: string | null;
    subdistrict?: string | null;
    district?: string | null;
    city?: string | null;
    province?: string | null;
    mapsUrl?: string | null;
    orders: {
        id: string;
        orderNo: string;
        orderDate: string;
        dueDate?: string | null;
        totalAmount: number;
        paidAmount: number;
        status: OrderStatus;
        deliveryStatus: DeliveryStatus;
        items: {
            id: string;
            name: string;
            unitName: string;
            quantity: number;
            unitPrice: number;
            subTotal: number;
        }[];
        payments: {
            id: string;
            receiptNo?: string | null;
            amount: number;
            method: PaymentMethod;
            paymentDate: string;
            orderNo?: string;
        }[];
    }[];
    payments: {
        id: string;
        receiptNo?: string | null;
        amount: number;
        method: PaymentMethod;
        paymentDate: string;
        orderNo?: string;
    }[];
}

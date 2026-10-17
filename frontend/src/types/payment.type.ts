export interface PaymentRequest {
    orderId: string;
    amount: number;
    paymentMethod: string;
    paymentDate: string;
    notes?: string;
}
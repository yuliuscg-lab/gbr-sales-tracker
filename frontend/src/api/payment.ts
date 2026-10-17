import { api } from "./client";
import { PaymentRequest } from "@/types/payment.type";

export const paymentApi = {
    async create(payload: PaymentRequest) {
        const res = await api.post('/payments', payload);
        return res.data.data;
    },
};
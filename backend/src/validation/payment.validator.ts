import { PaymentMethod } from "@prisma/client";
import { z } from "zod";

export const createPaymentSchema = z.object({
    orderId: z.string().cuid(),
    amount: z.number().positive(),
    paymentDate: z.string().datetime(),
    paymentMethod: z.nativeEnum(PaymentMethod),
    notes: z.string().optional(),
});


import { z } from "zod";

export const uploadPaymentProofSchema = z.object({
    paymentId: z.string().cuid(),
    paymentProof: z.string().url(),
});

export const rejectPaymentSchema = z.object({
    reason: z.string().min(3).max(255).optional(),
});
import { z } from "zod";
import { PaymentMethod } from "@prisma/client";

export const checkoutSchema = z.object({
    eventId: z.string().cuid(),
    ticketTypeId: z.number().int().positive(),
    qtyTickets: z.number().int().positive(),
    couponCode: z.string().optional(),
    usePoint: z.boolean().default(false),
    paymentMethod: z.nativeEnum(PaymentMethod),
});

export const calculateSchema = z.object({
    eventId: z.string().cuid(),
    ticketTypeId: z.number().int().positive(),
    qtyTickets: z.number().int().positive(),
    couponCode: z.string().optional(),
    usePoint: z.boolean().default(false),
});
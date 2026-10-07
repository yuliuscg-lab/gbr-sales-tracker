import { z } from "zod";

export const crateOrderSchema = z.object({
    customerId: z.string().cuid(),
    dueDate: z.string().datetime().optional(),
    notes: z.string().optional(),
    items: z.array(
        z.object({
            productId: z.string().cuid(),
            name: z.string().min(1, "Nama produk minimal 1 karakter!"),
            unitName: z.string(),
            conversionQty: z.string(),
            quantity: z.number().min(1, "Quantity minimal 1"),
            unit: z.string().min(1, "Unit minimal 1 karakter").optional(),
        })
    )
})

export const updateOrderSchema = z.object({
    dueDate: z.string().datetime().optional(),
    notes: z.string().optional(),
})

export const cancelOrderSchema = z.object({
    reason: z.string().min(3).max(255).optional(),
})
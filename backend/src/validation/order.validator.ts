import { z } from 'zod';

export const crateOrderSchema = z.object({
    customerId: z.string().cuid(),
    dueDate: z.string().date().optional().or(z.string().datetime().optional()),
    notes: z.string().optional(),
    deliveryFee: z.coerce.number(),
    deliveryDate: z.string().date().or(z.string().datetime()),
    items: z.array(
        z.object({
            productId: z.string().cuid(),
            productUnitId: z.string().cuid(),
            name: z.string().min(1, 'Nama produk minimal 1 karakter!'),
            unitName: z.string(),
            conversionQty: z.number(),
            quantity: z.number().min(1, 'Quantity minimal 1'),
            unitPrice: z.number(),
        })
    ),
});

export const updateOrderSchema = z.object({
    dueDate: z.string().date().or(z.string().datetime()).optional(),
    notes: z.string().optional(),
    deliveryDate: z.string().datetime().optional(),
});

export const cancelOrderSchema = z.object({
    reason: z.string().min(3).max(255).optional(),
});

export const updateDeliveryStatusSchema = z.object({
    deliveryStatus: z.enum(['NOT_SHIPPED', 'SHIPPED']),
    shippedAt: z.string().date().or(z.string().datetime()).optional(),
});

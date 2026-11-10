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
    deliveryDate: z.string().nullable().optional(),
    dueDate: z.string().nullable().optional(),
    notes: z.string().nullable().optional(),
    deliveryFee: z.coerce.number().min(0).optional(),
    items: z
        .array(
            z.object({
                productId: z.string().nullable().optional(),
                productUnitId: z.string().nullable().optional(),
                name: z.string().min(1, 'Nama produk wajib diisi'),
                unitName: z.string().min(1, 'Satuan wajib diisi'),
                conversionQty: z.coerce.number().min(1).default(1),
                quantity: z.coerce.number().min(1, 'Qty minimal 1'),
                unitPrice: z.coerce
                    .number()
                    .min(0, 'Harga tidak boleh negatif'),
            })
        )
        .min(1, 'Order harus memiliki minimal 1 item')
        .optional(),
});

export const cancelOrderSchema = z.object({
    reason: z.string().max(255).optional(),
});

export const updateDeliveryStatusSchema = z.object({
    deliveryStatus: z.enum(['NOT_SHIPPED', 'SHIPPED']),
    shippedAt: z.string().date().or(z.string().datetime()).optional(),
});

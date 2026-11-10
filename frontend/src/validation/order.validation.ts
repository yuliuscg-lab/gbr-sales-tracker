// frontend/src/validation/order.validation.ts
import { z } from 'zod';

export const orderItemSchema = z.object({
    productId: z.string().min(1, 'Pilih produk'),
    productUnitId: z.string().min(1, 'Pilih satuan (UOM)'),
    name: z.string(),
    unitName: z.string(),
    conversionQty: z.coerce.number(),
    quantity: z.coerce
        .number({ invalid_type_error: 'Qty harus berupa angka' })
        .min(1, 'Minimal qty adalah 1'),
    unitPrice: z.coerce
        .number({ invalid_type_error: 'Harga harus berupa angka' })
        .min(0, 'Harga tidak boleh negatif'),
});

export const createOrderSchema = z.object({
    customerId: z.string().min(1, 'Pilih pelanggan'),
    orderNo: z.string().optional(),
    dueDate: z.string().optional(),
    notes: z.string().optional(),
    deliveryFee: z.coerce.number().min(0, 'Ongkos kirim tidak boleh negatif'),
    deliveryDate: z.string().optional(),
    items: z.array(orderItemSchema).min(1, 'Minimal harus ada 1 item barang yang dipesan'),
});

export const updateOrderItemSchema = orderItemSchema.extend({
    productId: z.string().nullable().optional(),
    productUnitId: z.string().nullable().optional(),
    unitName: z.string().min(1, 'Pilih satuan (UOM)'),
});

export const updateOrderSchema = z.object({
    deliveryDate: z.string().optional().nullable(),
    dueDate: z.string().optional().nullable(),
    notes: z.string().optional(),
    deliveryFee: z.coerce.number().optional(),
    items: z.array(updateOrderItemSchema).min(1, `Minimal harus ada 1 item barang yang dipesan`).optional()
});

export type UpdateOrderFormData = z.infer<typeof updateOrderSchema>;
export type OrderFormData = z.infer<typeof createOrderSchema>;
export type OrderItemFormData = z.infer<typeof orderItemSchema>;

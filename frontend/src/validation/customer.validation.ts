import { z } from 'zod';

export const customerSchema = z.object({
    name: z
        .string()
        .trim()
        .min(1, 'Nama pelanggan wajib diisi')
        .max(100, 'Nama terlalu panjang'),
    phone: z
        .string()
        .trim()
        .optional()
        .transform((val) => (val === '' ? undefined : val)),
    notes: z
        .string()
        .trim()
        .optional()
        .transform((val) => (val === '' ? undefined : val)),
    totalOrders: z
        .coerce
        .number({ invalid_type_error: 'Harus berupa angka' })
        .int('Harus bilangan bulat'),
    unpaidOrdersCount: z
        .coerce
        .number({ invalid_type_error: 'Harus berupa angka' })
        .int('Harus bilangan bulat')
});

export type CustomerFormData = z.infer<typeof customerSchema>;

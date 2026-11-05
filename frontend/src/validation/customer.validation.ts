import { z } from 'zod';

export const customerSchema = z.object({
    name: z.string().trim().min(1, 'Nama konsumen wajib diisi'),
    phone: z
        .string()
        .trim()
        .optional(),
    notes: z
        .string()
        .trim()
        .optional(),

    // Field Alamat & Lokasi Baru
    address: z
        .string()
        .trim()
        .optional(),
    subdistrict: z
        .string()
        .trim()
        .optional(),
    district: z
        .string()
        .trim()
        .optional(),
    city: z
        .string()
        .trim()
        .optional(),
    province: z
        .string()
        .trim()
        .optional(),
    mapsUrl: z
        .string()
        .trim()
        .optional(),

    totalOrders: z.coerce.number(),
    unpaidOrdersCount: z.coerce.number(),
});

export type CustomerFormData = z.infer<typeof customerSchema>;

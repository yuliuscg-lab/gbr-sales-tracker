import { z } from 'zod';

export const productUnitSchema = z.object({
    id: z.string().optional(),
    unitName: z.string().trim().min(1, 'Nama satuan wajib diisi'),
    conversionQty: z.coerce
        .number({ invalid_type_error: 'Harus berupa angka' })
        .int('Harus bilangan bulat')
        .min(2, 'Konversi satuan tambahan minimal 2'),
});

export const productSchema = z.object({
    name: z.string().trim().min(1, 'Nama produk wajib diisi').max(100, 'Nama terlalu panjang'),
    baseUnit: z.string().trim().min(1, 'Satuan dasar wajib diisi'),
    isProductionItem: z.boolean(),
    costPrice: z.coerce
        .number({
            invalid_type_error: 'Harga modal harus berupa angka',
        }).min(0, 'HPP tidak boleh negatif'),
    additionalUnits: z.array(productUnitSchema),
});

export type ProductFormData = z.infer<typeof productSchema>;

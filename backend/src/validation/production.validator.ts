// backend/src/validations/production.validation.ts
import { z } from 'zod';

export const createProductionCardSchema = z.object({
        orderIds: z
            .array(z.string().min(1, 'ID order tidak boleh kosong'))
            .min(1, 'Minimal pilih 1 order untuk membuat kartu produksi'),
        notes: z.string().trim().nullable().optional(),
    });
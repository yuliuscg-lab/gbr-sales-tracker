import { z } from "zod";

export const createProductSchema = z.object({
    code: z.string().optional(),
    name: z.string().min(4, "Nama minimal 4 karakter!").trim(),
    baseUnit: z.string().min(1, "Unit dasar minimal 1 karakter!").trim(),
    additionalUnits: z.array(
        z.object({
            unitName: z.string().min(1, "Nama unit minimal 1 karakter").trim(),
            conversionQty: z.number().min(2, "Quantity konversi minimal 2"),
        })
    ).optional()
});

export const updateProductSchema = z.object({
    name: z.string().min(4, "Nama minimal 4 karakter!").trim().optional(),
    baseUnit: z.string().min(1, "Unit dasar minimal 1 karakter!").trim().optional(),
    additionalUnits: z.array(
        z.object({
            unitName: z.string().min(1, "Nama unit minimal 1 karakter").trim(),
            conversionQty: z.number().min(2, "Quantity konversi minimal 2"),
        })
    ).optional()
});
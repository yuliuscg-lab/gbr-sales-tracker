import { z } from "zod"

export const createCustomerSchema = z.object({
    name: z.string().min(4, "Nama minimal 4 karakter").trim(),
    phone: z.string().min(10, "Nomor telepon minimal 10 karakter").trim(),
    notes: z.string().optional(),
})

export const updateCustomerSchema = z.object({
    name: z.string().min(4, "Nama minimal 4 karakter").trim().optional(),
    phone: z.string().min(10, "Nomor telepon minimal 10 karakter").trim().optional(),
    notes: z.string().optional(),
})
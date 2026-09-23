import { z } from "zod";

export const createTicketTypeSchema = z.object({
    ticketType: z.string().trim().min(3, "Tipe tiket minimal 3 karakter!").max(50, "Tipe tiket maksimal 50 karakter!"),
    price: z.number().int().min(0, "Harga tidak boleh negatif!"),
    quota: z.number().int().positive("Kuota minimal 1"),
});

export const updateTicketTypeSchema = z.object({
    ticketType: z.string().trim().min(3, "Tipe tiket minimal 3 karakter!").max(50, "Tipe tiket maksimal 50 karakter!").optional(),
    price: z.number().int().min(0, "Harga tidak boleh negatif!").optional(),
    quota: z.number().int().positive("Kuota minimal 1").optional(),
})
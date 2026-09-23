import { z } from "zod";

export const updateUserSchema = z.object({
    name: z.string().min(4, "Nama minimal 4 karakter!").optional(),
    phone: z.string().min(10, "Nomor telepon minimal 10 karakter!").optional(),
}).strict();
import { z } from "zod";

export const registerSchema = z.object({
    name: z.string().min(4, "Nama minimal 4 karakter!").max(100, "Nama maksimal 100 karakter!"),
    username: z.string().email("username tidak valid!"),
    phone: z.string().min(10, "Nomor telepon minimal 10 karakter!").max(15, "Nomor telepon maksimal 15 karakter!"),
    password: z.string().min(8, "Password minimal 8 karakter!"),
    refCodeInput: z.string().optional(),
});

export const loginSchema = z.object({
    username: z.string().email("username harus diisi!"),
    password: z.string().min(1, "Password harus diisi!"),
});

export const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, "Password saat ini harus diisi!"),
    newPassword: z.string().min(8, "Password baru harus minimal 8 karakter!"),
});
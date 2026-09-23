import { z } from "zod";
import { Role } from "@prisma/client";

export const registerSchema = z.object({
    name: z.string().min(4, "Nama minimal 4 karakter!").max(100, "Nama maksimal 100 karakter!"),
    email: z.string().email("Email tidak valid!"),
    phone: z.string().min(10, "Nomor telepon minimal 10 karakter!").max(15, "Nomor telepon maksimal 15 karakter!"),
    password: z.string().min(8, "Password minimal 8 karakter!"),
    role: z.nativeEnum(Role),
    refCodeInput: z.string().optional(),
});

export const loginSchema = z.object({
    email: z.string().email("Email harus diisi!"),
    password: z.string().min(1, "Password harus diisi!"),
});

export const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, "Password saat ini harus diisi!"),
    newPassword: z.string().min(8, "Password baru harus minimal 8 karakter!"),
});
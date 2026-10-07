import { z } from "zod";

export const registerSchema = z.object({
    name: z.string().min(4, "Nama minimal 4 karakter!").max(100, "Nama maksimal 100 karakter!"),
    username: z.string().min(4, "Username minimal 4 karakter").max(20, "Username maksimal 20 karakter"),
    password: z.string().min(8, "Password minimal 8 karakter!"),
});

export const loginSchema = z.object({
    username: z.string().min(4, "Username minimal 4 karakter").max(20, "Username maksimal 20 karakter"),
    password: z.string().min(1, "Password harus diisi!"),
});

// export const changePasswordSchema = z.object({
//     currentPassword: z.string().min(1, "Password saat ini harus diisi!"),
//     newPassword: z.string().min(8, "Password baru harus minimal 8 karakter!"),
// });
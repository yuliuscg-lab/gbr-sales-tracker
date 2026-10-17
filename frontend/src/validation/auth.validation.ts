import { z } from "zod";

export const loginSchema = z.object({
    username: z.string().min(4, "Username minimal 4 karakter").max(20, "Username maksimal 20 karakter"),
    password: z.string().min(1, "Password harus diisi!"),
});

export type LoginFormData = z.infer<typeof loginSchema>;


import { z } from "zod";

export const idParamSchema = z.object ({
    id: z.coerce.number().int().positive(),
});

export const cuidParamSchema = z.object ({
    cuid: z.string().cuid(),
})

export const ticketCodeParamSchema = z.object({
    code: z.string().min(1),
});
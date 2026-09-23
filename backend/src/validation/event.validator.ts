import { EventStatus } from "@prisma/client";
import { z } from "zod";

const ticketTypeSchema = z.object({
    ticketType: z.string().trim().min(3, "Tipe tiket minimal 3 karaketer!").max(100, "Tipe tiket maksimal 100 karaketer!"),
    price: z.number().int().min(0, "Harga tidak boleh negatif!"),
    quota: z.number().int().positive("Kuota minimal 1!"),
});

export const createEventSchema = z.object({
    eventTitle: z.string().trim().min(5, "Judul event minimal 5 karakter!").max(150, "Judul event maksimal 150 karakter!"),
    eventDate: z.coerce.date(),
    startTime: z.coerce.date(),
    endTime: z.coerce.date(),
    eventDesc: z.string().trim().min(10, "Deskripsi event minimal 10 karakter!"),
    thumbnailUrl: z.string().url().optional(),
    eventTnc: z.string().trim().min(10, "Syarat dan ketentuan minimal 10 karakter!"),
    lastBuyAt: z.coerce.date(),
    categoryId: z.coerce.number(),
    venueId: z.number().int().positive(),
    ticketTypes: z.array(ticketTypeSchema).nonempty("Anda harus menambahkan minimal 1 tipe tiket!")
});

export const updateEventSchema = createEventSchema.partial().extend({
    status: z.nativeEnum(EventStatus).optional(),
});


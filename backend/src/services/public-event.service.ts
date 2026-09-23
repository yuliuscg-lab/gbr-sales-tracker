import { Public } from "@prisma/client/runtime/client";
import { AppError } from "../errors/AppError";
import { eventRepository } from "../repositories/event.repository";

class PublicEventService {
    async getAll() {
        return eventRepository.findPublished();
    }

    async getById(id:string) {
        const event = await eventRepository.findPublishedById(id);
        
        if (!event) {
            throw new AppError("Event tidak ditemukan!",404);
        }
        return event;
    }
}

export const publicEventService = new PublicEventService();
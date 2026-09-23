import { EventStatus, Role } from "@prisma/client";
import { AppError } from "../errors/AppError";
import { eventRepository } from "../repositories/event.repository";
import { ticketTypeRepository } from "../repositories/ticket-type.repository";
import { CreateTicketTypeRequest, UpdateTicketTypeRequest } from "../types/ticket-type.types";

class TicketTypeService {

    async getAll() {
        return ticketTypeRepository.findAll();
    }

    async getById(id: number) {
        const ticket = await ticketTypeRepository.findById(id);

        if (!ticket) {
            throw new AppError("Ticket Type tidak ditemukan", 404);
        }

        return ticket;
    }

    async getByEventId(eventId: string) {
        const event = await eventRepository.findById(eventId);

        if (!event) {
            throw new AppError("Event tidak ditemukan", 404);
        }

        return ticketTypeRepository.findByEventId(eventId);
    }

    async create(
        userId: string,
        role: Role,
        eventId: string,
        data: CreateTicketTypeRequest,
    ) {

        const event = await eventRepository.findById(eventId);

        if (!event) {
            throw new AppError("Event tidak ditemukan",404);
        }

        if (
            role !== Role.ADMIN &&
            event.organizerId !== userId
        ) {
            throw new AppError(
                "Anda tidak diizinkan menambah ticket pada event ini",
                403
            );
        }

        if (event.status !== EventStatus.DRAFT) {
            throw new AppError(
                "Ticket hanya dapat ditambahkan saat event masih DRAFT",
                400
            );
        }

        const existing = await ticketTypeRepository.findByName(
            eventId,
            data.ticketType
        );

        if (existing) {
            throw new AppError(
                "Ticket Type sudah ada",
                409
            );
        }

        return ticketTypeRepository.create({
            ...data,
            event: {
                connect: {
                    id: eventId,
                },
            },
            sold: 0
        });
    }

    async update(
        userId: string,
        role: Role,
        id: number,
        data: UpdateTicketTypeRequest,
    ) {

        const existingTicketType = await this.getById(id);

        if (
            role !== Role.ADMIN &&
            existingTicketType.event.organizerId !== userId
        ) {
            throw new AppError(
                "Anda tidak diizinkan mengubah ticket ini",
                403
            );
        }

        if (existingTicketType.event.status !== EventStatus.DRAFT) {
            throw new AppError(
                "Ticket tidak dapat diubah setelah event dipublish",
                400
            );
        }

        if (data.ticketType && data.ticketType !== existingTicketType.ticketType) {
            const existing = await ticketTypeRepository.findByName(existingTicketType.eventId,data.ticketType)

            if (existing) {
                throw new AppError(
                    "Ticket Type sudah ada",
                    409
                );
            }

        }

        return ticketTypeRepository.update(id, data);
    }

    async delete(
        userId: string,
        role: Role,
        id: number,
    ) {

        const ticket = await this.getById(id);

        if (role !== Role.ADMIN && ticket.event.organizerId !== userId) {
            throw new AppError(
                "Anda tidak diizinkan menghapus ticket ini",
                403
            );
        }

        if (ticket.event.status !== EventStatus.DRAFT) {
            throw new AppError(
                "Ticket tidak dapat dihapus setelah event dipublish",
                400
            );
        }

        return ticketTypeRepository.softDelete(id);
    }
}

export const ticketTypeService = new TicketTypeService();
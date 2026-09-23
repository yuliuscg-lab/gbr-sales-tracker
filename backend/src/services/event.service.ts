import { EventStatus, Role } from "@prisma/client";
import { AppError } from "../errors/AppError";
import { categoryRepository } from "../repositories/category.repository";
import { eventRepository } from "../repositories/event.repository";
import { venueRepository } from "../repositories/venue.repository";
import { CreateEventRequest, UpdateEventRequest } from "../types/event.types";

export class EventService {
    async getAll(userId:string, role:Role) {
        
        if (role===Role.ADMIN) {
            return eventRepository.findAll();
        }
        
        return eventRepository.findByOrganizerId(userId);
    }

    async getById(id:string) {
        const event = await eventRepository.findById(id);

        if(!event) {
            throw new AppError("Event tidak ditemukan", 404);
        }

        return event;
    }

    async create(organizerId:string, data:CreateEventRequest) {
        const existingEvent = await eventRepository.findByTitle(data.eventTitle);

        if (existingEvent) {
            throw new AppError("Event title already exist", 409);
        }

        const category = await categoryRepository.findById(data.categoryId);

        if(!category) {
            throw new AppError("Category tidak ditemukan", 404);
        }

        const venue = await venueRepository.findById(data.venueId);

        if (!venue) {
            throw new AppError("Venue tidak ditemukan", 404);
        }

        if (data.startTime >= data.endTime) {
            throw new AppError(
                "Start time haru sebelum end time",
                400
            );
        }

        if (data.lastBuyAt >= data.startTime) {
            throw new AppError(
                "Last buy date harus sebelum event start date",
                400
            )
        }
        
        const ticketNames = data.ticketTypes!.map(ticket =>
            ticket.ticketType.trim().toLowerCase()
        );

        if (
            new Set(ticketNames).size !== ticketNames.length
        ) {
            throw new AppError(
                "Nama ticket tidak boleh sama",
                400
            );
        }

        const {
            categoryId,
            venueId,
            ticketTypes,
            ...eventData
        } = data;

        return eventRepository.create({
            ...eventData,

            status: EventStatus.DRAFT,

            organizer: {
                connect: {
                    id: organizerId,
                },
            },

            category: {
                connect: {
                    id: categoryId,
                },
            },

            venue: {
                connect: {
                    id: venueId,
                },
            },
            ticketTypes: {
                create: ticketTypes,
            },
        });
    }

    async update(
        userId:string,
        role:Role,
        id:string,
        data:UpdateEventRequest) {
        const event = await this.getById(id);
        
        if (event.status === EventStatus.PUBLISHED) {
            throw new AppError("Event yang sudah dipublish tidak dapat diubah", 400);
        }

        if (
            role !== Role.ADMIN &&
            event.organizerId !== userId
        ) {
            throw new AppError(
                "Anda tidak diizinkan mengubah event ini",
                403
            );
        }

        if(data.eventTitle && data.eventTitle !== event.eventTitle) {
            const existing = await eventRepository.findByTitle(data.eventTitle);

            if (existing) {
                throw new AppError("Event sudah ada!", 409);
            }
        }

        if (data.categoryId) {
            const category = await categoryRepository.findById(
                data.categoryId
            );

            if(!category) {
                throw new AppError(
                    "Category tidak ditemukan",
                    404
                );
            }
        }

        if (data.venueId) {
            const venue = await venueRepository.findById(
                data.venueId
            );

            if(!venue) {
                throw new AppError(
                    "Venue tidak ditemukan",
                    404
                );
            }
        }

        const startTime = new Date(data.startTime ?? event.startTime);
        const endTime = new Date(data.endTime ?? event.endTime);
        const lastBuyAt = new Date(data.lastBuyAt ?? event.lastBuyAt);

        if (startTime >= endTime) {
            throw new AppError(
                "Waktu mulai (Start time) harus sebelum waktu selesai (End time)",
                400
            );
        }

        if (lastBuyAt >= startTime) {
            throw new AppError(
                "Batas akhir pembelian (Last buy date) harus sebelum waktu mulai event",
                400
            );
        }
        
        

        const {
            categoryId,
            venueId,
            ...eventData
        } = data;

        return eventRepository.update(id, {
            ...eventData,

            ...(data.categoryId !== undefined && {
                category: {
                    connect: {
                        id: data.categoryId,
                    },
                },
            }),

            ...(data.venueId !== undefined && {
                venue: {
                    connect: {
                        id: data.venueId,
                    },
                },
            }),
        });
    }

    async delete(
        userId:string,
        role:Role,
        id:string
    ) {
        const event = await this.getById(id);

        if (
            role !== Role.ADMIN &&
            event.organizerId !== userId
        ) {
            throw new AppError(
                "Anda tidak diizinkan menghapus event ini",
                403
            );
        }
        
        return eventRepository.softDelete(id);
    }

    async getAttendees(userId: string, role: Role, eventId: string) {
        const event = await this.getById(eventId);

        if (role !== Role.ADMIN && event.organizerId !== userId) {
            throw new AppError("Anda tidak diizinkan melihat daftar peserta event ini", 403);
        }

        const attendees = await eventRepository.findAttendeesByEventId(eventId);
        return {
            event: {
                id: event.id,
                eventTitle: event.eventTitle,
                eventDate: event.eventDate,
                status: event.status,
            },
            attendees,
        };
    }
}

export const eventService = new EventService();
import { AppError } from "../errors/AppError";
import { venueRepository } from "../repositories/venue.repository";
import { CreateVenueRequest, UpdateVenueRequest } from "../types/venue.types";

class VenueService {
    async getAll() {
        return await venueRepository.findAll();
    }

    async getById(id:number){
        const venue = await venueRepository.findById(id);

        if (!venue) {
            throw new AppError("Venue tidak ditemukan",404);
        }

        return venue;
    }

    async create(data: CreateVenueRequest) {
        const exist = await venueRepository.findByName(
            data.venueName
        );

        if (exist) {
            throw new AppError("Venue sudah ada", 409);
        }

        return venueRepository.create(data);
    }

    async update(id:number, data:UpdateVenueRequest) {
        await this.getById(id);

        if(data.venueName) {
            const exists = await venueRepository.findByName(data.venueName);

            if(exists && exists.id !== id) {
                throw new AppError("Venue sudah ada!", 409);
            }
        }

        return venueRepository.update(id, data);
    }

    async delete(id: number) {
        await this.getById(id);

        return venueRepository.softDelete(id);
    }
}

export const venueService = new VenueService()
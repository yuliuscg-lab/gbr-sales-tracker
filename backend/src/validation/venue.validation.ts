import { z } from "zod";

export const createVenueSchema = z.object({
    venueName: z.string().min(1, "Venue name is required").max(50, "Venue name must be at most 50 characters"),
    venueAddress: z.string().min(1, "Venue address is required"),
    venueCity: z.string().min(1, "Venue city is required"),
    venueState: z.string().min(1, "Venue state is required"),
    venueZipCode: z.string().min(1, "Venue zip code is required"),
    venuePhone: z.string().min(1, "Venue phone is required"),
    venueEmail: z.string().email("Venue email is invalid"),
    venueGMapsUrl: z.string().url("Venue GMaps URL is invalid"),
    capacity: z.number().int().positive(),
});

export const updateVenueSchema = createVenueSchema.partial();
import { z } from "zod";

export const createCategorySchema = z.object({
    category : z.string().min(1, "Category name is required").max(50, "Category name must be at most 50 characters"),
});

export const updateCategorySchema = z.object({
    category: z.string().min(1, "Category name is required").max(50, "Category name must be at most 50 characters"),
});

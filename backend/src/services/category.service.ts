import { AppError } from "../errors/AppError";
import { categoryRepository } from "../repositories/category.repository";
import { CreateCategoryRequest, UpdateCategoryRequest } from "../types/category.types";

class CategoryService {
    async getAll() {
        return categoryRepository.findAll();
    }

    async getById(id: number) {
        const category = await categoryRepository.findById(id);
        
        if (!category) {
            throw new AppError("Category tidak ditemukan!",404);
        }

        return category;
    }

    async create(data: CreateCategoryRequest) {
        const exist = await categoryRepository.findByCategory(data.category);

        if(exist) {
            throw new AppError("Category sudah ada!",400);
        }

        return categoryRepository.create(data);
    }

    async update(id:number, data:UpdateCategoryRequest) {
        await this.getById(id);

        if (data.category) {
            const exist = await categoryRepository.findByCategory(data.category);
            
            if(exist && exist.id !== id) {
                throw new AppError("Category sudah ada!",409);
            }
        }

        return categoryRepository.update(id, data);
    }

    async delete(id:number) {
        await this.getById(id);

        return categoryRepository.softDelete(id)
    }

}

export const categoryService = new CategoryService();
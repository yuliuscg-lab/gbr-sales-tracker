import { AppError } from '../errors/AppError';
import { productRepository } from '../repositories/product.repository';
import { CreateProductDTO, UpdateProductDTO } from '../types/product.types';
import { generateProductCode } from '../utils/generateProductCode';

export class ProductService {
    async getAllProducts(search?: string) {
        return productRepository.findMany(search);
    }

    async getProductById(id: string) {
        const product = await productRepository.findById(id);
        if (!product) {
            throw new AppError('Product tidak ditemukan', 404);
        }
        return product;
    }

    async createProduct(data: CreateProductDTO) {
        const trimmedName = data.name.trim();
        const trimmedBaseUnit = data.baseUnit.trim();

        if (!trimmedName) throw new AppError('Nama produk wajib diisi', 400);
        if (!trimmedBaseUnit)
            throw new AppError('Satuan dasar (base unit) wajib diisi', 400);

        const costPrice = Number(data.costPrice ?? 0);
        if (isNaN(costPrice) || costPrice < 0) {
            throw new AppError('HPP (Harga Modal) tidak boleh negatif', 400);
        }

        // Auto-generate code jika tidak ada
        const code = data.code?.trim() || (await generateProductCode());

        const existingCode = await productRepository.findByCode(code);
        if (existingCode) {
            throw new AppError('Kode produk sudah digunakan', 409);
        }

        const existingName = await productRepository.findByName(trimmedName);
        if (existingName) {
            throw new AppError('Nama produk sudah terdaftar', 409);
        }

        return productRepository.create({
            code,
            name: trimmedName,
            baseUnit: trimmedBaseUnit,
            costPrice, // <-- Kirim ke repository
            additionalUnits: data.additionalUnits,
        });
    }

    async updateProduct(id: string, data: UpdateProductDTO) {
        const product = await productRepository.findById(id);
        if (!product) {
            throw new AppError('Produk tidak ditemukan', 404);
        }

        const updatePayload: UpdateProductDTO = {};

        if (data.name !== undefined) {
            const trimmedName = data.name.trim();
            if (!trimmedName)
                throw new AppError('Nama produk tidak boleh kosong', 400);

            const existing = await productRepository.findByName(trimmedName);
            if (existing && existing.id !== id) {
                throw new AppError(
                    'Nama produk sudah digunakan oleh produk lain',
                    409
                );
            }
            updatePayload.name = trimmedName;
        }

        if (data.baseUnit !== undefined) {
            const trimmedBaseUnit = data.baseUnit.trim();
            if (!trimmedBaseUnit)
                throw new AppError('Satuan dasar tidak boleh kosong', 400);
            updatePayload.baseUnit = trimmedBaseUnit;
        }

        if (data.costPrice !== undefined) {
            const costPrice = Number(data.costPrice);
            if (isNaN(costPrice) || costPrice < 0) {
                throw new AppError(
                    'HPP (Harga Modal) tidak boleh negatif',
                    400
                );
            }
            updatePayload.costPrice = costPrice; // <-- Kirim update HPP
        }

        if (data.additionalUnits !== undefined) {
            updatePayload.additionalUnits = data.additionalUnits;
        }

        return productRepository.update(id, updatePayload);
    }

    async deleteProduct(id: string) {
        const product = await productRepository.findById(id);
        if (!product) {
            throw new AppError('Product tidak ditemukan', 404);
        }
        return productRepository.delete(id);
    }
}

export const productService = new ProductService();

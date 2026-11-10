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
            isProductionItem: Boolean(data.isProductionItem),
            costPrice,
            additionalUnits: data.additionalUnits,
        });
    }

    async massCreateProducts(items: CreateProductDTO[]) {
        if (!items?.length) {
            throw new AppError('Daftar produk tidak boleh kosong', 400);
        }

        // 1. Validasi duplikasi internal file Excel
        const names = items.map((i) => i.name?.trim()).filter(Boolean);
        if (new Set(names.map((n) => n.toLowerCase())).size !== items.length) {
            throw new AppError(
                'Terdapat nama produk duplikat di dalam file',
                400
            );
        }

        // 2. Ambil prefix sequence kode produk terakhir sekaligus
        const baseCode = await generateProductCode(); // Misal: GBR0045
        const prefix = baseCode.slice(0, 3);
        const startSeq = parseInt(baseCode.slice(3), 10) || 1;

        // 3. Susun payload bersih dengan SKU berurutan
        const sanitizedItems = items.map((item, idx) => ({
            code: `${prefix}${String(startSeq + idx).padStart(4, '0')}`,
            name: item.name.trim(),
            baseUnit: item.baseUnit.trim(),
            costPrice: Math.max(0, Number(item.costPrice || 0)),
            additionalUnits: item.additionalUnits || [],
        }));

        return productRepository.createManyWithUnits(sanitizedItems);
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

        if (data.isProductionItem !== undefined) {
            updatePayload.isProductionItem = Boolean(data.isProductionItem);
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

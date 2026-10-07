import { AppError } from "../errors/AppError";
import { productRepository } from "../repositories/product.repository";
import { CreateProductDTO, UpdateProductDTO } from "../types/product.types";
import { generateProductCode } from "../utils/generateProductCode";

export class ProductService {
    async getAllProducts(search?:string) {
        return productRepository.findMany(search);
    }

    async getProductById(id:string) {
        const product = await productRepository.findById(id);
        if (!product) {
            throw new AppError("Product tidak ditemukan", 404);
        }
        return product;
    }

    async createProduct(data: CreateProductDTO) {
        const trimmedName = data.name.trim();
        const trimmedBaseUnit = data.baseUnit.trim();

        if (!trimmedName) throw new AppError("Nama produk wajib diisi", 400);
        if (!trimmedBaseUnit) throw new AppError("Unit Dasar wajib diisi", 400);

        if(data.basePrice < 0 || data.basePrice === undefined) throw new AppError("Harga dasar tidak boleh negatif", 400);

        const code = await generateProductCode();

        const existingName = await productRepository.findByName(trimmedName);
        
        if (existingName) throw new AppError("Nama produk sudah terdaftar",409);

        if(data.additionalUnits && data.additionalUnits.length > 0) {
            
            const unitNames = new Set<string>();
            unitNames.add(trimmedBaseUnit.toLocaleLowerCase());

            for(const unit of data.additionalUnits) {
                const uName = unit.unitName?.trim();

                if(!uName) throw new AppError("Nama satuan tidak boleh kosong!", 400);


                if (unitNames.has(uName.toLowerCase())) {
                    throw new AppError(`Satuan ${uName} sudah terdaftar`, 400);
                }

                unitNames.add(uName.toLowerCase());

                if(unit.conversionQty <= 1) {
                    throw new AppError(`Unit konversi ${unit.unitName} harus lebih dari 1`, 400);
                }

                if (unit.price < 0) {
                    throw new AppError(`Harga untuk satuan ${unit.unitName} tidak boleh negatif`, 400);
                }
            }
        }
        
        return productRepository.create({
            code,
            name: trimmedName,
            baseUnit: trimmedBaseUnit,
            basePrice: data.basePrice,
            additionalUnits: data.additionalUnits?.map((unit)=> ({
                unitName: unit.unitName.trim(),
                conversionQty: unit.conversionQty,
                price: unit.price,
            })),
        });
    }

    async updateProduct (id: string, data: UpdateProductDTO) {
        const product = await productRepository.findById(id);
        if(!product) {
            throw new AppError("Product tidak ditemukan", 404);
        }

        if (data.name !== undefined) {
            const trimmedName = data.name.trim();

            if (!trimmedName) throw new AppError("Nama produk wajib diisi",400);

            const existing = await productRepository.findByName(trimmedName);
            if (existing && existing.id !== id) {
                throw new AppError("Nama produk sudah digunakan", 409);
            }
            data.name = trimmedName;
        }

        if (data.baseUnit !== undefined) {
            const trimmedBaseUnit = data.baseUnit.trim();
            if (!trimmedBaseUnit) throw new AppError ("Base unit tidak boleh kosong", 400);
            data.baseUnit = trimmedBaseUnit;
        }

        if (data.basePrice !== undefined) {
            if (data.basePrice < 0 || isNaN(data.basePrice)) throw new AppError("Harga dasar tidak valid",400)
        }

        if (data.additionalUnits !== undefined) {
            const effectiveBaseUnit = (data.baseUnit ?? product.baseUnit).toLowerCase();
            const unitNames = new Set<string>();
            unitNames.add(effectiveBaseUnit);

            for (const unit of data.additionalUnits) {
                const uName = unit.unitName?.trim();
                if (!uName) {
                    throw new AppError("Nama satuan tambahan wajib diisi", 400);
                }

                const lowerUName = uName.toLowerCase();
                if (unitNames.has(lowerUName)) {
                    throw new AppError(`Satuan '${uName}' terduplikasi atau sama dengan Base Unit`, 400);
                }
                unitNames.add(lowerUName);

                if (unit.conversionQty === undefined || unit.conversionQty <= 1) {
                    throw new AppError(`Faktor konversi untuk satuan '${uName}' harus lebih besar dari 1`,400);
                }

                if (unit.price === undefined || unit.price < 0) {
                    throw new AppError(`Harga untuk satuan '${uName}' tidak boleh negatif`, 400);
                }

                unit.unitName = uName;
                unit.conversionQty = unit.conversionQty;
                unit.price = unit.price;
            }
        }

        return productRepository.update(id,data);
    }

    async deleteProduct(id:string) {
        const product = await productRepository.findById(id);
        if(!product) {
            throw new AppError("Product tidak ditemukan", 404);
        }
        return productRepository.delete(id);
    }
}

export const productService = new ProductService();
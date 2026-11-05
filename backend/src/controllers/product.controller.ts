import { Request, Response } from 'express';
import { productService } from '../services/product.service';
import { success } from '../utils/response';

export class ProductController {
    async getAll(req: Request, res: Response) {
        const search = req.query.search as string | undefined;

        const products = await productService.getAllProducts(search);

        return success(res, 200, 'Berhasil mengambil data produk', products);
    }

    async getById(req: Request, res: Response) {
        const { id } = req.params;
        const product = await productService.getProductById(id.toString());
        return success(res, 200, 'Berhasil mengambil data produk', product);
    }

    async create(req: Request, res: Response) {
        const { code, name, baseUnit, costPrice, additionalUnits } = req.body;

        const newProduct = await productService.createProduct({
            code,
            name,
            baseUnit,
            costPrice: costPrice !== undefined ? Number(costPrice) : 0, // <-- Konversi number
            additionalUnits,
        });

        return success(res, 201, 'Produk berhasil ditambahkan', newProduct);
    }

    async massUpload(req: Request, res: Response) {
        const { products } = req.body;

        if (!Array.isArray(products)) {
            return res.status(400).json({
                success: false,
                message: "Payload harus berupa array 'products'",
            });
        }

        const created = await productService.massCreateProducts(products);

        return success(
            res,
            201,
            `${created.length} produk berhasil ditambahkan secara massal`,
            created
        );
    }

    async update(req: Request, res: Response) {
        const { id } = req.params;
        const { name, baseUnit, costPrice, additionalUnits } = req.body;

        const updatedProduct = await productService.updateProduct(
            id.toString(),
            {
                name,
                baseUnit,
                costPrice:
                    costPrice !== undefined ? Number(costPrice) : undefined, // <-- Konversi number jika ada
                additionalUnits,
            }
        );

        return success(res, 200, 'Produk berhasil diperbarui', updatedProduct);
    }

    async delete(req: Request, res: Response) {
        const { id } = req.params;
        await productService.deleteProduct(id.toString());
        return success(res, 200, 'Produk berhasil dihapus');
    }
}

export const productController = new ProductController();

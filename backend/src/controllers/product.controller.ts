import { Request, Response } from "express";
import { productService } from "../services/product.service";
import { success } from "../utils/response";

export class ProductController {
    async getAll(req:Request, res:Response) {
        const search = req.query.search as string | undefined;

        const products = await productService.getAllProducts(search);

        return success(
            res,
            200,
            "Berhasil mengambil data produk",
            products
        )
    }

    async getById(req:Request, res:Response) {
        const { id } = req.params;
        const product = await productService.getProductById(id.toString());
        return success(
            res,
            200,
            "Berhasil mengambil data produk",
            product
        )
    }

    async create(req:Request, res:Response) {
        const  { code, name, baseUnit, basePrice, additionalUnits } = req.body;

        const newProduct = await productService.createProduct({
            code,
            name,
            baseUnit,
            basePrice: Number(basePrice),
            additionalUnits: Array.isArray(additionalUnits) ?
            additionalUnits.map((u:any)=> ({
                unitName: String(u.unitName || ""),
                conversionQty: Number(u.conversionQty),
                price: Number(u.price)
            }))
            : undefined
        });

        return success (
            res,
            201,
            "Produk berhasil didaftarkan!",
            newProduct
        );
    }

    async update(req: Request, res: Response) {
        const {id} = req.params;
        const { name, baseUnit, basePrice, additionalUnits } = req.body;

        const updatedProduct = await productService.updateProduct(id.toString(), {
            name,
            baseUnit,
            basePrice: basePrice!== undefined?Number(basePrice):undefined,
            additionalUnits: Array.isArray(additionalUnits) ?
            additionalUnits.map((u:any)=> ({
                unitName: String(u.unitName || ""),
                conversionQty: Number(u.conversionQty),
                price: Number(u.price)
            }))
            : undefined
        });

        return success (
            res,
            200,
            "Produk berhasil di-update!",
            updatedProduct
        )
    }

    async delete (req: Request, res: Response) {
        const { id } = req.params;
        await productService.deleteProduct(id.toString());
        return success(
            res,
            200,
            "Produk berhasil dihapus"
        );
    }
}

export const productController = new ProductController();
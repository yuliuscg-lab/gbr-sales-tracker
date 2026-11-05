import { Request, Response } from "express";
import { priceMatrixService } from "../services/priceMatrix.service";
import { success } from "../utils/response";

export class PriceMatrixController {
    async getMatrix(req:Request, res: Response) {
        const { customerId } = req.params;
        const matrix = await priceMatrixService.getCustomerMatrix(customerId.toString());
        return success (
            res,
            200,
            "Berhasil memuat matrix harga",
            matrix
        );
    }

    async lookUp(req: Request, res:Response) {
        const { customerId, productUnitId } = req.query;
        const result = await priceMatrixService.getPriceLookup(
            customerId as string,
            productUnitId as string
        );
        return success (
            res,
            200,
            "Berhasil lookup harga customer",
            result
        );
    }

    async update(req:Request, res: Response){
        const { customerId } = req.params;
        const { prices } = req.body;

        await priceMatrixService.updateCustomerMatrix(customerId.toString(), prices);

        return success(
            res,
            200,
            "Matrix harga berhasil diperbarui"
        );
    }
}

export const priceMatrixController = new PriceMatrixController();
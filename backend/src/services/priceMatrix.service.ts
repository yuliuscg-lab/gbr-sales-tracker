import { prisma } from "../config/prisma";
import { AppError } from "../errors/AppError";
import { customerRepository } from "../repositories/customer.repository";
import { priceMatrixRepository } from "../repositories/priceMatrix.repository";

export class PriceMatrixService {
    async getCustomerMatrix(customerId:string) {
        const customer = await customerRepository.findById(customerId);
        if(!customer) {
            throw new AppError("Customer tidak ditemukan", 404);
        }
        return priceMatrixRepository.getMatrixByCustomerId(customerId);
    }

    async getPriceLookup(customerId:string, productUnitId:string) {
        const record = await priceMatrixRepository.findCustomerPrice(customerId, productUnitId);
        return { price: record? record.price: null};
    }

    async updateCustomerMatrix(
        customerId:string,
        prices: { 
            productUnitId:string;
            price:number}[]
    ) {
        const customer = await customerRepository.findById(customerId);
        if(!customer) {
            throw new AppError("Customer tidak ditemukan", 404);
        }

        const validPrices = prices.filter((p)=> p.price >= 0);
        return priceMatrixRepository.updateMatrix(customerId,validPrices);
    }
}

export const priceMatrixService = new PriceMatrixService();
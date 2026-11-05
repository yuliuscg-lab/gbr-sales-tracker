import { MatrixProductItem, MatrixUpdatePayload } from "@/types/priceMatrix.type";
import { api } from "./client";

export const priceMatrixApi = {
    async getByCustomerId(customerId:string): Promise<MatrixProductItem[]> {
        const res = await api.get<{ success: boolean; data: MatrixProductItem[]}>(`/price-matrix/${customerId}`);
        return res.data.data;
    },

    async updateMatrix(customerId:string, payload:MatrixUpdatePayload):Promise<void> {
        await api.put(`/price-matrix/${customerId}`,payload);
    }
};
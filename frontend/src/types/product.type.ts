
export interface ProductUnit {
    id: string;
    productId: string;
    unitName: string;
    conversionQty: number;
}

export interface Product {
    id: string;
    code: string;
    name: string;
    baseUnit: string;
    units: ProductUnit[];
    createdAt: string;
    updatedAt: string;
}
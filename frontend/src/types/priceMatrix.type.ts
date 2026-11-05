export interface MatrixUnitItem {
    productUnitId: string;
    unitName: string;
    conversionQty: number;
    price: number | null;
}

export interface MatrixProductItem {
    productId: string;
    code: string;
    name: string;
    baseUnit: string;
    costPrice?: number;
    units: MatrixUnitItem[];
}

export interface MatrixUpdatePayload {
    prices: {
        productUnitId: string;
        price: number;
    }[];
}
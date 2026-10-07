
export interface CreateProductUnitDTO {
    unitName: string;
    conversionQty: number;
    price: number;
}

export interface UpdateProductUnitDTO {
    unitName?: string;
    conversionQty?: number;
    price?: number;
}


export interface CreateProductDTO {
    code: string;
    name: string;
    baseUnit: string;
    basePrice: number;
    additionalUnits?: CreateProductUnitDTO[];
}

export interface UpdateProductDTO {
    name?: string;
    baseUnit?: string;
    basePrice?: number;
    additionalUnits?: UpdateProductUnitDTO[];
}
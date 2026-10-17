
export interface CreateProductUnitDTO {
    unitName: string;
    conversionQty: number;
}

export interface UpdateProductUnitDTO {
    unitName?: string;
    conversionQty?: number;
}


export interface CreateProductDTO {
    code: string;
    name: string;
    baseUnit: string;
    additionalUnits?: CreateProductUnitDTO[];
}

export interface UpdateProductDTO {
    name?: string;
    baseUnit?: string;
    additionalUnits?: UpdateProductUnitDTO[];
}
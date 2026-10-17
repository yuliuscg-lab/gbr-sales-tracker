export interface MatrixPriceItem {
    productUnitId:string;
    price:number;
}

export interface UpdatePriceMatrixDTO {
    prices: MatrixPriceItem[]
}
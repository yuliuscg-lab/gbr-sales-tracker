export interface CreateCustomerDTO {
    name: string;
    phone?:string|null;
    notes?:string|null;
    totalOrders:number;
    unpaidOrdersCount:number;
}

export interface UpdateCustomerDTO {
    name?:string;
    phone?:string|null;
    notes?:string|null;
}
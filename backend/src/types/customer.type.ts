export interface CreateCustomerDTO {
    name: string;
    phone?:string|null;
    notes?:string|null;
    maxUnpaidOrders?:number;
}

export interface UpdateCustomerDTO {
    name?:string;
    phone?:string|null;
    notes?:string|null;
    maxUnpaidOrders?:number;
    numOrders?:number;
}
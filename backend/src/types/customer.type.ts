export interface CreateCustomerDTO {
    name: string;
    phone?:string|null;
    notes?:string|null;
    maxUnpaidInvoices?:number;
}

export interface UpdateCustomerDTO {
    name?:string;
    phone?:string|null;
    notes?:string|null;
    maxUnpaidInvoices?:number;
}
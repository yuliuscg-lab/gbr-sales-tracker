export interface CreateCustomerDTO {
    name: string;
    phone?:string|null;
    notes?:string|null;
}

export interface UpdateCustomerDTO {
    name?:string;
    phone?:string|null;
    notes?:string|null;
}
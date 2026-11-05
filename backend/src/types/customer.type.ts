export interface CreateCustomerDTO {
    name: string;
    phone?:string|null;
    notes?:string|null;
    totalOrders:number;
    unpaidOrdersCount:number;
    address?:string|null;
    subdistrict?:string|null;
    district?:string|null;
    city?:string|null;
    province?:string|null;
    mapsUrl?:string|null;
}

export interface UpdateCustomerDTO {
    name?:string;
    phone?:string|null;
    notes?:string|null;
    address?:string|null;
    subdistrict?:string|null;
    district?:string|null;
    city?:string|null;
    province?:string|null;
    mapsUrl?:string|null;
}

export interface Customer {
    id: string;
    name: string;
    phone?: string;
    notes?: string;
    totalOrders: number;
    unpaidOrdersCount: number;
    createdAt: string;
    updatedAt: string;
}
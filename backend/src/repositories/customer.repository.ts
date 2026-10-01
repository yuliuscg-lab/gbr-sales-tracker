import { prisma } from "../config/prisma";
import { CreateCustomerDTO, UpdateCustomerDTO } from "../types/customer.type";

export class CustomerRepository {
    async findMany(search?:string) {
        return prisma.customer.findMany({
            where:search ? {
                OR:[
                    {name:{contains:search, mode:"insensitive"}},
                    {phone:{contains:search, mode:"insensitive"}},
                ],
            } : undefined,
            orderBy: { createdAt:"desc"}
        });
    }

    async findById(id:string) {
        return prisma.customer.findUnique({
            where: { id },
            include: {
                invoices:{
                    select: {
                        id: true,
                        invoiceNo: true,
                        totalAmount:true,
                        paidAmount:true,
                        status: true,
                        dueDate: true,
                        createdAt: true
                    },
                    orderBy: {invoiceDate: "desc"}
                },
            },
        });
    }

    findByName(name:string) {
        return prisma.customer.findFirst({
            where: { name:{equals: name, mode: "insensitive"}},
        });
    }

    async create(data: CreateCustomerDTO) {
        return prisma.customer.create({
            data,
        });
    }

    async update (id:string, data:UpdateCustomerDTO) {
        return prisma.customer.update({
            where: {id},
            data,
        });
    }

    async delete(id:string) {
        return prisma.customer.update({
            where: {id},
            data: { deletedAt: new Date()}
        })
    }
}

export const customerRepository = new CustomerRepository();
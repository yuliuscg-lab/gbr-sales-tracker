import { OrderStatus, Prisma, PrismaClient } from "@prisma/client";
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
                orders:{
                    select: {
                        id: true,
                        orderNo: true,
                        totalAmount:true,
                        paidAmount:true,
                        status: true,
                        dueDate: true,
                        createdAt: true
                    },
                    orderBy: {orderDate: "desc"}
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

    async calculateNumOrders(customerId:string, tx?: Prisma.TransactionClient):Promise<number> {
        const client = tx || prisma;
        const activeOrderCount = await client.order.count({
            where : {
                customerId,
                status: {
                    in: [OrderStatus.UNPAID, OrderStatus.PARTIALLY_PAID]
                },
            },
        });

        await client.customer.update({
            where: { id : customerId },
            data: { numOrders: activeOrderCount}
        })
        return activeOrderCount;
    }
    
    async delete(id:string) {
        return prisma.customer.update({
            where: {id},
            data: { deletedAt: new Date()}
        })
    }
}

export const customerRepository = new CustomerRepository();
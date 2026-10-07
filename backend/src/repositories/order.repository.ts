import { OrderStatus, Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { CreateOrderDTO, UpdateOrderDTO } from "../types/order.type";


export class OrderRepository {

    async findMany(filters?: {
        customerId?: string;
        status?: OrderStatus;
        search?: string;
    }) {
        const where: Prisma.OrderWhereInput = {};

        if(filters?.customerId) {
            where.customerId = filters.customerId;
        }
        if(filters?.status) {
            where.status = filters.status;
        }
        if(filters?.search) {
            where.OR = [
                {
                    orderNo: {
                        contains: filters.search,
                        mode:"insensitive"
                    }
                },
                {
                    customer: {
                        name: {
                            contains: filters.search,
                            mode: "insensitive"
                        }
                    }
                }
            ];
        }

        return prisma.order.findMany({
            where,
            include: {
                customer: {
                    select: {
                        id: true, name: true, phone: true
                    },
                },
                items: true,
                payments : {
                    orderBy: { paymentDate: "desc" },
                },
            },
            orderBy: {
                createdAt: "desc"
            }
        });
    }
    async findById(id:string) {
        return prisma.order.findUnique({
            where:{id},
            include: {
                customer: true,
                items : true,
                payments : {
                    orderBy : { paymentDate : "desc"},
                },
            },
        });
    }

    async findByOrderNo(orderNo:string) {
        return prisma.order.findUnique({
            where : { orderNo }
        });
    }

    async create (data: CreateOrderDTO) {
        return prisma.order.create ({
            data: {
                customerId: data.customerId,
                orderNo: data.orderNo,
                totalAmount: data.totalAmount,
                paidAmount: data.paidAmount,
                status: data.status || OrderStatus.UNPAID,
                dueDate: data.dueDate,
                notes: data.notes,
                items: {
                    create: data.items.map((item) => ({
                        productId: item.productId,
                        name: item.name,
                        unitName: item.unitName,
                        conversionQty: item.conversionQty,
                        baseQty: item.baseQty,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        subTotal: item.subTotal,
                    })),
                },
            },
            include: {
                customer:true,
                items:true,
            },
        });
    }

    async update(id:string, data: UpdateOrderDTO) {
        return prisma.order.update({
            where: {id},
            data,
            include: {
                customer:true,
                items:true,
                payments:true
            },
        });
    }

    async cancel(id: string, reason?:string) {
        return prisma.order.update({
            where: {id},
            data: {
                status: OrderStatus.CANCELLED,
                cancelReason: reason,
                cancelledAt: new Date()
            },
            include:{
                customer:{
                    select: {id: true, name:true, phone:true},
                },
                items:true,
            },
        });
    }

}

export const orderRepository = new OrderRepository();
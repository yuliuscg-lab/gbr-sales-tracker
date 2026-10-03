import { InvoiceStatus, Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { CreateInvoiceDTO, UpdateInvoiceDTO } from "../types/invoice.type";

export class InvoiceRepository {

    async findMany(filters?: {
        customerId?: string;
        status?: InvoiceStatus;
        search?: string;
    }) {
        const where: Prisma.InvoiceWhereInput = {};

        if(filters?.customerId) {
            where.customerId = filters.customerId;
        }
        if(filters?.status) {
            where.status = filters.status;
        }
        if(filters?.search) {
            where.OR = [
                {
                    invoiceNo: {
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

        return prisma.invoice.findMany({
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
        return prisma.invoice.findUnique({
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

    async findByInvoiceNo(invoiceNo:string) {
        return prisma.invoice.findUnique({
            where : { invoiceNo }
        });
    }

    async create (data: CreateInvoiceDTO) {
        return prisma.invoice.create ({
            data: {
                customerId: data.customerId,
                invoiceNo: data.invoiceNo,
                totalAmount: data.totalAmount,
                paidAmount: data.paidAmount,
                status: data.status || InvoiceStatus.UNPAID,
                dueDate: data.dueDate,
                notes: data.notes,
                items: {
                    create: data.items.map((item) => ({
                        name: item.name,
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

    async update(id:string, data: UpdateInvoiceDTO) {
        return prisma.invoice.update({
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
        return prisma.invoice.update({
            where: {id},
            data: {
                status: InvoiceStatus.CANCELLED,
                cancelReason: reason || "Invoice was cancelled",
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

export const invoiceRepository = new InvoiceRepository();
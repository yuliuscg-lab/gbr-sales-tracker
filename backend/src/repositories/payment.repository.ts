import { OrderStatus, Prisma } from "@prisma/client";
import { CreatePaymentDTO, PaymentFilterDTO } from "../types/payment.type";
import { prisma } from "../config/prisma";
import { customerRepository } from "./customer.repository";

export class PaymentRepository {
    async findMany(filters?: PaymentFilterDTO) {
        const where: Prisma.PaymentWhereInput = {};

        if (filters?.orderId) {
            where.orderId = filters.orderId;
        }

        if(filters?.paymentMethod) {
            where.paymentMethod = filters.paymentMethod;
        }

        if(filters?.startDate || filters?.endDate) {
            where.paymentDate = {};
            if (filters.startDate) {
                where.paymentDate.gte = new Date(filters.startDate);
            }

            if(filters.endDate) {
                where.paymentDate.lte = new Date(filters.endDate);
            }
        }

        return prisma.payment.findMany({
            where,
            include: {
                order: {
                    select: {
                        id: true,
                        orderNo: true,
                        totalAmount: true,
                        paidAmount: true,
                        status: true,
                        customer: {
                            select: {id:true, name:true,phone:true},
                        },
                    },
                },
            },
            orderBy: {
                paymentDate: 'desc',
            },
        });
    }

    async findById(id: string) {
        return prisma.payment.findUnique({
            where: { id, deletedAt:null },
            include: {
                order: {
                    include: {
                        customer: true,
                    },
                },
            },
        });
    }

    async create (
        paymentData: CreatePaymentDTO,
        tx?: Prisma.TransactionClient
    ) {
        return prisma.$transaction(async(tx)=> {
            const client = tx || prisma;
            return client.payment.create({
                data: {
                    orderId: paymentData.orderId,
                    amount: paymentData.amount,
                    paymentMethod: paymentData.paymentMethod,
                    paymentDate: new Date(paymentData.paymentDate),
                    notes: paymentData.notes?.trim() || null,
                    receiptNo: paymentData.receiptNo?.trim() || null,
                },
            });
        });
    }

    async delete(
        id: string,
        tx?: Prisma.TransactionClient
    ) {
        const client = tx || prisma;
        return client.payment.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
    }
}

export const paymentRepository = new PaymentRepository();
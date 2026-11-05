import { OrderStatus, PaymentMethod } from "@prisma/client";
import { AppError } from "../errors/AppError";
import { paymentRepository } from "../repositories/payment.repository";
import { CreatePaymentDTO, PaymentFilterDTO } from "../types/payment.type";
import { orderRepository } from "../repositories/order.repository";
import { prisma } from "../config/prisma";
import { customerRepository } from "../repositories/customer.repository";
import { generateReceiptNo } from "../utils/generateReceiptNo";

export class PaymentService {
    async getAllPayments (filters?: PaymentFilterDTO) {
        return paymentRepository.findMany(filters);
    }

    async getPaymentById (id: string) {
        const payment = await paymentRepository.findById(id);
        if (!payment) throw new AppError("Pembayaran tidak ditemukan",404);

        const formattedOrder = {
            id: payment.order.id,
            orderNo: payment.order.orderNo,
            orderDate: payment.order.orderDate || payment.order.createdAt,
            deliveryDate: payment.order.deliveryDate,
            deliveryFee: Number(payment.order.deliveryFee || 0),
            dueDate: payment.order.dueDate,
            totalAmount: Number(payment.order.totalAmount),
            paidAmount: Number(payment.order.paidAmount),
            status: payment.order.status,
            notes: payment.order.notes,
            cancelReason: payment.order.cancelReason,
            cancelledAt: payment.order.cancelledAt,
            deliveryStatus: payment.order.deliveryStatus,
            items: payment.order.items,
            payments: payment
        }
        return {
            ...payment,
        order:formattedOrder};
    }

    async createPayment(data: CreatePaymentDTO) {
        const amount = Number(data.amount);
        if(isNaN(amount) || amount <= 0) {
            throw new AppError("Nominal pembayaran harus berupa angka lebih dari 0!", 400);
        }

        const method = data.paymentMethod?.toUpperCase() as PaymentMethod;
        if(!Object.values(PaymentMethod).includes(method)) {
            throw new AppError("Metode pembayaran tidak valid!",400);
        }
        
        if (!data.paymentDate) {
            throw new AppError("Tanggal pembayaran wajib diisi!", 400);
        }

        const order = await orderRepository.findById(data.orderId);

        if(!order) {
            throw new AppError("Order tidak ditemukan",404);
        }

        if (order.status === OrderStatus.CANCELLED) {
            throw new AppError("Tidak dapat mencatat pembayaran pada order yang telah dibatalkan", 400);
        }

        if (order.status === OrderStatus.PAID) {
            throw new AppError("Order ini sudah lunas", 400);
        }

        const currentTotal = Number(order.totalAmount);
        const currentPaid = Number(order.paidAmount);
        const remaining = currentTotal - currentPaid;

        if (amount > remaining) {
            throw new AppError(`Pembayaran melebihi sisa tagihan. Sisa tagihan adalah Rp ${remaining.toLocaleString('id-ID')}`, 400);
        }

        const newPaidAmount = currentPaid + amount;
        const newStatus = newPaidAmount >= currentTotal ? OrderStatus.PAID : OrderStatus.PARTIALLY_PAID;
        const receiptNo = await generateReceiptNo();

        return prisma.$transaction(async (tx)=> {
            const payment = await paymentRepository.create({...data, paymentMethod: method, receiptNo }, tx);

            await tx.order.update({
                where: {
                    id: order.id
                },
                data: {
                    paidAmount: newPaidAmount,
                    status: newStatus
                }
            });

            await customerRepository.syncOrderMetrics(order.customerId, tx);

            return payment;
        });
    }

    async deletePayment(id:string) {
        const payment = await paymentRepository.findById(id.toString());
        if(!payment) {
            throw new AppError("Data pembayaran tidak ditemukan!",404);
        }

        const order = payment.order;
        if(!order) {
            throw new AppError("Order tidak ditemukan",404);
        }

        const paymentAmount = Number(payment.amount);
        const currentPaid = Number(order.paidAmount);
        const updatedPaid = Math.max(0, currentPaid - paymentAmount);

        let updatedStatus:OrderStatus = OrderStatus.PARTIALLY_PAID;
        if(updatedPaid === 0) {
            updatedStatus = OrderStatus.UNPAID;
        }

        return prisma.$transaction(async (tx) => {

            await paymentRepository.delete(id, tx);
            
            await tx.order.update({
                where: { id: order.id },
                data: {
                    paidAmount: updatedPaid,
                    status: updatedStatus
                }
            });

            await customerRepository.syncOrderMetrics(order.customerId, tx);
        })
    }
}

export const paymentService = new PaymentService();
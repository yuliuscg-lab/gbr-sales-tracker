import { PaymentStatus, SalesOrderStatus } from "@prisma/client";
import { prisma } from "../config/prisma";
import { AppError } from "../errors/AppError";
import { paymentRepository } from "../repositories/payment.repository";
import { UploadPaymentProof } from "../types/payment.types";
import { salesOrderRepository } from "../repositories/sales-order.repository";
import { couponService } from "./coupon.service";
import { pointService } from "./point.service";
import { pointsBucketRepository } from "../repositories/points-bucket.repository";
import { salesOrderService, SalesOrderService } from "./sales-order.service";
import { issuedTicketService } from "./issued-ticket.service";

interface CancelResult {
    salesOrderId: string;
    ok: boolean;
    error?: string;
}

class PaymentService {
    async uploadProof(customerId:string, payload:UploadPaymentProof){
        
        const payment = await paymentRepository.findById(
            prisma,
            payload.paymentId,
        );

        if(!payment) {
            throw new AppError(
                "Payment tidak ditemukan!",
                404
            );
        }

        if (
            payment.salesOrder.customerId !== customerId
        ) {
            throw new AppError("Pembayaran tidak ditemukan!", 404);
        }

        if (payment.status !== PaymentStatus.WAITING_UPLOAD) {
            throw new AppError("Bukti pembayaran sudah pernah diupload", 400);
        }

        if (payment.expiredAt < new Date() && payment.status === PaymentStatus.WAITING_UPLOAD) {
            await this.expireOrder(payment.id);
            throw new AppError("Pembayaran telah kadaluwarsa!", 400);
        }

        return paymentRepository.update(prisma, payment.id, {
            paymentProof: payload.paymentProof,
            paidAt: new Date(),
            status: PaymentStatus.WAITING_VERIFICATION
        });
    }

    async verifyPayment(adminId:string, paymentId:string) {
        const payment = await paymentRepository.findById(
            prisma,
            paymentId,
        );

        if (!payment) {
            throw new AppError("Pembayaran tidak ditemukan!", 404);
        }

        if (payment.status !== PaymentStatus.WAITING_VERIFICATION) {
            throw new AppError("Pembayaran sudah diverifikasi", 400);
        }

        return prisma.$transaction(async(tx) => {
            const verifiedPayment = await paymentRepository.update(
                tx, payment.id,
                {
                    status: PaymentStatus.VERIFIED,
                    verifiedBy: {
                        connect: {
                            id: adminId,
                        },
                    },
                    verifiedAt: new Date(),
                },
            );

            const salesOrder = await salesOrderRepository.update(tx, payment.salesOrder.id, {
                status: SalesOrderStatus.PAID
            });

            if (salesOrder.couponId) {
                await couponService.confirmCoupon(tx, salesOrder.couponId, salesOrder.id);
            }

            if (salesOrder.pointsUsed > 0) {
                await pointService.consumePoint(
                    tx,
                    salesOrder.customerId,
                    salesOrder.id,
                );
            }

            await issuedTicketService.issueTickets(tx, {
                id:salesOrder.id,
                ticketTypeId:salesOrder.ticketTypeId,
                ticketName: salesOrder.ticketName,
                ticketPrice: salesOrder.ticketPrice,
                qtyTickets:salesOrder.qtyTickets
            });

            return salesOrder;
        });
    }

    async rejectPayment(adminId:string, paymentId:string, reason?:string) {
        const payment = await paymentRepository.findById(prisma, paymentId);

        if (!payment) {
            throw new AppError("Pembayaran tidak ditemukan!", 404);
        }

        if (payment.status !== PaymentStatus.WAITING_VERIFICATION) {
            throw new AppError("Pembayaran tidak dapat ditolak!", 400);
        }

        return prisma.$transaction(async(tx) => {
            await paymentRepository.update(tx, payment.id, {
                status: PaymentStatus.REJECTED,
                verifiedBy: {
                    connect: {
                        id: adminId,
                    },
                },
                verifiedAt: new Date(),
                rejectReason: reason,
            });

            const salesOrder = await salesOrderRepository.findById(tx, payment.salesOrder.id);
            
            if(!salesOrder) {
                throw new AppError("Sales Order tidak ditemukan",404);
            }

            const updatedSalesOrder = await salesOrderService.releaseOrder(tx, salesOrder);

            return updatedSalesOrder;
        });
    }

    private async expireOrder(paymentId: string) {
        return prisma.$transaction(async(tx) => {
            const payment = await paymentRepository.update(tx, paymentId, {
                status: PaymentStatus.EXPIRED,
            });

            const salesOrder = await salesOrderRepository.findById(tx, payment.salesOrderId);

            if(!salesOrder || salesOrder.status !== SalesOrderStatus.WAITING_PAYMENT) {
                return;
            }

            await salesOrderService.releaseOrder(tx, salesOrder);
        })
    }
    async cancelExpiredOrders() {
        const expiredPayments = await paymentRepository.findExpiredWaitingUpload(prisma);

        const results : CancelResult[] = [];

        for (const payment of expiredPayments) {
            try {
                await prisma.$transaction(async(tx)=> {
                    await paymentRepository.update(tx, payment.id, {
                        status: PaymentStatus.EXPIRED,
                    });

                    const salesOrder = await salesOrderRepository.findById(tx, payment.salesOrderId);

                    if(!salesOrder) {
                        throw new AppError("Sales Order tidak ditemukan!", 404);
                    }

                    await salesOrderService.releaseOrder(tx, salesOrder);
                });

                results.push({ salesOrderId: payment.salesOrder.id, ok: true});
            } catch (err) {
                results.push({
                    salesOrderId: payment.salesOrder.id,
                    ok: false,
                    error: err instanceof Error ? err.message:"Unknown error"
                });
            }
        }
        return results;
    }
}

export const paymentService = new PaymentService();

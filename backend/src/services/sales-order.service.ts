import { Role, SalesOrderStatus } from "@prisma/client";
import { prisma } from "../config/prisma";
import { AppError } from "../errors/AppError";
import { eventRepository } from "../repositories/event.repository";
import { paymentRepository } from "../repositories/payment.repository";
import { salesOrderRepository } from "../repositories/sales-order.repository";
import { ticketTypeRepository } from "../repositories/ticket-type.repository";
import { CheckoutCalculation, CheckoutOrder } from "../types/checkout.types";
import { generateInvoiceNumber } from "../utils/generateInvoice";
import { generatePaymentExpiredAt } from "../utils/paymentExpired.utils";
import { couponService } from "./coupon.service";
import { pointService, PointValidationResult } from "./point.service";
import { DB } from "../types/database.types";

export class SalesOrderService {
    
    async findByCustomer(customerId:string) {
        return salesOrderRepository.findByCustomer(prisma, customerId);
    }

    async getById(userId: string, role:Role, id:string) {
        const salesOrder = await salesOrderRepository.findById(prisma, id);

        if (!salesOrder) {
            throw new AppError("Order tidak ditemukan!", 404);
        }

        if (role !== Role.ADMIN && salesOrder.customerId !== userId) {
            throw new AppError("Anda tidak diizinkan melihat order ini", 403);
        }

        return salesOrder;
    }

    private async validateCheckout(
        eventId:string,
        ticketTypeId: number,
        qtyTickets: number,
    ) {
        if (qtyTickets <= 0) {
            throw new AppError("Jumlah tiket harus lebih dari 0!", 400);
        }

        const event = await eventRepository.findById(eventId);

        if(!event) {
            throw new AppError("Event tidak ditemukan!", 404);
        }

        const ticketType = await ticketTypeRepository.findById(ticketTypeId);

        if(!ticketType) {
            throw new AppError("Ticket Type tidak ditemukan!", 404);
        }

        if (ticketType.eventId !== eventId) {
            throw new AppError("Ticket Type tidak sesuai dengan event!", 400);
        }

        if (event.deletedAt) {
            throw new AppError("Event sudah tidak tersedia!", 400);
        }

        if (ticketType.deletedAt) {
            throw new AppError("Ticket Type sudah tidak tersedia!", 400);
        }

        const available = ticketType.quota - (ticketType.sold ?? 0);

        if (available < qtyTickets) {
            throw new AppError("Kuota tidak mencukupi!", 400);
        }

        return {
            event, ticketType
        }
    }

    private async calculatePrice(
        customerId:string,
        ticketPrice:number,
        qtyTickets:number,
        couponCode?:string,
        usePoint?:boolean
    ):Promise<CheckoutCalculation> {
        const subtotal = ticketPrice * qtyTickets;

        let couponId: number | undefined;
        let couponDiscount = 0;
        let pointUsed = 0;

        let pointValidation: PointValidationResult = {
            pointUsed: 0,
            paymentAmount: 0,
            buckets: [],
        };

        if (couponCode) {
            const coupon = await couponService.validateCoupon(customerId, couponCode,subtotal);
            
            couponId = coupon.coupon.id;
            couponDiscount = coupon.discountAmount;
        }

        const afterCoupon = subtotal - couponDiscount;

        if (usePoint) {
            pointValidation = await pointService.validatePointUsage(customerId, afterCoupon);

            pointUsed = pointValidation.pointUsed;
        }

        const finalPrice = afterCoupon - pointUsed;

        return {
            subtotal, couponId, couponCode, couponDiscount, pointUsed, finalPrice,
            pointValidation
        };
    }

    async calculateOrder(customerId: string, payload: { eventId: string; ticketTypeId: number; qtyTickets: number; couponCode?: string; usePoint?: boolean }) {
        const { ticketType } = await this.validateCheckout(
            payload.eventId,
            payload.ticketTypeId,
            payload.qtyTickets
        );

        const calculation = await this.calculatePrice(
            customerId,
            ticketType.price,
            payload.qtyTickets,
            payload.couponCode,
            payload.usePoint
        );

        return {
            subtotal: calculation.subtotal,
            couponId: calculation.couponId,
            couponCode: calculation.couponCode,
            couponDiscount: calculation.couponDiscount,
            pointUsed: calculation.pointUsed,
            finalPrice: calculation.finalPrice
        };
    }

    async checkout(customerId:string, payload:CheckoutOrder) {
        const { event, ticketType } = await this.validateCheckout(
            payload.eventId, 
            payload.ticketTypeId, 
            payload.qtyTickets
        );

        const calculation = await this.calculatePrice(
            customerId,
            ticketType.price,
            payload.qtyTickets,
            payload.couponCode,
            payload.usePoint
        );

        return prisma.$transaction(async (tx) => {
            const result = await ticketTypeRepository.reserveTicket(
                tx, 
                ticketType.id, 
                ticketType.sold ?? 0, 
                payload.qtyTickets
            );

            if (result === 0) {
                throw new AppError("Kuota tiket telah berubah. Silakan ulangi checkout!", 409);
            }

            const invoiceNumber = generateInvoiceNumber();

            const salesOrder = await salesOrderRepository.create(tx, {
                invoiceNumber,

                customer: {
                    connect: {
                        id: customerId,
                    },
                },
                event: {
                    connect: {
                        id: event.id,
                    },
                },
                ticketType: {
                    connect: {
                        id: ticketType.id,
                    },
                },
                coupon: calculation.couponId ? {
                    connect: {
                        id: calculation.couponId,
                    },
                } : undefined,
                ticketName: ticketType.ticketType,
                ticketPrice: ticketType.price,
                qtyTickets: payload.qtyTickets,
                couponCode: calculation.couponCode,
                totalPrice: calculation.subtotal,
                totalDiscount: calculation.couponDiscount,
                pointsUsed: calculation.pointUsed,
                finalPrice: calculation.finalPrice,
                status:SalesOrderStatus.WAITING_PAYMENT,
            });

            if(calculation.couponId) {
                await couponService.reserveCoupon(tx, calculation.couponId, salesOrder.id);
            }

            if(calculation.pointUsed > 0) {
                await pointService.reservePoint(tx, customerId, salesOrder.id, calculation.pointValidation);
            }

            const payment = await paymentRepository.create(tx, {
                salesOrder: {
                    connect: {
                        id: salesOrder.id,
                    },
                },
                amount: calculation.finalPrice,
                paymentMethod: payload.paymentMethod,
                expiredAt: generatePaymentExpiredAt()
            })

            return {
                orderId: salesOrder.id,
                invoiceNumber: salesOrder.invoiceNumber,
                paymentId: payment.id,
                subtotal: calculation.subtotal,
                discount: calculation.couponDiscount,
                pointUsed: calculation.pointUsed,
                finalPrice: calculation.finalPrice,
                expiredAt: payment.expiredAt,
                status: salesOrder.status,
            }

        });
    }

    async releaseOrder(
        tx:DB, salesOrder : {
            id: string;
            customerId:string;
            ticketTypeId:number;
            qtyTickets:number;
            couponId:number|null;
            pointsUsed:number;
        },
        status: typeof SalesOrderStatus.CANCELLED | typeof SalesOrderStatus.CANCELLED_EXPIRED = SalesOrderStatus.CANCELLED
    ) {
        const updated = await salesOrderRepository.update(tx, salesOrder.id, {status});

        await ticketTypeRepository.releaseTicket(tx, salesOrder.ticketTypeId, salesOrder.qtyTickets);

        if(salesOrder.couponId) {
            await couponService.releaseCoupon(tx, salesOrder.couponId, salesOrder.id);
        }

        if (salesOrder.pointsUsed > 0) {
            await pointService.releasePoint(tx, salesOrder.customerId, salesOrder.id);
        }
        return updated;
    }

    async findByOrganizer(userId: string, role: Role) {
        return salesOrderRepository.findByOrganizer(prisma, userId, role);
    }
}

export const salesOrderService = new SalesOrderService();
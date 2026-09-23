import { Coupon, Prisma } from "@prisma/client";
import { couponRepository } from "../repositories/coupon.repository";
import { prisma } from "../config/prisma";
import { AppError } from "../errors/AppError";
import { DB } from "../types/database.types";

export class CouponService {

    async getMyCoupons(customerId:string) {
        return couponRepository.findCouponByCustomerId(prisma, customerId);
    }

    async validateCoupon(
        customerId:string,
        couponCode:string,
        subtotal:number
    ):Promise<{coupon: Coupon, discountAmount:number}> {
        const coupon = await couponRepository.findByCouponCode(
            prisma, couponCode,
        );

        if (!coupon) {
            throw new AppError("Kupon tidak ditemukan!", 404);
        }

        if(coupon.customerId !== customerId) {
            throw new AppError("Kupon bukan milik Customer!", 403);
        }

        if(coupon.expiredAt < new Date()) {
            throw new AppError("Kupon sudah expired!", 400);
        }

        if(coupon.isUsed) {
            throw new AppError("Kupon sudah digunakan!", 400);
        }

        return {
            coupon,
            discountAmount: Math.floor(subtotal * (coupon.discountPercent / 100)),
        };
    }
    async reserveCoupon(
        tx:DB,
        couponId:number,
        salesOrderId:string
    ):Promise<void> {
        const reserved = await couponRepository.reserve(tx, couponId, salesOrderId);

        if(reserved === 0) {
            throw new AppError("Kupon sudah digunakan!", 409);
        }
    }

    async confirmCoupon(
        tx: Prisma.TransactionClient,
        couponId:number,
        salesOrderId:string
    ):Promise<void> {
        const coupon = await couponRepository.findById(tx, couponId);
        
        if(!coupon) {
            throw new AppError("Kupon tidak ditemukan!", 404);
        }

        if(coupon.usedInOrderId !== salesOrderId) {
            throw new AppError("Kupon tidak sesuai dengan order!", 400);
        }
    }

    async releaseCoupon(
        tx:DB,
        couponId:number,
        salesOrderId:string
    ):Promise<void> {
        await couponRepository.release(tx, couponId, salesOrderId);
    }
}

export const couponService = new CouponService();
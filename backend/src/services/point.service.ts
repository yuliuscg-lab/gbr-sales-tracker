import { EarnSource, Prisma, TransactionType } from "@prisma/client";
import { prisma } from "../config/prisma";
import { AppError } from "../errors/AppError";
import { pointsBucketRepository } from "../repositories/points-bucket.repository";
import { userRepository } from "../repositories/user.repository";
import { pointsLedgerRepository } from "../repositories/points-ledger-repository";
import { pointsDeductionDetailRepository } from "../repositories/points-deduct-details.repository";
import { DB } from "../types/database.types";
import { pointsReservationRepository } from "../repositories/points-reservation.repository";

export interface BucketUsage {
    bucketId:number;
    amount:number;
}

export interface PointValidationResult {
    pointUsed: number;
    paymentAmount: number;
    buckets: BucketUsage[];
}

export class PointService {

    async getMyPoints(customerId:string) {
        const buckets = await pointsBucketRepository.findAvailableBuckets(prisma, customerId);
        const ledgers = await pointsLedgerRepository.findByCustomer(prisma, customerId);
        const user = await userRepository.findById(prisma, customerId);

        return {
            balance: user?.balancePoints ?? 0,
            buckets,
            history: ledgers,
        };
    }

    async validatePointUsage(
        customerId:string,
        subtotalAfterCoupon:number,
    ):Promise<PointValidationResult> {
        const buckets = await pointsBucketRepository.findAvailableBuckets(prisma, customerId,);

        if(buckets.length === 0) {
            return {
                pointUsed: 0,
                paymentAmount: subtotalAfterCoupon,
                buckets: [],
            };
        }

        const totalAvailable = buckets.reduce(
            (sum, bucket) => sum + bucket.remaining,
            0,
        );

        const pointUsed = Math.min(
            totalAvailable,
            subtotalAfterCoupon,
        );

        let remainingPoint = pointUsed;
        const BucketUsage: BucketUsage[] = [];

        for (const bucket of buckets) {
            if (remainingPoint <= 0) break;

            const used = Math.min(bucket.remaining, remainingPoint);

            BucketUsage.push({
                bucketId: bucket.id,
                amount: used,
            });

            remainingPoint -= used;
        }

        return {
            pointUsed,
            paymentAmount: subtotalAfterCoupon - pointUsed,
            buckets: BucketUsage,
        };
    }

    async reservePoint(
        tx: Prisma.TransactionClient, 
        customerId:string,
        salesOrderId:string,
        validation:PointValidationResult,
    ): Promise<void> {
        if(validation.pointUsed <= 0) return;

        for (const item of validation.buckets) {
            const reserved = await pointsBucketRepository.reserveAmount(
                tx,
                item.bucketId,
                item.amount,
            );

            if (reserved === 0) {
                throw new AppError("Saldo point telah berubah, silahkan ulangi checkout", 409);
            }

            await pointsReservationRepository.create(tx, {
                amount: item.amount,
                bucket: {
                    connect: { id: item.bucketId},
                },
                salesOrder: {
                    connect: { id: salesOrderId},
                },
            });
        }
        await userRepository.decrementBalancePoints(tx, customerId, validation.pointUsed);
    }

    async consumePoint(
        tx: Prisma.TransactionClient,
        customerId: string,
        salesOrderId: string,
    ): Promise<void> {
        const reservations = await pointsReservationRepository.findBySalesOrderId(tx, salesOrderId);

        if(reservations.length === 0) {
            return;
        }

        const totalUsed = reservations.reduce((sum, r) => sum + r.amount,0);

        const ledger = await pointsLedgerRepository.create(tx, {
            amount: totalUsed,
            transactionType: TransactionType.REDEEM,
            source: EarnSource.SALES_ORDER,
            sourceId: salesOrderId,
            customer: {
                connect: {
                    id: customerId,
                },
            },
        });

        for (const item of reservations) {

            await pointsDeductionDetailRepository.create(tx, {
                amountRedeemed: item.amount,
                bucket: {
                    connect: {id: item.bucketId},
                },
                ledger: {
                    connect: {
                        id: ledger.id,
                    },
                },
            });
        }

        await pointsReservationRepository.deleteBySalesOrderId(tx, salesOrderId);
    }

    async releasePoint(
        tx: Prisma.TransactionClient,
        customerId:string,
        salesOrderId:string,
    ):Promise<void> {
        const reservations = await pointsReservationRepository.findBySalesOrderId(tx, salesOrderId);

        if(reservations.length === 0) {
            return;
        }

        let totalReleased:number = 0;

        for(const item of reservations) {
            await pointsBucketRepository.incrementRemaining(tx, item.bucketId,item.amount);
            totalReleased += item.amount;
        }

        await userRepository.incrementBalancePoints(tx, customerId, totalReleased);
        await pointsReservationRepository.deleteBySalesOrderId(tx, salesOrderId);
    }
}

export const pointService = new PointService();
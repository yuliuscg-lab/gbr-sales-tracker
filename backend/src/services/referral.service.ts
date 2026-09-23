import { addMonths } from "date-fns";
import { EarnSource, Prisma, TransactionType } from "@prisma/client";
import { couponRepository } from "../repositories/coupon.repository";
import { userRepository } from "../repositories/user.repository";
import { pointsBucketRepository } from "../repositories/points-bucket.repository";
import { pointsLedgerRepository } from "../repositories/points-ledger-repository";
import { REFERRAL_COUPON_DISCOUNT, REFERRAL_COUPON_EXPIRED_MONTH, REFERRAL_POINT_EXPIRED_MONTH, REFERRAL_POINT_REWARD } from "../constants/referral.constants";

export class ReferralService {
    async handleSuccessfulReferral(
        tx: Prisma.TransactionClient,
        newUserId: string,
        referralOwnerId: string
    ){
        await couponRepository.create(tx, {
            couponCode: this.generateCouponCode(),
            discountPercent: REFERRAL_COUPON_DISCOUNT,
            expiredAt: addMonths(new Date(), REFERRAL_COUPON_EXPIRED_MONTH),
            customer: {
                connect: {
                    id: newUserId,
                },
            },
        });

        await pointsBucketRepository.create(tx, {
            earned: REFERRAL_POINT_REWARD,
            remaining: REFERRAL_POINT_REWARD,
            expiredAt: addMonths(new Date(),REFERRAL_POINT_EXPIRED_MONTH),
            customer: {
                connect: {
                    id: referralOwnerId,
                },
            },
        });

        await pointsLedgerRepository.create(tx, {
            amount: REFERRAL_POINT_REWARD,
            transactionType: TransactionType.EARN,
            source: EarnSource.REFERRAL,
            sourceId: newUserId,
            customer: {
                connect: {
                    id: referralOwnerId
                },
            },
        });

        await userRepository.incrementBalancePoints(tx, referralOwnerId, REFERRAL_POINT_REWARD);
    }

    private generateCouponCode(): string {
        const randomString = Math.random().toString(36).substring(2,8);
        return `CPNREF${randomString.toUpperCase()}`;
    }

    
}

export const referralService = new ReferralService();
import { Role } from "@prisma/client";
import { prisma } from "../config/prisma";
import { AppError } from "../errors/AppError";
import { toUserResponse } from "../mappers/user.mapper";
import { refreshTokenRepository } from "../repositories/refresh-token.repository";
import { userRepository } from "../repositories/user.repository";
import { LoginUser } from "../types/auth.types";
import { CreateUser, RegisterInput } from "../types/user.types";
import { generateReferral } from "../utils/generateReferral";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../utils/jwt";
import { comparePassword, hashPassword } from "../utils/password";
import crypto from "crypto";
import { referralService, ReferralService } from "./referral.service";


export class AuthService {

    private async generateRefCode(nama:string): Promise<string> {
        while (true) {
            const code = generateReferral(nama);
            const existingRefCode = await userRepository.findByRefCode(prisma,code);
            if (!existingRefCode) {
                return code;
            }
        }
    }

    async register(data:RegisterInput) {
        const existingEmail = await userRepository.findByEmail(prisma, data.email);
        const existingPhone = await userRepository.findByPhone(prisma, data.phone);
        
        if(existingEmail) {
            throw new AppError(
                "Email sudah terdaftar",
                409
            );
        }

        if(existingPhone) {
            throw new AppError("Nomor telepon sudah digunakan!",409);
        }

        let referralOwnerId:string | null = null;
        if(data.refCodeInput) {
            const referralOwner = await userRepository.findByRefCode(prisma, data.refCodeInput);

            if(!referralOwner) {
                throw new AppError("Kode referral tidak ditemukan!",400);
            }

            referralOwnerId = referralOwner.id;
        }

        let refCode:string | null = null;

        if (data.role==="CUSTOMER") {
            refCode = await this.generateRefCode(data.name);
        }

        const hashedPassword = await hashPassword(data.password);

        const user = await prisma.$transaction(async (tx) => {
            const createdUser = await userRepository.create(tx, {
                name: data.name,
                email:data.email,
                phone:data.phone,
                password:hashedPassword,
                refCode:refCode || null,
                role:data.role,
                refCodeInput: data.refCodeInput,
                balancePoints:0
            });

            if(referralOwnerId) {
                await referralService.handleSuccessfulReferral(
                    tx,
                    createdUser.id,
                    referralOwnerId
                );
            }

            return createdUser;
        });

        return toUserResponse(user);
    }

    async login(data:LoginUser) {
        const user = await userRepository.findByEmail(prisma,data.email);
        
        if(!user || user.deletedAt) {
            throw new AppError("Email atau password salah!", 401);
        };

        const isMatch = await comparePassword(
            data.password,
            user.password
        );

        if(!isMatch) {
            throw new AppError("Email atau password salah!", 401);
        };
        const jti = crypto.randomUUID();
        const accessToken = generateAccessToken(user.id, user.role);
        const refreshToken = generateRefreshToken(user.id,user.role,jti);
        const hashedRefreshToken = await hashPassword(refreshToken);

        const payload = verifyRefreshToken(refreshToken);
        const expiresAt = new Date(
            payload.exp! * 1000
        );

        await refreshTokenRepository.create({
        jti,
        tokenHash: hashedRefreshToken,
        expiresAt,
        user: {
            connect: {
                id: user.id
            },
        },
        });
        return {
            accessToken,
            refreshToken,
            user: toUserResponse(user),
        }
    }

    async refresh (
        refreshToken:string
    ) {
        const payload = verifyRefreshToken(refreshToken);
        const tokenRecord = await refreshTokenRepository.findByJti(payload.jti!);

        if(!tokenRecord || tokenRecord.revokedAt) {
            throw new AppError("Unauthorized!", 401);
        }

        const isValid = await comparePassword(refreshToken,tokenRecord.tokenHash);

        if (!isValid || new Date() > tokenRecord.expiresAt) {
            throw new AppError("Unauthorized",401);
        }

        const userId = payload.sub as string;
        const user = await userRepository.findById(prisma, userId);

        if (!user || user.deletedAt) {
            await refreshTokenRepository.revokeAll(userId);
            throw new AppError("Unauthorized", 401);
        }

        const newJti = crypto.randomUUID();
        
        const accessToken = generateAccessToken(
            user.id,
            user.role
        );

        const newRefreshToken = generateRefreshToken(user.id,user.role,newJti);
        const hashedRefreshToken = await hashPassword(newRefreshToken);
        const expiresAt = new Date(
            payload.exp! * 1000
        );

        await refreshTokenRepository.update(
            tokenRecord.id,
            {
                jti:newJti,
                tokenHash: hashedRefreshToken,
                expiresAt,
            }
        );

        return {
            accessToken,
            refreshToken: newRefreshToken,
        };

    }

    async logout (refreshToken:string): Promise<void> {
        const payload = verifyRefreshToken(refreshToken);

        const tokenRecord = await refreshTokenRepository.findByJti(payload.jti!);

        if(!tokenRecord || tokenRecord.revokedAt) {
            throw new AppError("Unauthorized", 401);
        }

        const isValid = await comparePassword(refreshToken, tokenRecord.tokenHash);

        if(!isValid) {
            throw new AppError("Unauthorized", 401);
        }

        await refreshTokenRepository.revoke(tokenRecord.id);

    }

    async logoutAll(refreshToken:string) {
        const payload = verifyRefreshToken(refreshToken);

        const tokenRecord = await refreshTokenRepository.findByJti(payload.jti!);

        if(!tokenRecord || tokenRecord.revokedAt) {
            throw new AppError("Unauthorized",401);
        }

        const isValid = await comparePassword(refreshToken,tokenRecord.tokenHash);

        if(!isValid) {
            throw new AppError("Unauthorized", 401);
        }

        await refreshTokenRepository.revokeAll(tokenRecord.userId);
    }

    async changePassword(
        userId:string,
        currentPassword:string,
        newPassword:string
    ):Promise<void> {
        const user = await userRepository.findById(prisma,userId);

        if (!user) {
            throw new AppError("User tidak ditemukan!",404);
        } 

        const isMatch = await comparePassword(currentPassword, user.password);
        if (!isMatch) {
            throw new AppError("Pasword saat ini salah",401);
        }

        if(await comparePassword(newPassword,user.password)) {
            throw new AppError(
                "Password baru tidak boleh sama dengan password saat ini!", 400
            );
        }

        const hashedPassword = await hashPassword(newPassword);
        await userRepository.update(prisma,user.id,{password:hashedPassword});
        await refreshTokenRepository.revokeAll(user.id);
    }
}

export const authService = new AuthService();
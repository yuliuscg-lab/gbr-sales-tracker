import { prisma } from "../config/prisma";
import { AppError } from "../errors/AppError";
import { authRepository } from "../repositories/auth.repository";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../utils/jwt";
import { comparePassword, hashPassword } from "../utils/password";
import crypto from "crypto";

export class AuthService {

    async login(username: string, password:string) {
        const user = await authRepository.findUserByUsername(username);
        
        if(!user || user.deletedAt) {
            throw new AppError("Email atau password salah!", 401);
        };

        const isMatch = await comparePassword(
            password,
            user.password
        );

        if(!isMatch) {
            throw new AppError("Email atau password salah!", 401);
        };
        
        return this.generateTokens(user.id);
    }

    async generateTokens(userId:string) {
        const jti = crypto.randomUUID();
        const accessToken = generateAccessToken(userId);
        const refreshToken = generateRefreshToken(userId,jti);
        const hashedRefreshToken = await hashPassword(refreshToken);

        const payload = verifyRefreshToken(refreshToken);
        const expiresAt = new Date(
            payload.exp! * 1000
        );

        await authRepository.createRefreshToken({
            jti,
            tokenHash:hashedRefreshToken,
            userId,
            expiresAt,
        })

        return {
            accessToken,
            refreshToken,
        }
    }

    async refresh (
        refreshToken:string
    ) {
        const payload = verifyRefreshToken(refreshToken);
        const tokenRecord = await authRepository.findRefreshTokenByJti(payload.jti!);

        if (!tokenRecord) {
            throw new AppError("Unauthorized!", 401);
        }
        if(tokenRecord.revokedAt) {
            await authRepository.revokeAllUserTokens(payload.sub as string);
            throw new AppError("Sesi mencurigakan terdeteksi, silakan login kembali!", 401);
        }

        const isValid = await comparePassword(refreshToken,tokenRecord!.tokenHash);

        if (!isValid || new Date() > tokenRecord!.expiresAt) {
            throw new AppError("Unauthorized",401);
        }

        const userId = payload.sub as string;
        const user = await authRepository.findUserById(userId);

        if (!user || user.deletedAt) {
            await authRepository.revokeAllUserTokens(userId);
            throw new AppError("Unauthorized", 401);
        }

        await authRepository.revokeRefreshToken(tokenRecord.id);
        return this.generateTokens(userId);

    }

    async logout (refreshToken:string): Promise<void> {
        const payload = verifyRefreshToken(refreshToken);

        const tokenRecord = await authRepository.findRefreshTokenByJti(payload.jti!);

        if(!tokenRecord || tokenRecord.revokedAt) {
            throw new AppError("Unauthorized", 401);
        }

        const isValid = await comparePassword(refreshToken, tokenRecord.tokenHash);

        if(!isValid) {
            throw new AppError("Unauthorized", 401);
        }

        await authRepository.revokeRefreshToken(tokenRecord.id);

    }

    async logoutAll(refreshToken:string) {
        const payload = verifyRefreshToken(refreshToken);

        const tokenRecord = await authRepository.findRefreshTokenByJti(payload.jti!);

        if(!tokenRecord || tokenRecord.revokedAt) {
            throw new AppError("Unauthorized",401);
        }

        const isValid = await comparePassword(refreshToken,tokenRecord.tokenHash);

        if(!isValid) {
            throw new AppError("Unauthorized", 401);
        }

        await authRepository.revokeAllUserTokens(tokenRecord.userId);
    }
}

export const authService = new AuthService();
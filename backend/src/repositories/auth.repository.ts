import { prisma } from "../config/prisma";

export class AuthRepository {
    async findUserByUsername(username:string) {
        return prisma.user.findUnique({
            where: {username}
        });
    }

    async findUserById(id:string) {
        return prisma.user.findUnique({
            where: {id}
        });
    }

    async createRefreshToken( data: {
        jti: string;
        tokenHash:string;
        userId: string;
        expiresAt: Date;
    }) {
        return prisma.refreshToken.create({
            data
        });
    }

    async findRefreshTokenByJti(jti:string) {
        return prisma.refreshToken.findUnique({
            where: {jti},
            include: {
                user:true
            }
        });
    }

    async revokeRefreshToken(id:string) {
        return prisma.refreshToken.update({
            where: {id},
            data: {
                revokedAt: new Date()
            }
        });
    }

    async revokeAllUserTokens(userId: string) {
        return prisma.refreshToken.updateMany({
            where: {userId, revokedAt: null},
            data: {
                revokedAt: new Date()
            }
        });
    }
}

export const authRepository = new AuthRepository();
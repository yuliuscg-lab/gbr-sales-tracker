import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";
import { env } from "../config/env";
import { AppError } from "../errors/AppError";
import { Role } from "@prisma/client";

interface TokenPayload extends JwtPayload {
    sub: string;
    role: Role;
    type: "access" | "refresh";
    jti?: string;
}

export function generateAccessToken(userId:string, role: Role):string {
    const payload:TokenPayload = {
        sub: userId,
        role,
        type: "access",
    };

    return jwt.sign(
    payload,
    env.JWT_ACCESS_SECRET,
    {
        expiresIn: env.JWT_ACCESS_EXPIRES_IN as SignOptions["expiresIn"],
    });
}

export function generateRefreshToken(userId:string, role: Role, jti:string):string {
    const payload:TokenPayload = {
        sub: userId,
        role,
        type: "refresh",
        jti,
    };

    return jwt.sign(
    payload,
    env.JWT_REFRESH_SECRET,
    {
        expiresIn: env.JWT_REFRESH_EXPIRES_IN as SignOptions["expiresIn"],
    });
}

export function verifyAccessToken(token:string):JwtPayload {
    const payload = jwt.verify(
        token,
        env.JWT_ACCESS_SECRET
    ) as TokenPayload;

    if (payload.type !== "access") {
        throw new AppError("Invalid token type!",401);
    }
    
    return payload;
}

export function verifyRefreshToken(token:string):JwtPayload {
    const payload = jwt.verify(
        token,
        env.JWT_REFRESH_SECRET
    ) as TokenPayload;

    if (payload.type !== "refresh") {
        throw new AppError("Invalid token type!",401);
    }
    
    return payload;
}
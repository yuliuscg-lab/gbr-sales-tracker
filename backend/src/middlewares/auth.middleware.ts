import { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/AppError";
import { verifyAccessToken } from "../utils/jwt";

declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
            };
        }
    }
}

export function authenticate (req:Request, res:Response, next:NextFunction) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer')) {
        throw new AppError ("Access Denied, Token Not Found!", 401);
    }

    const token = authHeader.split(" ")[1];

    try {
        const payload = verifyAccessToken(token.toString());

        req.user = {id: payload.userId};
        next();
    }
    catch (err) {
        if (err instanceof AppError) {
            throw err;
        }
        throw new AppError("Token tidak valid atau telah expired", 401);
    }
}

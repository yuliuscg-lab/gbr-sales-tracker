import { Response } from "express";

interface SuccessResponse<T> {
    success: true;
    message: string;
    data?: T;
    meta?: Record<string,unknown>;
}

export function success<T>(
    res: Response,
    statusCode: number,
    message: string,
    data?: T,
    meta?: Record<string, unknown>
) {
    const response: SuccessResponse<T> = {
        success: true,
        message,
    };

    if (data !== undefined) {
        response.data = data;
    }

    if (meta) {
        response.meta = meta;
    }

    return res.status(statusCode).json(response);
}

interface ErrorResponse {
    success: false;
    message: string;
    details?: unknown;
    errors?: unknown;
}

export function failure(
    res:Response,
    statusCode:number,
    message: string,
    details?:unknown,
) {
    const response: ErrorResponse = {
        success: false,
        message
    };

    if (details!==undefined) {
        response.details = details;
    }

    return res.status(statusCode).json(response);
}
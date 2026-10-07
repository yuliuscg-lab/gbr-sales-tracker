import { ErrorRequestHandler, NextFunction, Request, Response } from "express";
import { AppError } from "../errors/AppError";
import { failure } from "../utils/response";

export const errorHandler: ErrorRequestHandler = (
    err,
    req,
    res,
    next
) => {
    if (err instanceof AppError) {
        return failure (
            res,
            err.statusCode,
            err.message,
            err.details
        );
    }

    console.error(err);

    return failure(
        res,
        500,
        "Internal Server Error"
    );
};  
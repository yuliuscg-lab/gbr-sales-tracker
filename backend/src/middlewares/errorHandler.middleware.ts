import { ErrorRequestHandler, NextFunction, Request, Response } from "express";
import { AppError } from "../errors/AppError";
import { failure } from "../utils/response";
import { ZodError } from "zod";


export const errorHandler: ErrorRequestHandler = (
    err,
    req,
    res,
    next
) => {
    if (err instanceof ZodError) {
        console.error("ZOD VALIDATION ERROR");
        console.error(`Route : [${req.method}] ${req.originalUrl}`)
        console.error(`Issues :`);

        err.issues.forEach((issue, index) => {
            const fieldPath = issue.path.join(".") || ("root");
            console.error(`  ${index + 1}. ${fieldPath} : `);
            console.error(`     Message: ${issue.message}`);
            console.error(`     Code: ${issue.code}`);
        });

        console.error(`Payload:`,JSON.stringify({
            body: req.body,
            query: req.query,
            params: req.params,
        }, null, 2));

        const formatterErrors = err.issues.map((issue) => ({
            field:issue.path.join("."),
            message: issue.message
        }));

        return failure (
            res,
            400,
            "Validation Error",
            formatterErrors
        );
    }

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
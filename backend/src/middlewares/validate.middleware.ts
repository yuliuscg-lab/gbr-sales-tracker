import { NextFunction, Request, Response } from "express";
import { AnyZodObject } from "zod";

export const validate = (schema: AnyZodObject) => async (req: Request, res: Response, next: NextFunction) => {
    try {
        req.body = await schema.parseAsync(req.body);
        return next();
    }
    catch (error) {
        return next(error)
    }
};
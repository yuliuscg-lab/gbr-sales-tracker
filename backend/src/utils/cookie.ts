import { CookieOptions } from "express";
import { env } from "../config/env";

export const refreshCookieOptions: CookieOptions = {
    httpOnly: true,
    secure: true,
    domain: process.env.NODE_ENV === "production" ? ".gembirapancing.com" : undefined,
    sameSite: "none",
    path: "/api/auth",
    maxAge: 1 * 24 * 60 * 60 * 1000,
};
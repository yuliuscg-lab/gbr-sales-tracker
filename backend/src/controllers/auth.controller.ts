import { Request, Response } from "express";
import { authService } from "../services/auth.service";
import { refreshCookieOptions } from "../utils/cookie";
import { failure, success } from "../utils/response";

export class AuthController {
    async login (req: Request, res: Response) {
        const {username, password} = req.body;
        const {accessToken, refreshToken} = await authService.login(username,password);

        res.cookie(
            "refreshToken", 
            refreshToken,
            refreshCookieOptions
        );

        return success(
            res,
            200,
            "Login successful!", 
            {accessToken});
    }

    async refresh (req: Request, res:Response) {
        const refreshToken = req.cookies.refreshToken;

        if(!refreshToken) {
            return failure(
                res,
                401,
                "Refresh token tidak ditemukan"
            )
        }

        const { accessToken, refreshToken: newRefreshToken } = await authService.refresh(refreshToken);

        res.cookie(
            "refreshToken", 
            newRefreshToken, 
            refreshCookieOptions);

        return success(
            res,
            200,
            "Token berhasil diperbarui", 
            {accessToken});
    }

    async logout(req: Request, res:Response) {
        const token = req.cookies.refreshToken;
        if (token) {
            await authService.logout(token);
        }

        res.clearCookie(
            "refreshToken", 
            refreshCookieOptions
        );

        return success(
            res, 
            200, 
            "Logout successful!");
    }
}

export const authController = new AuthController();
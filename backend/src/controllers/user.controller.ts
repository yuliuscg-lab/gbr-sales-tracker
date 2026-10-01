import { Request, Response } from "express";
import { userService } from "../services/user.service";
import { success } from "../utils/response";

export class UserController {
    async getAll(req: Request, res: Response) {
        const users = await userService.getAllUsers();
        return success (
            res,
            200,
            "Data user berhasil diambil",
            users
        );
    }

    async getById(req: Request, res: Response) {
        const {id} = req.params;
        const user = await userService.getUserById(id.toString());
        return success(
            res,
            200,
            "Data user berhasil diambil",
            user
        );
    }

    async create(req: Request, res: Response) {
        const { username, password, name } = req.body;
        const user = await userService.createUser({username, password, name});
        return success (
            res,
            201,
            "User berhasil dibuat",
            user
        );
    }
}

export const userController = new UserController();
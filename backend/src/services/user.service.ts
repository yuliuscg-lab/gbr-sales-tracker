import { AppError } from "../errors/AppError";
import { userRepository } from "../repositories/user.repository";
import { hashPassword } from "../utils/password";

export class UserService {
    async getAllUsers() {
        return userRepository.findMany();
    }

    async getUserById(id: string) {
        const user = await userRepository.findById(id);
        if (!user) throw new AppError("User tidak ditemukan", 404);
        return user;
    }

    async createUser(data: {
        username:string;
        password:string;
        name:string
    }) {
        const exist = await userRepository.findByUsername(data.username);
        if(exist) throw new AppError("Username sudah digunakan", 400);
        
        const hashedPassword = await hashPassword(data.password);

        return userRepository.create({
            username: data.username,
            password: hashedPassword,
            name: data.name
        });
    }  
}

export const userService = new UserService();
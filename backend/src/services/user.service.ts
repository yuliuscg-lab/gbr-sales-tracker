import { Role } from "@prisma/client";
import { AppError } from "../errors/AppError";
import { toUserResponse } from "../mappers/user.mapper";
import { userRepository } from "../repositories/user.repository";
import { CreateUser, UpdateUser } from "../types/user.types";
import { generateReferral } from "../utils/generateReferral";
import { hashPassword } from "../utils/password";
import { prisma } from "../config/prisma";
import { UpdateCategoryRequest } from "../types/category.types";
import { refreshTokenRepository } from "../repositories/refresh-token.repository";

export class UserService {
  async findAll() {
    return userRepository.findAll(prisma);
  }

  async findById(id: string) {
    const user = await userRepository.findById(prisma,id);

    if (!user) {
      throw new AppError("User tidak ditemukan!",404)
    }

    return toUserResponse(user);
  }

  async update(id: string, data: UpdateUser) {
    const existingUser = await userRepository.findById(prisma,id);

    if (!existingUser) {
      throw new AppError("User tidak ditemukan", 404)
    }

    if (data.phone && data.phone !== existingUser.phone ) {
      const existingPhone = await userRepository.findByPhone(prisma,data.phone);

      if (existingPhone) {
        throw new AppError("Nomor sudah digunakan!", 409);
      }
    }

    const updatedUser = await userRepository.update(prisma,id,data);
    
    return toUserResponse(updatedUser);
  }

  async delete(id: string) {
    const existingUser = await userRepository.findById(prisma, id);

    if (!existingUser || existingUser.deletedAt) {
      throw new AppError("User tidak ditemukan", 404);
    }

    await userRepository.update(prisma, id, { deletedAt: new Date() });
    await refreshTokenRepository.revokeAll(id);
  }
}

export const userService = new UserService();
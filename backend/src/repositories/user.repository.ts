import { prisma } from "../config/prisma";

export class UserRepository {
    async findMany() {
        return prisma.user.findMany({
            where: {deletedAt: null},
            select: {
                id: true,
                username: true,
                name: true,
                createdAt: true,
                updatedAt: true
            },
            orderBy: [{name: "asc"}]
        });
    }

    async findById(id:string) {
        return prisma.user.findFirst({
            where: {id, deletedAt:null},
            select: {
                id: true,
                username: true,
                name: true,
                createdAt: true,
                updatedAt: true,
            }
        });
    }

    async findByUsername(username: string) {
        return prisma.user.findFirst({
            where: {username, deletedAt: null}
        });
    }

    async create(data: {
        username: string;
        password: string;
        name: string;
    }) {
        return prisma.user.create({
            data,
            select: {
                id: true,
                username: true,
                name: true,
                createdAt: true,
                updatedAt: true
            }
        });
    }
}

export const userRepository = new UserRepository();
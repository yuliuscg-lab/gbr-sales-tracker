import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    const defaultPassword = 'PasswordOwnerKuat123!';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    const owner = await prisma.user.upsert({
        where: { username: 'owner' },
        update: {
            password: hashedPassword,
            deletedAt: null,
        },
        create: {
            username: 'admin',
            name: 'admin',
            password: hashedPassword,
        },
    });

    console.log(`Akun Owner berhasil disiapkan: ${owner.username}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

import { PrismaClient, Role } from '@prisma/client';
import * as dotenv from 'dotenv';
import { BcryptService } from '../src/common/services';
dotenv.config();

const prisma = new PrismaClient();
const bcryptService = new BcryptService();

const main = async () => {
  console.log('Database seeded');
  await prisma.user.upsert({
    where: {
      email: process.env.ADMIN_EMAIL,
    },
    update: {},
    create: {
      email: process.env.ADMIN_EMAIL as string,
      name: process.env.ADMIN_NAME as string,
      passwordHash: (await bcryptService.hashPassword(
        process.env.ADMIN_PASSWORD as string,
      )) as string,
      role: Role.ADMIN,
    },
  });
};

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

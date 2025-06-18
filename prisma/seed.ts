import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash(process.env.SUPERADMIN_PASSWORD, 10); // Hash password dengan saltRounds 10
  await prisma.user.create({
    data: {
      name: process.env.SUPERADMIN_NAME,
      username: process.env.SUPERADMIN_USERNAME,
      password: hashedPassword,
      role: 'ADMIN',
    },
  });
  console.log('Superadmin user created successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const users = [
    { name: 'Nguyen Van A', email: 'a@example.com', phone: '0123456789', role: Role.ADMIN, password: 'password123' },
    { name: 'Tran Thi B', email: 'b@example.com', phone: '0987654321', role: Role.GARDENER, password: 'password123' },
    { name: 'Le Van C', email: 'c@example.com', phone: '0112233445', role: Role.GARDENER, password: 'password123' },
    { name: 'Pham Thi D', email: 'd@example.com', phone: '0223344556', role: Role.ADMIN, password: 'password123' },
    { name: 'Hoang Van E', email: 'e@example.com', phone: '0334455667', role: Role.GARDENER, password: 'password123' }
  ];

  for (const user of users) {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    await prisma.user.create({
      data: {
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        passwordHash: hashedPassword
        // passwordHash: user.password
      }
    });
  }
  console.log('Seed data created successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

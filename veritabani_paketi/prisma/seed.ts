import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const usersToCreate = [
    {
      email: 'ali.yilmaz@test.com',
      name: 'Ali Yılmaz',
      role: Role.DRIVER,
      passwordHash: 'password123',
    },
    {
      email: 'ayse.demir@test.com',
      name: 'Ayşe Demir',
      role: Role.OPERATOR,
      passwordHash: 'password123',
    },
    {
      email: 'can.tekin@test.com',
      name: 'Can Tekin',
      role: Role.ADMIN,
      passwordHash: 'password123',
    },
  ];

  for (const user of usersToCreate) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: user,
    });
  }

  console.log('Kullanıcılar başarıyla seed edildi.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

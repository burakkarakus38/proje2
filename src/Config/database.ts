import { PrismaClient } from '@prisma/client';
import { Logger } from '../Utils/logger';

const prisma = new PrismaClient();

prisma.$connect()
  .then(() => {
    Logger.info('✓ Prisma, PostgreSQL veritabanına başarıyla bağlandı.');
  })
  .catch((err: Error) => {
    Logger.error('✗ Prisma bağlantı hatası:', err);
    process.exit(1);
  });

// Graceful shutdown: veritabanı bağlantısını kapat
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  Logger.info('Prisma bağlantısı kapatıldı.');
  process.exit(0);
});

export default prisma;

/**
 * Prisma Seed Script
 * Run: npx prisma db seed
 * Populates database with test data for development/testing
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const SALT_ROUNDS = 10;

async function main() {
  console.log('🌱 Seed script başlatılıyor...\n');

  // Clean existing data
  console.log('🧹 Veritabanı temizleniyor...');
  await prisma.payment.deleteMany({});
  await prisma.parkingSession.deleteMany({});
  await prisma.reservation.deleteMany({});
  await prisma.parkingLot.deleteMany({});
  await prisma.vehicle.deleteMany({});
  await prisma.refreshToken.deleteMany({});
  await prisma.user.deleteMany({});

  // Create test users
  console.log('👥 Test kullanıcıları oluşturuluyor...');

  const testUsers = [
    {
      name: 'Otopark Sağlayıcı (Admin)',
      email: 'admin@parket.com',
      gsm: '5550000001',
      password: 'SecurePassword123',
      role: 'PROVIDER' as any,
    },
    {
      name: 'Sürücü Ahmet',
      email: 'ahmet@example.com',
      gsm: '5550000002',
      password: 'SecurePassword456',
      role: 'USER' as any,
    },
    {
      name: 'Sürücü Fatma',
      email: 'fatma@example.com',
      gsm: '5550000003',
      password: 'SecurePassword789',
      role: 'USER' as any,
    },
  ];

  const createdUsers = [];

  for (const testUser of testUsers) {
    const hashedPassword = await bcrypt.hash(testUser.password, SALT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        name: testUser.name,
        email: testUser.email,
        gsm: testUser.gsm,
        password: hashedPassword,
        role: testUser.role,
        isVerified: true,
      },
    });
    createdUsers.push(user);
    console.log(`✅ User oluşturuldu: ${user.email} (ID: ${user.id}, Role: ${user.role})`);
  }

  const providerId = createdUsers[0].id;
  const driverId = createdUsers[1].id;

  // Create vehicles for drivers
  console.log('🚗 Araçlar oluşturuluyor...');
  const vehicles = [
    {
      plate: '34ABC1234',
      type: 'CAR',
      brand: 'Toyota',
      model: 'Corolla',
      ownerId: driverId,
    },
    {
      plate: '34DEF5678',
      type: 'SUV',
      brand: 'Honda',
      model: 'CR-V',
      ownerId: createdUsers[2].id,
    },
  ];

  for (const vehicle of vehicles) {
    const createdVehicle = await prisma.vehicle.create({
      data: vehicle as any,
    });
    console.log(`✅ Araç oluşturuldu: ${createdVehicle.brand} ${createdVehicle.model} (Plaka: ${createdVehicle.plate})`);
  }

  // Create 5 Parking Lots
  console.log('🅿️ Otoparklar oluşturuluyor...');
  const parkingLots = [
    {
      name: 'Merkez Otoparkı',
      latitude: 41.0082,
      longitude: 28.9784,
      address: 'Sultanahmet, Fatih/İstanbul',
      workingHours: '00:00-24:00',
      capacity: 150,
      currentOccupancy: 30,
      hourlyRate: 30.0,
      providerId: providerId,
    },
    {
      name: 'Şişli AVM Otoparkı',
      latitude: 41.0613,
      longitude: 28.9912,
      address: 'Şişli Merkez Mahallesi, Şişli/İstanbul',
      workingHours: '10:00-22:00',
      capacity: 500,
      currentOccupancy: 100,
      hourlyRate: 20.0,
      providerId: providerId,
    },
    {
      name: 'Kadıköy Sahil Otoparkı',
      latitude: 40.9901,
      longitude: 29.0234,
      address: 'Caferağa Mahallesi, Kadıköy/İstanbul',
      workingHours: '08:00-00:00',
      capacity: 200,
      currentOccupancy: 50,
      hourlyRate: 40.0,
      providerId: providerId,
    },
    {
      name: 'Beşiktaş Meydan Otoparkı',
      latitude: 41.0422,
      longitude: 29.0083,
      address: 'Sinanpaşa Mahallesi, Beşiktaş/İstanbul',
      workingHours: '00:00-24:00',
      capacity: 100,
      currentOccupancy: 20,
      hourlyRate: 50.0,
      providerId: providerId,
    },
    {
      name: 'Bakırköy Marina Otoparkı',
      latitude: 40.9768,
      longitude: 28.8714,
      address: 'Zeytinlik Mahallesi, Bakırköy/İstanbul',
      workingHours: '00:00-24:00',
      capacity: 300,
      currentOccupancy: 60,
      hourlyRate: 25.0,
      providerId: providerId,
    },
  ];

  for (const lot of parkingLots) {
    const createdLot = await prisma.parkingLot.create({
      data: lot as any,
    });
    console.log(`✅ Otopark oluşturuldu: ${createdLot.name} (Kapasite: ${createdLot.capacity}, Ücret: ${createdLot.hourlyRate}₺)`);
  }

  console.log('\n✨ Seed işlemi başarıyla tamamlandı!\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed işlemi sırasında hata oluştu:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { PrismaClient, Role, Severity, DeviceStatus, DeviceType, Mode } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🔹 Đang xóa dữ liệu cũ...');
  await prisma.notificationRecipient.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.log.deleteMany();
  await prisma.user.deleteMany();
  await prisma.location.deleteMany();
  await prisma.device.deleteMany();
  await prisma.configuration.deleteMany();
  await prisma.moistureSensor.deleteMany();
  await prisma.dHT20Sensor.deleteMany();
  await prisma.pump.deleteMany();

  console.log('🔹 Đang tạo Location...');
  const locations = await prisma.$transaction([
    prisma.location.create({ data: { name: 'KV1' } }),
    prisma.location.create({ data: { name: 'KV2' } }),
    prisma.location.create({ data: { name: 'KV3' } }),
    prisma.location.create({ data: { name: 'KV4' } }),
    prisma.location.create({ data: { name: 'KV5' } }),
  ]);
  console.log('✅ Đã tạo Location xong!');

  const getRandomLocation = () => locations[Math.floor(Math.random() * locations.length)].locationId;

  console.log('🔹 Đang tạo User...');
  const users = [
    { name: 'Nguyen Van A', email: 'a@example.com', phone: '0123456789', role: Role.ADMIN },
    { name: 'Tran Thi B', email: 'b@example.com', phone: '0987654321', role: Role.GARDENER },
    { name: 'Le Van C', email: 'c@example.com', phone: '0112233445', role: Role.GARDENER },
    { name: 'Pham Thi D', email: 'd@example.com', phone: '0223344556', role: Role.ADMIN },
    { name: 'Hoang Van E', email: 'e@example.com', phone: '0334455667', role: Role.GARDENER },
    { name: 'Nguyen Thi F', email: 'f@example.com', phone: '0445566778', role: Role.GARDENER },
    { name: 'Tran Van G', email: 'g@example.com', phone: '0556677889', role: Role.GARDENER },
    { name: 'Le Thi H', email: 'h@example.com', phone: '0667788990', role: Role.GARDENER },
    { name: 'Pham Van I', email: 'i@example.com', phone: '0778899001', role: Role.ADMIN },
    { name: 'Hoang Thi J', email: 'j@example.com', phone: '0889900112', role: Role.GARDENER },
    { name: 'Nguyen Van K', email: 'k@example.com', phone: '0990011223', role: Role.GARDENER },
    { name: 'Tran Thi L', email: 'l@example.com', phone: '0112233445', role: Role.GARDENER },
    { name: 'Le Van M', email: 'm@example.com', phone: '0223344556', role: Role.GARDENER },
    { name: 'Pham Thi N', email: 'n@example.com', phone: '0334455667', role: Role.GARDENER },
    { name: 'Hoang Van O', email: 'o@example.com', phone: '0445566778', role: Role.GARDENER },
  ];

  const passwordHash = await bcrypt.hash('password123', 10);
  const createdUsers = await prisma.$transaction(
    users.map((user) =>
      prisma.user.create({
        data: {
          ...user,
          passwordHash,
          locationId: getRandomLocation(),
        },
      })
    )
  );

  console.log('🔹 Đang tạo Log...');
  await prisma.$transaction(
    Array.from({ length: 15 }).map((_, i) =>
      prisma.log.create({
        data: {
          userId: createdUsers[i % createdUsers.length].userId,
          deviceId: null,
          eventType: Severity.INFO,
          description: `Log event ${i + 1}`,
        },
      })
    )
  );
  console.log('✅ Đã tạo Log xong!');

  console.log('🔹 Đang tạo Notification...');
  const notifications = await prisma.$transaction(
    Array.from({ length: 5 }).map((_, i) =>
      prisma.notification.create({
        data: {
          senderId: createdUsers[i % createdUsers.length].userId,
          message: `Thông báo số ${i + 1}`,
          severity: Severity.WARNING,
        },
      })
    )
  );
  console.log('✅ Đã tạo Notification xong!');

  console.log('🔹 Đang tạo NotificationRecipient...');
  await prisma.$transaction(
    Array.from({ length: 10 }).map((_, i) =>
      prisma.notificationRecipient.create({
        data: {
          notificationId: notifications[i % notifications.length].notificationId,
          userId: createdUsers[(i + 1) % createdUsers.length].userId,
        },
      })
    )
  );
  console.log('✅ Đã tạo NotificationRecipient xong!');

  console.log('🔹 Đang tạo Device...');
  const devices = await prisma.$transaction(
    locations.flatMap((location) => [
      prisma.device.create({
        data: { name: 'Pump 1', status: DeviceStatus.ACTIVE, type: DeviceType.PUMP, locationId: location.locationId },
      }),
      prisma.device.create({
        data: { name: 'Moisture Sensor 1', status: DeviceStatus.ACTIVE, type: DeviceType.MOISTURE_SENSOR, locationId: location.locationId },
      }),
      prisma.device.create({
        data: { name: 'DHT20 Sensor 1', status: DeviceStatus.ACTIVE, type: DeviceType.DHT20_SENSOR, locationId: location.locationId },
      }),
    ])
  );
  console.log('✅ Đã tạo Device xong!');

  console.log('🔹 Đang tạo Configuration...');
  const configurations = await prisma.$transaction(
    Array.from({ length: 30 }, (_, i) =>
      prisma.configuration.create({
        data: { name: `Config ${i + 1}`, value: Math.random() * 100, locationId: getRandomLocation(), deviceType: i % 3 === 0 ? DeviceType.DHT20_SENSOR : i % 3 === 1 ? DeviceType.MOISTURE_SENSOR : DeviceType.PUMP },
      })
    )
  );
  console.log('✅ Đã tạo Configuration xong!');

  console.log('🔹 Đang tạo MoistureSensor...');
  if (configurations.length > 0) {
    await prisma.$transaction(
      devices
        .filter((d) => d.type === DeviceType.MOISTURE_SENSOR)
        .map((device) =>
          prisma.moistureSensor.create({
            data: {
              sensorId: device.deviceId,
              calibrationValue: Math.random() * 10,
              thresholdId: configurations[Math.floor(Math.random() * configurations.length)].configId,
            },
          })
        )
    );
  }

  console.log('✅ Đã tạo MoistureSensor xong!');

  console.log('🔹 Đang tạo DHT20Sensor...');
  if (configurations.length > 0) {
    await prisma.$transaction(
      devices
        .filter((d) => d.type === DeviceType.DHT20_SENSOR)
        .map((device) =>
          prisma.dHT20Sensor.create({
            data: {
              sensorId: device.deviceId,
              tempMinId: configurations[Math.floor(Math.random() * configurations.length)].configId,
              tempMaxId: configurations[Math.floor(Math.random() * configurations.length)].configId,
              humidityThresholdId: configurations[Math.floor(Math.random() * configurations.length)].configId,
            },
          })
        )
    );
  }

  console.log('✅ Đã tạo DHT20Sensor xong!');

  console.log('🔹 Đang tạo Pump...');
  if (configurations.length > 0) {
    await prisma.$transaction(
      devices
        .filter((d) => d.type === DeviceType.PUMP)
        .map((device) =>
          prisma.pump.create({
            data: {
              pumpId: device.deviceId,
              isRunning: false,
              mode: Mode.AUTO,
              maxRuntimeId: configurations[Math.floor(Math.random() * configurations.length)].configId,
              flowRate: Math.random() * 10,
              pressure: Math.random() * 5,
              energyConsumption: Math.random() * 50,
            },
          })
        )
    );
  }

  console.log('✅ Đã tạo Pump xong!');

  console.log('🎉 Seed thành công!');
}

main()
  .catch((e) => {
    console.error('❌ Lỗi khi chạy seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

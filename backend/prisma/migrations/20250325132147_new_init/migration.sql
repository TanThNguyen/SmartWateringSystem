-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'GARDENER', 'INACTIVE');

-- CreateEnum
CREATE TYPE "Severity" AS ENUM ('INFO', 'WARNING', 'ERROR');

-- CreateEnum
CREATE TYPE "DeviceStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "DeviceType" AS ENUM ('PUMP', 'MOISTURE_SENSOR', 'DHT20_SENSOR', 'LCD', 'FAN', 'LED');

-- CreateEnum
CREATE TYPE "Mode" AS ENUM ('MANUAL', 'AUTO', 'SCHEDULED');

-- CreateTable
CREATE TABLE "User" (
    "userId" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "phone" VARCHAR(20),
    "role" "Role" NOT NULL,
    "passwordHash" VARCHAR(255) NOT NULL,
    "locationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "Location" (
    "locationId" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("locationId")
);

-- CreateTable
CREATE TABLE "Notification" (
    "notificationId" TEXT NOT NULL,
    "senderId" VARCHAR(36),
    "message" TEXT NOT NULL,
    "severity" "Severity" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("notificationId")
);

-- CreateTable
CREATE TABLE "NotificationRecipient" (
    "notificationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "NotificationRecipient_pkey" PRIMARY KEY ("notificationId","userId")
);

-- CreateTable
CREATE TABLE "Configuration" (
    "configId" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "locationId" TEXT NOT NULL,
    "deviceType" "DeviceType" NOT NULL,
    "lastUpdated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Configuration_pkey" PRIMARY KEY ("configId")
);

-- CreateTable
CREATE TABLE "Device" (
    "deviceId" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "status" "DeviceStatus" NOT NULL,
    "type" "DeviceType" NOT NULL,
    "locationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Device_pkey" PRIMARY KEY ("deviceId")
);

-- CreateTable
CREATE TABLE "MoistureSensor" (
    "sensorId" TEXT NOT NULL,
    "thresholdId" TEXT NOT NULL,

    CONSTRAINT "MoistureSensor_pkey" PRIMARY KEY ("sensorId")
);

-- CreateTable
CREATE TABLE "DHT20Sensor" (
    "sensorId" TEXT NOT NULL,
    "tempMinId" TEXT NOT NULL,
    "tempMaxId" TEXT NOT NULL,
    "humidityThresholdId" TEXT NOT NULL,

    CONSTRAINT "DHT20Sensor_pkey" PRIMARY KEY ("sensorId")
);

-- CreateTable
CREATE TABLE "Pump" (
    "pumpId" TEXT NOT NULL,
    "isRunning" BOOLEAN NOT NULL DEFAULT false,
    "mode" "Mode" NOT NULL DEFAULT 'AUTO',
    "lastServiced" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Pump_pkey" PRIMARY KEY ("pumpId")
);

-- CreateTable
CREATE TABLE "Fan" (
    "fanId" TEXT NOT NULL,
    "isRunning" BOOLEAN NOT NULL DEFAULT false,
    "mode" "Mode" NOT NULL DEFAULT 'AUTO',
    "speed" DOUBLE PRECISION NOT NULL,
    "lastServiced" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Fan_pkey" PRIMARY KEY ("fanId")
);

-- CreateTable
CREATE TABLE "MoistureRecord" (
    "moistureRecordId" TEXT NOT NULL,
    "sensorId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "soilMoisture" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "MoistureRecord_pkey" PRIMARY KEY ("moistureRecordId")
);

-- CreateTable
CREATE TABLE "DHT20Record" (
    "dht20RecordId" TEXT NOT NULL,
    "sensorId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "temperature" DOUBLE PRECISION NOT NULL,
    "humidity" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "DHT20Record_pkey" PRIMARY KEY ("dht20RecordId")
);

-- CreateTable
CREATE TABLE "Schedule" (
    "scheduleId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "repeatDays" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Schedule_pkey" PRIMARY KEY ("scheduleId")
);

-- CreateTable
CREATE TABLE "Log" (
    "logId" TEXT NOT NULL,
    "userId" TEXT,
    "deviceId" TEXT,
    "eventType" "Severity" NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Log_pkey" PRIMARY KEY ("logId")
);

-- CreateIndex
CREATE UNIQUE INDEX "email_UNIQUE" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Location_name_key" ON "Location"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Configuration_name_key" ON "Configuration"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Device_name_key" ON "Device"("name");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("locationId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationRecipient" ADD CONSTRAINT "NotificationRecipient_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "Notification"("notificationId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationRecipient" ADD CONSTRAINT "NotificationRecipient_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Configuration" ADD CONSTRAINT "Configuration_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("locationId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Device" ADD CONSTRAINT "Device_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("locationId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MoistureSensor" ADD CONSTRAINT "MoistureSensor_sensorId_fkey" FOREIGN KEY ("sensorId") REFERENCES "Device"("deviceId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MoistureSensor" ADD CONSTRAINT "MoistureSensor_thresholdId_fkey" FOREIGN KEY ("thresholdId") REFERENCES "Configuration"("configId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DHT20Sensor" ADD CONSTRAINT "DHT20Sensor_sensorId_fkey" FOREIGN KEY ("sensorId") REFERENCES "Device"("deviceId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DHT20Sensor" ADD CONSTRAINT "DHT20Sensor_tempMinId_fkey" FOREIGN KEY ("tempMinId") REFERENCES "Configuration"("configId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DHT20Sensor" ADD CONSTRAINT "DHT20Sensor_tempMaxId_fkey" FOREIGN KEY ("tempMaxId") REFERENCES "Configuration"("configId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DHT20Sensor" ADD CONSTRAINT "DHT20Sensor_humidityThresholdId_fkey" FOREIGN KEY ("humidityThresholdId") REFERENCES "Configuration"("configId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pump" ADD CONSTRAINT "Pump_pumpId_fkey" FOREIGN KEY ("pumpId") REFERENCES "Device"("deviceId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fan" ADD CONSTRAINT "Fan_fanId_fkey" FOREIGN KEY ("fanId") REFERENCES "Device"("deviceId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MoistureRecord" ADD CONSTRAINT "MoistureRecord_sensorId_fkey" FOREIGN KEY ("sensorId") REFERENCES "MoistureSensor"("sensorId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DHT20Record" ADD CONSTRAINT "DHT20Record_sensorId_fkey" FOREIGN KEY ("sensorId") REFERENCES "DHT20Sensor"("sensorId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("deviceId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Log" ADD CONSTRAINT "Log_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Log" ADD CONSTRAINT "Log_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("deviceId") ON DELETE SET NULL ON UPDATE CASCADE;

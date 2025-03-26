-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'GARDENER', 'INACTIVE');

-- CreateEnum
CREATE TYPE "Severity" AS ENUM ('Info', 'Warning', 'Error');

-- CreateEnum
CREATE TYPE "DeviceStatus" AS ENUM ('Active', 'Inactive');

-- CreateEnum
CREATE TYPE "DeviceType" AS ENUM ('Pump', 'MoistureSensor', 'DHT20Sensor', 'LCD', 'Relay');

-- CreateEnum
CREATE TYPE "SoilType" AS ENUM ('Cat', 'Set', 'Mun', 'Dat_thit');

-- CreateEnum
CREATE TYPE "LocationType" AS ENUM ('Trong_nha', 'Ngoai_troi');

-- CreateTable
CREATE TABLE "User" (
    "userId" VARCHAR(36) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "phone" VARCHAR(20),
    "address" VARCHAR(255),
    "role" "Role" NOT NULL,
    "passwordHash" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "Notification" (
    "notificationId" TEXT NOT NULL,
    "recipientUserId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "severity" "Severity" NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("notificationId")
);

-- CreateTable
CREATE TABLE "Configuration" (
    "configId" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "location" VARCHAR(100) NOT NULL,
    "lastUpdated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Configuration_pkey" PRIMARY KEY ("configId")
);

-- CreateTable
CREATE TABLE "Device" (
    "deviceId" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "status" "DeviceStatus" NOT NULL,
    "type" "DeviceType" NOT NULL,
    "location" TEXT NOT NULL,
    "lastUpdated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Device_pkey" PRIMARY KEY ("deviceId")
);

-- CreateTable
CREATE TABLE "MoistureSensor" (
    "sensorId" TEXT NOT NULL,
    "calibrationValue" DOUBLE PRECISION,
    "threshold" DOUBLE PRECISION NOT NULL,
    "soilType" "SoilType",
    "lastCalibrated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MoistureSensor_pkey" PRIMARY KEY ("sensorId")
);

-- CreateTable
CREATE TABLE "DHT20Sensor" (
    "sensorId" TEXT NOT NULL,
    "temperatureRangeMin" DOUBLE PRECISION NOT NULL,
    "temperatureRangeMax" DOUBLE PRECISION NOT NULL,
    "humidityAccuracy" DOUBLE PRECISION NOT NULL,
    "locationType" "LocationType" NOT NULL,

    CONSTRAINT "DHT20Sensor_pkey" PRIMARY KEY ("sensorId")
);

-- CreateTable
CREATE TABLE "Pump" (
    "pumpId" TEXT NOT NULL,
    "isRunning" BOOLEAN NOT NULL DEFAULT false,
    "autoMode" BOOLEAN NOT NULL DEFAULT false,
    "maxRuntime" INTEGER NOT NULL,
    "flowRate" DOUBLE PRECISION NOT NULL,
    "pressure" DOUBLE PRECISION NOT NULL,
    "energyConsumption" DOUBLE PRECISION NOT NULL,
    "lastServiced" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Pump_pkey" PRIMARY KEY ("pumpId")
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
CREATE TABLE "WaterUsage" (
    "usageId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "waterAmount" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "WaterUsage_pkey" PRIMARY KEY ("usageId")
);

-- CreateTable
CREATE TABLE "IrrigationSchedule" (
    "scheduleId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "repeatDays" VARCHAR(50) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "IrrigationSchedule_pkey" PRIMARY KEY ("scheduleId")
);

-- CreateTable
CREATE TABLE "Log" (
    "logId" TEXT NOT NULL,
    "userId" TEXT,
    "deviceId" TEXT,
    "eventType" VARCHAR(100) NOT NULL,
    "description" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Log_pkey" PRIMARY KEY ("logId")
);

-- CreateIndex
CREATE UNIQUE INDEX "email_UNIQUE" ON "User"("email");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_recipientUserId_fkey" FOREIGN KEY ("recipientUserId") REFERENCES "User"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MoistureSensor" ADD CONSTRAINT "MoistureSensor_sensorId_fkey" FOREIGN KEY ("sensorId") REFERENCES "Device"("deviceId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DHT20Sensor" ADD CONSTRAINT "DHT20Sensor_sensorId_fkey" FOREIGN KEY ("sensorId") REFERENCES "Device"("deviceId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pump" ADD CONSTRAINT "Pump_pumpId_fkey" FOREIGN KEY ("pumpId") REFERENCES "Device"("deviceId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MoistureRecord" ADD CONSTRAINT "MoistureRecord_sensorId_fkey" FOREIGN KEY ("sensorId") REFERENCES "MoistureSensor"("sensorId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DHT20Record" ADD CONSTRAINT "DHT20Record_sensorId_fkey" FOREIGN KEY ("sensorId") REFERENCES "DHT20Sensor"("sensorId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaterUsage" ADD CONSTRAINT "WaterUsage_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Pump"("pumpId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IrrigationSchedule" ADD CONSTRAINT "IrrigationSchedule_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Pump"("pumpId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Log" ADD CONSTRAINT "Log_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Log" ADD CONSTRAINT "Log_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("deviceId") ON DELETE SET NULL ON UPDATE CASCADE;

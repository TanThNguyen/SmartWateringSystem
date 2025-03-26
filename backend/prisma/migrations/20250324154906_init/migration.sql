/*
  Warnings:

  - The values [Active,Inactive] on the enum `DeviceStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [Pump,MoistureSensor,DHT20Sensor,Relay] on the enum `DeviceType` will be removed. If these variants are still used in the database, this will fail.
  - The values [Info,Warning,Error] on the enum `Severity` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `location` on the `Configuration` table. All the data in the column will be lost.
  - You are about to drop the column `humidityAccuracy` on the `DHT20Sensor` table. All the data in the column will be lost.
  - You are about to drop the column `locationType` on the `DHT20Sensor` table. All the data in the column will be lost.
  - You are about to drop the column `temperatureRangeMax` on the `DHT20Sensor` table. All the data in the column will be lost.
  - You are about to drop the column `temperatureRangeMin` on the `DHT20Sensor` table. All the data in the column will be lost.
  - You are about to drop the column `lastUpdated` on the `Device` table. All the data in the column will be lost.
  - You are about to drop the column `location` on the `Device` table. All the data in the column will be lost.
  - You are about to drop the column `timestamp` on the `Log` table. All the data in the column will be lost.
  - You are about to drop the column `calibrationValue` on the `MoistureSensor` table. All the data in the column will be lost.
  - You are about to drop the column `lastCalibrated` on the `MoistureSensor` table. All the data in the column will be lost.
  - You are about to drop the column `soilType` on the `MoistureSensor` table. All the data in the column will be lost.
  - You are about to drop the column `threshold` on the `MoistureSensor` table. All the data in the column will be lost.
  - You are about to drop the column `isRead` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the column `recipientUserId` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the column `timestamp` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the column `autoMode` on the `Pump` table. All the data in the column will be lost.
  - You are about to drop the column `energyConsumption` on the `Pump` table. All the data in the column will be lost.
  - You are about to drop the column `flowRate` on the `Pump` table. All the data in the column will be lost.
  - You are about to drop the column `maxRuntime` on the `Pump` table. All the data in the column will be lost.
  - You are about to drop the column `pressure` on the `Pump` table. All the data in the column will be lost.
  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `address` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `IrrigationSchedule` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `WaterUsage` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[name]` on the table `Configuration` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name]` on the table `Device` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `deviceType` to the `Configuration` table without a default value. This is not possible if the table is not empty.
  - Added the required column `locationId` to the `Configuration` table without a default value. This is not possible if the table is not empty.
  - Added the required column `humidityThresholdId` to the `DHT20Sensor` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tempMaxId` to the `DHT20Sensor` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tempMinId` to the `DHT20Sensor` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Device` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `eventType` on the `Log` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `thresholdId` to the `MoistureSensor` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Mode" AS ENUM ('MANUAL', 'AUTO', 'SCHEDULED');

-- AlterEnum
BEGIN;
CREATE TYPE "DeviceStatus_new" AS ENUM ('ACTIVE', 'INACTIVE');
ALTER TABLE "Device" ALTER COLUMN "status" TYPE "DeviceStatus_new" USING ("status"::text::"DeviceStatus_new");
ALTER TYPE "DeviceStatus" RENAME TO "DeviceStatus_old";
ALTER TYPE "DeviceStatus_new" RENAME TO "DeviceStatus";
DROP TYPE "DeviceStatus_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "DeviceType_new" AS ENUM ('PUMP', 'MOISTURE_SENSOR', 'DHT20_SENSOR', 'LCD', 'FAN', 'LED');
ALTER TABLE "Configuration" ALTER COLUMN "deviceType" TYPE "DeviceType_new" USING ("deviceType"::text::"DeviceType_new");
ALTER TABLE "Device" ALTER COLUMN "type" TYPE "DeviceType_new" USING ("type"::text::"DeviceType_new");
ALTER TYPE "DeviceType" RENAME TO "DeviceType_old";
ALTER TYPE "DeviceType_new" RENAME TO "DeviceType";
DROP TYPE "DeviceType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "Severity_new" AS ENUM ('INFO', 'WARNING', 'ERROR');
ALTER TABLE "Notification" ALTER COLUMN "severity" TYPE "Severity_new" USING ("severity"::text::"Severity_new");
ALTER TABLE "Log" ALTER COLUMN "eventType" TYPE "Severity_new" USING ("eventType"::text::"Severity_new");
ALTER TYPE "Severity" RENAME TO "Severity_old";
ALTER TYPE "Severity_new" RENAME TO "Severity";
DROP TYPE "Severity_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "IrrigationSchedule" DROP CONSTRAINT "IrrigationSchedule_deviceId_fkey";

-- DropForeignKey
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_recipientUserId_fkey";

-- DropForeignKey
ALTER TABLE "WaterUsage" DROP CONSTRAINT "WaterUsage_deviceId_fkey";

-- AlterTable
ALTER TABLE "Configuration" DROP COLUMN "location",
ADD COLUMN     "deviceType" "DeviceType" NOT NULL,
ADD COLUMN     "locationId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "DHT20Sensor" DROP COLUMN "humidityAccuracy",
DROP COLUMN "locationType",
DROP COLUMN "temperatureRangeMax",
DROP COLUMN "temperatureRangeMin",
ADD COLUMN     "humidityThresholdId" TEXT NOT NULL,
ADD COLUMN     "tempMaxId" TEXT NOT NULL,
ADD COLUMN     "tempMinId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Device" DROP COLUMN "lastUpdated",
DROP COLUMN "location",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "locationId" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Log" DROP COLUMN "timestamp",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
DROP COLUMN "eventType",
ADD COLUMN     "eventType" "Severity" NOT NULL;

-- AlterTable
ALTER TABLE "MoistureSensor" DROP COLUMN "calibrationValue",
DROP COLUMN "lastCalibrated",
DROP COLUMN "soilType",
DROP COLUMN "threshold",
ADD COLUMN     "thresholdId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Notification" DROP COLUMN "isRead",
DROP COLUMN "recipientUserId",
DROP COLUMN "timestamp",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "senderId" VARCHAR(36);

-- AlterTable
ALTER TABLE "Pump" DROP COLUMN "autoMode",
DROP COLUMN "energyConsumption",
DROP COLUMN "flowRate",
DROP COLUMN "maxRuntime",
DROP COLUMN "pressure",
ADD COLUMN     "mode" "Mode" NOT NULL DEFAULT 'AUTO';

-- AlterTable
ALTER TABLE "User" DROP CONSTRAINT "User_pkey",
DROP COLUMN "address",
ADD COLUMN     "locationId" TEXT,
ALTER COLUMN "userId" SET DATA TYPE TEXT,
ADD CONSTRAINT "User_pkey" PRIMARY KEY ("userId");

-- DropTable
DROP TABLE "IrrigationSchedule";

-- DropTable
DROP TABLE "WaterUsage";

-- DropEnum
DROP TYPE "LocationType";

-- DropEnum
DROP TYPE "SoilType";

-- CreateTable
CREATE TABLE "Location" (
    "locationId" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("locationId")
);

-- CreateTable
CREATE TABLE "NotificationRecipient" (
    "notificationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "NotificationRecipient_pkey" PRIMARY KEY ("notificationId","userId")
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
CREATE TABLE "Schedule" (
    "scheduleId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "repeatDays" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Schedule_pkey" PRIMARY KEY ("scheduleId")
);

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
ALTER TABLE "MoistureSensor" ADD CONSTRAINT "MoistureSensor_thresholdId_fkey" FOREIGN KEY ("thresholdId") REFERENCES "Configuration"("configId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DHT20Sensor" ADD CONSTRAINT "DHT20Sensor_tempMinId_fkey" FOREIGN KEY ("tempMinId") REFERENCES "Configuration"("configId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DHT20Sensor" ADD CONSTRAINT "DHT20Sensor_tempMaxId_fkey" FOREIGN KEY ("tempMaxId") REFERENCES "Configuration"("configId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DHT20Sensor" ADD CONSTRAINT "DHT20Sensor_humidityThresholdId_fkey" FOREIGN KEY ("humidityThresholdId") REFERENCES "Configuration"("configId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fan" ADD CONSTRAINT "Fan_fanId_fkey" FOREIGN KEY ("fanId") REFERENCES "Device"("deviceId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("deviceId") ON DELETE CASCADE ON UPDATE CASCADE;

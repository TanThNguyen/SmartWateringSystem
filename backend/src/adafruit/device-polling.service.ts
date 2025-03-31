import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AdafruitService } from './adafruit.service';
import { DeviceStatus, DeviceType, Severity } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { LOG_EVENT, LogEventPayload } from 'src/log/dto';
import { NOTIFICATION_EVENT, NotificationEventPayload, NotificationEventContext } from "src/notification/dto";

@Injectable()
export class DevicePollingService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DevicePollingService.name);
  private pollingIntervals: Map<string, NodeJS.Timeout> = new Map();
  private moistureBuffer: Map<string, { timestamp?: Date; count: number; timeout?: NodeJS.Timeout }> = new Map();
  private tempBuffer = new Map<string, { temperature: number; timestamp: Date; count: number; timeout?: NodeJS.Timeout }>();
  private humiBuffer = new Map<string, { humidity: number; timestamp: Date; count: number; timeout?: NodeJS.Timeout }>();
  private readonly ERROR_THRESHOLD = 5;
  private readonly MAX_POLLING_FAILURES = 3;
  private CLEANUP_DELAY = 5 * 60 * 1000;

  constructor(
    private readonly prisma: PrismaService,
    private readonly adafruitService: AdafruitService,
    private eventEmitter: EventEmitter2,
  ) { }

  async onModuleInit() {
    this.logger.log('DevicePollingService đã khởi động. Bắt đầu lấy dữ liệu...');    // --- BỔ SUNG LOG KHỞI ĐỘNG ---
    const logPayload: LogEventPayload = {
      eventType: Severity.INFO,
      description: 'DevicePollingService đã khởi động.'
    };
    this.eventEmitter.emit(LOG_EVENT, logPayload);
    // --- KẾT THÚC BỔ SUNG ---
    await this.startPollingForActiveDevices();
  }

  async startPollingForActiveDevices() {
    try {
      const activeDevices = await this.prisma.device.findMany({
        where: { status: DeviceStatus.ACTIVE, type: { in: [DeviceType.MOISTURE_SENSOR, DeviceType.DHT20_SENSOR] } },
      });

      this.logger.log(`Tìm thấy ${activeDevices.length} thiết bị cảm biến đang hoạt động để bắt đầu polling.`);

      for (const device of activeDevices) {
        const feedNames = this.adafruitService.getFeedNames(device);
        for (const feedName of feedNames) {
          this.startPolling(device.deviceId, device.type, feedName);
        }
      }

    } catch (error) {
      this.logger.error(`Lỗi nghiêm trọng khi khởi tạo polling: ${error.message}`, error.stack);
      // --- BỔ SUNG LOG & NOTIFICATION LỖI KHỞI TẠO ---
      const logPayloadError: LogEventPayload = {
        eventType: Severity.ERROR,
        description: `Lỗi nghiêm trọng khi khởi tạo polling thiết bị: ${error.message}`
      };
      this.eventEmitter.emit(LOG_EVENT, logPayloadError);

      const notiPayload: NotificationEventPayload = {
        severity: Severity.ERROR,
        messageTemplate: `Lỗi hệ thống Polling: Không thể bắt đầu giám sát thiết bị. Lỗi: {{errorMessage}}`,
        context: { errorMessage: error.message }
      };
      this.eventEmitter.emit(NOTIFICATION_EVENT, notiPayload);
      // --- KẾT THÚC BỔ SUNG ---
    }
  }

  startPolling(deviceId: string, deviceType: string, feedName: string, intervalMs = 10000) {
    if (this.pollingIntervals.has(feedName)) return;
    console.log(`Bắt đầu lấy dữ liệu từ '${feedName}' mỗi ${intervalMs / 1000} giây...`);

    let failureCount = 0;
    const maxFailures = 3;

    const interval = setInterval(async () => {
      try {
        const latestData = await this.adafruitService.getLatestFeedData(feedName);
        if (latestData) {
          failureCount = 0; // Reset bộ đếm nếu lấy dữ liệu thành công
          await this.processDeviceData(deviceId, deviceType, latestData);
        }
      } catch (error) {
        failureCount++;
        console.error(`Lỗi khi lấy dữ liệu từ '${feedName}' (lần ${failureCount}):`, error);

        if (failureCount >= maxFailures) {
          clearInterval(interval);
          this.pollingIntervals.delete(feedName);
          console.warn(`Thiết bị ${deviceId} không phản hồi sau ${maxFailures} lần thử, tiến hành vô hiệu hóa.`);
          await this.disableDevice(deviceId);
        }
      }
    }, intervalMs);

    this.pollingIntervals.set(feedName, interval);
  }

  async processDeviceData(deviceId: string, deviceType: string, data: any) {
    const timestamp = new Date(data.created_at);
    const parsedValue = parseFloat(data.value);

    if (deviceType === 'MOISTURE_SENSOR') {
      await this.handleMoistureSensor(deviceId, timestamp, parsedValue);
    } else if (deviceType === 'DHT20_SENSOR') {
      await this.handleDHT20Sensor(deviceId, timestamp, data.feed_key, parsedValue);
    }
  }

  async handleMoistureSensor(deviceId: string, timestamp: Date, value: number) {
    const buffer = this.moistureBuffer.get(deviceId) || { count: 0 };

    if (buffer.timestamp?.getTime() === timestamp.getTime()) {
      buffer.count++;
      if (buffer.count >= this.ERROR_THRESHOLD) {
        this.moistureBuffer.delete(deviceId);
        await this.disableDevice(deviceId);
      }
      console.log(`Bỏ qua dữ liệu trùng lặp từ thiết bị ${deviceId} tại timestamp ${timestamp}`);
      return;
    }

    buffer.timestamp = timestamp;
    buffer.count = 0;

    if (buffer.timeout) clearTimeout(buffer.timeout);

    buffer.timeout = setTimeout(() => {
      console.log(`🧹 Dọn dẹp buffer của thiết bị ${deviceId}`);
      this.moistureBuffer.delete(deviceId);
    }, this.CLEANUP_DELAY);

    this.moistureBuffer.set(deviceId, buffer);

    await this.prisma.moistureRecord.create({
      data: { sensorId: deviceId, timestamp, soilMoisture: value },
    });
    console.log(`✅ Dữ liệu Moisture của ${deviceId} đã được lưu: Độ ẩm đất = ${value}`);
  }


  async handleDHT20Sensor(deviceId: string, timestamp: Date, feedKey: string, value: number) {
    const isTemperature = feedKey.startsWith('nhietdo');
    const buffer = isTemperature ? this.tempBuffer.get(deviceId) : this.humiBuffer.get(deviceId);

    if (buffer?.timestamp?.getTime() === timestamp.getTime()) {
      buffer.count++;
      if (buffer.count >= this.ERROR_THRESHOLD) {
        this.tempBuffer.delete(deviceId);
        this.humiBuffer.delete(deviceId);
        await this.disableDevice(deviceId);
      }
      console.log(`⚠ Bỏ qua dữ liệu trùng lặp từ thiết bị ${deviceId} tại timestamp ${timestamp}`);
      return;
    }

    if (isTemperature) {
      this.tempBuffer.set(deviceId, { temperature: value, timestamp, count: 0 });
    } else {
      this.humiBuffer.set(deviceId, { humidity: value, timestamp, count: 0 });
    }

    const tempData = this.tempBuffer.get(deviceId);
    const humiData = this.humiBuffer.get(deviceId);

    if (tempData && humiData && tempData.timestamp?.getTime() === humiData.timestamp?.getTime()) {
      await this.prisma.dHT20Record.create({
        data: {
          sensorId: deviceId,
          timestamp: tempData.timestamp,
          temperature: tempData.temperature,
          humidity: humiData.humidity,
        },
      });
      console.log(`✅ Dữ liệu DHT20 của ${deviceId} đã được lưu: Nhiệt độ = ${tempData.temperature}, Độ ẩm = ${humiData.humidity}`);
    }

    const cleanupTimeout = setTimeout(() => {
      console.warn(`⚠ Dọn dẹp buffer cho thiết bị ${deviceId} do timeout`);
      this.tempBuffer.delete(deviceId);
      this.humiBuffer.delete(deviceId);
    }, this.CLEANUP_DELAY);

    if (tempData) this.tempBuffer.set(deviceId, { ...tempData, timeout: cleanupTimeout });
    if (humiData) this.humiBuffer.set(deviceId, { ...humiData, timeout: cleanupTimeout });
  }


  async disableDevice(deviceId: string) {
    try {
      console.log(`⚠ Thiết bị ${deviceId} không phản hồi, chuyển sang trạng thái INACTIVE.`);

      const device = await this.prisma.device.update({
        where: { deviceId },
        data: { status: DeviceStatus.INACTIVE },
      });

      if (!device) {
        console.warn(`❌ Không tìm thấy thiết bị ${deviceId}.`);
        return;
      }

      const feedNames = this.adafruitService.getFeedNames(device);
      for (const feedName of feedNames) {
        this.stopPolling(feedName);
      }

      // await this.logService.create({
      //   userId: '',
      //   deviceId,
      //   eventType: 'WARNING',
      //   description: `Thiết bị ${device.name} đã bị vô hiệu hóa do không phản hồi.`,
      // });

      // await this.notificationService.create({
      //   senderId: '',
      //   message: `Thiết bị ${deviceId} đã bị vô hiệu hóa do không phản hồi.`,
      //   severity: 'WARNING',
      //   recipientIds: await this.getAdminUserIds(),
      // });

      // --- BỔ SUNG LOG & NOTIFICATION VÔ HIỆU HÓA ---
      const logPayloadDisable: LogEventPayload = {
        deviceId: deviceId,
        eventType: Severity.WARNING, // Cảnh báo vì thiết bị bị vô hiệu hóa
        description: `Thiết bị '${device.name}' đã bị vô hiệu hóa do không phản hồi.`
      };
      this.eventEmitter.emit(LOG_EVENT, logPayloadDisable);

      const notiContext: NotificationEventContext = { deviceId: deviceId, errorMessage: "do không phản hồi." };
      const notiPayload: NotificationEventPayload = {
        severity: Severity.WARNING, // Cảnh báo cho Admin
        messageTemplate: `Thiết bị {{deviceId}} ('${device.name}') đã bị vô hiệu hóa tự động. Lý do: {{errorMessage}}`,
        context: notiContext
      };
      this.eventEmitter.emit(NOTIFICATION_EVENT, notiPayload);
      // --- KẾT THÚC BỔ SUNG ---

      console.log(`✅ Thiết bị ${device.name} đã được vô hiệu hóa và dừng polling.`);
    } catch (error) {
      console.error(`❌ Lỗi khi vô hiệu hóa thiết bị ${deviceId}:`, error);
    }
  }

  async getAdminUserIds(): Promise<string[]> {
    const admins = await this.prisma.user.findMany({ where: { role: 'ADMIN' } });
    return admins.map(admin => admin.userId);
  }

  stopPolling(feedName: string) {
    if (this.pollingIntervals.has(feedName)) {
      clearInterval(this.pollingIntervals.get(feedName)!);
      this.pollingIntervals.delete(feedName);
      console.log(`Dừng lấy dữ liệu từ '${feedName}'`);
    }
  }

  async stopPollingForInactiveDevices() {
    const inactiveDevices = await this.prisma.device.findMany({ where: { status: 'INACTIVE' } });
    for (const device of inactiveDevices) {
      const feedNames = this.adafruitService.getFeedNames(device);
      for (const feedName of feedNames) {
        this.stopPolling(feedName);
      }
    }
  }

  async refreshPolling() {
    console.log('Refreshing polling...');
    await this.stopPollingForInactiveDevices();
    await this.startPollingForActiveDevices();
  }

  onModuleDestroy() {
    this.pollingIntervals.forEach((interval, feedName) => {
      clearInterval(interval);
      console.log(`Dừng lấy dữ liệu (khi module bị hủy) từ '${feedName}'`);
    });
    this.pollingIntervals.clear();
  }
}






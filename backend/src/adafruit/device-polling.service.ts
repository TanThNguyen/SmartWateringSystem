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

  private failureCounters: Map<string, number> = new Map();
  private readonly SENSOR_DUPLICATE_THRESHOLD = 5;
  private readonly SENSOR_MAX_POLLING_FAILURES = 3;
  private readonly ACTUATOR_FAILURE_THRESHOLD = 5;
  private readonly ACTUATOR_POLL_INTERVAL = 60 * 1000;
  private readonly SENSOR_POLL_INTERVAL = 10 * 1000;
  private readonly CLEANUP_DELAY = 5 * 60 * 1000;

  constructor(
    private readonly prisma: PrismaService,
    private readonly adafruitService: AdafruitService,
    private eventEmitter: EventEmitter2,
  ) { }

  async onModuleInit() {
    this.logger.log('DevicePollingService đã khởi động. Bắt đầu lấy dữ liệu...');

    // // --- BỔ SUNG LOG KHỞI ĐỘNG ---
    // const logPayload: LogEventPayload = {
    //   eventType: Severity.INFO,
    //   description: 'DevicePollingService đã khởi động.'
    // };
    // this.eventEmitter.emit(LOG_EVENT, logPayload);
    // // --- KẾT THÚC BỔ SUNG ---

    await this.startPollingForActiveDevices();
  }

  async startPollingForActiveDevices() {
    try {
      const devicesToPoll = await this.prisma.device.findMany({
        where: {
          OR: [
            { 
              type: { in: [DeviceType.MOISTURE_SENSOR, DeviceType.DHT20_SENSOR] }, 
              status: DeviceStatus.ACTIVE 
            },
            { 
              type: { in: [DeviceType.PUMP, DeviceType.FAN] } 
            }
          ]
        }
      });
      


      this.logger.log(`Tìm thấy ${devicesToPoll.length} thiết bị bắt đầu polling.`);

      for (const device of devicesToPoll) {
        const feedNames = this.adafruitService.getFeedNames(device);
        const interval = this.getIntervalForDevice(device.type);
        for (const feedName of feedNames) {
          this.startPolling(device.deviceId, device.type, device.status, device.name, device.locationId || 'noId', feedName, interval);
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

  getIntervalForDevice(deviceType: DeviceType): number {
    switch (deviceType) {
      case DeviceType.PUMP:
      case DeviceType.FAN:
        return this.ACTUATOR_POLL_INTERVAL;
      case DeviceType.MOISTURE_SENSOR:
      case DeviceType.DHT20_SENSOR:
        return this.SENSOR_POLL_INTERVAL;
      // Add other sensor types here if needed
      // case DeviceType.LCD: // Example if LCD needed polling
      // case DeviceType.LED: // Example if LED needed polling
      //    return SOME_OTHER_INTERVAL;
      default:
        return this.SENSOR_POLL_INTERVAL;
    }
  }

  startPolling(deviceId: string, deviceType: DeviceType, initialDbStatus: DeviceStatus, deviceName: string, locationId: string, feedName: string, intervalMs: number) {
    if (this.pollingIntervals.has(feedName)) return;

    console.log(`Bắt đầu lấy dữ liệu từ '${feedName}' mỗi ${intervalMs / 1000} giây...`);
    this.failureCounters.set(feedName, 0);

    const interval = setInterval(async () => {
      // let currentDeviceInDb: Device | null = null;
      try {
        const latestData = await this.adafruitService.getLatestFeedData(feedName);
        if (latestData) {
          this.failureCounters.set(feedName, 0);

          await this.processDeviceData(deviceId, deviceType, initialDbStatus, deviceName, latestData);

        } else {

          this.handlePollingFailure(deviceId, deviceType, deviceName, locationId, feedName, new Error('Received null or undefined data from Adafruit feed'), interval);

        }
      } catch (error) {

        this.handlePollingFailure(deviceId, deviceType, deviceName, locationId, feedName, error as Error, interval);

      }
    }, intervalMs);

    this.pollingIntervals.set(feedName, interval);
  }

  handlePollingFailure(deviceId: string, deviceType: DeviceType, deviceName: string, locationId: string, feedName: string, error: Error, interval: NodeJS.Timeout) {

    let currentFailures = (this.failureCounters.get(feedName) || 0) + 1;
    this.failureCounters.set(feedName, currentFailures);

    this.logger.error(`Error polling feed '${feedName}' (Device: ${deviceName}, Type: ${deviceType}, Attempt ${currentFailures}): ${error.message}`);

    const isSensor = deviceType === DeviceType.MOISTURE_SENSOR || deviceType === DeviceType.DHT20_SENSOR;
    const isActuator = deviceType === DeviceType.PUMP || deviceType === DeviceType.FAN;

    // Sensor: Disable after N failures
    if (isSensor && currentFailures >= this.SENSOR_MAX_POLLING_FAILURES) {
      this.logger.warn(`Sensor feed '${feedName}' (Device: ${deviceName}) failed ${currentFailures} times. Disabling device ${deviceId}.`);
      clearInterval(interval);
      this.pollingIntervals.delete(feedName);
      this.failureCounters.delete(feedName);
      this.disableDevice(deviceId, deviceName, `Liên tục không thể lấy dữ liệu từ cảm biến sau ${this.SENSOR_MAX_POLLING_FAILURES} lần thử.`);
    }
    // Actuator: Warn after N failures, keep polling
    else if (isActuator && currentFailures === this.ACTUATOR_FAILURE_THRESHOLD) {
      this.logger.warn(`Actuator feed '${feedName}' (Device: ${deviceName}) failed ${currentFailures} times. Status checks unreliable. Polling continues.`);

      const logPayload: LogEventPayload = {
        deviceId: deviceId,
        eventType: Severity.WARNING,
        description: `Thiết bị '${deviceName}' (${deviceType}) không phản hồi ${currentFailures} lần liên tiếp (feed '${feedName}')`
      };
      this.eventEmitter.emit(LOG_EVENT, logPayload);

      const notiContext: NotificationEventContext = {
        deviceId: deviceId,
        errorMessage: `Không phản hồi ${currentFailures} lần liên tiếp qua feed '${feedName}'`
      };
      const notiPayload: NotificationEventPayload = {
        severity: Severity.WARNING,
        messageTemplate: `Thiết bị {{deviceId}} ('${deviceName}') không phản hồi nhiều lần. Chi tiết: {{errorMessage}}`,
        context: notiContext
      };
      this.eventEmitter.emit(NOTIFICATION_EVENT, notiPayload);
    }
  }

  async processDeviceData(deviceId: string, deviceType: DeviceType, currentDbStatus: DeviceStatus, deviceName: string, data: any) {
    const timestamp = new Date(data.created_at);
    const value = data.value;

    switch (deviceType) {
      case DeviceType.MOISTURE_SENSOR:
        await this.handleMoistureSensor(deviceId, deviceName, timestamp, parseFloat(value));
        break;

      case DeviceType.DHT20_SENSOR:
        if (!data.feed_key) {
          this.logger.warn(`Missing feed_key in DHT20 data for ${deviceName} (${deviceId}). Skipping.`);
          return;
        }
        await this.handleDHT20Sensor(deviceId, deviceName, timestamp, data.feed_key, parseFloat(value));
        break;

      case DeviceType.PUMP:
      case DeviceType.FAN:
        await this.handleActuatorStatus(deviceId, deviceType, deviceName, currentDbStatus, value);
        break;

      default:
        this.logger.warn(`Received data for unhandled or non-polling device type: ${deviceType} (${deviceName} - ${deviceId})`);
        break;
    }
  }

  async handleMoistureSensor(deviceId: string, deviceName: string, timestamp: Date, value: number) {
    if (isNaN(value)) {
      this.logger.warn(`Invalid numeric value for MOISTURE_SENSOR ${deviceName} (${deviceId}): ${value}`);
      return;
    }

    const buffer = this.moistureBuffer.get(deviceId) || { count: 0 };

    if (buffer.timestamp?.getTime() === timestamp.getTime()) {
      buffer.count++;
      if (buffer.count >= this.SENSOR_DUPLICATE_THRESHOLD) {
        this.moistureBuffer.delete(deviceId);
        if (buffer.timeout) clearTimeout(buffer.timeout);
        this.disableDevice(deviceId, deviceName, `Gửi dữ liệu trùng lặp (timestamp) quá ${this.SENSOR_DUPLICATE_THRESHOLD} lần.`);
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

    try {
      await this.prisma.moistureRecord.create({
        data: { sensorId: deviceId, timestamp, soilMoisture: value },
      });
      console.log(`✅ Dữ liệu Moisture của ${deviceId} đã được lưu: Độ ẩm đất = ${value}`);
    } catch (error) {
      this.logger.error(`Failed to save MoistureRecord for ${deviceName} (${deviceId}): ${(error as Error).message}`);
    }
  }


  async handleDHT20Sensor(deviceId: string, deviceName: string, timestamp: Date, feedKey: string, value: number) {
    if (isNaN(value)) {
      this.logger.warn(`Invalid numeric value for DHT20_SENSOR ${deviceName} (${deviceId}), feed ${feedKey}: ${value}`);
      return;
    }

    const isTemperature = feedKey.startsWith('nhietdo');
    const buffer = isTemperature ? this.tempBuffer.get(deviceId) : this.humiBuffer.get(deviceId);

    if (buffer?.timestamp?.getTime() === timestamp.getTime()) {
      buffer.count++;
      if (buffer.count >= this.SENSOR_DUPLICATE_THRESHOLD) {
        this.tempBuffer.delete(deviceId);
        this.humiBuffer.delete(deviceId);
        this.disableDevice(deviceId, deviceName, `Gửi dữ liệu nhiệt độ trùng lặp (timestamp) quá ${this.SENSOR_DUPLICATE_THRESHOLD} lần.`);
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

  async handleActuatorStatus(deviceId: string, deviceType: DeviceType, deviceName: string, currentDbStatus: DeviceStatus, polledValue: string) {
    let polledStatus: DeviceStatus;
    const upperPolledValue = polledValue?.toUpperCase(); // Add safe navigation

    if (upperPolledValue === '1' || upperPolledValue === 'ON') {
      polledStatus = DeviceStatus.ACTIVE;
    } else if (upperPolledValue === '0' || upperPolledValue === 'OFF') {
      polledStatus = DeviceStatus.INACTIVE;
    } else {
      this.logger.warn(`Unexpected status value '${polledValue}' for ${deviceType} ${deviceName} (${deviceId}). Ignoring.`);
      return;
    }

    if (polledStatus !== currentDbStatus) {
      this.logger.log(`Status change detected for ${deviceName} (${deviceId}): ${currentDbStatus} -> ${polledStatus}. Updating DB.`);
      try {
        await this.prisma.device.update({
          where: { deviceId },
          data: { status: polledStatus },
        });

        const logPayload: LogEventPayload = {
          deviceId: deviceId,
          eventType: Severity.INFO,
          description: `Trạng thái thiết bị '${deviceName}' (${deviceType}) cập nhật: ${currentDbStatus} -> ${polledStatus} (polled).`
        };
        this.eventEmitter.emit(LOG_EVENT, logPayload);

        // Optional notification for status change
        // const notiContext: NotificationEventContext = { deviceId: deviceId, /* add other relevant context from DTO */ };
        // const notiPayload: NotificationEventPayload = {
        //   severity: Severity.INFO,
        //   messageTemplate: `Trạng thái thiết bị {{deviceId}} ('${deviceName}') cập nhật: ${currentDbStatus} -> ${polledStatus}`,
        //   context: notiContext
        // };
        // this.eventEmitter.emit(NOTIFICATION_EVENT, notiPayload);

      } catch (error) {
        this.logger.error(`Failed to update status for ${deviceName} (${deviceId}): ${(error as Error).message}`);
        const logPayloadError: LogEventPayload = {
          deviceId: deviceId,
          eventType: Severity.ERROR,
          description: `Lỗi cập nhật trạng thái ${deviceType} '${deviceName}': ${(error as Error).message}`
        };
        this.eventEmitter.emit(LOG_EVENT, logPayloadError);
      }
    }
  }

  async disableDevice(deviceId: string, deviceName: string, reason: string = "không phản hồi.") {
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

      // --- BỔ SUNG LOG & NOTIFICATION VÔ HIỆU HÓA ---
      const logPayloadDisable: LogEventPayload = {
        deviceId: deviceId,
        eventType: Severity.WARNING, // Cảnh báo vì thiết bị bị vô hiệu hóa
        description: `Thiết bị '${device.name}' đã bị vô hiệu hóa. Lý do: ${reason}`
      };
      this.eventEmitter.emit(LOG_EVENT, logPayloadDisable);

      const notiContext: NotificationEventContext = { deviceId: deviceId, errorMessage: reason };
      const notiPayload: NotificationEventPayload = {
        severity: Severity.WARNING, // Cảnh báo cho Admin
        messageTemplate: `Thiết bị {{deviceId}} ('${device.name}') đã bị vô hiệu hóa tự động. Lý do: {{errorMessage}}`,
        context: notiContext
      };
      this.eventEmitter.emit(NOTIFICATION_EVENT, notiPayload);
      // --- KẾT THÚC BỔ SUNG ---

      console.log(`✅ Thiết bị ${device.name} đã được vô hiệu hóa và dừng polling.`);
    } catch (error) {

      const logPayloadError: LogEventPayload = {
        deviceId: deviceId,
        eventType: Severity.ERROR,
        description: `Lỗi khi cố gắng vô hiệu hóa thiết bị '${deviceName}' (${deviceId}): {{errorMessage}}`
      };
      this.eventEmitter.emit(LOG_EVENT, logPayloadError);

      console.error(`❌ Lỗi khi vô hiệu hóa thiết bị ${deviceId}:`, error);
    }
  }

  // async getAdminUserIds(): Promise<string[]> {
  //   const admins = await this.prisma.user.findMany({ where: { role: 'ADMIN' } });
  //   return admins.map(admin => admin.userId);
  // }

  stopPolling(feedName: string) {
    if (this.pollingIntervals.has(feedName)) {
      clearInterval(this.pollingIntervals.get(feedName)!);
      this.pollingIntervals.delete(feedName);
      console.log(`Dừng lấy dữ liệu từ '${feedName}'`);
    }
  }

  async stopPollingForInactiveDevices() {
    const inactiveDevices = await this.prisma.device.findMany({
      where: {
        type: { in: [DeviceType.MOISTURE_SENSOR, DeviceType.DHT20_SENSOR] },
        status: DeviceStatus.INACTIVE
      }
    });
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






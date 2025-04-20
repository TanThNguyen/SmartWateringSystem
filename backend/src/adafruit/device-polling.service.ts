import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AdafruitService } from './adafruit.service';
import { DeviceStatus, DeviceType, Severity } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { LOG_EVENT, LogEventPayload } from 'src/log/dto';
import { NOTIFICATION_EVENT, NotificationEventPayload, NotificationEventContext } from "src/notification/dto";
import { DecisionService, LatestSensorState } from 'src/decision/decision.service';

@Injectable()
export class DevicePollingService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DevicePollingService.name);
  private pollingIntervals: Map<string, NodeJS.Timeout> = new Map();
  private failureCounters: Map<string, number> = new Map();

  private moistureBuffer: Map<string, { timestamp?: Date; count: number; timeout?: NodeJS.Timeout }> = new Map();
  private tempBuffer = new Map<string, { temperature: number; timestamp: Date; count: number; timeout?: NodeJS.Timeout }>();
  private humiBuffer = new Map<string, { humidity: number; timestamp: Date; count: number; timeout?: NodeJS.Timeout }>();

  private latestLocationSensorState: Map<string, LatestSensorState> = new Map();

  private readonly SENSOR_DUPLICATE_THRESHOLD = 5;
  private readonly SENSOR_MAX_POLLING_FAILURES = 3;
  private readonly ACTUATOR_FAILURE_THRESHOLD = 5;
  private readonly ACTUATOR_POLL_INTERVAL = 60 * 1000;
  private readonly SENSOR_POLL_INTERVAL = 10 * 1000;
  private readonly CLEANUP_DELAY = 5 * 60 * 1000;
  private readonly SEVEN_HOURS_IN_MS = 7 * 60 * 60 * 1000;

  constructor(
    private readonly prisma: PrismaService,
    private readonly adafruitService: AdafruitService,
    private eventEmitter: EventEmitter2,
    private readonly decisionService: DecisionService,
  ) { }

  async onModuleInit() {
    this.logger.log('DevicePollingService đã khởi động. Bắt đầu lấy dữ liệu...');
    await this.startPollingForActiveDevices();
  }

  async startPollingForActiveDevices() {
    this.logger.log('Bắt đầu tìm kiếm thiết bị để polling...');
    try {
      const devicesToPoll = await this.prisma.device.findMany({
        where: {
          OR: [
            {
              type: { in: [DeviceType.MOISTURE_SENSOR, DeviceType.DHT20_SENSOR] },
              status: DeviceStatus.ACTIVE,
              locationId: { not: null }
            },
            {
              type: { in: [DeviceType.PUMP, DeviceType.FAN] },
              locationId: { not: null }
            }
          ]
        },
        select: { deviceId: true, name: true, type: true, status: true, locationId: true }
      });

      this.logger.log(`Tìm thấy ${devicesToPoll.length} thiết bị hợp lệ.`);

      const uniqueLocationIds = new Set<string>();
      devicesToPoll.forEach(device => {
        if (device.locationId && (device.type === DeviceType.MOISTURE_SENSOR || device.type === DeviceType.DHT20_SENSOR)) {
          uniqueLocationIds.add(device.locationId);
        }
      });

      uniqueLocationIds.forEach(locId => {
        if (!this.latestLocationSensorState.has(locId)) {
          this.latestLocationSensorState.set(locId, {});
          this.logger.verbose(`Khởi tạo state buffer cho locationId: ${locId}`);
        }
      });

      for (const device of devicesToPoll) {
        if (!device.locationId) {
          this.logger.warn(`Bỏ qua polling ${device.name} (${device.deviceId}) vì không có locationId.`);
          continue;
        }

        const feedNames = this.adafruitService.getFeedNames(device as any);
        const interval = this.getIntervalForDevice(device.type);

        for (const feedName of feedNames) {
          this.startPolling(device, feedName, interval);
        }
      }
      this.logger.log('Khởi tạo polling hoàn tất.');
    } catch (error) {
      this.logger.error(`Lỗi nghiêm trọng khi khởi tạo polling: ${error.message}`, error.stack);
      const logPayloadError: LogEventPayload = { eventType: Severity.ERROR, description: `Lỗi nghiêm trọng khi khởi tạo polling thiết bị: ${error.message}` };
      this.eventEmitter.emit(LOG_EVENT, logPayloadError);
      const notiPayload: NotificationEventPayload = { severity: Severity.ERROR, messageTemplate: `Lỗi hệ thống Polling: Không thể bắt đầu giám sát thiết bị. Lỗi: {{errorMessage}}`, context: { errorMessage: error.message } };
      this.eventEmitter.emit(NOTIFICATION_EVENT, notiPayload);
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
      default:
        this.logger.warn(`Sử dụng SENSOR_POLL_INTERVAL mặc định cho loại thiết bị không xác định: ${deviceType}`);
        return this.SENSOR_POLL_INTERVAL;
    }
  }

  startPolling(device: { deviceId: string, name: string, type: DeviceType, status: DeviceStatus, locationId: string | null }, feedName: string, intervalMs: number) {
    if (this.pollingIntervals.has(feedName)) {
      return;
    }

    this.logger.log(`Bắt đầu lấy dữ liệu từ '${feedName}' (Thiết bị: ${device.name}, ID: ${device.deviceId}) mỗi ${intervalMs / 1000} giây...`);
    this.failureCounters.set(feedName, 0);

    const interval = setInterval(async () => {
      try {
        const latestData = await this.adafruitService.getLatestFeedData(feedName);
        if (latestData !== null && typeof latestData !== 'undefined') {
          const previousFailures = this.failureCounters.get(feedName) ?? 0; // Sử dụng ?? 0 để xử lý undefined
          if (previousFailures > 0) {
            this.logger.log(`Polling cho '${feedName}' thành công sau ${previousFailures} lần thất bại.`);
          }
          this.failureCounters.set(feedName, 0);
          await this.processDeviceData(device, latestData);
        } else {
          this.handlePollingFailure(device, feedName, new Error('Nhận được dữ liệu null hoặc undefined từ Adafruit'), interval);
        }
      } catch (error) {
        this.handlePollingFailure(device, feedName, error as Error, interval);
      }
    }, intervalMs);

    this.pollingIntervals.set(feedName, interval);
  }

  handlePollingFailure(device: { deviceId: string, name: string, type: DeviceType, status: DeviceStatus, locationId: string | null }, feedName: string, error: Error, interval: NodeJS.Timeout) {
    let currentFailures = (this.failureCounters.get(feedName) || 0) + 1; // || 0 xử lý undefined
    this.failureCounters.set(feedName, currentFailures);

    this.logger.error(`Lỗi polling feed '${feedName}' (Device: ${device.name}, Type: ${device.type}, Lần ${currentFailures}): ${error.message}`);

    const isSensor = device.type === DeviceType.MOISTURE_SENSOR || device.type === DeviceType.DHT20_SENSOR;
    const isActuator = device.type === DeviceType.PUMP || device.type === DeviceType.FAN;

    if (isSensor && currentFailures >= this.SENSOR_MAX_POLLING_FAILURES) {
      this.logger.warn(`Sensor feed '${feedName}' (${device.name}) thất bại ${currentFailures} lần. Vô hiệu hóa thiết bị ${device.deviceId}.`);
      this.stopPolling(feedName);
      this.disableDevice(device.deviceId, device.name, device.locationId, `Lỗi polling liên tục (${this.SENSOR_MAX_POLLING_FAILURES} lần) từ feed '${feedName}'.`);
    } else if (isActuator && currentFailures >= this.ACTUATOR_FAILURE_THRESHOLD) {
      this.logger.warn(`Actuator feed '${feedName}' (${device.name}) thất bại ${currentFailures} lần. Trạng thái có thể không đúng.`);
      const logPayload: LogEventPayload = { 
        deviceId: device.deviceId, 
        eventType: Severity.WARNING, 
        description: `Thiết bị '${device.name}' (${device.type}) không phản hồi ${currentFailures} lần liên tiếp (feed '${feedName}')` 
      };
      this.eventEmitter.emit(LOG_EVENT, logPayload);
      const notiContext: NotificationEventContext = { 
        deviceId: device.deviceId, 
        locationId: device.locationId || 'N/A', 
        errorMessage: `Feed '${feedName}' không phản hồi ${currentFailures} lần.` 
      };
      const notiPayload: NotificationEventPayload = {
         severity: Severity.WARNING, 
         messageTemplate: `Thiết bị {{deviceId}} ('${device.name}' tại {{locationId}}) không phản hồi nhiều lần. Chi tiết: {{errorMessage}}`, 
         context: notiContext 
        };
      this.eventEmitter.emit(NOTIFICATION_EVENT, notiPayload);
    }
  }

  async processDeviceData(device: { deviceId: string, name: string, type: DeviceType, status: DeviceStatus, locationId: string | null }, data: any) {
    const timestamp = new Date(data.created_at);
    const value = data.value;

    switch (device.type) {
      case DeviceType.MOISTURE_SENSOR:
        if (!device.locationId) {
          this.logger.warn(`Bỏ qua xử lý MoistureSensor ${device.name} (${device.deviceId}): thiếu locationId.`);
          return;
        }
        await this.handleMoistureSensor(device.deviceId, device.name, device.locationId, timestamp, parseFloat(value));
        break;

      case DeviceType.DHT20_SENSOR:
        if (!data.feed_key) {
          this.logger.warn(`Bỏ qua dữ liệu DHT20 cho ${device.name} (${device.deviceId}): thiếu feed_key.`);
          return;
        }
        if (!device.locationId) {
          this.logger.warn(`Bỏ qua xử lý DHT20Sensor ${device.name} (${device.deviceId}): thiếu locationId.`);
          return;
        }
        await this.handleDHT20Sensor(device.deviceId, device.name, device.locationId, timestamp, data.feed_key, parseFloat(value));
        break;

      case DeviceType.PUMP:
      case DeviceType.FAN:
        await this.handleActuatorStatus(device.deviceId, device.type, device.name, device.status, value);
        break;

      default:
        this.logger.warn(`Nhận dữ liệu cho loại thiết bị không xử lý: ${device.type} (${device.name} - ${device.deviceId})`);
        break;
    }
  }

  async handleMoistureSensor(deviceId: string, deviceName: string, locationId: string, timestamp: Date, value: number) {
    if (isNaN(value)) {
      this.logger.warn(`Giá trị không hợp lệ cho MOISTURE_SENSOR ${deviceName} (${deviceId}): ${value}`);
      return;
    }
    const buffer = this.moistureBuffer.get(deviceId) || { count: 0 };
    if (buffer.timestamp?.getTime() === timestamp.getTime()) {
      buffer.count++;
      if (buffer.count >= this.SENSOR_DUPLICATE_THRESHOLD) {
        this.logger.warn(`Ngưỡng dữ liệu trùng lặp đạt đến cho ${deviceName} (${deviceId}). Vô hiệu hóa.`);
        this.moistureBuffer.delete(deviceId);
        if (buffer.timeout) clearTimeout(buffer.timeout);
        this.disableDevice(deviceId, deviceName, locationId, `Dữ liệu trùng lặp (timestamp) nhận được ${this.SENSOR_DUPLICATE_THRESHOLD} lần.`);
      } else {
        this.logger.debug(`Bỏ qua dữ liệu độ ẩm trùng lặp từ ${deviceId} (lần: ${buffer.count})`);
        this.moistureBuffer.set(deviceId, buffer);
      }
      return;
    }
    buffer.timestamp = timestamp;
    buffer.count = 1;
    if (buffer.timeout) clearTimeout(buffer.timeout);
    buffer.timeout = setTimeout(() => {
      this.logger.debug(`Dọn dẹp buffer trùng lặp độ ẩm cho ${deviceId}`);
      this.moistureBuffer.delete(deviceId);
    }, this.CLEANUP_DELAY);
    this.moistureBuffer.set(deviceId, buffer);

    try {
      const timestampUTC = new Date(timestamp.getTime() - this.SEVEN_HOURS_IN_MS);
      await this.prisma.moistureRecord.create({
        data: { sensorId: deviceId, timestamp: timestampUTC, soilMoisture: value },
      });
      this.logger.debug(`✅ Dữ liệu Moisture của ${deviceId} (${deviceName}) đã lưu: ${value}%`);

      const locationState = this.latestLocationSensorState.get(locationId) || {};
      locationState.soilMoisture = value;
      locationState.lastUpdate = new Date();
      this.latestLocationSensorState.set(locationId, locationState);
      this.logger.verbose(`State của location ${locationId} cập nhật: Moisture=${value}`);

      await this.decisionService.processSensorDataForDecision(locationId, locationState);

    } catch (error) {
      this.logger.error(`Lỗi lưu MoistureRecord cho ${deviceName} (${deviceId}): ${error.message}`);
      const logPayloadError: LogEventPayload = { 
        deviceId: deviceId, 
        eventType: Severity.ERROR, 
        description: `Không thể lưu MoistureRecord: ${error.message}` 
      };
      this.eventEmitter.emit(LOG_EVENT, logPayloadError);
    }
  }

  async handleDHT20Sensor(deviceId: string, deviceName: string, locationId: string, timestamp: Date, feedKey: string, value: number) {
    if (isNaN(value)) {
      this.logger.warn(`Giá trị không hợp lệ cho DHT20_SENSOR ${deviceName} (${deviceId}), feed ${feedKey}: ${value}`);
      return;
    }
    const isTemperature = feedKey.startsWith('nhietdo');
    const bufferKey = isTemperature ? 'temp' : 'humi';
    const specificBuffer = isTemperature ? this.tempBuffer : this.humiBuffer;
    const buffer = specificBuffer.get(deviceId) || { count: 0 };
    // @ts-ignore
    if (buffer.timestamp?.getTime() === timestamp.getTime()) {
      // @ts-ignore
      buffer.count++;
      // @ts-ignore
      if (buffer.count >= this.SENSOR_DUPLICATE_THRESHOLD) {
        this.logger.warn(`Ngưỡng dữ liệu ${bufferKey} trùng lặp đạt đến cho ${deviceName} (${deviceId}). Vô hiệu hóa.`);
        this.tempBuffer.delete(deviceId); this.humiBuffer.delete(deviceId);
        // @ts-ignore
        if (buffer.timeout) clearTimeout(buffer.timeout);
        this.disableDevice(deviceId, deviceName, locationId, `Dữ liệu ${bufferKey} trùng lặp nhận được ${this.SENSOR_DUPLICATE_THRESHOLD} lần.`);
      } else {
        this.logger.debug(`Bỏ qua dữ liệu ${bufferKey} trùng lặp từ ${deviceId} (lần: ${buffer.count})`);
        // @ts-ignore
        specificBuffer.set(deviceId, buffer);
      }
      return;
    }
    if (isTemperature) { this.tempBuffer.set(deviceId, { temperature: value, timestamp, count: 1 }); }
    else { this.humiBuffer.set(deviceId, { humidity: value, timestamp, count: 1 }); }
    // @ts-ignore
    if (buffer.timeout) clearTimeout(buffer.timeout);
    const newTimeout = setTimeout(() => { this.logger.debug(`Dọn dẹp buffer trùng lặp ${bufferKey} cho ${deviceId}`); specificBuffer.delete(deviceId); }, this.CLEANUP_DELAY);
    // @ts-ignore
    specificBuffer.set(deviceId, { ...(specificBuffer.get(deviceId)), timeout: newTimeout });

    const locationState = this.latestLocationSensorState.get(locationId) || {};
    locationState.lastUpdate = new Date();
    if (isTemperature) {
      locationState.temperature = value;
      this.logger.verbose(`State của location ${locationId} cập nhật: Temp=${value}°C`);
    } else {
      locationState.humidity = value;
      this.logger.verbose(`State của location ${locationId} cập nhật: Humi=${value}%`);
    }
    this.latestLocationSensorState.set(locationId, locationState);

    const tempData = this.tempBuffer.get(deviceId);
    const humiData = this.humiBuffer.get(deviceId);
    if (tempData && humiData && tempData.timestamp.getTime() === humiData.timestamp.getTime()) {
      try {
        const timestampUTC = new Date(tempData.timestamp.getTime() - this.SEVEN_HOURS_IN_MS);
        await this.prisma.dHT20Record.create({
          data: { sensorId: deviceId, timestamp: timestampUTC, temperature: tempData.temperature, humidity: humiData.humidity },
        });
        this.logger.debug(`✅ Dữ liệu DHT20 của ${deviceId} (${deviceName}) đã lưu: T=${tempData.temperature}, H=${humiData.humidity}`);
      } catch (error) {
        this.logger.error(`Lỗi lưu DHT20Record cho ${deviceName} (${deviceId}): ${error.message}`);
        const logPayloadError: LogEventPayload = { deviceId: deviceId, eventType: Severity.ERROR, description: `Không thể lưu DHT20Record: ${error.message}` };
        this.eventEmitter.emit(LOG_EVENT, logPayloadError);
      }
    }

    await this.decisionService.processSensorDataForDecision(locationId, locationState);
  }

  async handleActuatorStatus(deviceId: string, deviceType: DeviceType, deviceName: string, currentDbStatus: DeviceStatus, polledValue: string) {
    let polledStatus: DeviceStatus | null = null;
    const upperPolledValue = polledValue?.toUpperCase();

    if (upperPolledValue === 'ON') { polledStatus = DeviceStatus.ACTIVE; }
    else if (upperPolledValue === 'OFF') { polledStatus = DeviceStatus.INACTIVE; }
    else {
      this.logger.warn(`Giá trị trạng thái không mong đợi '${polledValue}' cho ${deviceType} ${deviceName} (${deviceId}). Bỏ qua.`);
      return;
    }

    if (polledStatus !== null && polledStatus !== currentDbStatus) {
      this.logger.log(`Trạng thái ${deviceName} (${deviceId}) thay đổi (polling): ${currentDbStatus} -> ${polledStatus}. Cập nhật DB.`);
      try {
        await this.prisma.device.update({
          where: { deviceId },
          data: { status: polledStatus },
        });
        const logPayload: LogEventPayload = { deviceId: deviceId, eventType: Severity.INFO, description: `Trạng thái thiết bị '${deviceName}' (${deviceType}) cập nhật: ${currentDbStatus} -> ${polledStatus} (do polling).` };
        this.eventEmitter.emit(LOG_EVENT, logPayload);
      } catch (error) {
        this.logger.error(`Lỗi cập nhật trạng thái (polling) cho ${deviceName} (${deviceId}): ${error.message}`);
        const logPayloadError: LogEventPayload = { deviceId: deviceId, eventType: Severity.ERROR, description: `Lỗi cập nhật trạng thái ${deviceType} '${deviceName}' (polling): ${error.message}` };
        this.eventEmitter.emit(LOG_EVENT, logPayloadError);
      }
    } else if (polledStatus !== null) {
      this.logger.verbose(`Trạng thái của ${deviceName} (${deviceId}) không đổi (${currentDbStatus}) theo polling.`);
    }
  }

  async disableDevice(deviceId: string, deviceName: string, locationId: string | null, reason: string = "Không phản hồi.") {
    this.logger.warn(`Vô hiệu hóa thiết bị ${deviceName} (${deviceId}). Lý do: ${reason}`);
    try {
      const device = await this.prisma.device.update({
        where: { deviceId },
        data: { status: DeviceStatus.INACTIVE },
        select: { deviceId: true, name: true, type: true, status: true, locationId: true }
      });

      if (!device) {
        this.logger.error(`Không tìm thấy thiết bị ${deviceId} để vô hiệu hóa.`);
        return;
      }

      const feedNames = this.adafruitService.getFeedNames(device as any);
      for (const feedName of feedNames) {
        this.stopPolling(feedName);
        this.failureCounters.delete(feedName);
      }

      this.moistureBuffer.delete(deviceId);
      this.tempBuffer.delete(deviceId);
      this.humiBuffer.delete(deviceId);

      if (locationId && (device.type === DeviceType.MOISTURE_SENSOR || device.type === DeviceType.DHT20_SENSOR)) {
        const locState = this.latestLocationSensorState.get(locationId);
        if (locState) {
          let stateUpdated = false;
          if (device.type === DeviceType.MOISTURE_SENSOR && typeof locState.soilMoisture !== 'undefined') {
            delete locState.soilMoisture;
            stateUpdated = true;
          }
          if (device.type === DeviceType.DHT20_SENSOR) {
            if (typeof locState.temperature !== 'undefined') { delete locState.temperature; stateUpdated = true; }
            if (typeof locState.humidity !== 'undefined') { delete locState.humidity; stateUpdated = true; }
          }
          if (stateUpdated) {
            this.latestLocationSensorState.set(locationId, locState);
            this.logger.log(`Đã xóa dữ liệu sensor lỗi (${device.type}) khỏi state của location ${locationId}.`);
          }
        }
      }

      const logPayloadDisable: LogEventPayload = { deviceId: deviceId, eventType: Severity.WARNING, description: `Thiết bị '${device.name}' đã bị vô hiệu hóa. Lý do: ${reason}` };
      this.eventEmitter.emit(LOG_EVENT, logPayloadDisable);
      const notiContext: NotificationEventContext = { deviceId: deviceId, locationId: device.locationId || 'N/A', errorMessage: reason };
      const notiPayload: NotificationEventPayload = { severity: Severity.WARNING, messageTemplate: `Thiết bị {{deviceId}} ('${device.name}' tại {{locationId}}) đã bị vô hiệu hóa tự động. Lý do: {{errorMessage}}`, context: notiContext };
      this.eventEmitter.emit(NOTIFICATION_EVENT, notiPayload);

      this.logger.log(`✅ Thiết bị ${device.name} đã được vô hiệu hóa và dừng polling.`);
    } catch (error) {
      this.logger.error(`❌ Lỗi khi vô hiệu hóa ${deviceId} (${deviceName}):`, error.stack);
      const logPayloadError: LogEventPayload = { deviceId: deviceId, eventType: Severity.ERROR, description: `Lỗi khi cố gắng vô hiệu hóa thiết bị '${deviceName}': ${error.message}` };
      this.eventEmitter.emit(LOG_EVENT, logPayloadError);
    }
  }

  stopPolling(feedName: string) {
    if (this.pollingIntervals.has(feedName)) {
      clearInterval(this.pollingIntervals.get(feedName)!);
      this.pollingIntervals.delete(feedName);
      this.logger.log(`Dừng polling feed '${feedName}'`);
    }
  }

  async stopPollingForInactiveDevices() {
    this.logger.debug('Dừng polling cho các cảm biến inactive...');
    const inactiveSensors = await this.prisma.device.findMany({
      where: {
        type: { in: [DeviceType.MOISTURE_SENSOR, DeviceType.DHT20_SENSOR] },
        status: DeviceStatus.INACTIVE
      },
      select: { deviceId: true, name: true, type: true, status: true, locationId: true }
    });
    let stoppedCount = 0;
    for (const device of inactiveSensors) {
      const feedNames = this.adafruitService.getFeedNames(device as any);
      for (const feedName of feedNames) {
        if (this.pollingIntervals.has(feedName)) {
          this.stopPolling(feedName);
          stoppedCount++;
        }
      }
    }
    if (stoppedCount > 0) this.logger.log(`Đã dừng polling cho ${stoppedCount} feeds từ các cảm biến inactive.`);
    else this.logger.debug('Không có polling đang chạy nào cho các cảm biến inactive.');
  }

  async refreshPolling() {
    this.logger.log('Làm mới polling...');
    await this.stopPollingForInactiveDevices();
    await this.startPollingForActiveDevices();
    this.logger.log('Làm mới polling hoàn tất.');
  }

  onModuleDestroy() {
    this.logger.log("DevicePollingService đang dừng...");
    this.pollingIntervals.forEach(interval => clearInterval(interval));
    this.pollingIntervals.clear();
    this.failureCounters.clear();

    this.moistureBuffer.forEach(buf => buf.timeout && clearTimeout(buf.timeout));
    this.tempBuffer.forEach(buf => buf.timeout && clearTimeout(buf.timeout));
    this.humiBuffer.forEach(buf => buf.timeout && clearTimeout(buf.timeout));
    this.moistureBuffer.clear();
    this.tempBuffer.clear();
    this.humiBuffer.clear();

    this.latestLocationSensorState.clear();

    this.logger.log("Tất cả polling và buffer đã được dọn dẹp.");
  }
}
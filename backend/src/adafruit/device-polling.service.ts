// import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
// import { PrismaService } from '../prisma/prisma.service';
// import { AdafruitService } from './adafruit.service';

// @Injectable()
// export class DevicePollingService implements OnModuleInit, OnModuleDestroy {
//   private pollingIntervals: Map<string, NodeJS.Timeout> = new Map();
//   private dht20DataBuffer: Map<string, { temperature?: number; humidity?: number; timestamp?: Date }> = new Map();

//   constructor(
//     private readonly prisma: PrismaService,
//     private readonly adafruitService: AdafruitService,
//   ) {}

//   async onModuleInit() {
//     console.log('DevicePollingService đã khởi động. Bắt đầu lấy dữ liệu...');
//     await this.startPollingForActiveDevices();
//   }

//   async startPollingForActiveDevices() {
//     const activeDevices = await this.prisma.device.findMany({
//       where: { status: 'ACTIVE', type: { in: ['MOISTURE_SENSOR', 'DHT20_SENSOR'] } },
//     });

//     for (const device of activeDevices) {
//       const feedNames = this.adafruitService.getFeedNames(device);
//       for (const feedName of feedNames) {
//         this.startPolling(device.deviceId, device.type, feedName);
//       }
//     }
//   }

//   startPolling(deviceId: string, deviceType: string, feedName: string, intervalMs = 5000) {
//     if (this.pollingIntervals.has(feedName)) return;

//     console.log(`Bắt đầu lấy dữ liệu từ '${feedName}' mỗi ${intervalMs / 1000} giây...`);

//     const interval = setInterval(async () => {
//       try {
//         const latestData = await this.adafruitService.getLatestFeedData(feedName);
//         if (latestData) await this.saveDataToDatabase(deviceId, deviceType, latestData);
//       } catch (error) {
//         console.error(`Lỗi khi lấy dữ liệu từ '${feedName}':`, error);
//       }
//     }, intervalMs);

//     this.pollingIntervals.set(feedName, interval);
//   }

//   async saveDataToDatabase(deviceId: string, deviceType: string, data: any) {
//     const timestamp = new Date(data.created_at);
//     const parsedValue = parseFloat(data.value);

//     if (deviceType === 'MOISTURE_SENSOR') {
//       await this.prisma.moistureRecord.create({
//         data: { sensorId: deviceId, timestamp, soilMoisture: parsedValue },
//       });
//       console.log(`Dữ liệu độ ẩm đã được lưu: ${parsedValue}`);
//     } else if (deviceType === 'DHT20_SENSOR') {
//       const isTemperature = data.feed_key.startsWith('nhietdo');
//       const existingData = this.dht20DataBuffer.get(deviceId) || { timestamp };

//       if (isTemperature) {
//         existingData.temperature = parsedValue;
//       } else {
//         existingData.humidity = parsedValue;
//       }

//       if (!existingData.timestamp) {
//         existingData.timestamp = timestamp;
//       }

//       if (existingData.temperature !== undefined && existingData.humidity !== undefined) {
//         await this.prisma.dHT20Record.create({
//           data: {
//             sensorId: deviceId,
//             timestamp: existingData.timestamp,
//             temperature: existingData.temperature,
//             humidity: existingData.humidity,
//           },
//         });
//         console.log(`Dữ liệu DHT20 đã được lưu: Nhiệt độ = ${existingData.temperature}, Độ ẩm = ${existingData.humidity}`);
//         this.dht20DataBuffer.delete(deviceId);
//       } else {
//         this.dht20DataBuffer.set(deviceId, existingData);
//         console.log(`Dữ liệu DHT20 đang được lưu tạm cho thiết bị ${deviceId}:`, existingData);
//       }
//     }
//   }

//   stopPolling(feedName: string) {
//     if (this.pollingIntervals.has(feedName)) {
//       clearInterval(this.pollingIntervals.get(feedName)!);
//       this.pollingIntervals.delete(feedName);
//       console.log(`Dừng lấy dữ liệu từ '${feedName}'`);
//     }
//   }

//   async stopPollingForInactiveDevices() {
//     const inactiveDevices = await this.prisma.device.findMany({
//       where: { status: 'INACTIVE' },
//     });

//     for (const device of inactiveDevices) {
//       const feedNames = this.adafruitService.getFeedNames(device);
//       for (const feedName of feedNames) {
//         this.stopPolling(feedName);
//       }
//     }
//   }

//   async refreshPolling() {
//     await this.stopPollingForInactiveDevices();
//     await this.startPollingForActiveDevices();
//   }

//   onModuleDestroy() {
//     this.pollingIntervals.forEach((interval, feedName) => {
//       clearInterval(interval);
//       console.log(`Dừng lấy dữ liệu (khi module bị hủy) từ '${feedName}'`);
//     });
//     this.pollingIntervals.clear();
//   }
// }





import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AdafruitService } from './adafruit.service';
import { LogService } from '../log/log.service';
import { NotificationService } from '../notification/notification.service';
import { DeviceStatus } from '@prisma/client';
import { CreateLogDto } from 'src/log/dto';
import { CreateNotiDto } from 'src/notification/dto';


@Injectable()
export class DevicePollingService implements OnModuleInit, OnModuleDestroy {
  private pollingIntervals: Map<string, NodeJS.Timeout> = new Map();
  private dht20DataBuffer: Map<string, { temperature?: number; humidity?: number; timestamp?: Date }> = new Map();
  private deviceTimestampBuffer: Map<string, { timestamp?: Date; count: number }> = new Map();

  constructor(
    private readonly prisma: PrismaService,
    private readonly adafruitService: AdafruitService,
    private readonly logService: LogService,
    private readonly notificationService: NotificationService,
  ) { }

  async onModuleInit() {
    console.log('DevicePollingService đã khởi động. Bắt đầu lấy dữ liệu...');
    await this.startPollingForActiveDevices();
  }

  async startPollingForActiveDevices() {
    const activeDevices = await this.prisma.device.findMany({
      where: { status: 'ACTIVE', type: { in: ['MOISTURE_SENSOR', 'DHT20_SENSOR'] } },
    });

    for (const device of activeDevices) {
      const feedNames = this.adafruitService.getFeedNames(device);
      for (const feedName of feedNames) {
        this.startPolling(device.deviceId, device.type, feedName);
      }
    }
  }

  startPolling(deviceId: string, deviceType: string, feedName: string, intervalMs = 5000) {
    if (this.pollingIntervals.has(feedName)) return;
    console.log(`Bắt đầu lấy dữ liệu từ '${feedName}' mỗi ${intervalMs / 1000} giây...`);

    const interval = setInterval(async () => {
      try {
        const latestData = await this.adafruitService.getLatestFeedData(feedName);
        if (latestData) await this.processDeviceData(deviceId, deviceType, latestData);
      } catch (error) {
        console.error(`Lỗi khi lấy dữ liệu từ '${feedName}':`, error);
      }
    }, intervalMs);

    this.pollingIntervals.set(feedName, interval);
  }

  async processDeviceData(deviceId: string, deviceType: string, data: any) {
    const timestamp = new Date(data.created_at);
    const parsedValue = parseFloat(data.value);


    let deviceBuffer = this.deviceTimestampBuffer.get(deviceId);

    if (!deviceBuffer) {
      // Lần đầu tiên nhận dữ liệu, không kiểm tra trùng lặp
      deviceBuffer = { timestamp, count: 0 };
    } else if (deviceBuffer.timestamp?.getTime() === timestamp.getTime()) {
      // Nếu timestamp trùng với lần trước => tăng biến đếm và bỏ qua
      deviceBuffer.count++;
      if (deviceBuffer.count >= 5) {
        await this.disableDevice(deviceId);
        return;
      }
      console.log(`Bỏ qua dữ liệu trùng lặp từ ${data.feed_key} với timestamp ${timestamp}`);

      return;
    } else {
      // Nếu timestamp mới khác, reset lại count
      deviceBuffer.count = 0;
    }

    // Cập nhật timestamp mới và lưu lại trong buffer
    deviceBuffer.timestamp = timestamp;
    this.deviceTimestampBuffer.set(deviceId, deviceBuffer);

    if (deviceType === 'MOISTURE_SENSOR') {
      await this.prisma.moistureRecord.create({
        data: { sensorId: deviceId, timestamp, soilMoisture: parsedValue },
      });
      console.log(`Dữ liệu độ ẩm đã được lưu: ${parsedValue}`);
    } else if (deviceType === 'DHT20_SENSOR') {
      const isTemperature = data.feed_key.startsWith('nhietdo');
      const existingData = this.dht20DataBuffer.get(deviceId) || { timestamp };

      if (isTemperature) {
        existingData.temperature = parsedValue;
      } else {
        existingData.humidity = parsedValue;
      }

      if (!existingData.timestamp) {
        existingData.timestamp = timestamp;
      }

      if (existingData.temperature !== undefined && existingData.humidity !== undefined) {
        await this.prisma.dHT20Record.create({
          data: {
            sensorId: deviceId,
            timestamp: existingData.timestamp,
            temperature: existingData.temperature,
            humidity: existingData.humidity,
          },
        });
        console.log(`Dữ liệu DHT20 đã được lưu: Nhiệt độ = ${existingData.temperature}, Độ ẩm = ${existingData.humidity}`);
        this.dht20DataBuffer.delete(deviceId);
      } else {
        this.dht20DataBuffer.set(deviceId, existingData);
        console.log(`Dữ liệu DHT20 đang được lưu tạm cho thiết bị ${deviceId}:`, existingData);
      }
    }
  }

  async disableDevice(deviceId: string) {
    console.log(`Thiết bị ${deviceId} không phản hồi, chuyển sang trạng thái INACTIVE.`);
    await this.prisma.device.update({
      where: { deviceId },
      data: { status: DeviceStatus.INACTIVE },
    });

    const log: CreateLogDto = {
      userId: '',
      deviceId,
      eventType: 'WARNING',
      description: `Thiết bị ${deviceId} đã bị vô hiệu hóa do không phản hồi.`,
    };
    await this.logService.create(log);

    const notification: CreateNotiDto = {
      senderId: '',
      message: `Thiết bị ${deviceId} đã bị vô hiệu hóa do không phản hồi.`,
      severity: 'WARNING',
      recipientIds: await this.getAdminUserIds(),
    };
    await this.notificationService.create(notification);
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

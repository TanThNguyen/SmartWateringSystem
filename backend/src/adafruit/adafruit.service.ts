import { Injectable, OnModuleDestroy, Logger, OnModuleInit } from '@nestjs/common';
import { Device, DeviceType } from '@prisma/client';
import { DateTime } from 'luxon';
import { PrismaService } from 'src/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AdafruitService implements OnModuleInit, OnModuleDestroy {
  private readonly AIO_USERNAME: string;
  private readonly AIO_KEY: string;
  private readonly BASE_URL: string;

  private readonly logger = new Logger(AdafruitService.name);

  private initialModeSet: boolean = false;
  private static readonly AUTOMODE_FEED_KEY = 'automode';

  constructor(
    private prismaService: PrismaService,
    private readonly configService: ConfigService
  ) {
    this.AIO_USERNAME = this.configService.get<string>('AIO_USERNAME') ?? 'leduy1204';
    this.AIO_KEY = this.configService.get<string>('AIO_KEY') ?? 'aio_geGY19NFH3nv6m1rAj3unlge1M1q';
    this.BASE_URL = `https://io.adafruit.com/api/v2/${this.AIO_USERNAME}`;
  }

  async onModuleInit() {
    if (!this.initialModeSet) {
      this.initialModeSet = true;
      this.logger.log(`Attempting to set initial mode to MAN for ${AdafruitService.AUTOMODE_FEED_KEY} feed...`);
      this.sendFeedData(AdafruitService.AUTOMODE_FEED_KEY, 'MAN')
        .then(() => {
          this.logger.log(`Successfully set initial mode to MAN for ${AdafruitService.AUTOMODE_FEED_KEY}.`);
        })
        .catch(error => {
          this.logger.error(`Failed to set initial mode to MAN for ${AdafruitService.AUTOMODE_FEED_KEY}: ${error.message}. Flag already set, won't retry.`);
        });
    }
  }
  // Lấy dữ liệu từ một feed và chuyển đổi thời gian về Asia/Ho_Chi_Minh (UTC+7)
  async getFeedData(feedName: string): Promise<any> {
    const url = `${this.BASE_URL}/feeds/${feedName}/data`;

    const response = await fetch(url, {
      method: 'GET',
      headers: { 'X-AIO-Key': this.AIO_KEY },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch feed data: ${response.statusText}`);
    }

    const data = await response.json();

    return data.map((item: any) => ({
      ...item,
      created_at: DateTime.fromISO(item.created_at, { zone: 'utc' })
        .setZone('Asia/Ho_Chi_Minh')
        .toFormat('yyyy-MM-dd HH:mm:ss'),
    }));
  }


  async fetchMoistureData(feedName: string, deviceId: string): Promise<any> {
    const url = `${this.BASE_URL}/feeds/${feedName}/data`;

    const response = await fetch(url, {
      method: 'GET',
      headers: { 'X-AIO-Key': this.AIO_KEY },
    });

    if (!response.ok) {
      throw new Error(`Lỗi khi lấy dữ liệu độ ẩm: ${response.statusText}`);
    }

    const data = await response.json();

    const formattedData = data.map((item: any) => ({
      sensorId: deviceId,
      timestamp: DateTime.fromISO(item.created_at, { zone: 'utc' })
        .setZone('Asia/Ho_Chi_Minh')
        .toJSDate(),
      soilMoisture: parseFloat(item.value),
    }));

    await this.prismaService.moistureRecord.createMany({
      data: formattedData,
      skipDuplicates: true,
    });

    console.log(`Dữ liệu độ ẩm từ ${feedName} đã được lưu vào cơ sở dữ liệu.`);
    return formattedData;
  }


  async fetchDHT20Data(feedName: string, deviceId: string): Promise<any> {
    const nhietDoFeed = feedName.replace(/^DHT20/, 'nhietdo');
    const doAmFeed = feedName.replace(/^DHT20/, 'doam');

    const [nhietDoData, doAmData] = await Promise.all([
      this.fetchAdafruitFeed(nhietDoFeed),
      this.fetchAdafruitFeed(doAmFeed),
    ]);

    const nhietDoMap = new Map(
      nhietDoData.map((item: any) => [
        DateTime.fromISO(item.created_at, { zone: 'utc' })
          .setZone('Asia/Ho_Chi_Minh')
          .toMillis(),
        parseFloat(item.value),
      ])
    );

    const doAmMap = new Map(
      doAmData.map((item: any) => [
        DateTime.fromISO(item.created_at, { zone: 'utc' })
          .setZone('Asia/Ho_Chi_Minh')
          .toMillis(),
        parseFloat(item.value),
      ])
    );

    type DHT20RecordType = {
      sensorId: string;
      timestamp: Date;
      temperature: number;
      humidity: number;
    };

    const matchedRecords: DHT20RecordType[] = [];

    for (const [timestamp, temperature] of nhietDoMap) {
      if (doAmMap.has(timestamp)) {
        matchedRecords.push({
          sensorId: deviceId,
          timestamp: new Date(timestamp),
          temperature,
          humidity: doAmMap.get(timestamp) ?? 0,
        });
      }
    }

    if (matchedRecords.length > 0) {
      await this.prismaService.dHT20Record.createMany({
        data: matchedRecords,
        skipDuplicates: true,
      });
      console.log(`✅ DHT20 data stored successfully for ${feedName}`);
    } else {
      console.log(`⚠️ No matching DHT20 records found for ${feedName}`);
    }

    return matchedRecords;
  }

  private async fetchAdafruitFeed(feedName: string): Promise<any[]> {
    const url = `${this.BASE_URL}/feeds/${feedName}/data`;

    const response = await fetch(url, {
      method: 'GET',
      headers: { 'X-AIO-Key': this.AIO_KEY },
    });

    if (!response.ok) {
      console.warn(`Lỗi khi lấy dữ liệu từ ${feedName}: ${response.statusText}`);
      return [];
    }

    return response.json();
  }


  // Gửi dữ liệu lên Adafruit IO
  async sendFeedData(feedName: string, value: string): Promise<any> {
    const url = `${this.BASE_URL}/feeds/${feedName}/data`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'X-AIO-Key': this.AIO_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ value }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Lỗi khi gửi dữ liệu: ${response.status} - ${errorText}`);
    }

    return response.json();
  }



  private pollingIntervals: Map<string, NodeJS.Timeout> = new Map();

  // Lấy dữ liệu gần nhất từ một feed
  async getLatestFeedData(feedName: string): Promise<any> {
    const url = `${this.BASE_URL}/feeds/${feedName}/data?limit=1`;

    const response = await fetch(url, {
      method: 'GET',
      headers: { 'X-AIO-Key': this.AIO_KEY },
    });

    if (!response.ok) {
      throw new Error(`Lỗi khi lấy dữ liệu mới nhất: ${response.statusText}`);
    }

    const data = await response.json();
    if (data.length === 0) return null;

    // Chuyển đổi thời gian về UTC+7
    return {
      ...data[0],
      created_at: DateTime.fromISO(data[0].created_at, { zone: 'utc' })
        .setZone('Asia/Ho_Chi_Minh')
        .toFormat('yyyy-MM-dd HH:mm:ss'),
    };
  }


  // Polling liên tục để lấy dữ liệu mới nhất từ feed
  startPollingFeed(feedName: string, intervalMs: number, callback: (data: any) => void): void {
    if (this.pollingIntervals.has(feedName)) {
      console.warn(`Polling for feed '${feedName}' is already running.`);
      return;
    }

    console.log(`Starting polling for feed '${feedName}' every ${intervalMs / 1000}s...`);
    const interval = setInterval(async () => {
      try {
        const latestData = await this.getLatestFeedData(feedName);
        if (latestData) callback(latestData);
      } catch (error) {
        console.error(`Error fetching feed '${feedName}':`, error);
      }
    }, intervalMs);

    this.pollingIntervals.set(feedName, interval);
  }

  // Dừng polling cho một feed cụ thể
  stopPollingFeed(feedName: string): void {
    if (this.pollingIntervals.has(feedName)) {
      clearInterval(this.pollingIntervals.get(feedName)!);
      this.pollingIntervals.delete(feedName);
      console.log(`Stopped polling for feed '${feedName}'.`);
    }
  }

  // Dừng toàn bộ polling khi module bị hủy
  async onModuleDestroy() {
    this.logger.log(`Sending final 'AUTO' state to ${AdafruitService.AUTOMODE_FEED_KEY} before clean disconnect...`);
      try {
        await this.sendFeedData(AdafruitService.AUTOMODE_FEED_KEY, 'AUTO');
        this.logger.log(`Successfully sent final 'AUTO' state.`);
      } catch (error) {
        this.logger.error(`Failed to send final 'AUTO' state during shutdown: ${error.message}`);
      }
    this.pollingIntervals.forEach((interval, feedName) => {
      clearInterval(interval);
      console.log(`Stopped polling for feed '${feedName}' (module destroy).`);
    });
    this.pollingIntervals.clear();
  }

  getFeedNames(device: Device): string[] {
    if (device.type === DeviceType.MOISTURE_SENSOR || device.type === DeviceType.PUMP || device.type === DeviceType.FAN) {
      return [device.name];
    }
    if (device.type === DeviceType.DHT20_SENSOR) {
      const identifier = device.name.replace(/^DHT20/, ''); // Loại bỏ tiền tố "DHT20"
      return [`nhietdo${identifier}`, `doam${identifier}`];
    }
    return [];
  }

  async getSensorData(feedName: string): Promise<any> {
    const sensorData = await this.getFeedData(feedName);

    const feedConfig = await this.getFeedConfig(feedName);
    const threshold = feedConfig ? feedConfig.threshold : null;
    return {
      feedName,
      data: sensorData,
      threshold,
    };
  }


  async getFeedConfig(feedName: string): Promise<any> {
    const url = `${this.BASE_URL}/feeds/${feedName}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'X-AIO-Key': this.AIO_KEY },
      });

      if (!response.ok) {
        throw new Error(`Lỗi API (${response.status}): ${response.statusText}`);
      }

      const data = await response.json();

      return {
        name: data.name,
        key: data.key,
        unit: data.unit_type,
        last_value: data.last_value,
        status: data.status,
        visibility: data.visibility,
        metadata: data.metadata ? JSON.parse(data.metadata) : null,
      };
    } catch (error) {
      console.error(`Lỗi khi lấy cấu hình feed ${feedName}:`, error);
      return null;
    }
  }
}

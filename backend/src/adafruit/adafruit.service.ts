import { Injectable } from '@nestjs/common';
import { Device, DeviceType } from '@prisma/client';
import { DateTime } from 'luxon';

@Injectable()
export class AdafruitService {
  private readonly AIO_USERNAME = 'leduy1204';
  private readonly AIO_KEY = 'aio_geGY19NFH3nv6m1rAj3unlge1M1q';
  private readonly BASE_URL = `https://io.adafruit.com/api/v2/${this.AIO_USERNAME}`;

  // Lấy dữ liệu từ một feed và chuyển đổi thời gian về Asia/Ho_Chi_Minh (UTC+7)
  async getFeedData(feedName: string): Promise<any> {
    const url = `${this.BASE_URL}/feeds/${feedName}/data`;
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'X-AIO-Key': this.AIO_KEY },
    });

    if (!response.ok) {
      throw new Error(`❌ Failed to fetch feed data: ${response.statusText}`);
    }

    const data = await response.json();

    // Chuyển đổi thời gian về UTC+7
    return data.map((item: any) => ({
      ...item,
      created_at: DateTime.fromISO(item.created_at, { zone: 'utc' })
        .setZone('Asia/Ho_Chi_Minh')
        .toFormat('yyyy-MM-dd HH:mm:ss'),
    }));
  }

  // Gửi dữ liệu lên Adafruit IO
  async sendFeedData(feedName: string, value: string): Promise<any> {
    const url = `${this.BASE_URL}/feeds/${feedName}/data`;
  
    console.log(`🔹 Sending request to: ${url} with value: ${value}`);
  
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'X-AIO-Key': this.AIO_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ value: `${value}` }), // Đảm bảo `value` là string
    });
  
    if (!response.ok) {
      const errorText = await response.text(); // Lấy nội dung lỗi
      throw new Error(`❌ Failed to send feed data: ${response.status} - ${errorText}`);
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
      throw new Error(`❌ Failed to fetch latest feed data: ${response.statusText}`);
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
      console.warn(`⚠️ Polling for feed '${feedName}' is already running.`);
      return;
    }

    console.log(`🚀 Starting polling for feed '${feedName}' every ${intervalMs / 1000}s...`);
    const interval = setInterval(async () => {
      try {
        const latestData = await this.getLatestFeedData(feedName);
        if (latestData) callback(latestData);
      } catch (error) {
        console.error(`❌ Error fetching feed '${feedName}':`, error);
      }
    }, intervalMs);

    this.pollingIntervals.set(feedName, interval);
  }

  // Dừng polling cho một feed cụ thể
  stopPollingFeed(feedName: string): void {
    if (this.pollingIntervals.has(feedName)) {
      clearInterval(this.pollingIntervals.get(feedName)!);
      this.pollingIntervals.delete(feedName);
      console.log(`🛑 Stopped polling for feed '${feedName}'.`);
    }
  }

  // Dừng toàn bộ polling khi module bị hủy
  onModuleDestroy() {
    this.pollingIntervals.forEach((interval, feedName) => {
      clearInterval(interval);
      console.log(`🛑 Stopped polling for feed '${feedName}' (module destroy).`);
    });
    this.pollingIntervals.clear();
  }

  getFeedNames(device: Device): string[] {
    if (device.type === DeviceType.MOISTURE_SENSOR) {
      return [device.name]; // Lấy trực tiếp từ name
    }
    if (device.type === DeviceType.DHT20_SENSOR) {
      const identifier = device.name.replace(/^DHT20/, ''); // Loại bỏ tiền tố "DHT20"
      return [`nhietdo${identifier}`, `doam${identifier}`];
    }
    return [];
  }
}

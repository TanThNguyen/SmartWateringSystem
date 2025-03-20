import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AdafruitService } from './adafruit.service';

@Injectable()
export class DevicePollingService implements OnModuleInit, OnModuleDestroy {
  private pollingIntervals: Map<string, NodeJS.Timeout> = new Map();
  private dht20DataBuffer: Map<string, { temperature?: number; humidity?: number; timestamp?: Date }> = new Map();

  constructor(
    private readonly prisma: PrismaService,
    private readonly adafruitService: AdafruitService,
  ) {}

  async onModuleInit() {
    console.log('🚀 DevicePollingService initialized. Starting polling...');
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

    console.log(`📡 Polling started for '${feedName}' every ${intervalMs / 1000}s...`);

    const interval = setInterval(async () => {
      try {
        const latestData = await this.adafruitService.getLatestFeedData(feedName);
        if (latestData) await this.saveDataToDatabase(deviceId, deviceType, latestData);
      } catch (error) {
        console.error(`❌ Error fetching feed '${feedName}':`, error);
      }
    }, intervalMs);

    this.pollingIntervals.set(feedName, interval);
  }

  async saveDataToDatabase(deviceId: string, deviceType: string, data: any) {
    const timestamp = new Date(data.created_at);
    const parsedValue = parseFloat(data.value);

    if (deviceType === 'MOISTURE_SENSOR') {
      await this.prisma.moistureRecord.create({
        data: { sensorId: deviceId, timestamp, soilMoisture: parsedValue },
      });
      console.log(`✅ Moisture data saved: ${parsedValue}`);
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
        console.log(`✅ DHT20 data saved: Temp = ${existingData.temperature}, Humidity = ${existingData.humidity}`);
        this.dht20DataBuffer.delete(deviceId);
      } else {
        this.dht20DataBuffer.set(deviceId, existingData);
        console.log(`⏳ DHT20 data buffered for device ${deviceId}:`, existingData);
      }
    }
  }

  stopPolling(feedName: string) {
    if (this.pollingIntervals.has(feedName)) {
      clearInterval(this.pollingIntervals.get(feedName)!);
      this.pollingIntervals.delete(feedName);
      console.log(`🛑 Polling stopped for '${feedName}'`);
    }
  }

  async stopPollingForInactiveDevices() {
    const inactiveDevices = await this.prisma.device.findMany({
      where: { status: 'INACTIVE' },
    });

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
      console.log(`🛑 Polling stopped (module destroy) for '${feedName}'`);
    });
    this.pollingIntervals.clear();
  }
}
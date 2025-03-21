import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DeviceRecordQueryDto, LocationRecordQueryDto } from './dto/record.dto';

@Injectable()
export class RecordService {
    constructor(private prisma: PrismaService) {}

    async getDeviceRecords(query: DeviceRecordQueryDto) {
        const { deviceId, start, stop } = query;

        const device = await this.prisma.device.findUnique({
            where: { deviceId },
            include: { moistureSensor: true, dht20Sensor: true },
        });

        if (!device) {
            throw new NotFoundException(`Không tìm thấy thiết bị với ID: ${deviceId}`);
        }

        if (device.moistureSensor) {
            return await this.prisma.moistureRecord.findMany({
                where: {
                    sensorId: deviceId,
                    timestamp: { gte: new Date(start), lte: new Date(stop) },
                },
            });
        }

        if (device.dht20Sensor) {
            return await this.prisma.dHT20Record.findMany({
                where: {
                    sensorId: deviceId,
                    timestamp: { gte: new Date(start), lte: new Date(stop) },
                },
            });
        }

        throw new NotFoundException(`Thiết bị không có dữ liệu cảm biến.`);
    }

    async getLocationRecords(query: LocationRecordQueryDto) {
        const { locationId, start, stop } = query;

        const devices = await this.prisma.device.findMany({
            where: { locationId },
            include: { moistureSensor: true, dht20Sensor: true },
        });

        if (!devices.length) {
            throw new NotFoundException(`Không có thiết bị nào thuộc khu vực ID: ${locationId}`);
        }

        const moistureRecords = await this.prisma.moistureRecord.groupBy({
            by: ['sensorId'],
            where: {
                sensorId: { in: devices.filter(d => d.moistureSensor).map(d => d.deviceId) },
                timestamp: { gte: new Date(start), lte: new Date(stop) },
            },
            _avg: { soilMoisture: true },
        });

        const dht20Records = await this.prisma.dHT20Record.groupBy({
            by: ['sensorId'],
            where: {
                sensorId: { in: devices.filter(d => d.dht20Sensor).map(d => d.deviceId) },
                timestamp: { gte: new Date(start), lte: new Date(stop) },
            },
            _avg: { temperature: true, humidity: true },
        });

        return {
            moisture: moistureRecords,
            dht20: dht20Records,
        };
    }
}

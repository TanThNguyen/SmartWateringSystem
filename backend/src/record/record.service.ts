import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DeviceRecordQueryDto, LocationRecordQueryDto } from './dto/record.dto';

@Injectable()
export class RecordService {
    constructor(private prisma: PrismaService) {}

    async getDeviceRecords(query: DeviceRecordQueryDto) {
        try {
            const { deviceId, start, stop } = query;
    
            if (!deviceId || !start || !stop) {
                throw new BadRequestException("Thiếu thông tin cần thiết (deviceId, start, stop).");
            }
    
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
        } catch (error) {
            console.error("Lỗi khi lấy dữ liệu thiết bị:", error);
    
            if (error instanceof BadRequestException || error instanceof NotFoundException) {
                throw error;
            }
    
            throw new InternalServerErrorException("Có lỗi xảy ra khi truy xuất dữ liệu.");
        }
    }
    

    async getLocationRecords(query: LocationRecordQueryDto) {
        try {
            const { locationId, start, stop } = query;
    
            if (!locationId || !start || !stop) {
                throw new BadRequestException("Thiếu thông tin cần thiết (locationId, start, stop).");
            }
    
            const devices = await this.prisma.device.findMany({
                where: { locationId },
                select: { deviceId: true, type: true },
            });
    
            if (!devices.length) {
                throw new NotFoundException(`Không tìm thấy thiết bị nào tại khu vực ID: ${locationId}.`);
            }
    
            const moistureSensorIds = devices
                .filter((d) => d.type === "MOISTURE_SENSOR")
                .map((d) => d.deviceId);
    
            const dht20SensorIds = devices
                .filter((d) => d.type === "DHT20_SENSOR")
                .map((d) => d.deviceId);
    
            const moistureRecords = await this.prisma.moistureRecord.groupBy({
                by: ["timestamp"],
                where: {
                    sensorId: { in: moistureSensorIds },
                    timestamp: { gte: new Date(start), lte: new Date(stop) },
                },
                _avg: { soilMoisture: true },
                orderBy: { timestamp: "asc" },
            });
    
            const dht20Records = await this.prisma.dHT20Record.groupBy({
                by: ["timestamp"],
                where: {
                    sensorId: { in: dht20SensorIds },
                    timestamp: { gte: new Date(start), lte: new Date(stop) },
                },
                _avg: { temperature: true, humidity: true },
                orderBy: { timestamp: "asc" },
            });
    
            return {
                moisture: moistureRecords,
                dht20: dht20Records,
            };
        } catch (error) {
            console.error("Lỗi khi lấy dữ liệu cảm biến theo khu vực:", error);
    
            if (error instanceof BadRequestException || error instanceof NotFoundException) {
                throw error;
            }
    
            throw new InternalServerErrorException("Có lỗi xảy ra khi truy xuất dữ liệu cảm biến.");
        }
    }
    
}

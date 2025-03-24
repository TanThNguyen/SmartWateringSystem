import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SensorRecordFactory } from './sensors/sensor-record.factory';
import { LocationRecordQueryDto, SensorDataResponseDto } from './dto';

@Injectable()
export class RecordService {
    constructor(private prisma: PrismaService, private sensorFactory: SensorRecordFactory) { }

    async getDeviceRecords(deviceId: string, start: string, stop: string) {
        const device = await this.prisma.device.findUnique({
            where: { deviceId },
            select: { type: true },
        });

        if (!device) {
            throw new NotFoundException(`Không tìm thấy thiết bị với ID: ${deviceId}`);
        }

        const sensorService = this.sensorFactory.getService(device.type);
        return sensorService.getRecords(deviceId, start, stop);
    }

    async getLocationRecords(query: LocationRecordQueryDto): Promise<SensorDataResponseDto> {
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
                moisture: moistureRecords.map(record => ({
                    _avg: {
                        soilMoisture: record._avg.soilMoisture ?? 0, // hoặc undefined
                    },
                    timestamp: record.timestamp,
                })),
                dht20: dht20Records.map(record => ({
                    _avg: {
                        temperature: record._avg.temperature ?? 0,
                        humidity: record._avg.humidity ?? 0,
                    },
                    timestamp: record.timestamp,
                })),
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

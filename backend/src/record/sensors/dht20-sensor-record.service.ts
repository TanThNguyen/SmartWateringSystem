import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SensorRecordService } from './sensor-record.interface';

@Injectable()
export class DHT20SensorRecordService implements SensorRecordService {
    constructor(private prisma: PrismaService) {}

    async getRecords(deviceId: string, start: string, stop: string) {
        return this.prisma.dHT20Record.findMany({
            where: {
                sensorId: deviceId,
                timestamp: { gte: new Date(start), lte: new Date(stop) },
            },
            orderBy: { timestamp: "desc" },
        });
    }
}

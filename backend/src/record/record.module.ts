import { Module } from '@nestjs/common';
import { RecordController } from './record.controller';
import { RecordService } from './record.service';
import { PrismaService } from '../prisma/prisma.service';
import { MoistureSensorRecordService } from './sensors/moisture-sensor-record.service';
import { DHT20SensorRecordService } from './sensors/dht20-sensor-record.service';
import { SensorRecordFactory } from './sensors/sensor-record.factory';

@Module({
    controllers: [RecordController],
    providers: [
        PrismaService,
        RecordService,
        MoistureSensorRecordService,
        DHT20SensorRecordService,
        SensorRecordFactory,
    ],
    exports: [RecordService],
})
export class RecordModule {}

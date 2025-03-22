import { Injectable, NotFoundException } from '@nestjs/common';
import { MoistureSensorRecordService } from './moisture-sensor-record.service';
import { DHT20SensorRecordService } from './dht20-sensor-record.service';
import { SensorRecordService } from './sensor-record.interface';

@Injectable()
export class SensorRecordFactory {
    constructor(
        private moistureService: MoistureSensorRecordService,
        private dht20Service: DHT20SensorRecordService
    ) {}

    getService(sensorType: string): SensorRecordService {
        switch (sensorType) {
            case 'MOISTURE_SENSOR':
                return this.moistureService;
            case 'DHT20_SENSOR':
                return this.dht20Service;
            default:
                throw new NotFoundException(`Không tìm thấy service cho loại cảm biến: ${sensorType}`);
        }
    }
    
}

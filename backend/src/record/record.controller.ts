import { Controller, Get, Query } from '@nestjs/common';
import { RecordService } from './record.service';
import { DeviceRecordQueryDto, LocationRecordQueryDto, SensorDataResponseDto } from './dto/record.dto';

@Controller('records')
export class RecordController {
    constructor(private readonly recordService: RecordService) { }

    @Get('device')
    async getDeviceRecords(@Query() query: DeviceRecordQueryDto) {
        return this.recordService.getDeviceRecords(query.deviceId, query.start, query.stop);
    }

    @Get('location')
    async getLocationRecords(@Query() query: LocationRecordQueryDto): Promise<SensorDataResponseDto> {
        return this.recordService.getLocationRecords(query);
    }
}

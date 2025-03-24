import { Type } from 'class-transformer';
import { IsUUID, IsISO8601, IsNotEmpty, IsString, IsDateString, IsNumber, IsArray, IsOptional, ValidateNested, IsDate } from 'class-validator';

export class DeviceRecordQueryDto {
    @IsUUID()
    @IsNotEmpty()
    deviceId: string;

    @IsISO8601()
    @IsNotEmpty()
    start: string;

    @IsISO8601()
    @IsNotEmpty()
    stop: string;
}

export class LocationRecordQueryDto {
    @IsUUID()
    @IsNotEmpty()
    locationId: string;

    @IsISO8601()
    @IsNotEmpty()
    start: string;

    @IsISO8601()
    @IsNotEmpty()
    stop: string;
}

class AvgMoistureDto {
    @IsNumber()
    @IsOptional()
    soilMoisture?: number | null;
}

class AvgDHT20Dto {
    @IsNumber()
    @IsOptional()
    temperature?: number | null;

    @IsNumber()
    @IsOptional()
    humidity?: number | null;
}


export class MoistureRecordDto {
    @ValidateNested()
    @Type(() => AvgMoistureDto)
    _avg: AvgMoistureDto;

    @IsDate()
    timestamp: Date;
}

export class DHT20RecordDto {
    @ValidateNested()
    @Type(() => AvgDHT20Dto)
    _avg: AvgDHT20Dto;

    @IsDate()
    timestamp: Date;
}

export class SensorDataResponseDto {
    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => MoistureRecordDto)
    moisture?: MoistureRecordDto[];

    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => DHT20RecordDto)
    dht20?: DHT20RecordDto[];
}
import { IsUUID, IsISO8601, IsNotEmpty } from 'class-validator';

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

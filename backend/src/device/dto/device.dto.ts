import { DeviceStatus, DeviceType, Mode } from "@prisma/client";
import { Transform, Type } from "class-transformer";
import { IsArray, IsBoolean, IsDate, IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Matches, Min, ValidateNested } from "class-validator";

export class GetDevicesRequestDto {
    @IsInt()
    @Min(1)
    @Type(() => Number)
    page: number;

    @IsInt()
    @Min(1)
    @Type(() => Number)
    items_per_page: number;

    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @Transform(({ value }) => value?.toUpperCase() || 'ALL')
    @Matches(/^(ACTIVE|INACTIVE||ALL)$/, {
        message: 'DeviceStatus phải là giá trị hợp lệ của DeviceStatus hoặc "ALL"',
    })
    status?: DeviceStatus | 'ALL' = 'ALL';

    @IsOptional()
    @IsString()
    locationName?: string;

    @IsOptional()
    @IsString()
    order?: string;
}

export class InfoDevicesDto {

    @IsUUID()
    @IsString()
    @IsNotEmpty()
    deviceId: string;

    @IsEnum(DeviceType)
    type: DeviceType;

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    locationName: string;

    @IsDate()
    @IsNotEmpty()
    updatedAt: Date;

    @IsEnum(DeviceStatus)
    status: DeviceStatus;
}

export class FindAllDevicesDto {
    @IsArray()
    devices: InfoDevicesDto[];

    @IsNumber()
    total: number;

    @IsNumber()
    currentPage: number;

    @IsNumber()
    nextPage: number | null;

    @IsNumber()
    prevPage: number | null;

    @IsNumber()
    lastPage: number;
}

export class AddDeviceDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    locationName: string;

    @IsEnum(DeviceType)
    type: DeviceType;

    @IsEnum(DeviceStatus)
    status: DeviceStatus;

    @IsOptional()
    thresholdId: string;

    @IsOptional()
    tempMinId: string;

    @IsOptional()
    tempMaxId: string;

    @IsOptional()
    humidityThresholdId: string;

    @IsOptional()
    speed: string;
}

export class DeleteDevicesDto {
    @IsArray()
    @IsUUID("4", { each: true })
    @IsNotEmpty()
    deviceIds: string[];
}

export class DeviceIdDto {
    @IsUUID()
    @IsNotEmpty()
    deviceId: string;
}

export class PumpAttributes {
    @IsBoolean()
    @IsOptional()
    isRunning?: boolean;

    @IsEnum(Mode)
    @IsOptional()
    mode?: Mode;
}

export class FanAttributes {
    @IsBoolean()
    @IsOptional()
    isRunning?: boolean;

    @IsEnum(Mode)
    @IsOptional()
    mode?: Mode;

    @IsOptional()
    @IsNumber()
    speed?: number;
}

export class MoistureSensorAttributes {
    @IsUUID()
    @IsOptional()
    thresholdId?: string;
}

export class DHT20SensorAttributes {
    @IsUUID()
    @IsOptional()
    tempMinId?: string;

    @IsUUID()
    @IsOptional()
    tempMaxId?: string;

    @IsUUID()
    @IsOptional()
    humidityThresholdId?: string;
}

export class EditDeviceDto {
    @IsUUID()
    @IsNotEmpty()
    deviceId: string;

    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsEnum(DeviceStatus)
    status?: DeviceStatus;

    @IsOptional()
    @IsUUID()
    locationId?: string;

    @IsOptional()
    @ValidateNested()
    @Type(() => PumpAttributes)
    pump?: PumpAttributes;

    @IsOptional()
    @ValidateNested()
    @Type(() => FanAttributes)
    fan?: FanAttributes;

    @IsOptional()
    @ValidateNested()
    @Type(() => MoistureSensorAttributes)
    moistureSensor?: MoistureSensorAttributes;

    @IsOptional()
    @ValidateNested()
    @Type(() => DHT20SensorAttributes)
    dht20Sensor?: DHT20SensorAttributes;
}


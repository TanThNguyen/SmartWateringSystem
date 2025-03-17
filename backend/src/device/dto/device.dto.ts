import { DeviceStatus, DeviceType } from "@prisma/client";
import { Transform, Type } from "class-transformer";
import { IsArray, IsDate, IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Matches, Min } from "class-validator";

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
    @Matches(/^(Active|Inactive||ALL)$/, {
        message: 'role phải là giá trị hợp lệ của Role hoặc "ALL"',
    })
    status?: DeviceStatus | 'ALL' = 'ALL';

    @IsOptional()
    @IsString()
    location?: string;

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
    location: string;

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
    location: string;

    @IsEnum(DeviceType)
    type: DeviceType;

    @IsEnum(DeviceStatus)
    status: DeviceStatus;
}

export class DeleteDevicesDto {
    @IsArray()
    @IsUUID("4", { each: true })
    @IsNotEmpty()
    deviceIds: string[];
}
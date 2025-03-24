import { IsUUID, IsString, IsNotEmpty, IsEnum, IsNumber, IsDate, IsArray, IsOptional, Min, IsInt, Matches } from "class-validator";
import { DeviceType } from "@prisma/client";
import { Transform, Type } from "class-transformer";

export class ConfigurationCreateDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @Type(() => Number)
    @IsNotEmpty()
    value: number;

    @IsUUID()
    @IsString()
    @IsNotEmpty()
    locationId: string;

    @IsEnum(DeviceType)
    @IsNotEmpty()
    deviceType: DeviceType;
}

export class ConfigurationUpdateDto {
    @IsUUID()
    @IsString()
    @IsNotEmpty()
    configId: string;

    @IsString()
    @IsNotEmpty()
    name: string;

    @Type(() => Number)
    @IsNotEmpty()
    value: number;

    @IsUUID()
    @IsString()
    @IsNotEmpty()
    locationId: string;

    @IsEnum(DeviceType)
    @IsNotEmpty()
    deviceType: DeviceType;
}

export class ConfigurationDeleteDto {
    @IsUUID()
    @IsNotEmpty()
    configId: string;
}

export class ConfigurationQueryDto {
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
    @Matches(/^(PUMP|MOISTURE_SENSOR|DHT20_SENSOR|LCD|FAN|LED|ALL)$/, {
        message: 'DeviceType phải là giá trị hợp lệ của DeviceType hoặc "ALL"',
    })
    deviceType?: DeviceType | 'ALL' = 'ALL';
}

export class ConfigurationDetailDto {
    @IsUUID()
    @IsString()
    @IsNotEmpty()
    configId: string;

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsNumber()
    @IsNotEmpty()
    value: number;

    @IsUUID()
    @IsString()
    @IsNotEmpty()
    locationId: string;

    @IsEnum(DeviceType)
    @IsNotEmpty()
    deviceType: DeviceType;

    @IsDate()
    @IsNotEmpty()
    lastUpdated: Date;
}

export class ConfigurationPaginatedDto {
    @IsArray()
    configurations: ConfigurationDetailDto[];

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

export class ConfigurationFilterDto {
    @IsUUID()
    @IsString()
    @IsNotEmpty()
    locationId: string;

    @IsEnum(DeviceType)
    @IsNotEmpty()
    deviceType: DeviceType;
}

export class ConfigurationListDto {
    @IsArray()
    configurations: ConfigurationDetailDto[];
}
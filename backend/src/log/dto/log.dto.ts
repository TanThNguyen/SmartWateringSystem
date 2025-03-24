import { Severity } from "@prisma/client";
import { Transform, Type } from "class-transformer";
import { IsArray, IsDate, IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Matches, Min } from "class-validator";

export class GetLogsRequestDto {
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
    @Matches(/^(INFO|WARNING|ERROR|ALL)$/, {
        message: 'eventType phải là giá trị hợp lệ của Severity hoặc "ALL"',
    })
    eventType?: Severity | 'ALL' = 'ALL';

    @IsOptional()
    @IsString()
    order?: string;
}

export class InfoLogDto {

    @IsUUID()
    @IsString()
    @IsNotEmpty()
    logId: string;

    @IsUUID()
    @IsString()
    @IsNotEmpty()
    userId: string;

    @IsUUID()
    @IsString()
    @IsNotEmpty()
    deviceId: string;

    @IsEnum(Severity)
    eventType: Severity;

    @IsString()
    @IsNotEmpty()
    description: string;

    @IsDate()
    @IsNotEmpty()
    createdAt: Date;
}

export class FindAllLogsDto {
    @IsArray()
    logs: InfoLogDto[];

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

export class CreateLogDto {

    @IsOptional()
    userId: string;

    @IsOptional()
    deviceId: string;

    @IsEnum(Severity)
    eventType: Severity;

    @IsString()
    @IsNotEmpty()
    description: string;
}
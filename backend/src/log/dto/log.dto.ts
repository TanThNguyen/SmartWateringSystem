import { Severity } from "@prisma/client";
import { Transform, Type } from 'class-transformer';
import { IsArray, IsDate, IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Matches, Min, ValidateIf } from 'class-validator';

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
    @Transform(({ value }) => value ? value.toUpperCase() : 'ALL')
    @Matches(/^(INFO|WARNING|ERROR|ALL)$/, {
        message: 'eventType phải là giá trị hợp lệ của Severity hoặc "ALL"',
    })
    eventType?: Severity | 'ALL' = 'ALL';

    @IsOptional()
    @IsString()
    @Matches(/^(asc|desc)$/i, { message: 'order phải là "asc" hoặc "desc"' })
    order?: 'asc' | 'desc' = 'desc';
}

export class InfoLogDto {
    @IsUUID()
    @IsString()
    @IsNotEmpty()
    logId: string;

    @IsOptional()
    @IsUUID()
    @IsString()
    userId?: string | null;

    @IsOptional()
    @IsUUID()
    @IsString()
    deviceId?: string | null;

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
    @Type(() => InfoLogDto)
    logs: InfoLogDto[];

    @IsNumber()
    total: number;

    @IsNumber()
    currentPage: number;

    @IsNumber()
    @IsOptional()
    nextPage: number | null;

    @IsNumber()
    @IsOptional()
    prevPage: number | null;

    @IsNumber()
    lastPage: number;
}

export const LOG_EVENT = 'log.event.created';

export class LogEventPayload {
    @IsOptional()
    @IsUUID()
    @ValidateIf(o => o.userId != null)
    userId?: string | null;

    @IsOptional()
    @IsUUID()
    @ValidateIf(o => o.deviceId != null)
    deviceId?: string | null;

    @IsEnum(Severity)
    eventType: Severity;

    @IsString()
    @IsNotEmpty()
    description: string;
}
import { Transform, Type } from 'class-transformer';
import {
  IsString,
  IsUUID,
  IsDateString,
  IsInt,
  Min,
  Max,
  IsBoolean,
  IsOptional,
  IsNotEmpty,
  Matches,
  IsDate,
} from 'class-validator';

export class CreateScheduleDto {
  @IsNotEmpty()
  @IsString()
  @IsUUID()
  deviceId: string;

  @IsNotEmpty()
  @IsDateString({}, { message: 'startTime phải là định dạng ISO 8601 hợp lệ (vd: 2023-10-27T10:00:00.000Z). Chỉ giờ và phút sẽ được sử dụng.' })
  startTime: string;

  @IsNotEmpty()
  @IsDateString({}, { message: 'endTime phải là định dạng ISO 8601 hợp lệ (vd: 2023-10-27T18:30:00.000Z). Chỉ giờ và phút sẽ được sử dụng.' })
  endTime: string;

  @IsNotEmpty()
  @IsInt()
  @Min(0, { message: 'repeatDays phải là số nguyên không âm (bitmask).' })
  @Max(127, { message: 'Giá trị bitmask tối đa cho 7 ngày là 127.' })
  repeatDays: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true; 
}

export class GetSchedulesRequestDto {
  @IsOptional()
  @IsUUID()
  deviceId?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return 'ALL';
  })
  @Matches(/^(true|false|ALL)$/, { message: 'isActive phải là "true", "false" hoặc "ALL"' })
  isActive?: boolean | 'ALL' = 'ALL';

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  items_per_page?: number = 5;
}

export class ScheduleInfoDto {
  @IsUUID()
  scheduleId: string;

  @IsUUID()
  deviceId: string;

  @IsDate()
  startTime: Date;

  @IsDate()
  endTime: Date;

  @IsInt()
  repeatDays: number;

  @IsBoolean()
  isActive: boolean;
}

export class FindAllSchedulesDto {
  @IsInt()
  total: number;

  @IsInt()
  currentPage: number;

  @IsInt()
  nextPage: number | null;

  @IsInt()
  prevPage: number | null;

  @IsInt()
  lastPage: number;

  schedules: ScheduleInfoDto[];
}

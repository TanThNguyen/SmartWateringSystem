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
  } from 'class-validator';
  
  export class CreateScheduleDto {
    @IsNotEmpty()
    @IsString()
    @IsUUID()
    deviceId: string;
  
    @IsNotEmpty()
    @IsDateString({}, { message: 'startTime phải là định dạng ISO 8601 hợp lệ (vd: 2023-10-27T10:00:00.000Z). Chỉ giờ và phút sẽ được sử dụng.' })
    startTime: string; // Nhận vào dạng string ISO, service sẽ xử lý
  
    @IsNotEmpty()
    @IsDateString({}, { message: 'endTime phải là định dạng ISO 8601 hợp lệ (vd: 2023-10-27T18:30:00.000Z). Chỉ giờ và phút sẽ được sử dụng.' })
    endTime: string; // Nhận vào dạng string ISO, service sẽ xử lý
  
    @IsNotEmpty()
    @IsInt()
    @Min(0, { message: 'repeatDays phải là số nguyên không âm (bitmask).' })
    // Max là 127 (1111111 binary) nếu bạn muốn giới hạn 7 ngày (CN-T7)
    @Max(127, { message: 'Giá trị bitmask tối đa cho 7 ngày là 127.'})
    repeatDays: number; // Bitmask: CN=1, T2=2, T3=4, T4=8, T5=16, T6=32, T7=64
  
    @IsOptional()
    @IsBoolean()
    isActive?: boolean = true; // Mặc định là active
  }
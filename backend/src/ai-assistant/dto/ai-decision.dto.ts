import { IsString, IsNotEmpty, ValidateNested, IsNumber, IsOptional, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export class SensorDataDto {
  @IsNumber()
  @IsNotEmpty()
  soilMoisture: number;

  @IsNumber()
  @IsNotEmpty()
  temperature: number;

  @IsNumber()
  @IsNotEmpty()
  humidity: number;
}

export class ConfigurationDataDto {
  @IsNumber()
  @IsNotEmpty()
  moistureThreshold: number;

  @IsOptional()
  @IsNumber()
  tempMin?: number;

  @IsNumber()
  @IsNotEmpty()
  tempMax: number;

  @IsNumber()
  @IsNotEmpty()
  humidityMax: number;
}

export class AiDecisionRequestDto {
  @IsString()
  @IsNotEmpty()
  locationId: string;

  @ValidateNested()
  @Type(() => SensorDataDto)
  @IsNotEmpty()
  sensorData: SensorDataDto;

  @ValidateNested()
  @Type(() => ConfigurationDataDto)
  @IsNotEmpty()
  configuration: ConfigurationDataDto;
}

export enum AiAction {
    PUMP_ON = "PUMP_ON",
    FAN_ON = "FAN_ON",
    NONE = "NONE",
}

export enum AiUrgency {
    URGENT = "URGENT",
    NORMAL = "NORMAL",
}

export class AiDecisionResponseDto {
  @IsEnum(AiAction)
  @IsNotEmpty()
  action: AiAction;

  @IsNumber()
  @IsNotEmpty()
  duration: number;

  @IsEnum(AiUrgency)
  @IsNotEmpty()
  urgency: AiUrgency;
}
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

export enum AiUrgency {
    URGENT = "URGENT",
    NORMAL = "NORMAL",
}

export enum AiPumpAction {
    PUMP_ON = "PUMP_ON",
    PUMP_OFF = "PUMP_OFF",
    NONE = "NONE",
}

export enum AiFanAction {
    FAN_ON = "FAN_ON",
    FAN_OFF = "FAN_OFF",
    NONE = "NONE",
}

export class AiCombinedDecisionResponseDto {
  @IsEnum(AiPumpAction)
  @IsNotEmpty()
  pump_action: AiPumpAction;

  @IsNumber()
  @IsNotEmpty()
  pump_duration: number;

  @IsEnum(AiUrgency)
  @IsNotEmpty()
  pump_urgency: AiUrgency;

  @IsEnum(AiFanAction)
  @IsNotEmpty()
  fan_action: AiFanAction;

  @IsNumber()
  @IsNotEmpty()
  fan_duration: number;

  @IsEnum(AiUrgency)
  @IsNotEmpty()
  fan_urgency: AiUrgency;
}
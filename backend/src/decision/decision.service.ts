import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiAssistantService } from '../ai-assistant/ai-assistant.service';
import { ScheduleService } from '../schedule/schedule.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { LOG_EVENT, LogEventPayload } from '../log/dto';
import { Device, DeviceType, Severity, Configuration } from '@prisma/client'; 
import { AiAction, AiDecisionRequestDto, ConfigurationDataDto, SensorDataDto, AiUrgency, AiDecisionResponseDto } from '../ai-assistant/dto/ai-decision.dto';
import { CreateScheduleDto } from '../schedule/dto';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import isBetween from 'dayjs/plugin/isBetween';

dayjs.extend(utc);
dayjs.extend(isBetween);

export interface LatestSensorState {
    soilMoisture?: number;
    temperature?: number;
    humidity?: number;
    lastUpdate?: Date;
}

@Injectable()
export class DecisionService {
    private readonly logger = new Logger(DecisionService.name);
    private lastAiCallTimestamps: Map<string, Date> = new Map();
    private readonly AI_CALL_RATE_LIMIT_MS = 5 * 60 * 1000;
    private readonly MAX_DATA_AGE_MS = 10 * 60 * 1000;
    private readonly FALLBACK_DURATION_MINUTES = 30;

    constructor(
        private readonly prisma: PrismaService,
        private readonly aiAssistantService: AiAssistantService,
        private readonly scheduleService: ScheduleService,
        private readonly eventEmitter: EventEmitter2,
    ) {}

    async processSensorDataForDecision(locationId: string, currentState: LatestSensorState | undefined): Promise<void> {
        this.logger.debug(`[${this.constructor.name}] Nhận yêu cầu xử lý quyết định cho location ${locationId}`);
        if (!currentState) {
            this.logger.warn(`[${this.constructor.name}] Không có trạng thái sensor hiện tại cho location ${locationId}, bỏ qua.`);
            return;
        }
        await this.checkAndTriggerAiOrFallback(locationId, currentState);
    }

    private async checkAndTriggerAiOrFallback(locationId: string, currentState: LatestSensorState): Promise<void> {
        this.logger.debug(`[${this.constructor.name}] Kiểm tra điều kiện gọi AI cho location ${locationId}...`);

        if (typeof currentState.soilMoisture === 'undefined' || typeof currentState.temperature === 'undefined' || typeof currentState.humidity === 'undefined') {
            this.logger.debug(`[${this.constructor.name}] Thiếu dữ liệu cảm biến hoàn chỉnh cho location ${locationId}. Bỏ qua.`);
            return;
        }

        const now = new Date();
        const nowDayjs = dayjs();

        if (currentState.lastUpdate) {
             const dataAge = now.getTime() - currentState.lastUpdate.getTime();
             if (dataAge > this.MAX_DATA_AGE_MS) {
                 const ageMinutes = Math.round(dataAge / 60000);
                 this.logger.warn(`[${this.constructor.name}] Dữ liệu cảm biến cho location ${locationId} đã quá cũ (${ageMinutes} phút). Bỏ qua gọi AI.`);
                 return;
             }
        } else {
             this.logger.warn(`[${this.constructor.name}] Thiếu thông tin lastUpdate cho location ${locationId}. Bỏ qua kiểm tra độ tươi.`);
        }

        let configDataDto: ConfigurationDataDto | null;
        try {
            configDataDto = await this.getLocationConfiguration(locationId);
            if (!configDataDto) {
                this.logger.error(`[${this.constructor.name}] Không lấy được cấu hình đầy đủ cho location ${locationId}. Không thể đưa ra quyết định.`);
                return;
            }
        } catch (error) {
            this.logger.error(`[${this.constructor.name}] Lỗi lấy cấu hình cho location ${locationId}: ${error.message}.`);
            return;
        }

        const sensorDataDto: SensorDataDto = {
            soilMoisture: currentState.soilMoisture,
            temperature: currentState.temperature,
            humidity: currentState.humidity,
        };

        let potentialAction = AiAction.NONE;
        let targetDeviceType: DeviceType | null = null;
        if (sensorDataDto.temperature > configDataDto.tempMax || sensorDataDto.humidity > configDataDto.humidityMax) {
            potentialAction = AiAction.FAN_ON;
            targetDeviceType = DeviceType.FAN; 
        } else if (sensorDataDto.soilMoisture < configDataDto.moistureThreshold) {
            potentialAction = AiAction.PUMP_ON;
            targetDeviceType = DeviceType.PUMP;
        }

        let actuatorDevice: { deviceId: string; name: string; } | null = null;
        if (targetDeviceType === DeviceType.PUMP || targetDeviceType === DeviceType.FAN) { 
            actuatorDevice = await this.findActuatorDevice(locationId, targetDeviceType);
            if (actuatorDevice) {
                const isScheduleRunning = await this.checkIfScheduleIsRunning(actuatorDevice.deviceId, nowDayjs);
                if (isScheduleRunning) {
                    this.logger.log(`[${this.constructor.name}] Đã có lịch trình đang chạy cho ${actuatorDevice.name} (${actuatorDevice.deviceId}). Bỏ qua.`);
                    return;
                }
            } else {
                 this.logger.warn(`[${this.constructor.name}] Không tìm thấy ${targetDeviceType} tại location ${locationId} để kiểm tra lịch chạy.`);
            }
        }

        const lastCallTime = this.lastAiCallTimestamps.get(locationId);
        if (lastCallTime && (now.getTime() - lastCallTime.getTime()) < this.AI_CALL_RATE_LIMIT_MS) {
            const remainingTime = Math.ceil((this.AI_CALL_RATE_LIMIT_MS - (now.getTime() - lastCallTime.getTime())) / 1000);
            this.logger.debug(`[${this.constructor.name}] Rate limit active cho location ${locationId}. Còn ${remainingTime} giây.`);
            return;
        }

        this.logger.log(`[${this.constructor.name}] Đủ điều kiện gọi AI cho location ${locationId}.`);

        const requestPayload: AiDecisionRequestDto = {
            locationId: locationId,
            sensorData: sensorDataDto,
            configuration: configDataDto,
        };

        try {
            this.logger.log(`[${this.constructor.name}] >>> Gọi AI Service /decide cho location ${locationId}...`);
            const aiDecision = await this.aiAssistantService.getAiDecision(requestPayload);
            this.logger.log(`[${this.constructor.name}] <<< Nhận quyết định từ AI cho location ${locationId}: Action=${aiDecision.action}, Duration=${aiDecision.duration}s, Urgency=${aiDecision.urgency}`);
            this.lastAiCallTimestamps.set(locationId, new Date());

            if (aiDecision.action === AiAction.PUMP_ON || aiDecision.action === AiAction.FAN_ON) {
                 const actionTargetDeviceType = aiDecision.action === AiAction.PUMP_ON ? DeviceType.PUMP : DeviceType.FAN;
                 const actionActuatorDevice = await this.findActuatorDevice(locationId, actionTargetDeviceType);

                 if (!actionActuatorDevice) {
                     this.logger.error(`[AI Trigger] Không tìm thấy ${actionTargetDeviceType} tại location ${locationId} để thực thi quyết định AI.`);
                     const logErr: LogEventPayload = { eventType: Severity.ERROR, description: `Không tìm thấy ${actionTargetDeviceType} tại location ${locationId} để AI kích hoạt.` };
                     this.eventEmitter.emit(LOG_EVENT, logErr);
                 } else {
                     if (aiDecision.urgency === AiUrgency.URGENT) {
                         await this.createUrgentSchedule(actionActuatorDevice.deviceId, actionActuatorDevice.name, aiDecision.action, 'AI', aiDecision.duration);
                     } else {
                         await this.createNormalSchedule(actionActuatorDevice.deviceId, actionActuatorDevice.name, aiDecision.action, 'AI', aiDecision.duration);
                     }
                 }
            } else {
                this.logger.log(`[${this.constructor.name}] AI quyết định không cần hành động cho location ${locationId}.`);
            }

        } catch (error) {
            this.logger.error(`[${this.constructor.name}] Lỗi khi gọi AI cho location ${locationId}: ${error.message}`);
            this.logger.warn(`[${this.constructor.name}] Kích hoạt logic Fallback cho location ${locationId} do lỗi AI.`);
            await this.executeFallbackLogic(locationId, sensorDataDto, configDataDto);

            const logPayloadAiError: LogEventPayload = { eventType: Severity.ERROR, description: `Lỗi gọi AI Assistant cho location ${locationId} (${error.message}). Kích hoạt fallback logic.` };
            this.eventEmitter.emit(LOG_EVENT, logPayloadAiError);
        }
    }

    private async getLocationConfiguration(locationId: string): Promise<ConfigurationDataDto | null> {
        this.logger.debug(`[${this.constructor.name}] Lấy cấu hình cho location ${locationId}...`);
        const locationConfigs = await this.prisma.configuration.findMany({ where: { locationId: locationId } });
        if (locationConfigs.length === 0) {
            this.logger.warn(`[${this.constructor.name}] Không tìm thấy bản ghi cấu hình nào cho location ${locationId}.`);
            return null;
        }
        let moistureThreshold: number | undefined;
        let tempMax: number | undefined;
        let humidityMax: number | undefined;
        let tempMin: number | undefined;
        const moistureConfig = locationConfigs.find(c => c.deviceType === DeviceType.MOISTURE_SENSOR);
        if (moistureConfig) { moistureThreshold = moistureConfig.value; }
        const tempMaxConfig = locationConfigs.find(c => c.deviceType === DeviceType.DHT20_SENSOR && c.name.includes('TMax'));
        if (tempMaxConfig) { tempMax = tempMaxConfig.value; }
        const humidityMaxConfig = locationConfigs.find(c => c.deviceType === DeviceType.DHT20_SENSOR && c.name.includes('HMax'));
        if (humidityMaxConfig) { humidityMax = humidityMaxConfig.value; }
        const tempMinConfig = locationConfigs.find(c => c.deviceType === DeviceType.DHT20_SENSOR && c.name.includes('TMin'));
        if (tempMinConfig) { tempMin = tempMinConfig.value; }
        this.logger.verbose(`[${this.constructor.name}] Các giá trị cấu hình tìm thấy cho location ${locationId}: MoistThresh=${moistureThreshold}, TempMax=${tempMax}, HumiMax=${humidityMax}, TempMin=${tempMin}`);
        if (typeof moistureThreshold === 'undefined' || typeof tempMax === 'undefined' || typeof humidityMax === 'undefined') {
            this.logger.error(`[${this.constructor.name}] Thiếu cấu hình ngưỡng cần thiết cho location ${locationId}. Cần kiểm tra cấu hình trong DB.`);
            return null;
        }
        return { moistureThreshold, tempMax, humidityMax, tempMin };
    }

     private async findActuatorDevice(locationId: string, deviceType: DeviceType): Promise<{ deviceId: string; name: string; } | null> {
         if (deviceType !== DeviceType.PUMP && deviceType !== DeviceType.FAN) {
             this.logger.warn(`[${this.constructor.name}] findActuatorDevice chỉ hỗ trợ PUMP hoặc FAN, nhận được ${deviceType}`);
             return null;
         }
         return this.prisma.device.findFirst({
             where: { locationId: locationId, type: deviceType },
             select: { deviceId: true, name: true }
         });
     }

     private async checkIfScheduleIsRunning(actuatorDeviceId: string, now: dayjs.Dayjs): Promise<boolean> {
        this.logger.debug(`Kiểm tra lịch trình đang chạy cho thiết bị ${actuatorDeviceId}...`);
        const nowUtc = now.utc();
        const runningSchedule = await this.prisma.schedule.findFirst({
            where: {
                deviceId: actuatorDeviceId,
                isActive: true,
                startTime: { lte: nowUtc.toDate() },
                endTime: { gt: nowUtc.toDate() }
            },
            select: { scheduleId: true, startTime: true, endTime: true }
        });
         if(runningSchedule){
             this.logger.log(`Phát hiện lịch trình ${runningSchedule.scheduleId} đang chạy cho thiết bị ${actuatorDeviceId} (StartTime: ${dayjs(runningSchedule.startTime).toISOString()}, EndTime: ${dayjs(runningSchedule.endTime).toISOString()}).`);
             return true;
         }
         this.logger.debug(`Không có lịch trình nào đang chạy cho thiết bị ${actuatorDeviceId} tại thời điểm hiện tại.`);
         return false;
    }

    private async executeFallbackLogic(locationId: string, sensorData: SensorDataDto, config: ConfigurationDataDto | null): Promise<void> {
        this.logger.log(`[${this.constructor.name}] [Fallback] Thực thi logic dự phòng cho location ${locationId}`);
        if (!config) {
            this.logger.error(`[${this.constructor.name}] [Fallback] Không có cấu hình cho location ${locationId}. Không thể chạy fallback.`);
            return;
        }

        let fallbackAction = AiAction.NONE;
        let targetDeviceType : DeviceType | null = null;

        if (sensorData.temperature > config.tempMax || sensorData.humidity > config.humidityMax) {
            fallbackAction = AiAction.FAN_ON;
            targetDeviceType = DeviceType.FAN;
            this.logger.warn(`[${this.constructor.name}] [Fallback] Điều kiện: Temp/Humi cao. Quyết định: ${fallbackAction}.`);
        } else if (sensorData.soilMoisture < config.moistureThreshold) {
            fallbackAction = AiAction.PUMP_ON;
            targetDeviceType = DeviceType.PUMP;
            this.logger.warn(`[${this.constructor.name}] [Fallback] Điều kiện: Độ ẩm đất thấp. Quyết định: ${fallbackAction}.`);
        } else {
            this.logger.log(`[${this.constructor.name}] [Fallback] Điều kiện ổn. Không hành động.`);
        }

        if (fallbackAction !== AiAction.NONE && (targetDeviceType === DeviceType.PUMP || targetDeviceType === DeviceType.FAN)) { // Kiểm tra cụ thể hơn
             const actuatorDevice = await this.findActuatorDevice(locationId, targetDeviceType);
             if (!actuatorDevice) {
                  this.logger.error(`[Fallback Trigger] Không tìm thấy ${targetDeviceType} tại location ${locationId} để thực thi fallback.`);
                  const logErr: LogEventPayload = { eventType: Severity.ERROR, description: `Không tìm thấy ${targetDeviceType} tại location ${locationId} để Fallback kích hoạt.` };
                  this.eventEmitter.emit(LOG_EVENT, logErr);
                  return;
             }
            const fallbackDurationSeconds = this.FALLBACK_DURATION_MINUTES * 60;
            await this.createUrgentSchedule(actuatorDevice.deviceId, actuatorDevice.name, fallbackAction, 'FALLBACK', fallbackDurationSeconds);
        }
    }

    private async createUrgentSchedule(actuatorDeviceId: string, actuatorDeviceName: string, action: AiAction.PUMP_ON | AiAction.FAN_ON, source: 'AI' | 'FALLBACK', durationSeconds: number): Promise<void> {
        const actionVerb = action === AiAction.PUMP_ON ? 'Bơm' : 'Quạt';
        this.logger.log(`[${source} Trigger] Tạo lịch trình GẤP (simple) cho ${actuatorDeviceName} (${actuatorDeviceId}): ${actionVerb} trong ${durationSeconds} giây.`);

        const now = dayjs();
        const endTime = now.add(durationSeconds, 'second');
        const scheduleDto: CreateScheduleDto = {
            deviceId: actuatorDeviceId,
            startTime: now.toISOString(),
            endTime: endTime.toISOString(),
            repeatDays: 0,
            isActive: true
        };

        try {
            await this.scheduleService.createScheduleWithSimpleValidation(scheduleDto);
            this.logger.log(`[${source} Trigger] Tạo lịch trình ${actionVerb} (simple) thành công cho ${actuatorDeviceName} (${actuatorDeviceId}).`);
            const logPayloadSuccess: LogEventPayload = { deviceId: actuatorDeviceId, eventType: Severity.INFO, description: `${source} (Urgent) đã kích hoạt ${actionVerb} (${actuatorDeviceName}) trong ${durationSeconds} giây qua lịch trình tức thời (simple).` };
            this.eventEmitter.emit(LOG_EVENT, logPayloadSuccess);
        } catch (error) {
            this.logger.error(`[${source} Trigger] Lỗi tạo lịch trình ${actionVerb} (simple) tức thời cho ${actuatorDeviceName} (${actuatorDeviceId}): ${error.message}`);
            const logPayloadError: LogEventPayload = { deviceId: actuatorDeviceId, eventType: Severity.ERROR, description: `Lỗi khi ${source} (Urgent) cố gắng tạo lịch trình ${actionVerb} tức thời (simple): ${error.message}` };
            this.eventEmitter.emit(LOG_EVENT, logPayloadError);
        }
    }

     private async createNormalSchedule(actuatorDeviceId: string, actuatorDeviceName: string, action: AiAction.PUMP_ON | AiAction.FAN_ON, source: 'AI', durationSeconds: number): Promise<void> {
        const actionVerb = action === AiAction.PUMP_ON ? 'Bơm' : 'Quạt';
        this.logger.log(`[${source} Trigger] Tạo lịch trình BÌNH THƯỜNG (full check) cho ${actuatorDeviceName} (${actuatorDeviceId}): ${actionVerb} trong ${durationSeconds} giây, bắt đầu ngay.`);

        const now = dayjs();
        const endTime = now.add(durationSeconds, 'second');
        const scheduleDto: CreateScheduleDto = {
            deviceId: actuatorDeviceId,
            startTime: now.toISOString(),
            endTime: endTime.toISOString(),
            repeatDays: 0,
            isActive: true
        };

        try {
            await this.scheduleService.create(scheduleDto);
            this.logger.log(`[${source} Trigger] Tạo lịch trình ${actionVerb} (normal) thành công cho ${actuatorDeviceName} (${actuatorDeviceId}).`);
            const logPayloadSuccess: LogEventPayload = { deviceId: actuatorDeviceId, eventType: Severity.INFO, description: `${source} (Normal) đã tạo lịch trình ${actionVerb} (${actuatorDeviceName}) trong ${durationSeconds} giây (bắt đầu ngay).` };
            this.eventEmitter.emit(LOG_EVENT, logPayloadSuccess);
        } catch (error) {
            if (error instanceof ConflictException) {
                 this.logger.warn(`[${source} Trigger] Tạo lịch trình ${actionVerb} (normal) thất bại do xung đột với lịch trình hiện có cho ${actuatorDeviceName} (${actuatorDeviceId}).`);
                 const logPayloadConflict: LogEventPayload = { deviceId: actuatorDeviceId, eventType: Severity.WARNING, description: `AI (Normal) cố gắng tạo lịch trình ${actionVerb} bị xung đột: ${error.message}` };
                 this.eventEmitter.emit(LOG_EVENT, logPayloadConflict);
            } else {
                 this.logger.error(`[${source} Trigger] Lỗi tạo lịch trình ${actionVerb} (normal) cho ${actuatorDeviceName} (${actuatorDeviceId}): ${error.message}`);
                 const logPayloadError: LogEventPayload = { deviceId: actuatorDeviceId, eventType: Severity.ERROR, description: `Lỗi khi ${source} (Normal) cố gắng tạo lịch trình ${actionVerb}: ${error.message}` };
                 this.eventEmitter.emit(LOG_EVENT, logPayloadError);
            }
        }
    }

}
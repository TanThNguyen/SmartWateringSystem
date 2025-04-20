import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiAssistantService, AiDecisionSuccessPayload } from '../ai-assistant/ai-assistant.service';
import { ScheduleService } from '../schedule/schedule.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { LOG_EVENT, LogEventPayload } from '../log/dto';
import { Device, DeviceType, Severity, Configuration } from '@prisma/client';
import {
    AiDecisionRequestDto,
    ConfigurationDataDto,
    SensorDataDto,
    AiUrgency,
    AiCombinedDecisionResponseDto,
    AiPumpAction,
    AiFanAction
} from '../ai-assistant/dto';
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
    ) { }

    async processSensorDataForDecision(locationId: string, currentState: LatestSensorState | undefined): Promise<void> {
        this.logger.debug(`[${this.constructor.name}] Nhận yêu cầu xử lý quyết định cho vị trí ${locationId}`);
        if (!currentState) {
            this.logger.warn(`[${this.constructor.name}] Không có trạng thái cảm biến hiện tại cho vị trí ${locationId}, bỏ qua.`);
            return;
        }
        await this.checkAndTriggerAiOrFallback(locationId, currentState);
    }

    private async checkAndTriggerAiOrFallback(locationId: string, currentState: LatestSensorState): Promise<void> {
        this.logger.debug(`[${this.constructor.name}] Kiểm tra điều kiện gọi AI cho vị trí ${locationId}...`);

        if (typeof currentState.soilMoisture === 'undefined' || typeof currentState.temperature === 'undefined' || typeof currentState.humidity === 'undefined') {
            this.logger.debug(`[${this.constructor.name}] Dữ liệu cảm biến không đầy đủ cho vị trí ${locationId}. Bỏ qua.`);
            return;
        }

        const now = new Date();
        const nowDayjs = dayjs();

        if (currentState.lastUpdate) {
            const dataAge = now.getTime() - currentState.lastUpdate.getTime();
            if (dataAge > this.MAX_DATA_AGE_MS) {
                const ageMinutes = Math.round(dataAge / 60000);
                this.logger.warn(`[${this.constructor.name}] Dữ liệu cảm biến cho vị trí ${locationId} đã quá cũ (${ageMinutes} phút). Bỏ qua gọi AI.`);
                return;
            }
        } else {
            this.logger.warn(`[${this.constructor.name}] Thiếu thông tin lastUpdate cho vị trí ${locationId}. Bỏ qua kiểm tra độ tươi.`);
        }

        let configDataDto: ConfigurationDataDto | null;
        try {
            configDataDto = await this.getLocationConfiguration(locationId);
            if (!configDataDto) {
                this.logger.error(`[${this.constructor.name}] Không lấy được cấu hình đầy đủ cho vị trí ${locationId}. Không thể đưa ra quyết định.`);
                return;
            }
        } catch (error) {
            this.logger.error(`[${this.constructor.name}] Lỗi lấy cấu hình cho vị trí ${locationId}: ${error.message}.`);
            return;
        }

        const sensorDataDto: SensorDataDto = {
            soilMoisture: currentState.soilMoisture,
            temperature: currentState.temperature,
            humidity: currentState.humidity,
        };

        // let potentialTriggerDeviceType: DeviceType | null = null;
        // if (sensorDataDto.temperature > configDataDto.tempMax || sensorDataDto.humidity > configDataDto.humidityMax) {
        //     potentialTriggerDeviceType = DeviceType.FAN;
        // } else if (sensorDataDto.soilMoisture < configDataDto.moistureThreshold) {
        //     potentialTriggerDeviceType = DeviceType.PUMP;
        // }

        // if (potentialTriggerDeviceType) {
        //     const actuatorDevice = await this.findActuatorDevice(locationId, potentialTriggerDeviceType);
        //     if (actuatorDevice) {
        //         const isScheduleRunning = await this.checkIfScheduleIsRunning(actuatorDevice.deviceId, nowDayjs);
        //         if (isScheduleRunning) {
        //             this.logger.log(`[${this.constructor.name}] Đã có lịch trình đang chạy cho ${actuatorDevice.name} (${actuatorDevice.deviceId}). Bỏ qua gọi AI.`);
        //             return;
        //         }
        //     } else {
        //          this.logger.warn(`[${this.constructor.name}] Không tìm thấy ${potentialTriggerDeviceType} tại vị trí ${locationId} để kiểm tra lịch chạy.`);
        //     }
        // }

        const lastCallTime = this.lastAiCallTimestamps.get(locationId);
        if (lastCallTime && (now.getTime() - lastCallTime.getTime()) < this.AI_CALL_RATE_LIMIT_MS) {
            const remainingTime = Math.ceil((this.AI_CALL_RATE_LIMIT_MS - (now.getTime() - lastCallTime.getTime())) / 1000);
            this.logger.debug(`[${this.constructor.name}] Giới hạn tần suất gọi đang hoạt động cho vị trí ${locationId}. Còn ${remainingTime} giây.`);
            return;
        }

        this.logger.log(`[${this.constructor.name}] Đủ điều kiện gọi AI cho vị trí ${locationId}.`);

        const requestPayload: AiDecisionRequestDto = {
            locationId: locationId,
            sensorData: sensorDataDto,
            configuration: configDataDto,
        };

        try {
            this.logger.log(`[${this.constructor.name}] >>> Gọi AI Service /decide cho vị trí ${locationId}...`);
            const aiDecision: AiCombinedDecisionResponseDto = await this.aiAssistantService.getAiDecision(requestPayload);
            this.logger.log(`[${this.constructor.name}] <<< Nhận quyết định AI kết hợp cho vị trí ${locationId}: BƠM(${aiDecision.pump_action}, ${aiDecision.pump_duration}s, ${aiDecision.pump_urgency}), QUẠT(${aiDecision.fan_action}, ${aiDecision.fan_duration}s, ${aiDecision.fan_urgency})`);
            this.lastAiCallTimestamps.set(locationId, new Date());

            if (aiDecision.pump_action === AiPumpAction.PUMP_ON) {
                const pumpDevice = await this.findActuatorDevice(locationId, DeviceType.PUMP);
                if (!pumpDevice) {
                    this.logger.error(`[Kích hoạt AI] Yêu cầu bật BƠM, nhưng không tìm thấy thiết bị BƠM tại vị trí ${locationId}.`);
                    const logErr: LogEventPayload = { eventType: Severity.ERROR, description: `AI yêu cầu bật BƠM nhưng không tìm thấy thiết bị BƠM tại vị trí ${locationId}.` };
                    this.eventEmitter.emit(LOG_EVENT, logErr);
                } else {
                    if (aiDecision.pump_urgency === AiUrgency.URGENT) {
                        await this.createUrgentSchedule(pumpDevice.deviceId, pumpDevice.name, AiPumpAction.PUMP_ON, 'AI', aiDecision.pump_duration);
                    } else {
                        await this.createNormalSchedule(pumpDevice.deviceId, pumpDevice.name, AiPumpAction.PUMP_ON, 'AI', aiDecision.pump_duration);
                    }
                }
            } else {
                this.logger.log(`[${this.constructor.name}] AI quyết định không cần bật BƠM cho vị trí ${locationId}.`);
            }

            if (aiDecision.fan_action === AiFanAction.FAN_ON) {
                const fanDevice = await this.findActuatorDevice(locationId, DeviceType.FAN);
                if (!fanDevice) {
                    this.logger.error(`[Kích hoạt AI] Yêu cầu bật QUẠT, nhưng không tìm thấy thiết bị QUẠT tại vị trí ${locationId}.`);
                    const logErr: LogEventPayload = { eventType: Severity.ERROR, description: `AI yêu cầu bật QUẠT nhưng không tìm thấy thiết bị QUẠT tại vị trí ${locationId}.` };
                    this.eventEmitter.emit(LOG_EVENT, logErr);
                } else {
                    if (aiDecision.fan_urgency === AiUrgency.URGENT) {
                        await this.createUrgentSchedule(fanDevice.deviceId, fanDevice.name, AiFanAction.FAN_ON, 'AI', aiDecision.fan_duration);
                    } else {
                        await this.createNormalSchedule(fanDevice.deviceId, fanDevice.name, AiFanAction.FAN_ON, 'AI', aiDecision.fan_duration);
                    }
                }
            } else {
                this.logger.log(`[${this.constructor.name}] AI quyết định không cần bật QUẠT cho vị trí ${locationId}.`);
            }

        } catch (error) {
            this.logger.error(`[${this.constructor.name}] Lỗi khi gọi AI cho vị trí ${locationId}: ${error.message}`);
            this.logger.warn(`[${this.constructor.name}] Kích hoạt logic Dự phòng cho vị trí ${locationId} do lỗi AI.`);
            await this.executeFallbackLogic(locationId, sensorDataDto, configDataDto);

            const logPayloadAiError: LogEventPayload = { eventType: Severity.ERROR, description: `Lỗi gọi AI Assistant cho vị trí ${locationId} (${error.message}). Kích hoạt logic dự phòng.` };
            this.eventEmitter.emit(LOG_EVENT, logPayloadAiError);
        }
    }

    private async getLocationConfiguration(locationId: string): Promise<ConfigurationDataDto | null> {
        this.logger.debug(`[${this.constructor.name}] Lấy cấu hình cho vị trí ${locationId}...`);
        const locationConfigs = await this.prisma.configuration.findMany({ where: { locationId: locationId } });
        if (locationConfigs.length === 0) {
            this.logger.warn(`[${this.constructor.name}] Không tìm thấy bản ghi cấu hình nào cho vị trí ${locationId}.`);
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
        this.logger.verbose(`[${this.constructor.name}] Các giá trị cấu hình tìm thấy cho vị trí ${locationId}: NgưỡngẨm=${moistureThreshold}, NhiệtMax=${tempMax}, ĐộẨmMax=${humidityMax}, NhiệtMin=${tempMin}`);
        if (typeof moistureThreshold === 'undefined' || typeof tempMax === 'undefined' || typeof humidityMax === 'undefined') {
            this.logger.error(`[${this.constructor.name}] Thiếu cấu hình ngưỡng cần thiết cho vị trí ${locationId}. Cần kiểm tra cấu hình trong DB.`);
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
        if (runningSchedule) {
            this.logger.log(`Phát hiện lịch trình ${runningSchedule.scheduleId} đang chạy cho thiết bị ${actuatorDeviceId} (StartTime: ${dayjs(runningSchedule.startTime).toISOString()}, EndTime: ${dayjs(runningSchedule.endTime).toISOString()}).`);
            return true;
        }
        this.logger.debug(`Không có lịch trình nào đang chạy cho thiết bị ${actuatorDeviceId} tại thời điểm hiện tại.`);
        return false;
    }

    private async executeFallbackLogic(locationId: string, sensorData: SensorDataDto, config: ConfigurationDataDto | null): Promise<void> {
        this.logger.log(`[${this.constructor.name}] [Dự phòng] Thực thi logic dự phòng cho vị trí ${locationId}`);
        if (!config) {
            this.logger.error(`[${this.constructor.name}] [Dự phòng] Không có cấu hình cho vị trí ${locationId}. Không thể chạy dự phòng.`);
            return;
        }

        let fallbackActionEnum: AiPumpAction.PUMP_ON | AiFanAction.FAN_ON | null = null;
        let targetDeviceType: DeviceType | null = null;

        if (sensorData.temperature > config.tempMax || sensorData.humidity > config.humidityMax) {
            fallbackActionEnum = AiFanAction.FAN_ON;
            targetDeviceType = DeviceType.FAN;
            this.logger.warn(`[${this.constructor.name}] [Dự phòng] Điều kiện: Nhiệt/Độ ẩm cao. Quyết định: ${fallbackActionEnum}.`);
        } else if (sensorData.soilMoisture < config.moistureThreshold) {
            fallbackActionEnum = AiPumpAction.PUMP_ON;
            targetDeviceType = DeviceType.PUMP;
            this.logger.warn(`[${this.constructor.name}] [Dự phòng] Điều kiện: Độ ẩm đất thấp. Quyết định: ${fallbackActionEnum}.`);
        } else {
            this.logger.log(`[${this.constructor.name}] [Dự phòng] Điều kiện ổn định. Không hành động.`);
        }

        if (fallbackActionEnum && targetDeviceType) {
            const actuatorDevice = await this.findActuatorDevice(locationId, targetDeviceType);
            if (!actuatorDevice) {
                this.logger.error(`[Kích hoạt Dự phòng] Không tìm thấy ${targetDeviceType} tại vị trí ${locationId} để thực thi dự phòng.`);
                const logErr: LogEventPayload = { eventType: Severity.ERROR, description: `Không tìm thấy ${targetDeviceType} tại vị trí ${locationId} để kích hoạt Dự phòng.` };
                this.eventEmitter.emit(LOG_EVENT, logErr);
                return;
            }
            const fallbackDurationSeconds = this.FALLBACK_DURATION_MINUTES * 60;
            await this.createUrgentSchedule(actuatorDevice.deviceId, actuatorDevice.name, fallbackActionEnum, 'FALLBACK', fallbackDurationSeconds);
        }
    }

    private async createUrgentSchedule(actuatorDeviceId: string, actuatorDeviceName: string, action: AiPumpAction.PUMP_ON | AiFanAction.FAN_ON, source: 'AI' | 'FALLBACK', durationSeconds: number): Promise<void> {
        const actionVerb = action === AiPumpAction.PUMP_ON ? 'Bơm' : 'Quạt';
        this.logger.log(`[Kích hoạt ${source}] Tạo lịch trình GẤP (simple) cho ${actuatorDeviceName} (${actuatorDeviceId}): ${actionVerb} trong ${durationSeconds} giây.`);

        const now = dayjs();

        const isAlreadyRunning = await this.checkIfScheduleIsRunning(actuatorDeviceId, now);
        if (isAlreadyRunning) {
            this.logger.log(`[Kích hoạt ${source}] Thiết bị ${actuatorDeviceName} (${actuatorDeviceId}) đã có lịch trình đang chạy. Bỏ qua tạo lịch trình GẤP (${actionVerb}) mới.`);
            const logPayloadSkip: LogEventPayload = { deviceId: actuatorDeviceId, eventType: Severity.INFO, description: `${source} (Khẩn) yêu cầu ${actionVerb} nhưng thiết bị ${actuatorDeviceName} đã chạy. Không tạo lịch GẤP mới.` };
            this.eventEmitter.emit(LOG_EVENT, logPayloadSkip);
            return;
        }

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
            this.logger.log(`[Kích hoạt ${source}] Tạo lịch trình ${actionVerb} (simple) thành công cho ${actuatorDeviceName} (${actuatorDeviceId}).`);
            const logPayloadSuccess: LogEventPayload = { deviceId: actuatorDeviceId, eventType: Severity.INFO, description: `${source} (Khẩn) đã kích hoạt ${actionVerb} (${actuatorDeviceName}) trong ${durationSeconds} giây qua lịch trình tức thời (simple).` };
            this.eventEmitter.emit(LOG_EVENT, logPayloadSuccess);
        } catch (error) {
            this.logger.error(`[Kích hoạt ${source}] Lỗi tạo lịch trình ${actionVerb} (simple) tức thời cho ${actuatorDeviceName} (${actuatorDeviceId}): ${error.message}`);
            const logPayloadError: LogEventPayload = { deviceId: actuatorDeviceId, eventType: Severity.ERROR, description: `Lỗi khi ${source} (Khẩn) cố gắng tạo lịch trình ${actionVerb} tức thời (simple): ${error.message}` };
            this.eventEmitter.emit(LOG_EVENT, logPayloadError);
        }
    }

    private async createNormalSchedule(actuatorDeviceId: string, actuatorDeviceName: string, action: AiPumpAction.PUMP_ON | AiFanAction.FAN_ON, source: 'AI', durationSeconds: number): Promise<void> {
        const actionVerb = action === AiPumpAction.PUMP_ON ? 'Bơm' : 'Quạt';
        this.logger.log(`[Kích hoạt ${source}] Tạo lịch trình BÌNH THƯỜNG (full check) cho ${actuatorDeviceName} (${actuatorDeviceId}): ${actionVerb} trong ${durationSeconds} giây, bắt đầu ngay.`);

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
            this.logger.log(`[Kích hoạt ${source}] Tạo lịch trình ${actionVerb} (normal) thành công cho ${actuatorDeviceName} (${actuatorDeviceId}).`);
            const logPayloadSuccess: LogEventPayload = { deviceId: actuatorDeviceId, eventType: Severity.INFO, description: `${source} (Thường) đã tạo lịch trình ${actionVerb} (${actuatorDeviceName}) trong ${durationSeconds} giây (bắt đầu ngay).` };
            this.eventEmitter.emit(LOG_EVENT, logPayloadSuccess);
        } catch (error) {
            if (error instanceof ConflictException) {
                this.logger.warn(`[Kích hoạt ${source}] Tạo lịch trình ${actionVerb} (normal) thất bại do xung đột với lịch trình hiện có cho ${actuatorDeviceName} (${actuatorDeviceId}).`);
                const logPayloadConflict: LogEventPayload = { deviceId: actuatorDeviceId, eventType: Severity.WARNING, description: `AI (Thường) cố gắng tạo lịch trình ${actionVerb} bị xung đột: ${error.message}` };
                this.eventEmitter.emit(LOG_EVENT, logPayloadConflict);
            } else {
                this.logger.error(`[Kích hoạt ${source}] Lỗi tạo lịch trình ${actionVerb} (normal) cho ${actuatorDeviceName} (${actuatorDeviceId}): ${error.message}`);
                const logPayloadError: LogEventPayload = { deviceId: actuatorDeviceId, eventType: Severity.ERROR, description: `Lỗi khi ${source} (Thường) cố gắng tạo lịch trình ${actionVerb}: ${error.message}` };
                this.eventEmitter.emit(LOG_EVENT, logPayloadError);
            }
        }
    }
}
import { HttpService } from '@nestjs/axios';
import { Injectable, InternalServerErrorException, Logger, OnModuleDestroy, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';
import CircuitBreaker from 'opossum';

import {
    AiDecisionRequestDto,
    AiCombinedDecisionResponseDto,
    AiPumpAction,
    AiFanAction,
    AiUrgency
} from './dto';

import {
    AiCircuitOpenPayload,
    AI_DECISION_SUCCESS_EVENT,
    AI_DECISION_CIRCUIT_OPEN_EVENT,
    AI_DECISION_FAILURE_EVENT
} from './events/ai-events.payload';


export interface AiDecisionSuccessPayload {
    request: AiDecisionRequestDto;
    response: AiCombinedDecisionResponseDto;
}

export interface AiDecisionFailurePayload {
    request: AiDecisionRequestDto;
    error: Error;
}

export class AiCircuitOpenError extends ServiceUnavailableException {
    constructor(message = 'Dịch vụ AI tạm thời không khả dụng (Mạch đã ngắt). Yêu cầu xử lý dự phòng.') {
        super(message);
    }
}

@Injectable()
export class AiAssistantService implements OnModuleDestroy {
    private readonly logger = new Logger(AiAssistantService.name);
    private readonly aiServiceUrl: string;
    private readonly decideEndpoint: string;
    private readonly healthCheckEndpoint: string;

    private readonly decisionCircuitBreaker: CircuitBreaker<[AiDecisionRequestDto], AiCombinedDecisionResponseDto>;
    private readonly circuitBreakerOptions: CircuitBreaker.Options;

    constructor(
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
        private readonly eventEmitter: EventEmitter2,
    ) {
        const urlFromConfig = this.configService.get<string>('AI_SERVICE_URL');
        if (!urlFromConfig) {
            this.logger.error('NGHIÊM TRỌNG: Biến môi trường AI_SERVICE_URL chưa được thiết lập.');
            throw new InternalServerErrorException('URL dịch vụ AI chưa được cấu hình.');
        }
        this.aiServiceUrl = urlFromConfig;
        this.decideEndpoint = `${this.aiServiceUrl}/decide`;
        this.healthCheckEndpoint = `${this.aiServiceUrl}/health`;
        this.logger.log(`URL Dịch vụ AI Trợ Lý: ${this.aiServiceUrl}`);

        this.circuitBreakerOptions = {
            failureThreshold: 3,
            resetTimeout: 30000
        };
        const httpCallTimeout = 10000;

        const protectedDecisionCall = async (payload: AiDecisionRequestDto): Promise<AiCombinedDecisionResponseDto> => {
            const contextId = payload.locationId;
            try {
                this.logger.verbose(`[CB Nội bộ - Context: ${contextId}] Thực thi POST ${this.decideEndpoint}`);
                const response = await firstValueFrom(
                    this.httpService.post<AiCombinedDecisionResponseDto>(this.decideEndpoint, payload, { timeout: httpCallTimeout })
                );
                this.logger.verbose(`[CB Nội bộ - Context: ${contextId}] Nhận phản hồi: Trạng thái ${response.status}`);

                if (!response.data ||
                    typeof response.data.pump_action === 'undefined' ||
                    typeof response.data.pump_duration === 'undefined' ||
                    typeof response.data.pump_urgency === 'undefined' ||
                    typeof response.data.fan_action === 'undefined' ||
                    typeof response.data.fan_duration === 'undefined' ||
                    typeof response.data.fan_urgency === 'undefined') {
                    this.logger.error(`[CB Nội bộ - Context: ${contextId}] Cấu trúc phản hồi không hợp lệ: ${JSON.stringify(response.data)}`);
                    throw new Error('Cấu trúc phản hồi không hợp lệ từ dịch vụ AI.');
                }

                if (!Object.values(AiPumpAction).includes(response.data.pump_action as AiPumpAction)) {
                    this.logger.error(`[CB Nội bộ - Context: ${contextId}] Giá trị pump_action không hợp lệ: ${response.data.pump_action}`);
                    throw new Error(`Giá trị pump_action '${response.data.pump_action}' không hợp lệ từ dịch vụ AI.`);
                }
                if (!Object.values(AiUrgency).includes(response.data.pump_urgency as AiUrgency)) {
                    this.logger.error(`[CB Nội bộ - Context: ${contextId}] Giá trị pump_urgency không hợp lệ: ${response.data.pump_urgency}`);
                    throw new Error(`Giá trị pump_urgency '${response.data.pump_urgency}' không hợp lệ từ dịch vụ AI.`);
                }

                if (!Object.values(AiFanAction).includes(response.data.fan_action as AiFanAction)) {
                    this.logger.error(`[CB Nội bộ - Context: ${contextId}] Giá trị fan_action không hợp lệ: ${response.data.fan_action}`);
                    throw new Error(`Giá trị fan_action '${response.data.fan_action}' không hợp lệ từ dịch vụ AI.`);
                }
                if (!Object.values(AiUrgency).includes(response.data.fan_urgency as AiUrgency)) {
                    this.logger.error(`[CB Nội bộ - Context: ${contextId}] Giá trị fan_urgency không hợp lệ: ${response.data.fan_urgency}`);
                    throw new Error(`Giá trị fan_urgency '${response.data.fan_urgency}' không hợp lệ từ dịch vụ AI.`);
                }

                this.logger.verbose(`[CB Nội bộ - Context: ${contextId}] Cấu trúc phản hồi OK.`);
                return response.data;

            } catch (error) {
                const axiosError = error as AxiosError;
                let errorMessage = `[CB Nội bộ - Context: ${contextId}] Yêu cầu thất bại`;
                if (axiosError?.isAxiosError) {
                    if (axiosError.response) { errorMessage += `: Dịch vụ AI trả về lỗi - Trạng thái ${axiosError.response.status}, Dữ liệu: ${JSON.stringify(axiosError.response.data)}`; }
                    else if (axiosError.request) { errorMessage += `: Không nhận được phản hồi (Lỗi mạng hoặc Timeout) - ${axiosError.message}`; }
                    else { errorMessage += `: Lỗi thiết lập yêu cầu - ${axiosError.message}`; }
                } else { errorMessage += `: ${(error as Error).message}`; }
                this.logger.error(errorMessage, axiosError?.stack || (error as Error)?.stack);
                throw error;
            }
        };

        this.decisionCircuitBreaker = new CircuitBreaker<[AiDecisionRequestDto], AiCombinedDecisionResponseDto>(
            protectedDecisionCall,
            this.circuitBreakerOptions
        );
        this.setupCircuitBreakerListeners();
    }

    private setupCircuitBreakerListeners(): void {
        const resetTimeoutValue = this.circuitBreakerOptions.resetTimeout;
        this.decisionCircuitBreaker.on('open', () => this.logger.warn(`[Sự kiện CB] Bộ ngắt mạch Quyết định: TRẠNG THÁI chuyển sang MỞ. Chặn yêu cầu trong ${resetTimeoutValue}ms.`));
        this.decisionCircuitBreaker.on('close', () => this.logger.log(`[Sự kiện CB] Bộ ngắt mạch Quyết định: TRẠNG THÁI chuyển sang ĐÓNG. Hoạt động bình thường.`));
        this.decisionCircuitBreaker.on('halfOpen', () => this.logger.log(`[Sự kiện CB] Bộ ngắt mạch Quyết định: TRẠNG THÁI chuyển sang NỬA MỞ. Thử gọi kiểm tra.`));
        this.decisionCircuitBreaker.on('reject', () => this.logger.warn(`[Sự kiện CB] Bộ ngắt mạch Quyết định: TỪ CHỐI một cuộc gọi (Mạch đang MỞ).`));

        this.decisionCircuitBreaker.on('failure', (error: Error, latencyMs: number, args?: [AiDecisionRequestDto]) => {
            const contextId = args?.[0]?.locationId ?? 'không rõ';
            this.logger.error(`[Sự kiện CB] Bộ ngắt mạch Quyết định: Ghi nhận THẤT BẠI cho context ${contextId} (Độ trễ: ${latencyMs}ms). Lỗi: ${error?.message ?? 'Lỗi không xác định'}`);
        });

        this.decisionCircuitBreaker.on('success', (result: AiCombinedDecisionResponseDto, latencyMs: number, args?: [AiDecisionRequestDto]) => {
            const contextId = args?.[0]?.locationId ?? 'không rõ';
            this.logger.debug(`[Sự kiện CB] Bộ ngắt mạch Quyết định: Ghi nhận THÀNH CÔNG cho context ${contextId} (Độ trễ: ${latencyMs}ms).`);
        });
    }

    async checkAiServiceHealth(): Promise<any> {
        this.logger.log(`Kiểm tra tình trạng dịch vụ AI tại: ${this.healthCheckEndpoint}`);
        try {
            const response = await firstValueFrom(
                this.httpService.get<any>(this.healthCheckEndpoint, { timeout: 5000 })
            );
            this.logger.log(`Kiểm tra tình trạng dịch vụ AI thành công. Trạng thái: ${response.status}, Phản hồi: ${JSON.stringify(response.data)}`);
            return response.data;
        } catch (error) {
            const axiosError = error as AxiosError;
            let errorMessage = `Kiểm tra tình trạng thất bại tới ${this.healthCheckEndpoint}`;
            if (axiosError?.isAxiosError) {
                if (axiosError.response) { errorMessage += `: Trạng thái ${axiosError.response.status}`; }
                else if (axiosError.request) { errorMessage += `: Không có phản hồi (Mạng/Timeout)`; }
                else { errorMessage += `: Lỗi thiết lập yêu cầu`; }
            } else { errorMessage += `: ${(error as Error).message}`; }
            this.logger.error(errorMessage);
            throw new ServiceUnavailableException(`Kiểm tra tình trạng dịch vụ AI thất bại: ${errorMessage}`);
        }
    }

    async getAiDecision(requestPayload: AiDecisionRequestDto): Promise<AiCombinedDecisionResponseDto> {
        const contextId = requestPayload.locationId;
        this.logger.debug(`[Context: ${contextId}] Thử lấy quyết định AI qua Bộ ngắt mạch...`);

        try {
            const result = await this.decisionCircuitBreaker.fire(requestPayload);
            this.logger.log(`[Context: ${contextId}] Nhận quyết định AI thành công qua Bộ ngắt mạch: ${JSON.stringify(result)}`);

            const successPayload: AiDecisionSuccessPayload = { request: requestPayload, response: result };
            this.eventEmitter.emit(AI_DECISION_SUCCESS_EVENT, successPayload);
            this.logger.debug(`[Context: ${contextId}] Đã phát sự kiện: ${AI_DECISION_SUCCESS_EVENT}`);
            console.log(result);
            return result;

        } catch (error: any) {
            const failureContext = { request: requestPayload };

            if (error.code === 'EOPENBREAKER') {
                this.logger.warn(`[Context: ${contextId}] Bộ ngắt mạch đang MỞ. Yêu cầu AI bị từ chối.`);
                this.eventEmitter.emit(AI_DECISION_CIRCUIT_OPEN_EVENT, failureContext as AiCircuitOpenPayload);
                this.logger.debug(`[Context: ${contextId}] Đã phát sự kiện: ${AI_DECISION_CIRCUIT_OPEN_EVENT}`);
                throw new AiCircuitOpenError(`Dịch vụ AI tạm thời không khả dụng cho context ${contextId} (Bộ ngắt mạch MỞ).`);
            } else {
                this.logger.error(`[Context: ${contextId}] Không thể lấy quyết định AI qua Bộ ngắt mạch. Lỗi: ${error.message}`);
                const failurePayload: AiDecisionFailurePayload = { ...failureContext, error: error as Error };
                this.eventEmitter.emit(AI_DECISION_FAILURE_EVENT, failurePayload);
                this.logger.debug(`[Context: ${contextId}] Đã phát sự kiện: ${AI_DECISION_FAILURE_EVENT}`);
                throw new InternalServerErrorException(`Không thể lấy quyết định AI cho context ${contextId}: ${error.message}`);
            }
        }
    }

    async onModuleDestroy() {
        this.logger.log("Đang dừng AiAssistantService...");
        if (this.decisionCircuitBreaker) {
            this.decisionCircuitBreaker.removeAllListeners();
            this.logger.log("Đã gỡ bỏ các listener của Bộ ngắt mạch Quyết định.");
        }
    }
}